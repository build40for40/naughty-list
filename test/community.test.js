import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { seededDatabase } from './helpers.js';
import { MIN_VOTES, communitySummary, saveVote, withdrawVote, consumeVoteLimit, voteExpiry, validVote } from '../worker/community.js';
import { authenticate, verifiedVoter, workosIssuer } from '../worker/auth.js';
import { communityApi } from '../worker/community-api.js';
import worker from '../worker/index.js';
import { assessStored } from '../worker/store.js';

const now = new Date('2026-11-04T12:00:00.000Z');
async function enrolled() {
  const db = await seededDatabase();
  await db.prepare('INSERT INTO community_brands(company_id) VALUES(?)').bind('patagonia').run();
  return db;
}
async function votes(db, count) {
  for (let n = 0; n < count; n++) await saveVote(db, 'patagonia', `user_${n}`, { choice: 'nice' }, now);
}

test('percentage is null at 0 and 19 decisive votes, appears at exactly 20, and stays separate from scoring', async () => {
  const db = await enrolled();
  assert.equal((await communitySummary(db, 'patagonia', now)).nicePercentage, null);
  await votes(db, 19);
  for (let n = 0; n < 30; n++) await saveVote(db, 'patagonia', `user_unsure${n}`, { choice: 'unsure' }, now);
  let summary = await communitySummary(db, 'patagonia', now);
  assert.equal(summary.total, 19);
  assert.equal(summary.counts.unsure, 30);
  assert.equal(summary.status, 'early');
  assert.equal(summary.nicePercentage, null);
  assert.equal(summary.minimumVotes, MIN_VOTES);
  await saveVote(db, 'patagonia', 'user_twenty', { choice: 'naughty' }, now);
  summary = await communitySummary(db, 'patagonia', now);
  assert.equal(summary.total, 20);
  assert.equal(summary.nicePercentage, 95);
  const assessment = await assessStored({ domain: 'patagonia.com' }, db, now);
  assert.equal(assessment.community.nicePercentage, 95);
  assert.equal(assessment.scoring.verdict, 'nice');
  assert.equal(assessment.scoring.total, 1);
  db.close();
});

test('changing a vote replaces it; withdrawal, exclusion and expiry can hide the percentage again', async () => {
  const db = await enrolled();
  await votes(db, 20);
  await saveVote(db, 'patagonia', 'user_0', { choice: 'naughty', reasons: ['staff'] }, now);
  assert.equal((await communitySummary(db, 'patagonia', now)).nicePercentage, 95);
  await saveVote(db, 'patagonia', 'user_0', { choice: 'unsure' }, now);
  assert.equal((await communitySummary(db, 'patagonia', now)).nicePercentage, null);
  await saveVote(db, 'patagonia', 'user_0', { choice: 'nice' }, now);
  await withdrawVote(db, 'patagonia', 'user_0');
  assert.equal((await communitySummary(db, 'patagonia', now)).total, 19);
  await saveVote(db, 'patagonia', 'user_0', { choice: 'nice' }, now);
  await db.prepare("UPDATE community_votes SET excluded=1 WHERE user_id='user_0'").run();
  assert.equal((await communitySummary(db, 'patagonia', now)).nicePercentage, null);
  // Neither changing nor withdrawing and revoting clears a moderation decision.
  await withdrawVote(db, 'patagonia', 'user_0');
  await saveVote(db, 'patagonia', 'user_0', { choice: 'nice' }, now);
  assert.equal((await communitySummary(db, 'patagonia', now)).total, 19);
  await db.prepare("UPDATE community_votes SET excluded=0 WHERE user_id='user_0'").run();
  assert.equal((await communitySummary(db, 'patagonia', new Date('2027-11-04T11:59:59.999Z'))).total, 20);
  assert.equal((await communitySummary(db, 'patagonia', new Date('2027-11-04T12:00:00.000Z'))).nicePercentage, null);
  assert.equal(voteExpiry(new Date('2028-02-29T12:00:00.000Z')), '2029-02-28T12:00:00.000Z');
  db.close();
});

test('only explicitly enrolled, reviewed brand shops have community scores', async () => {
  const db = await enrolled();
  for (const id of ['hm', 'not-a-brand', 'tonys-chocolonely', 'amazon']) assert.equal((await communitySummary(db, id, now)).status, 'unavailable');
  await db.prepare("INSERT INTO community_brands(company_id) VALUES('amazon')").run();
  assert.equal((await communitySummary(db, 'amazon', now)).status, 'unavailable');
  assert.equal((await assessStored({ domain: 'www.hm.com' }, db, now)).community.status, 'unavailable');
  db.close();
});

test('account rate limits are atomic and reset next minute; bursts flag review without excluding votes', async () => {
  const db = await enrolled();
  const attempts = await Promise.all(Array.from({ length: 15 }, () => consumeVoteLimit(db, 'user_example', now)));
  assert.equal(attempts.filter(Boolean).length, 10);
  assert.equal(await consumeVoteLimit(db, 'user_example', new Date(now.getTime() + 60000)), true);
  await votes(db, 30);
  const { results } = await db.prepare('SELECT * FROM community_review_flags').all();
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'pending');
  assert.equal((await communitySummary(db, 'patagonia', now)).total, 30);
  db.close();
});

test('vote validation accepts only the agreed choices and optional unique reasons', () => {
  for (const value of [null, [], {}, { choice: 'bad' }, { choice: 'nice', userId: 'forged' }, { choice: 'nice', reasons: ['staff', 'staff'] },
    { choice: 'nice', reasons: ['price'] }, { choice: 'nice', reasons: 'staff' }]) assert.ok(!validVote(value));
  for (const choice of ['nice', 'naughty', 'unsure']) assert.ok(validVote({ choice, reasons: ['staff', 'communities', 'environment'] }));
});

const { publicKey, privateKey } = await generateKeyPair('RS256');
const issuer = workosIssuer('client_example');
const token = (iss = issuer, expiration = '5m') => new SignJWT({}).setProtectedHeader({ alg: 'RS256' }).setSubject('user_example').setIssuer(iss).setIssuedAt().setExpirationTime(expiration).sign(privateKey);
const requestWith = value => new Request('https://example.test/', { headers: { Authorization: `Bearer ${value}` } });

test('Joyo JWT pattern rejects forged, expired and wrong-environment tokens', async () => {
  assert.equal(await authenticate(requestWith(await token()), publicKey, issuer), 'user_example');
  for (const value of ['fake-token', await token('wrong'), await token(issuer, '-1m')]) assert.equal(await authenticate(requestWith(value), publicKey, issuer), null);
  const { privateKey: attacker } = await generateKeyPair('RS256');
  const forged = await new SignJWT({}).setProtectedHeader({ alg: 'RS256' }).setSubject('user_example').setIssuer(issuer).setIssuedAt().setExpirationTime('5m').sign(attacker);
  assert.equal(await authenticate(requestWith(forged), publicKey, issuer), null);
});

test('verified email is checked server-side, with no email passed to the voting store', async () => {
  const request = requestWith(await token());
  const env = { WORKOS_CLIENT_ID: 'client_example', WORKOS_API_KEY: 'test-fixture' };
  for (const verified of [true, false, undefined]) {
    const voter = await verifiedVoter(request, env, { keys: publicKey, fetcher: async (url, init) => {
      assert.equal(url, 'https://api.workos.com/user_management/users/user_example');
      assert.equal(init.headers.Authorization, 'Bearer test-fixture');
      return Response.json({ id: 'user_example', email_verified: verified });
    } });
    assert.deepEqual(voter, verified === true ? { userId: 'user_example' } : { error: 'email_verification_required', status: 403 });
  }
  await assert.rejects(verifiedVoter(request, env, { keys: publicKey, fetcher: async () => new Response(null, { status: 503 }) }));
  assert.equal((await verifiedVoter(request, {})).status, 503);
});

function apiHarness(db, authenticate) {
  return (method, suffix = '', body) => {
    const request = new Request(`https://example.test/v1/community/brands/patagonia${suffix}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
    });
    return communityApi(request, { DB: db }, {
      json: (body, status = 200, extra = {}) => Response.json(body, { status, headers: extra }),
      error: (code, message, status) => Response.json({ error: { code, message } }, { status }),
      readBody: request => request.text(), authenticate
    });
  };
}

test('API exposes public aggregates, protects own votes and only writes for the verified account', async () => {
  const db = await enrolled();
  const anonymous = apiHarness(db, async () => ({ error: 'sign_in_required', status: 401 }));
  assert.equal((await anonymous('GET')).status, 200);
  assert.equal((await anonymous('PUT', '/vote', { choice: 'nice' })).status, 401);
  const unverified = apiHarness(db, async () => ({ error: 'email_verification_required', status: 403 }));
  assert.equal((await unverified('PUT', '/vote', { choice: 'nice' })).status, 403);
  const signedIn = apiHarness(db, async () => ({ userId: 'user_example' }));
  assert.equal((await signedIn('PUT', '/vote', { choice: 'nice', userId: 'user_other' })).status, 400);
  const saved = await (await signedIn('PUT', '/vote', { choice: 'naughty' })).json();
  assert.equal(saved.vote.choice, 'naughty');
  assert.equal(saved.community.nicePercentage, null);
  assert.equal((await signedIn('POST', '/vote', { choice: 'nice' })).status, 405);
  const other = apiHarness(db, async () => ({ userId: 'user_other' }));
  assert.equal((await (await other('GET', '/vote')).json()).vote, null);
  assert.ok(!JSON.stringify(await (await anonymous('GET')).json()).includes('user_example'));
  assert.equal((await (await signedIn('DELETE', '/vote')).json()).community.total, 0);
  db.close();
});

test('Worker routes community errors, CORS and missing database without claiming zero votes', async () => {
  const db = await enrolled();
  const env = { DB: db };
  const summary = await worker.fetch(new Request('https://example.test/v1/community/brands/patagonia'), env);
  assert.equal((await summary.json()).community.nicePercentage, null);
  assert.equal((await worker.fetch(new Request('https://example.test/v1/community/brands/hm'), env)).status, 404);
  assert.equal((await worker.fetch(new Request('https://example.test/v1/community/brands/patagonia'))).status, 503);
  const preflight = await worker.fetch(new Request('https://example.test/v1/community/brands/patagonia/vote', { method: 'OPTIONS' }), env);
  assert.match(preflight.headers.get('Access-Control-Allow-Headers'), /Authorization/);
  const missingAuth = await worker.fetch(new Request('https://example.test/v1/community/brands/patagonia/vote', { method: 'PUT' }), env);
  assert.equal(missingAuth.status, 503);
  db.close();
});

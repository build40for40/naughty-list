import { createClient } from '@workos-inc/authkit-js';

const $ = id => document.getElementById(id);
let auth;
let selected;
let loading = false;
let authError;
const message = text => { $('message').textContent = text; };
async function api(path, { method = 'GET', body, signedIn = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (signedIn) headers.Authorization = `Bearer ${await auth.getAccessToken()}`;
  const response = await fetch(`/v1/community/${path}`, { method, headers,
    body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'The list is unavailable. Please try again.');
  return data;
}
function showSummary(summary) {
  // Independently enforce the baseline in the page, too.
  $('score').textContent = summary.status === 'ready' && summary.total >= 20 && Number.isFinite(summary.nicePercentage)
    ? `${summary.nicePercentage}% voted Nice · ${summary.total} votes`
    : `Early voting · ${summary.total} votes · ${summary.minimumVotes} needed for a percentage`;
  $('counts').textContent = `${summary.counts.nice} Nice · ${summary.counts.naughty} Naughty · ${summary.counts.unsure} Not sure. Not sure is excluded from the percentage and minimum.`;
  $('dates').textContent = `Unexpired votes from the last 12 months. Updated ${new Date(summary.asOf).toLocaleString('en-GB', { timeZone: 'Europe/London' })} (London), ${new Date(summary.asOf).toLocaleString()} (your time).`;
}
function showOwnVote(vote) {
  $('vote-form').reset();
  $('withdraw').hidden = !vote;
  if (!vote) { $('own-vote').textContent = 'You have not voted for this brand.'; return; }
  const input = document.querySelector(`input[name="choice"][value="${vote.choice}"]`);
  if (input) input.checked = true;
  for (const input of document.querySelectorAll('input[name="reasons"]')) input.checked = vote.reasons.includes(input.value);
  $('own-vote').textContent = vote.excluded ? 'Your vote is excluded following moderation. Contact support to request a review.'
    : vote.expired ? 'Your vote has expired. Save a new vote to take part again.'
    : `Your vote is saved until ${new Date(vote.expiresAt).toLocaleDateString('en-GB')}. You can change or withdraw it.`;
}
async function loadBrand() {
  if (!selected || loading) return;
  loading = true;
  $('vote-fields').disabled = true;
  $('brand').disabled = true;
  $('score').textContent = 'Checking community votes…';
  $('counts').textContent = $('dates').textContent = '';
  $('assessment').textContent = 'Awaiting assessment';
  try {
    const result = await api(`brands/${selected}`);
    showSummary(result.community);
    // The existing assessment remains authoritative, even when public opinion differs.
    try {
      const response = await fetch('/v1/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: result.brand.name }), credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('Assessment unavailable');
      const assessment = await response.json();
      if (assessment.company?.id === result.brand.id && ['nice', 'naughty'].includes(assessment.scoring?.verdict)) {
        $('assessment').textContent = assessment.scoring.verdict === 'nice' ? 'On the Nice list' : 'On the Naughty list';
      }
    } catch { $('assessment').textContent = 'Our assessment is unavailable. Please try again later.'; }
    if (auth?.getUser()) {
      const own = await api(`brands/${selected}/vote`, { signedIn: true });
      showOwnVote(own.vote);
      $('vote-fields').disabled = false;
    }
    message(authError || 'Community opinion sits alongside our evidence assessment.');
  } catch (error) { message(error.message); }
  finally { loading = false; $('brand').disabled = false; }
}
async function mutate(method, body) {
  $('vote-fields').disabled = true;
  $('brand').disabled = true;
  try {
    const result = await api(`brands/${selected}/vote`, { method, body, signedIn: true });
    showSummary(result.community);
    showOwnVote(result.vote);
    message(method === 'DELETE' ? 'Your vote has been withdrawn.' : 'Your vote is saved. Thank you for taking part.');
  } catch (error) { message(error.message); }
  finally { $('vote-fields').disabled = false; $('brand').disabled = false; }
}
$('brand').addEventListener('change', () => {
  selected = $('brand').value;
  localStorage.setItem('naughty-list-brand', selected);
  history.replaceState(null, '', `/community/?brand=${encodeURIComponent(selected)}`);
  loadBrand();
});
$('sign-in').addEventListener('click', () => auth.signIn().catch(error => message(error.message)));
$('sign-out').addEventListener('click', () => auth.signOut({ returnTo: new URL('/community/', location.origin).href }));
$('vote-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData($('vote-form'));
  mutate('PUT', { choice: data.get('choice'), reasons: data.getAll('reasons') });
});
$('withdraw').addEventListener('click', () => mutate('DELETE'));

async function start() {
  const params = new URLSearchParams(location.search);
  const requested = params.get('brand');
  if (requested && /^[a-z0-9-]{1,100}$/.test(requested)) localStorage.setItem('naughty-list-brand', requested);
  const config = await api('config');
  if (config.signInAvailable) {
    try {
      // Same client-side AuthKit pattern and storage trade-off as Joyo. The
      // isolated voting origin never exposes its tokens to a shop content script.
      auth = await createClient(config.clientId, {
        redirectUri: new URL('/community/', location.origin).href,
        devMode: true,
        onRedirectCallback: () => history.replaceState(null, '', '/community/')
      });
      if (location.pathname === '/community/login') { await auth.signIn(); return; }
      $('sign-in').disabled = false;
      $('sign-in').hidden = Boolean(auth.getUser());
      $('sign-out').hidden = !auth.getUser();
      $('vote-form').hidden = !auth.getUser();
    } catch { authError = 'Sign-in is unavailable. You can still view community results. Please reload to retry.'; }
  } else authError = 'Voting sign-in is not configured yet. Community results remain public.';
  const { brands } = await api('brands');
  $('brand').replaceChildren();
  if (!brands.length) {
    $('score').textContent = 'Voting is not open yet';
    message('H&M voting opens after its brand identity has been reviewed and sign-in is ready.');
    return;
  }
  for (const brand of brands) {
    const option = document.createElement('option'); option.value = brand.id; option.textContent = brand.name; $('brand').append(option);
  }
  const remembered = localStorage.getItem('naughty-list-brand');
  selected = brands.some(brand => brand.id === remembered) ? remembered : brands[0].id;
  $('brand').value = selected;
  if (requested && !brands.some(brand => brand.id === requested)) {
    message('This brand is not open for voting yet.');
    return;
  }
  await loadBrand();
}
start().catch(() => message('The list is unavailable. Please reload to try again.'));

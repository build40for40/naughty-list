// Reuses Joyo's AuthKit JWT/JWKS pattern. Email verification is additionally
// checked against WorkOS, never accepted from a browser-supplied user object.
import { createRemoteJWKSet, jwtVerify } from 'jose';

const keySets = new Map();
export const workosIssuer = clientId => `https://api.workos.com/user_management/${clientId}`;
export function workosKeys(clientId) {
  if (!keySets.has(clientId)) keySets.set(clientId, createRemoteJWKSet(new URL(`https://api.workos.com/sso/jwks/${clientId}`)));
  return keySets.get(clientId);
}

export async function authenticate(request, keys, issuer) {
  const token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, keys, { issuer, algorithms: ['RS256'], requiredClaims: ['sub', 'exp', 'iat'] });
    return typeof payload.sub === 'string' && /^user_[a-zA-Z0-9]+$/.test(payload.sub) ? payload.sub : null;
  } catch { return null; }
}

export async function verifiedVoter(request, env, { keys, fetcher = fetch } = {}) {
  if (!env.WORKOS_CLIENT_ID || !env.WORKOS_API_KEY) return { error: 'auth_unavailable', status: 503 };
  const userId = await authenticate(request, keys ?? workosKeys(env.WORKOS_CLIENT_ID), env.WORKOS_ISSUER || workosIssuer(env.WORKOS_CLIENT_ID));
  if (!userId) return { error: 'sign_in_required', status: 401 };
  const response = await fetcher(`https://api.workos.com/user_management/users/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${env.WORKOS_API_KEY}` }, signal: AbortSignal.timeout(10000)
  });
  if (response.status === 404) return { error: 'sign_in_required', status: 401 };
  if (!response.ok) throw new Error('Account verification unavailable');
  const user = await response.json();
  if (user.id !== userId || user.email_verified !== true) return { error: 'email_verification_required', status: 403 };
  return { userId };
}

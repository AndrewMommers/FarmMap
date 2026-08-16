// Signs/verifies the OAuth `state` parameter so an oauth-callback function
// can trust the farmId it carries without a database round-trip, and so it
// can't be forged or replayed against a different farm or a different
// provider's callback (CSRF protection for the OAuth redirect). Requires the
// STATE_SIGNING_SECRET secret (generate one with `openssl rand -hex 32`) —
// the same secret can safely be shared across all providers since the
// provider name is bound into the signed payload.

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signState(secret: string, provider: string, farmId: string): Promise<string> {
  const nonce = crypto.randomUUID();
  const payload = `${provider}.${farmId}.${nonce}`;
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

/** Returns the farmId if the state is authentic and matches the expected provider, otherwise null. */
export async function verifyState(secret: string, provider: string, state: string): Promise<string | null> {
  const parts = state.split('.');
  if (parts.length !== 4) return null;
  const [stateProvider, farmId, nonce, sig] = parts;
  if (stateProvider !== provider) return null;
  const expected = await hmac(secret, `${stateProvider}.${farmId}.${nonce}`);
  return expected === sig ? farmId : null;
}

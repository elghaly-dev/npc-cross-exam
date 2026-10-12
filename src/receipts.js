// Signed receipts for answered questions. The server keeps no game state, so the browser
// carries the history. Every turn /api/ask answers comes back with a receipt: an HMAC over
// the case, the turn's position, the receipt before it and the turn itself. /api/accuse
// walks the chain again, so it only counts questions this server really answered, in that
// order, for that case. Nothing in a turn can be edited without breaking its receipt.
//
// RECEIPT_SECRET is a Worker secret (npx wrangler secret put RECEIPT_SECRET). Without it
// each server instance makes a random key, which is fine for tests and the local server
// but means a receipt only checks out on the instance that issued it.

const enc = new TextEncoder();

export async function receiptKey(secret) {
  const raw = secret ? enc.encode(String(secret)) : crypto.getRandomValues(new Uint8Array(32));
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function payload(caseId, index, prev, t) {
  return enc.encode(
    JSON.stringify([
      'v1',
      caseId,
      index,
      prev,
      t.suspectId,
      t.question,
      t.present,
      t.reply,
      t.claims.map((c) => [c.about, c.slot, c.value]),
      t.reveals,
      t.cracked,
    ]),
  );
}

function toBase64Url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(s)) return null;
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '=');
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

export async function signTurn(key, caseId, index, prev, turn) {
  return toBase64Url(await crypto.subtle.sign('HMAC', key, payload(caseId, index, prev, turn)));
}

// True only if every turn carries the receipt this server would have issued for it.
export async function verifyChain(key, caseId, turns) {
  let prev = '';
  for (let i = 0; i < turns.length; i++) {
    const mac = fromBase64Url(turns[i].receipt);
    if (!mac) return false;
    const ok = await crypto.subtle.verify('HMAC', key, mac, payload(caseId, i, prev, turns[i]));
    if (!ok) return false;
    prev = turns[i].receipt;
  }
  return true;
}

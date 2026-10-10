import { createApp } from '../src/api.js';
import { createRateLimiter } from '../src/ratelimit.js';

export const BASE = 'http://game.test';

export function makeApp(env = {}, deps = {}) {
  return createApp(env, {
    limiter: createRateLimiter({ perMinute: 6000, burst: 1000 }),
    log: () => {},
    ...deps,
  });
}

export function post(app, path, body, { headers = {}, ip = '203.0.113.7' } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return app.handle(
    new Request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: raw,
    }),
    { ip },
  );
}

export function get(app, path) {
  return app.handle(new Request(`${BASE}${path}`), { ip: '203.0.113.7' });
}

// Plays one question the way the browser does and appends the turn to the game.
export async function askTurn(app, game, suspectId, question, present = null) {
  const res = await post(app, '/api/ask', {
    caseId: 'harbor-compass',
    suspectId,
    question,
    present,
    history: game.turns,
    unlocked: [...game.unlocked],
  });
  const data = await res.json();
  if (res.status !== 200) throw new Error(`${res.status} ${data.error}`);
  for (const r of data.reveals) game.unlocked.add(r.id);
  game.turns.push({
    suspectId,
    question,
    present,
    reply: data.reply,
    claims: data.claims,
    reveals: data.reveals.map((r) => r.id),
    cracked: data.cracked,
  });
  game.contradictions = data.contradictions;
  return data;
}

export function newGame() {
  return { turns: [], unlocked: new Set(['case_lock']), contradictions: [] };
}

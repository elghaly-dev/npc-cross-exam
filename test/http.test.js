// End to end over real HTTP: the dev server serves the page and the API, and with
// MOCK_OPENAI=1 it also serves the mock model as an OpenAI-compatible endpoint. Pointing
// NEBIUS_BASE_URL at that endpoint with a key set sends every question through the real
// HTTP model client, so the mock -> Nemotron switch is proven to be config only.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/dev-server.js';

const servers = [];
after(() => Promise.all(servers.map((s) => new Promise((r) => s.close(r)))));

function listen(env) {
  const { server, app } = createServer({ env });
  servers.push(server);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ base: `http://127.0.0.1:${server.address().port}`, app }));
  });
}

test('static page and headers', async () => {
  const { base } = await listen({});
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(page.headers.get('content-security-policy'), /default-src 'self'/);
  assert.match(await page.text(), /NPC Cross-Exam/);
  const shared = await fetch(`${base}/shared/detector.js`);
  assert.equal(shared.status, 200);
  assert.equal((await fetch(`${base}/_headers`)).status, 404);
  assert.equal((await fetch(`${base}/../src/cases/harbor-compass.js`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e/src/cases/harbor-compass.js`)).status, 404);
});

test('mock mode over HTTP', async () => {
  const { base } = await listen({});
  const res = await fetch(`${base}/api/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ suspectId: 'dana', question: 'When did you leave the museum?' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.mode, 'mock');
  assert.match(body.reply, /nine/);
});

test('real HTTP client against an OpenAI-compatible endpoint, switched by env only', async () => {
  const upstream = await listen({ MOCK_OPENAI: '1' });
  const { base, app } = await listen({
    NEBIUS_API_KEY: 'test-key-not-real',
    NEBIUS_BASE_URL: `${upstream.base}/mock/v1`,
    NEBIUS_MODEL: 'nvidia/nemotron-test',
  });
  assert.equal(app.client.mode, 'token-factory');
  const res = await fetch(`${base}/api/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({ suspectId: 'theo', question: 'Where were you after 21:00?' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.mode, 'token-factory');
  assert.equal(body.model, 'nvidia/nemotron-test');
  assert.deepEqual(body.claims, [{ about: 'theo', slot: 'in_building_after_2100', value: 'no' }]);
  const health = await (await fetch(`${base}/api/health`)).json();
  assert.ok(!JSON.stringify(health).includes('test-key-not-real'));
});

test('the mock endpoint wants a bearer key, like the real one', async () => {
  const upstream = await listen({ MOCK_OPENAI: '1' });
  const res = await fetch(`${upstream.base}/mock/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [] }),
  });
  assert.equal(res.status, 401);
});

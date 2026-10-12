import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModelClient, completionText, ModelError, DEFAULT_BASE_URL, DEFAULT_MODEL } from '../src/model/client.js';
import { buildMessages } from '../src/prompt.js';
import { getCase } from '../src/cases/index.js';

const KEY = 'test-key-not-real';

function fakeFetch(respond) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return respond(url, init);
  };
  fn.calls = calls;
  return fn;
}

const okBody = {
  id: 'x',
  object: 'chat.completion',
  model: 'm',
  choices: [{ index: 0, message: { role: 'assistant', content: '{"reply":"hi","claims":[]}' } }],
};

test('no key: the mock model answers', () => {
  const client = createModelClient({});
  assert.equal(client.mode, 'mock');
});

test('blank key counts as no key', () => {
  assert.equal(createModelClient({ NEBIUS_API_KEY: '   ' }).mode, 'mock');
});

test('key set: OpenAI-compatible request to NEBIUS_BASE_URL with a bearer key', async () => {
  const fetchImpl = fakeFetch(() => new Response(JSON.stringify(okBody), { status: 200 }));
  const client = createModelClient(
    { NEBIUS_API_KEY: KEY, NEBIUS_BASE_URL: 'https://example.test/v1/', NEBIUS_MODEL: 'nvidia/some-nemotron' },
    { fetchImpl },
  );
  assert.equal(client.mode, 'token-factory');
  const res = await client.createChatCompletion({ messages: [{ role: 'user', content: 'x' }], max_tokens: 10 });
  assert.equal(completionText(res), '{"reply":"hi","claims":[]}');
  const [call] = fetchImpl.calls;
  assert.equal(call.url, 'https://example.test/v1/chat/completions');
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers.authorization, `Bearer ${KEY}`);
  assert.equal(call.body.model, 'nvidia/some-nemotron');
  assert.equal(call.body.max_tokens, 10);
  assert.deepEqual(call.body.response_format, { type: 'json_object' });
});

test('defaults: Token Factory base URL and Nemotron model', async () => {
  const fetchImpl = fakeFetch(() => new Response(JSON.stringify(okBody)));
  const client = createModelClient({ NEBIUS_API_KEY: KEY }, { fetchImpl });
  await client.createChatCompletion({ messages: [] });
  assert.equal(fetchImpl.calls[0].url, `${DEFAULT_BASE_URL}/chat/completions`);
  assert.equal(fetchImpl.calls[0].body.model, DEFAULT_MODEL);
});

test('the caller cannot pick the model', async () => {
  const fetchImpl = fakeFetch(() => new Response(JSON.stringify(okBody)));
  const client = createModelClient({ NEBIUS_API_KEY: KEY }, { fetchImpl });
  await client.createChatCompletion({ messages: [], model: 'something-else' });
  assert.equal(fetchImpl.calls[0].body.model, DEFAULT_MODEL);
});

test('NEBIUS_JSON_MODE=off drops response_format', async () => {
  const fetchImpl = fakeFetch(() => new Response(JSON.stringify(okBody)));
  const client = createModelClient({ NEBIUS_API_KEY: KEY, NEBIUS_JSON_MODE: 'off' }, { fetchImpl });
  await client.createChatCompletion({ messages: [] });
  assert.equal(fetchImpl.calls[0].body.response_format, undefined);
});

test('upstream errors become ModelError without the key or the upstream body', async () => {
  const fetchImpl = fakeFetch(() => new Response(`bad key ${KEY}`, { status: 401 }));
  const client = createModelClient({ NEBIUS_API_KEY: KEY }, { fetchImpl });
  await assert.rejects(client.createChatCompletion({ messages: [] }), (err) => {
    assert.ok(err instanceof ModelError);
    assert.equal(err.status, 401);
    assert.ok(!err.message.includes(KEY));
    return true;
  });
});

test('network failure becomes ModelError', async () => {
  const client = createModelClient(
    { NEBIUS_API_KEY: KEY },
    { fetchImpl: async () => { throw new TypeError('fetch failed'); } },
  );
  await assert.rejects(client.createChatCompletion({ messages: [] }), (err) => err instanceof ModelError && err.kind === 'network');
});

test('the mock returns the same OpenAI response shape', async () => {
  const client = createModelClient({});
  const caseData = getCase();
  const messages = buildMessages(caseData, 'rosa', [], 'Where were you all evening?', null);
  const res = await client.createChatCompletion({ messages, temperature: 0.6, max_tokens: 400 });
  assert.equal(res.object, 'chat.completion');
  assert.equal(res.choices[0].message.role, 'assistant');
  assert.ok(res.usage.total_tokens > 0);
  const out = JSON.parse(completionText(res));
  assert.equal(typeof out.reply, 'string');
  assert.deepEqual(out.claims, [{ about: 'rosa', slot: 'at_desk_2120_2135', value: 'yes' }]);
});

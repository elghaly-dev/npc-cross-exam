// OpenAI-compatible Chat Completions client. The settings come from the environment:
// with NEBIUS_API_KEY set, requests go to NEBIUS_BASE_URL (Nebius Token Factory);
// without it, the in-process mock answers with the same request and response shape.
// Swapping mock -> Nemotron is a config change, not a code change.

import { createMockClient } from './mock.js';

export const DEFAULT_BASE_URL = 'https://api.tokenfactory.nebius.com/v1';
export const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const DEFAULT_TIMEOUT_MS = 25_000;

export class ModelError extends Error {
  constructor(message, { status = 0, kind = 'upstream' } = {}) {
    super(message);
    this.name = 'ModelError';
    this.status = status;
    this.kind = kind;
  }
}

export function createModelClient(env = {}, { fetchImpl = globalThis.fetch, timeoutMs } = {}) {
  const apiKey = String(env.NEBIUS_API_KEY ?? '').trim();
  if (!apiKey) return createMockClient();

  const model = String(env.NEBIUS_MODEL ?? '').trim() || DEFAULT_MODEL;
  const baseURL = (String(env.NEBIUS_BASE_URL ?? '').trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const jsonMode = String(env.NEBIUS_JSON_MODE ?? 'json_object').trim() !== 'off';
  const timeout = Number(timeoutMs ?? env.NEBIUS_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  return {
    mode: 'token-factory',
    model,
    baseURL,
    async createChatCompletion(params) {
      const body = { ...params, model };
      if (jsonMode && !body.response_format) body.response_format = { type: 'json_object' };
      let res;
      try {
        res = await fetchImpl(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeout),
        });
      } catch (err) {
        const kind = err?.name === 'TimeoutError' ? 'timeout' : 'network';
        throw new ModelError(`model request failed (${kind})`, { kind });
      }
      if (!res.ok) {
        // The upstream body is not read or forwarded: it can echo request details.
        throw new ModelError(`model returned HTTP ${res.status}`, { status: res.status });
      }
      try {
        return await res.json();
      } catch {
        throw new ModelError('model returned a body that is not JSON', { kind: 'bad_body' });
      }
    },
  };
}

export function completionText(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((p) => p?.text ?? '').join('');
  return '';
}

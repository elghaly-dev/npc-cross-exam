// Mock model. Takes an OpenAI Chat Completions request and returns an OpenAI Chat
// Completions response, so the rest of the app cannot tell it from Nemotron. It reads
// the same messages the real model gets and answers from the case's scripted lines.

import { getCase } from '../cases/index.js';

function answer(x = {}, cracked = false) {
  return {
    reply: x.reply ?? '…',
    claims: x.claims ?? [],
    reveals: x.reveals ?? [],
    cracked,
  };
}

export function mockAnswer(messages = []) {
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const caseId = /^CASE_ID: (\S+)$/m.exec(system)?.[1];
  const suspectId = /^SUSPECT_ID: (\S+)$/m.exec(system)?.[1];
  const script = getCase(caseId)?.mock?.[suspectId];
  if (!script) return answer({ reply: 'I have nothing to say.' });

  const changed =
    /^STORY_CHANGED: yes$/m.test(system) ||
    messages.some((m) => m.role === 'assistant' && /"cracked":\s*true/.test(m.content));
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const present = /^\[Evidence shown: (\w+) \|/m.exec(last)?.[1] ?? null;
  const question = (/^Detective: ([\s\S]*)$/m.exec(last)?.[1] ?? '').trim();

  if (present) {
    const p = script.present[present];
    if (!p) return answer(script.presentOther);
    if (p.crack) return changed ? answer(script.repeatCrack) : answer(p, true);
    return answer(p);
  }

  const base = script.intents.find((i) => i.when.test(question)) ?? script.fallback;
  const pick = changed && base.after ? base.after : base;
  return answer({ ...pick, reveals: base.reveals });
}

const approxTokens = (text) => Math.ceil(text.length / 4);

export function createMockClient({ model = 'mock-suspects' } = {}) {
  let count = 0;
  return {
    mode: 'mock',
    model,
    async createChatCompletion(params = {}) {
      const messages = Array.isArray(params.messages) ? params.messages : [];
      const content = JSON.stringify(mockAnswer(messages));
      const prompt = messages.reduce((n, m) => n + approxTokens(String(m.content ?? '')), 0);
      const completion = approxTokens(content);
      count += 1;
      return {
        id: `mock-${count}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
        usage: { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion },
      };
    },
  };
}

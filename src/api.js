// The serverless proxy. Holds the key, builds the prompts, validates the model output
// and rate-limits each visitor. Stateless: the browser sends the turns so far.
//
//   GET  /api/health   mode and model name
//   GET  /api/case     public case data (no secrets)
//   POST /api/ask      one question to one suspect
//   POST /api/accuse   the accusation; returns the score and the true story

import { getCase, publicCase, evidenceCard, DEFAULT_CASE_ID } from './cases/index.js';
import { buildMessages } from './prompt.js';
import { createModelClient, completionText, ModelError } from './model/client.js';
import { parseSuspectOutput, validateClaims, cleanText } from './model/parse.js';
import { limiterFromEnv } from './ratelimit.js';
import { detect } from '../public/shared/detector.js';
import { scoreGame, RULES } from '../public/shared/score.js';

export const MAX_BODY_BYTES = 32 * 1024;
export const MAX_QUESTION_CHARS = 280;
const MODEL_PARAMS = { temperature: 0.6, max_tokens: 400 };

class HttpError extends Error {
  constructor(status, code, message, headers = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  });
}

async function readJson(request) {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'bad_type', 'Send JSON.');
  }
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, 'too_large', 'Request is too large.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new HttpError(413, 'too_large', 'Request is too large.');
  }
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
    return body;
  } catch {
    throw new HttpError(400, 'bad_json', 'Request is not valid JSON.');
  }
}

function checkOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return; // not a browser cross-site request; rate limits still apply
  const self = new URL(request.url).origin;
  const extra = String(env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin !== self && !extra.includes(origin)) {
    throw new HttpError(403, 'bad_origin', 'Origin not allowed.');
  }
}

function loadCase(id) {
  const caseData = getCase(id ?? DEFAULT_CASE_ID);
  if (!caseData) throw new HttpError(404, 'no_case', 'Unknown case.');
  return caseData;
}

function question(value) {
  const q = cleanText(value, MAX_QUESTION_CHARS + 1);
  if (!q) throw new HttpError(400, 'no_question', 'Ask a question.');
  if (q.length > MAX_QUESTION_CHARS) {
    throw new HttpError(400, 'question_too_long', `Keep questions under ${MAX_QUESTION_CHARS} characters.`);
  }
  return q;
}

// History comes from the browser, so every field is checked again here.
function readHistory(raw, caseData) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new HttpError(400, 'bad_history', 'History must be a list.');
  if (raw.length > caseData.questionBudget) {
    throw new HttpError(400, 'bad_history', 'History is longer than the question budget.');
  }
  return raw.map((t) => {
    if (!t || typeof t !== 'object' || !caseData.suspects[t.suspectId]) {
      throw new HttpError(400, 'bad_history', 'History has an unknown suspect.');
    }
    const present = t.present && caseData.evidence[t.present] ? t.present : null;
    return {
      suspectId: t.suspectId,
      question: cleanText(t.question, MAX_QUESTION_CHARS),
      present,
      reply: cleanText(t.reply),
      claims: validateClaims(t.claims, caseData),
      reveals: Array.isArray(t.reveals)
        ? t.reveals.filter((id) => caseData.evidence[id]?.holder === t.suspectId)
        : [],
      cracked: t.cracked === true,
    };
  });
}

function readUnlocked(raw, caseData, history) {
  const ids = new Set(caseData.startEvidence);
  if (Array.isArray(raw)) for (const id of raw) if (caseData.evidence[id]) ids.add(id);
  for (const t of history) for (const id of t.reveals) ids.add(id);
  return ids;
}

function names(caseData) {
  return Object.fromEntries(Object.entries(caseData.suspects).map(([id, s]) => [id, s.name]));
}

function labels(caseData) {
  return Object.fromEntries(
    Object.entries(caseData.slots).map(([k, v]) => [k, { yes: v.yes, no: v.no }]),
  );
}

function contradictionsFor(caseData, turns, unlocked) {
  const claims = turns.flatMap((t, turn) => t.claims.map((c) => ({ ...c, by: t.suspectId, turn })));
  const evidence = [...unlocked].map((id) => ({ id, ...caseData.evidence[id] }));
  return detect({ claims, evidence, labels: labels(caseData), names: names(caseData) });
}

const crackedSuspects = (turns) => new Set(turns.filter((t) => t.cracked).map((t) => t.suspectId));

export function createApp(env = {}, deps = {}) {
  const client = deps.client ?? createModelClient(env, deps);
  const limiter = deps.limiter ?? limiterFromEnv(env);
  const log = deps.log ?? ((...a) => console.warn(...a));

  async function rateLimit(request, ctx) {
    const ip = ctx.ip || 'unknown';
    if (env.RATE_LIMITER?.limit) {
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) throw new HttpError(429, 'slow_down', 'Too many questions too fast.', { 'retry-after': '10' });
    }
    const r = limiter.take(ip);
    if (!r.ok) {
      throw new HttpError(429, 'slow_down', `Too many questions too fast. Try again in ${r.retryAfter} s.`, {
        'retry-after': String(r.retryAfter),
      });
    }
  }

  async function ask(request, ctx) {
    checkOrigin(request, env);
    const body = await readJson(request);
    const caseData = loadCase(body.caseId);
    const suspectId = body.suspectId;
    const suspect = caseData.suspects[suspectId];
    if (!suspect) throw new HttpError(400, 'no_suspect', 'Unknown suspect.');
    const q = question(body.question);
    const history = readHistory(body.history, caseData);
    if (history.length >= caseData.questionBudget) {
      throw new HttpError(409, 'no_questions_left', 'No questions left. Make your accusation.');
    }
    const unlocked = readUnlocked(body.unlocked, caseData, history);
    const present = body.present ?? null;
    if (present !== null && !unlocked.has(present)) {
      throw new HttpError(400, 'bad_evidence', 'You have not found that evidence yet.');
    }

    await rateLimit(request, ctx);
    if (client.mode !== 'mock') {
      const day = limiter.takeDaily();
      if (!day.ok) {
        throw new HttpError(503, 'resting', 'The suspects are resting for today. Come back tomorrow.', {
          'retry-after': String(day.retryAfter),
        });
      }
    }

    const mine = history.filter((t) => t.suspectId === suspectId);
    const messages = buildMessages(caseData, suspectId, mine, q, present);
    let text;
    try {
      text = completionText(await client.createChatCompletion({ messages, ...MODEL_PARAMS }));
    } catch (err) {
      log('model call failed:', err instanceof ModelError ? `${err.kind} ${err.status}` : 'error');
      throw new HttpError(502, 'no_answer', `${suspect.name} didn't answer. Try again.`);
    }

    const out = parseSuspectOutput(text, caseData, suspectId);
    const already = crackedSuspects(history).has(suspectId);
    const turn = { suspectId, question: q, present, ...out, cracked: out.cracked && !already };
    for (const id of turn.reveals) unlocked.add(id);
    const turns = [...history, turn];

    return json(200, {
      reply: turn.reply,
      claims: turn.claims,
      reveals: turn.reveals.map((id) => evidenceCard(caseData, id)),
      cracked: turn.cracked,
      contradictions: contradictionsFor(caseData, turns, unlocked),
      questionsLeft: caseData.questionBudget - turns.length,
      mode: client.mode,
      model: client.model,
    });
  }

  async function accuse(request, ctx) {
    checkOrigin(request, env);
    const body = await readJson(request);
    const caseData = loadCase(body.caseId);
    const accused = caseData.suspects[body.suspectId];
    if (!accused) throw new HttpError(400, 'no_suspect', 'Unknown suspect.');
    const history = readHistory(body.history, caseData);
    await rateLimit(request, ctx);

    const unlocked = readUnlocked(body.unlocked, caseData, history);
    const contradictions = contradictionsFor(caseData, history, unlocked);
    const correct = body.suspectId === caseData.culprit;
    const support = contradictions.filter((c) => c.involves.includes(caseData.culprit));
    const score = scoreGame({
      questions: history.length,
      contradictions,
      cracks: crackedSuspects(history).size,
      accusation: { correct, support: support.length },
    });
    return json(200, {
      correct,
      accused: { id: body.suspectId, name: accused.name },
      culprit: { id: caseData.culprit, name: caseData.suspects[caseData.culprit].name },
      solution: caseData.solution,
      support: support.slice(0, RULES.supportMax).map((c) => c.id),
      contradictions,
      score,
    });
  }

  async function handle(request, ctx = {}) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return json(200, { ok: true, mode: client.mode, model: client.model });
      }
      if (url.pathname === '/api/case' && request.method === 'GET') {
        const caseData = loadCase(url.searchParams.get('id') ?? undefined);
        return json(200, { ...publicCase(caseData), mode: client.mode, model: client.model });
      }
      if (url.pathname === '/api/ask' || url.pathname === '/api/accuse') {
        if (request.method !== 'POST') throw new HttpError(405, 'method', 'Use POST.', { allow: 'POST' });
        return url.pathname === '/api/ask' ? await ask(request, ctx) : await accuse(request, ctx);
      }
      if (url.pathname === '/api/health' || url.pathname === '/api/case') {
        throw new HttpError(405, 'method', 'Use GET.', { allow: 'GET' });
      }
      throw new HttpError(404, 'not_found', 'Not found.');
    } catch (err) {
      if (err instanceof HttpError) {
        return json(err.status, { error: err.code, message: err.message }, err.headers);
      }
      log('unexpected error:', err?.name ?? 'error');
      return json(500, { error: 'server', message: 'Something went wrong. Try again.' });
    }
  }

  return { handle, client, limiter };
}

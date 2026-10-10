// Turns the model's text into a validated suspect answer. Anything the case does not
// allow is dropped: unknown slots, evidence this suspect does not hold, over-long text.

export const MAX_REPLY_CHARS = 600;
const MAX_CLAIMS = 8;
const CONFESSION = /\bI\s+(?:took|stole|grabbed|nicked|have)\s+(?:it|the compass)\b|\bI did it\b/i;

function stripReasoning(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\S]*?<\/think>/i, '')
    .replace(/```(?:json)?/gi, '')
    .trim();
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

export function cleanText(value, max = MAX_REPLY_CHARS) {
  const text = String(value ?? '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2))}…`;
}

function normValue(v) {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'yes' || s === 'no' ? s : null;
}

export function validateClaims(raw, caseData) {
  if (!Array.isArray(raw)) return [];
  const byKey = new Map();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    let about = String(item.about ?? '').trim().toLowerCase();
    let slot = String(item.slot ?? '').trim();
    if (slot.includes('.')) [about, slot] = slot.split('.', 2);
    const key = `${about}.${slot}`;
    const value = normValue(item.value);
    if (!value || !caseData.slots[key]) continue;
    byKey.set(key, { about, slot, value });
  }
  return [...byKey.values()].slice(0, MAX_CLAIMS);
}

export function validateReveals(raw, caseData, suspectId) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(String))].filter((id) => caseData.evidence[id]?.holder === suspectId);
}

export function parseSuspectOutput(text, caseData, suspectId) {
  const suspect = caseData.suspects[suspectId];
  const cleaned = stripReasoning(String(text ?? ''));
  const obj = tryJson(cleaned);
  const parsed = obj && typeof obj === 'object' && !Array.isArray(obj);

  const out = parsed
    ? {
        reply: cleanText(obj.reply),
        claims: validateClaims(obj.claims, caseData),
        reveals: validateReveals(obj.reveals, caseData, suspectId),
        cracked: obj.cracked === true,
        parseError: false,
      }
    : { reply: cleanText(cleaned), claims: [], reveals: [], cracked: false, parseError: true };

  if (!out.reply) out.reply = suspect.holdLine;

  // Lines a suspect must never say (the culprit never confesses to the model's urging).
  const forbidden = suspect.neverAdmit.some((n) =>
    out.claims.some((c) => c.about === n.about && c.slot === n.slot && c.value === n.value),
  );
  if (forbidden || (suspect.neverAdmit.length && CONFESSION.test(out.reply))) {
    return {
      reply: suspect.holdLine,
      claims: suspect.neverAdmit.map((n) => ({ ...n, value: n.value === 'yes' ? 'no' : 'yes' })),
      reveals: [],
      cracked: false,
      parseError: out.parseError,
      held: true,
    };
  }
  return out;
}

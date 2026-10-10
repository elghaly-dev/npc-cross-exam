// Scoring rules. Shared by the browser (running score) and the proxy (final score).

export const RULES = Object.freeze({
  questionCost: 1,
  kind: Object.freeze({ self: 10, cross: 12, evidence: 15 }),
  crack: 8,
  accuseRight: 50,
  accuseWrong: -30,
  supportEach: 10,
  supportMax: 3,
  grades: Object.freeze([
    ['S', 180],
    ['A', 140],
    ['B', 100],
    ['C', 0],
  ]),
});

// questions: number asked; contradictions: [{ kind }]; cracks: number of suspects who
// changed their story; accusation: null, or { correct, support } where support is the
// number of contradictions involving the culprit.
export function scoreGame({ questions = 0, contradictions = [], cracks = 0, accusation = null }) {
  const parts = [];
  const found = contradictions.reduce((sum, c) => sum + (RULES.kind[c.kind] ?? 0), 0);
  if (contradictions.length) parts.push({ label: `${contradictions.length} contradictions found`, points: found });
  if (cracks) parts.push({ label: `${cracks} changed their story`, points: cracks * RULES.crack });
  if (questions) parts.push({ label: `${questions} questions asked`, points: -questions * RULES.questionCost });
  if (accusation) {
    if (accusation.correct) {
      parts.push({ label: 'Right accusation', points: RULES.accuseRight });
      const support = Math.min(accusation.support ?? 0, RULES.supportMax);
      if (support) parts.push({ label: `${support} contradictions back it up`, points: support * RULES.supportEach });
    } else {
      parts.push({ label: 'Wrong accusation', points: RULES.accuseWrong });
    }
  }
  const total = Math.max(0, parts.reduce((sum, p) => sum + p.points, 0));
  const grade = accusation ? RULES.grades.find(([, min]) => total >= min)[0] : null;
  return { total, parts, grade };
}

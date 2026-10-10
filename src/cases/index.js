import { harborCompass } from './harbor-compass.js';

const CASES = new Map([[harborCompass.id, harborCompass]]);

export const DEFAULT_CASE_ID = harborCompass.id;

export function getCase(id = DEFAULT_CASE_ID) {
  return CASES.get(id) ?? null;
}

export function evidenceCard(caseData, id) {
  const e = caseData.evidence[id];
  return e ? { id, title: e.title, text: e.text } : null;
}

// What the browser may see before the accusation: no slots, no persona sheets, no
// culprit, and evidence text only for the evidence the player starts with.
export function publicCase(caseData) {
  return {
    id: caseData.id,
    title: caseData.title,
    intro: caseData.intro,
    questionBudget: caseData.questionBudget,
    startEvidence: [...caseData.startEvidence],
    suspects: Object.entries(caseData.suspects).map(([id, s]) => ({
      id,
      name: s.name,
      role: s.role,
      bio: s.bio,
      suggestions: [...s.suggestions],
    })),
    evidence: caseData.startEvidence.map((id) => evidenceCard(caseData, id)),
    evidenceTotal: Object.keys(caseData.evidence).length,
  };
}

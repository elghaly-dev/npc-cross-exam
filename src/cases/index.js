import { harborCompass } from './harbor-compass.js';
import { greenhouseOrchid } from './greenhouse-orchid.js';
import { operaScore } from './opera-score.js';

const CASES = new Map([harborCompass, greenhouseOrchid, operaScore].map((c) => [c.id, c]));

export const DEFAULT_CASE_ID = harborCompass.id;

// Questions a player must really ask (checked by receipt) before /api/accuse answers.
export const MIN_QUESTIONS = 3;

export function getCase(id = DEFAULT_CASE_ID) {
  return CASES.get(id) ?? null;
}

export function caseIds() {
  return [...CASES.keys()];
}

// The case list for the picker: titles and teasers only.
export function listCases() {
  return [...CASES.values()].map((c) => ({
    id: c.id,
    title: c.title,
    teaser: c.teaser,
    questionBudget: c.questionBudget,
    suspects: Object.values(c.suspects).map((s) => s.name),
  }));
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
    teaser: caseData.teaser,
    intro: caseData.intro,
    accuseQuestion: caseData.accuseQuestion,
    questionBudget: caseData.questionBudget,
    minQuestions: Math.min(MIN_QUESTIONS, caseData.questionBudget),
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

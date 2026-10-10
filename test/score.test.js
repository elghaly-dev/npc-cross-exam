import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreGame, RULES } from '../public/shared/score.js';

test('each question costs a point, never below zero', () => {
  assert.equal(scoreGame({ questions: 3 }).total, 0);
  assert.equal(scoreGame({ questions: 3, contradictions: [{ kind: 'evidence' }] }).total, 12);
});

test('contradictions, cracks and a right accusation add up', () => {
  const s = scoreGame({
    questions: 10,
    contradictions: [{ kind: 'self' }, { kind: 'cross' }, { kind: 'evidence' }],
    cracks: 2,
    accusation: { correct: true, support: 5 },
  });
  // 10 + 12 + 15 + 16 - 10 + 50 + 30 (support capped at 3)
  assert.equal(s.total, 123);
  assert.equal(s.grade, 'B');
  assert.ok(s.parts.some((p) => p.label === 'Right accusation' && p.points === RULES.accuseRight));
});

test('a wrong accusation costs points', () => {
  const s = scoreGame({ questions: 2, contradictions: [{ kind: 'evidence' }], accusation: { correct: false } });
  assert.equal(s.total, 0);
  assert.equal(s.grade, 'C');
});

test('no grade until the accusation', () => {
  assert.equal(scoreGame({ questions: 1 }).grade, null);
});

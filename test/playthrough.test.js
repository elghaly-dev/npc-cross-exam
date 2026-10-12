import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, post, askTurn, newGame } from './helpers.js';

test('a full game on the mock model: find the contradictions, break the suspects, accuse Theo', async () => {
  const app = makeApp();
  const game = newGame();

  await askTurn(app, game, 'rosa', 'Was the case forced open?');
  assert.ok(game.contradictions.some((c) => c.id === 'evidence:case_lock:rosa:case.case_forced'));

  await askTurn(app, game, 'rosa', 'Where were you all evening?');
  await askTurn(app, game, 'rosa', 'Who came in through the doors tonight?');
  await askTurn(app, game, 'theo', 'Where were you after 21:00?');
  await askTurn(app, game, 'theo', 'Who else was around tonight?');
  await askTurn(app, game, 'dana', 'When did you leave the museum?');
  await askTurn(app, game, 'dana', 'What did you notice about the guard?');

  const theo = await askTurn(app, game, 'theo', 'This says otherwise. What really happened?', 'badge_log');
  assert.equal(theo.cracked, true);
  const dana = await askTurn(app, game, 'dana', 'This says otherwise. What really happened?', 'cafe_receipt');
  assert.equal(dana.cracked, true);
  await askTurn(app, game, 'theo', 'Where was your van tonight?');
  const rosa = await askTurn(app, game, 'rosa', 'This says otherwise. What really happened?', 'cctv_desk');
  assert.equal(rosa.cracked, true);

  const ids = game.contradictions.map((c) => c.id);
  for (const id of [
    'evidence:badge_log:theo:theo.in_building_after_2100',
    'self:theo:theo.in_building_after_2100',
    'evidence:cafe_receipt:dana:dana.left_building_2100',
    'self:dana:dana.in_cafe_2130',
    'cross:dana|theo:theo.van_in_lot_2120',
    'evidence:cctv_desk:rosa:rosa.at_desk_2120_2135',
    'self:rosa:rosa.at_desk_2120_2135',
  ]) {
    assert.ok(ids.includes(id), `missing ${id}`);
  }

  const res = await post(app, '/api/accuse', {
    caseId: 'harbor-compass',
    suspectId: 'theo',
    history: game.turns,
    unlocked: [...game.unlocked],
  });
  const result = await res.json();
  assert.equal(result.correct, true);
  assert.equal(result.support.length, 3);
  assert.equal(result.score.grade, 'S');
  assert.ok(result.score.total >= 180, `total ${result.score.total}`);
});

test('a lazy accusation after the fewest questions allowed scores low', async () => {
  const app = makeApp();
  const game = newGame();
  await askTurn(app, game, 'rosa', 'Nice evening?');
  await askTurn(app, game, 'rosa', 'Nice evening?');
  await askTurn(app, game, 'rosa', 'Nice evening?');
  const res = await post(app, '/api/accuse', { suspectId: 'theo', history: game.turns });
  const result = await res.json();
  assert.equal(res.status, 200);
  assert.equal(result.correct, true);
  assert.equal(result.score.grade, 'C');
});

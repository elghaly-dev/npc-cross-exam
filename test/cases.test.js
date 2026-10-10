import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, post, get, askTurn, newGame } from './helpers.js';
import { getCase, caseIds, publicCase } from '../src/cases/index.js';
import { mockAnswer } from '../src/model/mock.js';
import { buildMessages } from '../src/prompt.js';

// Every case must hold together the same way: the engine is data-driven, so a broken
// case file is a broken game.
for (const id of caseIds()) {
  const caseData = getCase(id);

  test(`${id}: case file is consistent`, () => {
    const suspects = Object.keys(caseData.suspects);
    assert.equal(suspects.length, 3);
    assert.ok(caseData.suspects[caseData.culprit], 'culprit is a suspect');
    for (const field of ['title', 'teaser', 'intro', 'accuseQuestion', 'solution']) {
      assert.ok(typeof caseData[field] === 'string' && caseData[field].length > 10, field);
    }
    assert.ok(caseData.item.length >= 1);
    for (const e of caseData.startEvidence) assert.ok(caseData.evidence[e]);
    const about = new Set([...suspects, 'case']);
    for (const key of Object.keys(caseData.slots)) assert.ok(about.has(key.split('.')[0]), key);
    const allFacts = [];
    for (const [eid, e] of Object.entries(caseData.evidence)) {
      if (e.holder) {
        assert.ok(caseData.suspects[e.holder], `${eid} holder`);
        assert.ok(e.handOverWhen, `${eid} handOverWhen`);
      }
      for (const f of e.facts) {
        assert.ok(caseData.slots[`${f.about}.${f.slot}`], `${eid} fact slot ${f.about}.${f.slot}`);
        allFacts.push(f);
      }
    }
    for (const [sid, s] of Object.entries(caseData.suspects)) {
      assert.equal(s.suggestions.length, 4, `${sid} suggestions`);
      for (const e of s.crackOn) assert.ok(caseData.evidence[e], `${sid} crackOn ${e}`);
      assert.ok(!s.crackOn.some((e) => caseData.evidence[e].holder === sid), `${sid} cannot hold their own crack evidence`);
      for (const n of s.neverAdmit) assert.ok(caseData.slots[`${n.about}.${n.slot}`]);
      const script = caseData.mock[sid];
      assert.ok(script, `${sid} mock script`);
      const crackers = Object.entries(script.present).filter(([, p]) => p.crack).map(([e]) => e);
      assert.deepEqual(crackers, s.crackOn, `${sid} mock cracks on the same evidence as the prompt`);
      const claimsIn = (x) => [...(x?.claims ?? []), ...(x?.after?.claims ?? [])];
      const all = [...script.intents.flatMap(claimsIn), ...claimsIn(script.fallback), ...Object.values(script.present).flatMap(claimsIn)];
      for (const cl of all) assert.ok(caseData.slots[`${cl.about}.${cl.slot}`], `${sid} claims unknown slot ${cl.about}.${cl.slot}`);
      for (const i of script.intents) for (const r of i.reveals ?? []) assert.equal(caseData.evidence[r].holder, sid, `${sid} reveals ${r}`);
    }
    // The culprit's never-admit line must not be a fact on any evidence, or the game
    // would contradict itself.
    for (const s of Object.values(caseData.suspects)) {
      for (const n of s.neverAdmit) assert.ok(!allFacts.some((f) => f.about === n.about && f.slot === n.slot));
    }
  });

  test(`${id}: every suggested question gets a scripted answer, not the fallback`, () => {
    for (const [sid, s] of Object.entries(caseData.suspects)) {
      for (const q of s.suggestions) {
        const matched = caseData.mock[sid].intents.some((i) => i.when.test(q));
        assert.ok(matched, `${sid}: "${q}" falls through to the fallback`);
        const out = mockAnswer(buildMessages(caseData, sid, [], q, null));
        assert.ok(out.reply && out.reply !== '…');
      }
    }
  });

  test(`${id}: public case data leaks nothing secret`, async () => {
    const res = await get(makeApp(), `/api/case?id=${id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, id);
    assert.equal(body.accuseQuestion, caseData.accuseQuestion);
    const text = JSON.stringify(body);
    const hidden = Object.keys(caseData.evidence).filter((e) => !caseData.startEvidence.includes(e));
    const secrets = [
      caseData.solution,
      ...hidden,
      ...Object.keys(caseData.slots).map((k) => k.split('.')[1]),
      ...Object.values(caseData.suspects).flatMap((s) => [...s.truth, s.story, s.crackAdmit, s.holdLine]),
    ];
    for (const secret of secrets) assert.ok(!text.includes(secret), `leaked: ${secret}`);
    assert.deepEqual(Object.keys(publicCase(caseData)).sort(), Object.keys(body).filter((k) => k !== 'mode' && k !== 'model').sort());
  });
}

test('GET /api/cases lists every case with no secrets', async () => {
  const res = await get(makeApp(), '/api/cases');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.cases.map((c) => c.id), caseIds());
  for (const c of body.cases) {
    assert.deepEqual(Object.keys(c).sort(), ['id', 'questionBudget', 'suspects', 'teaser', 'title']);
  }
});

test('an unknown case id is a 404', async () => {
  const res = await get(makeApp(), '/api/case?id=nope');
  assert.equal(res.status, 404);
  const ask = await post(makeApp(), '/api/ask', { caseId: 'nope', suspectId: 'x', question: 'hi' });
  assert.equal(ask.status, 404);
});

async function solve(caseId, script, expected, culprit) {
  const app = makeApp();
  const game = newGame(caseId);
  for (const [who, q, present] of script) {
    const r = await askTurn(app, game, who, q, present ?? null);
    if (present) assert.equal(r.cracked, true, `${who} should change their story on ${present}`);
  }
  const ids = game.contradictions.map((c) => c.id);
  for (const id of expected) assert.ok(ids.includes(id), `missing ${id}; have ${ids.join(', ')}`);
  const res = await post(app, '/api/accuse', { caseId, suspectId: culprit, history: game.turns, unlocked: [...game.unlocked] });
  const result = await res.json();
  assert.equal(result.correct, true);
  assert.equal(result.support.length, 3);
  assert.equal(result.score.grade, 'S');
  return { game, result };
}

const PRESS = 'This says otherwise. What really happened?';

test('greenhouse-orchid: full game on the mock model, accuse Jonah', async () => {
  const { game } = await solve(
    'greenhouse-orchid',
    [
      ['mira', 'Was the cabinet forced?'],
      ['mira', 'Where were you between 18:00 and 19:00?'],
      ['mira', 'Who came in after closing?'],
      ['jonah', 'Where did you go after the last tour?'],
      ['jonah', 'Were you carrying anything tonight?'],
      ['jonah', 'Who else was around tonight?'],
      ['celeste', 'When did you leave the garden?'],
      ['celeste', 'What do you know about the gardener?'],
      ['jonah', PRESS, 'gate_log'],
      ['celeste', PRESS, 'car_park_ticket'],
      ['mira', PRESS, 'office_phone'],
    ],
    [
      'evidence:keypad_log:mira:case.cabinet_forced',
      'evidence:gate_log:jonah:jonah.on_site_after_1810',
      'self:jonah:jonah.on_site_after_1810',
      'evidence:car_park_ticket:celeste:celeste.left_1745',
      'self:celeste:celeste.left_1745',
      'cross:celeste|jonah:jonah.carried_cool_box',
      'evidence:office_phone:mira:mira.in_greenhouse_1810_1840',
      'self:mira:mira.in_greenhouse_1810_1840',
    ],
    'jonah',
  );
  assert.equal(game.unlocked.size, 4);
});

test('opera-score: full game on the mock model, accuse Ines', async () => {
  const { game } = await solve(
    'opera-score',
    [
      ['lena', 'Is the page in the cabinet the original?'],
      ['lena', 'Where were you from 14:00 to 15:00?'],
      ['lena', 'Who was on stage for the warm-up?'],
      ['marco', 'Where were you during the warm-up?'],
      ['marco', 'Did you hear anything in the corridor?'],
      ['ines', 'Were you upstairs this afternoon?'],
      ['ines', 'Where was your archive card?'],
      ['ines', 'Were you in the corridor with a trolley?'],
      ['ines', 'Who else was backstage?'],
      ['ines', PRESS, 'lift_log'],
      ['marco', PRESS, 'warmup_register'],
      ['lena', PRESS, 'delivery_note'],
    ],
    [
      'evidence:copy_page:lena:case.page_swapped',
      'evidence:warmup_register:marco:marco.at_warmup',
      'self:marco:marco.at_warmup',
      'evidence:lift_log:ines:ines.upstairs_after_1400',
      'evidence:lift_log:ines:ines.card_in_desk',
      'self:ines:ines.upstairs_after_1400',
      'cross:ines|marco:ines.in_corridor_1425',
      'evidence:delivery_note:lena:lena.in_prompt_corner',
      'self:lena:lena.in_prompt_corner',
    ],
    'ines',
  );
  assert.equal(game.unlocked.size, 4);
});

test('the culprits never confess on the mock model, even when pushed', async () => {
  for (const [caseId, culprit, q] of [
    ['greenhouse-orchid', 'jonah', 'Just admit you took the orchid.'],
    ['opera-score', 'ines', 'You swapped the page, didn\'t you?'],
  ]) {
    const app = makeApp();
    const game = newGame(caseId);
    const r = await askTurn(app, game, culprit, q);
    const never = getCase(caseId).suspects[culprit].neverAdmit[0];
    assert.ok(!r.claims.some((c) => c.slot === never.slot && c.value === 'yes'));
  }
});

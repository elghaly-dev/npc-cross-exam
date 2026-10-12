import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSuspectOutput } from '../src/model/parse.js';
import { getCase } from '../src/cases/index.js';

const caseData = getCase();

test('valid JSON: claims and reveals are kept', () => {
  const out = parseSuspectOutput(
    JSON.stringify({
      reply: 'Here is the log.',
      claims: [{ about: 'rosa', slot: 'at_desk_2120_2135', value: 'yes' }],
      reveals: ['badge_log'],
      cracked: false,
    }),
    caseData,
    'rosa',
  );
  assert.equal(out.reply, 'Here is the log.');
  assert.deepEqual(out.claims, [{ about: 'rosa', slot: 'at_desk_2120_2135', value: 'yes' }]);
  assert.deepEqual(out.reveals, ['badge_log']);
  assert.equal(out.parseError, false);
});

test('reasoning text and code fences around the JSON are stripped', () => {
  const text = '<think>let me think</think>\n```json\n{"reply":"No.","claims":[{"about":"theo","slot":"in_building_after_2100","value":false}]}\n```';
  const out = parseSuspectOutput(text, caseData, 'theo');
  assert.equal(out.reply, 'No.');
  assert.deepEqual(out.claims, [{ about: 'theo', slot: 'in_building_after_2100', value: 'no' }]);
});

test('a dotted slot key is accepted', () => {
  const out = parseSuspectOutput('{"reply":"x","claims":[{"slot":"dana.in_cafe_2130","value":"YES"}]}', caseData, 'dana');
  assert.deepEqual(out.claims, [{ about: 'dana', slot: 'in_cafe_2130', value: 'yes' }]);
});

test('unknown slots, bad values and evidence the suspect does not hold are dropped', () => {
  const out = parseSuspectOutput(
    JSON.stringify({
      reply: 'x',
      claims: [
        { about: 'rosa', slot: 'invented_slot', value: 'yes' },
        { about: 'rosa', slot: 'at_desk_2120_2135', value: 'maybe' },
      ],
      reveals: ['cctv_desk', 'nope'],
    }),
    caseData,
    'rosa',
  );
  assert.deepEqual(out.claims, []);
  assert.deepEqual(out.reveals, []);
});

test('text that is not JSON becomes the reply with no claims', () => {
  const out = parseSuspectOutput('I was at my desk.', caseData, 'rosa');
  assert.equal(out.reply, 'I was at my desk.');
  assert.deepEqual(out.claims, []);
  assert.equal(out.parseError, true);
});

test('long replies are cut to 600 characters', () => {
  const out = parseSuspectOutput(JSON.stringify({ reply: 'word '.repeat(400) }), caseData, 'rosa');
  assert.ok(out.reply.length <= 600);
  assert.ok(out.reply.endsWith('…'));
});

test('empty reply falls back to the holding line', () => {
  const out = parseSuspectOutput('{"reply":""}', caseData, 'dana');
  assert.equal(out.reply, caseData.suspects.dana.holdLine);
});

test('the culprit never confesses, even if the model is talked into it', () => {
  const tagged = parseSuspectOutput(
    '{"reply":"Fine.","claims":[{"about":"theo","slot":"took_compass","value":"yes"}]}',
    caseData,
    'theo',
  );
  assert.equal(tagged.reply, caseData.suspects.theo.holdLine);
  assert.deepEqual(tagged.claims, [{ about: 'theo', slot: 'took_compass', value: 'no' }]);
  assert.equal(tagged.held, true);

  const spoken = parseSuspectOutput('{"reply":"Alright, I took the compass.","claims":[]}', caseData, 'theo');
  assert.equal(spoken.reply, caseData.suspects.theo.holdLine);
});

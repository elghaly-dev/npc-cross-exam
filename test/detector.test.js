import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detect } from '../public/shared/detector.js';

const labels = {
  'theo.home': { yes: 'Theo was home.', no: 'Theo was not home.' },
  'theo.van': { yes: 'The van was in the lot.', no: 'The van was not in the lot.' },
};
const names = { theo: 'Theo Marsh', dana: 'Dana Okafor', rosa: 'Rosa Vale' };
const claim = (by, about, slot, value, turn) => ({ by, about, slot, value, turn });

test('no claims, no contradictions', () => {
  assert.deepEqual(detect({ claims: [], labels, names }), []);
});

test('self: the same suspect gives two answers to one slot', () => {
  const out = detect({
    claims: [claim('theo', 'theo', 'home', 'yes', 0), claim('theo', 'theo', 'home', 'no', 3)],
    labels,
    names,
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'self:theo:theo.home');
  assert.equal(out[0].kind, 'self');
  assert.equal(out[0].points, 10);
  assert.deepEqual(out[0].involves, ['theo']);
  assert.deepEqual(out[0].press, { suspect: 'theo' });
  assert.equal(out[0].lines[0].text, 'Theo was home.');
  assert.equal(out[0].lines[1].text, 'Theo was not home.');
});

test('repeating the same answer is not a contradiction', () => {
  const out = detect({
    claims: [claim('theo', 'theo', 'home', 'yes', 0), claim('theo', 'theo', 'home', 'yes', 1)],
    labels,
    names,
  });
  assert.deepEqual(out, []);
});

test('cross: two suspects disagree; press targets the one the slot is about', () => {
  const out = detect({
    claims: [claim('theo', 'theo', 'van', 'no', 1), claim('dana', 'theo', 'van', 'yes', 4)],
    labels,
    names,
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'cross:dana|theo:theo.van');
  assert.equal(out[0].points, 12);
  assert.deepEqual(out[0].involves.sort(), ['dana', 'theo']);
  assert.deepEqual(out[0].press, { suspect: 'theo' });
});

test('evidence: a claim against a found fact', () => {
  const evidence = [{ id: 'log', title: 'Badge log', facts: [{ about: 'theo', slot: 'home', value: 'no' }] }];
  const out = detect({ claims: [claim('theo', 'theo', 'home', 'yes', 2)], evidence, labels, names });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'evidence:log:theo:theo.home');
  assert.equal(out[0].points, 15);
  assert.deepEqual(out[0].press, { suspect: 'theo', evidence: 'log' });
  assert.equal(out[0].lines[1].who, 'Badge log');
});

test('ids are stable, so a contradiction is counted once', () => {
  const claims = [
    claim('theo', 'theo', 'home', 'yes', 0),
    claim('theo', 'theo', 'home', 'no', 1),
    claim('theo', 'theo', 'home', 'yes', 2),
    claim('theo', 'theo', 'home', 'no', 3),
  ];
  const ids = detect({ claims, labels, names }).map((c) => c.id);
  assert.deepEqual(ids, ['self:theo:theo.home']);
});

test('evidence the player has not found does not count', () => {
  const out = detect({ claims: [claim('theo', 'theo', 'home', 'yes', 0)], evidence: [], labels, names });
  assert.deepEqual(out, []);
});

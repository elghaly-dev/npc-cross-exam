// Contradiction detector. Pure functions, no secrets: the browser and the proxy both
// load this file. The model only tags what a suspect said; this code decides whether
// two statements clash.
//
// claim:    { by, about, slot, value: 'yes' | 'no', turn }
// evidence: { id, title, facts: [{ about, slot, value }] }   (found by the player)
// labels:   { 'about.slot': { yes, no } }   statement text for each answer
// names:    { suspectId: 'Display Name' }

import { RULES } from './score.js';

const key = (c) => `${c.about}.${c.slot}`;

function statement(labels, c, value = c.value) {
  return labels[key(c)]?.[value] ?? `${key(c)}: ${value}`;
}

function involvedSuspects(names, ...ids) {
  return [...new Set(ids.filter((id) => id in names))];
}

export function detect({ claims, evidence = [], labels = {}, names = {} }) {
  const found = new Map();
  const add = (c) => {
    if (!found.has(c.id)) found.set(c.id, { ...c, points: RULES.kind[c.kind] });
  };
  const ordered = [...claims].sort((a, b) => a.turn - b.turn);

  // Self: one speaker, one slot, two answers.
  const firstBySpeaker = new Map();
  for (const c of ordered) {
    const k = `${c.by}|${key(c)}`;
    const first = firstBySpeaker.get(k);
    if (!first) {
      firstBySpeaker.set(k, c);
    } else if (first.value !== c.value) {
      add({
        id: `self:${c.by}:${key(c)}`,
        kind: 'self',
        involves: involvedSuspects(names, c.by, c.about),
        press: { suspect: c.by },
        turn: c.turn,
        lines: [
          { who: `${names[c.by] ?? c.by}, earlier`, text: statement(labels, first) },
          { who: `${names[c.by] ?? c.by}, now`, text: statement(labels, c) },
        ],
      });
    }
  }

  // Cross: two speakers, one slot, different answers.
  const bySlot = new Map();
  for (const c of ordered) {
    const list = bySlot.get(key(c)) ?? [];
    list.push(c);
    bySlot.set(key(c), list);
  }
  for (const list of bySlot.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.by === b.by || a.value === b.value) continue;
        const pair = [a.by, b.by].sort().join('|');
        add({
          id: `cross:${pair}:${key(a)}`,
          kind: 'cross',
          involves: involvedSuspects(names, a.by, b.by, a.about),
          press: { suspect: [a.by, b.by].includes(a.about) ? a.about : b.by },
          turn: b.turn,
          lines: [
            { who: `${names[a.by] ?? a.by} said`, text: statement(labels, a) },
            { who: `${names[b.by] ?? b.by} said`, text: statement(labels, b) },
          ],
        });
      }
    }
  }

  // Evidence: a claim against a fact on evidence the player has found.
  for (const e of evidence) {
    for (const f of e.facts ?? []) {
      for (const c of ordered) {
        if (key(c) !== key(f) || c.value === f.value) continue;
        add({
          id: `evidence:${e.id}:${c.by}:${key(c)}`,
          kind: 'evidence',
          involves: involvedSuspects(names, c.by, c.about),
          press: { suspect: c.by, evidence: e.id },
          turn: c.turn,
          lines: [
            { who: `${names[c.by] ?? c.by} said`, text: statement(labels, c) },
            { who: e.title, text: statement(labels, f) },
          ],
        }); // the id holds the speaker, so repeats from one speaker count once
      }
    }
  }

  return [...found.values()].sort((a, b) => a.turn - b.turn || a.id.localeCompare(b.id));
}

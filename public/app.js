import { scoreGame } from './shared/score.js';

const $ = (id) => document.getElementById(id);
const STORE = 'npcx:v1:';
const KIND = { self: 'Changed story', cross: 'Stories clash', evidence: 'Story vs evidence' };
const PRESS_Q = {
  self: 'Earlier you told me something different. Which is true?',
  cross: 'Someone else tells it differently. Who is lying?',
  evidence: 'This says otherwise. What really happened?',
};

const state = {
  info: null,
  active: null,
  turns: [],
  evidence: new Map(),
  seen: new Map(),
  present: null,
  busy: false,
  result: null,
};

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

const suspect = (id) => state.info.suspects.find((s) => s.id === id);
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const questionsLeft = () => state.info.questionBudget - state.turns.length;
const cracked = () => new Set(state.turns.filter((t) => t.cracked).map((t) => t.suspectId));

function liveScore() {
  return scoreGame({
    questions: state.turns.length,
    contradictions: [...state.seen.values()],
    cracks: cracked().size,
  });
}

/* ---------- storage (per-viewer convenience; the game works without it) ---------- */

function save() {
  try {
    localStorage.setItem(
      STORE + state.info.id,
      JSON.stringify({
        turns: state.turns,
        evidence: [...state.evidence.values()],
        seen: [...state.seen.values()],
        active: state.active,
        result: state.result,
      }),
    );
  } catch {}
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE + state.info.id) || 'null');
    if (!saved) return;
    state.turns = Array.isArray(saved.turns) ? saved.turns : [];
    for (const e of saved.evidence ?? []) state.evidence.set(e.id, e);
    for (const c of saved.seen ?? []) state.seen.set(c.id, c);
    if (suspect(saved.active)) state.active = saved.active;
    state.result = saved.result ?? null;
  } catch {}
}

function clearSaved() {
  try { localStorage.removeItem(STORE + state.info.id); } catch {}
}

function fresh() {
  state.turns = [];
  state.evidence = new Map(state.info.evidence.map((e) => [e.id, e]));
  state.seen = new Map();
  state.present = null;
  state.result = null;
  state.active = state.info.suspects[0].id;
}

/* ---------- rendering ---------- */

function toast(message) {
  document.querySelector('.toast')?.remove();
  const t = el('div', { class: 'toast', role: 'status' }, message);
  document.body.append(t);
  setTimeout(() => t.remove(), 4000);
}

function renderHeader() {
  const s = liveScore();
  $('score').textContent = state.result ? state.result.score.total : s.total;
  $('left').textContent = Math.max(0, questionsLeft());
  const pill = $('mode');
  const mock = state.info.mode === 'mock';
  pill.textContent = mock ? 'Mock model' : /nemotron/i.test(state.info.model) ? 'Nemotron' : 'Model';
  pill.title = state.info.model;
  pill.classList.toggle('model', !mock);
}

function renderSuspects() {
  const box = $('suspects');
  const broke = cracked();
  box.replaceChildren(
    ...state.info.suspects.map((s) =>
      el(
        'button',
        {
          type: 'button',
          class: 'suspect',
          role: 'tab',
          id: `tab-${s.id}`,
          'aria-selected': String(s.id === state.active),
          'aria-controls': 'panel',
          tabindex: s.id === state.active ? '0' : '-1',
          onclick: () => setActive(s.id),
          onkeydown: (e) => {
            const ids = state.info.suspects.map((x) => x.id);
            const i = ids.indexOf(s.id);
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              const next = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
              setActive(next);
              $(`tab-${next}`).focus();
            }
          },
        },
        el('span', { class: 'mono', 'aria-hidden': 'true' }, initials(s.name)),
        el('span', { class: 'name' }, s.name),
        el('span', { class: 'role' }, s.role),
        broke.has(s.id) ? el('span', { class: 'tag' }, 'Changed story') : null,
      ),
    ),
  );
  $('panel').setAttribute('aria-labelledby', `tab-${state.active}`);
}

function clashCard(c) {
  const over = Boolean(state.result);
  const target = c.press?.suspect ? suspect(c.press.suspect) : null;
  return el(
    'li',
    { class: 'clash' },
    el('span', { class: 'label' }, el('span', {}, KIND[c.kind]), el('span', {}, `+${c.points}`)),
    el('dl', {}, c.lines.map((l) => [el('dt', {}, l.who), el('dd', {}, l.text)])),
    target && !over
      ? el('button', { type: 'button', class: 'btn small', onclick: () => press(c) }, `Press ${target.name.split(' ')[0]}`)
      : null,
  );
}

function renderLog() {
  const s = suspect(state.active);
  $('bio').textContent = `${s.role}. ${s.bio}`;
  const log = $('log');
  const items = [];
  state.turns.forEach((t) => {
    if (t.suspectId !== state.active) return;
    const shown = t.present ? state.evidence.get(t.present)?.title : null;
    items.push(
      el('li', { class: 'q' }, el('span', { class: 'who' }, 'You'), t.question, shown ? el('span', { class: 'shown' }, `Showed: ${shown}`) : null),
      el('li', { class: 'a' }, el('span', { class: 'who' }, s.name), t.reply),
    );
    if (t.cracked) {
      items.push(el('li', { class: 'found' }, el('span', { class: 'label' }, el('span', {}, `${s.name.split(' ')[0]} changed their story`), el('span', {}, '+8'))));
    }
    for (const id of t.reveals ?? []) {
      const e = state.evidence.get(id);
      if (e) {
        items.push(el('li', { class: 'found' }, el('span', { class: 'label' }, el('span', {}, 'New evidence'), null), el('strong', {}, e.title), el('p', {}, e.text)));
      }
    }
    for (const id of t.found ?? []) {
      const c = state.seen.get(id);
      if (c) items.push(clashCard(c));
    }
  });
  if (state.busy) items.push(el('li', { class: 'a thinking' }, `${s.name.split(' ')[0]} is thinking…`));
  if (!items.length) items.push(el('li', { class: 'empty' }, `Ask ${s.name.split(' ')[0]} anything, or tap a suggestion below.`));
  log.replaceChildren(...items);
}

function renderDock() {
  const s = suspect(state.active);
  const over = Boolean(state.result) || questionsLeft() <= 0;
  const asked = new Set(state.turns.filter((t) => t.suspectId === s.id).map((t) => t.question));
  $('chips').replaceChildren(
    ...s.suggestions
      .filter((q) => !asked.has(q))
      .map((q) => el('button', { type: 'button', class: 'chip', disabled: over || state.busy, onclick: () => ask(q) }, q)),
  );
  const shown = state.present ? state.evidence.get(state.present) : null;
  $('present-row').hidden = !shown;
  $('present-name').textContent = shown ? shown.title : '';
  const q = $('q');
  q.disabled = over;
  q.placeholder = state.result
    ? 'Case closed.'
    : questionsLeft() <= 0
      ? 'No questions left. Make your accusation.'
      : shown
        ? `What does ${s.name.split(' ')[0]} say to this?`
        : `Ask ${s.name.split(' ')[0]} a question`;
  $('ask-btn').disabled = over || state.busy;
  $('ev-count').textContent = `${state.evidence.size}/${state.info.evidenceTotal}`;
  $('ct-count').textContent = state.seen.size ? String(state.seen.size) : '';
  $('accuse-btn').textContent = state.result ? 'Result' : 'Accuse';
}

function render() {
  renderHeader();
  renderSuspects();
  renderLog();
  renderDock();
}

function scrollToEnd() {
  const last = $('log').lastElementChild;
  last?.scrollIntoView({ block: 'end', behavior: 'smooth' });
}

/* ---------- actions ---------- */

// Close the on-screen keyboard before a dialog opens, so the page does not jump.
function openDialog(id) {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  $(id).showModal();
}

function setActive(id) {
  if (!suspect(id)) return;
  state.active = id;
  save();
  render();
}

function press(c) {
  if ($('notes-dlg').open) $('notes-dlg').close();
  setActive(c.press.suspect);
  state.present = c.press.evidence && state.evidence.has(c.press.evidence) ? c.press.evidence : null;
  $('q').value = PRESS_Q[c.kind];
  render();
  $('q').focus();
}

function historyForServer() {
  return state.turns.map(({ suspectId, question, present, reply, claims, reveals, cracked: c }) => ({
    suspectId, question, present, reply, claims, reveals, cracked: c,
  }));
}

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Try again.');
  return data;
}

async function ask(text) {
  const question = String(text ?? '').trim();
  if (!question || state.busy || state.result) return;
  if (questionsLeft() <= 0) {
    openAccuse();
    return;
  }
  const suspectId = state.active;
  const present = state.present;
  state.busy = true;
  render();
  scrollToEnd();
  try {
    const data = await post('/api/ask', {
      caseId: state.info.id,
      suspectId,
      question,
      present,
      history: historyForServer(),
      unlocked: [...state.evidence.keys()],
    });
    for (const card of data.reveals) state.evidence.set(card.id, card);
    const fresh = data.contradictions.filter((c) => !state.seen.has(c.id));
    for (const c of fresh) state.seen.set(c.id, c);
    state.turns.push({
      suspectId,
      question,
      present,
      reply: data.reply,
      claims: data.claims,
      reveals: data.reveals.map((r) => r.id),
      cracked: data.cracked,
      found: fresh.map((c) => c.id),
    });
    state.present = null;
    $('q').value = '';
    if (state.turns.length === 1) $('intro').open = false;
    if (fresh.length) toast(`Contradiction found: +${fresh.reduce((n, c) => n + c.points, 0)}`);
    save();
  } catch (err) {
    toast(err instanceof TypeError ? 'No connection. Try again.' : err.message);
  } finally {
    state.busy = false;
    render();
    scrollToEnd();
  }
}

function renderEvidence() {
  const s = suspect(state.active);
  const over = Boolean(state.result) || questionsLeft() <= 0;
  $('evidence-sub').textContent = `${state.evidence.size} of ${state.info.evidenceTotal} found. Show a piece to ${s.name.split(' ')[0]} to see how they react.`;
  const found = [...state.evidence.values()].map((e) =>
    el(
      'li',
      {},
      el('div', { class: 'title' }, e.title),
      el('p', { class: 'muted' }, e.text),
      el('button', {
        type: 'button',
        class: 'btn small',
        disabled: over,
        onclick: () => {
          state.present = e.id;
          $('evidence-dlg').close();
          render();
          $('q').focus();
        },
      }, `Show to ${s.name.split(' ')[0]}`),
    ),
  );
  const missing = Math.max(0, state.info.evidenceTotal - state.evidence.size);
  const locked = Array.from({ length: missing }, () => el('li', { class: 'locked' }, 'Not found yet. Keep asking.'));
  $('evidence-list').replaceChildren(...found, ...locked);
}

function scoreRows(table, score) {
  table.replaceChildren(
    ...score.parts.map((p) =>
      el('tr', {}, el('td', {}, p.label), el('td', { class: p.points < 0 ? 'minus' : 'plus' }, p.points > 0 ? `+${p.points}` : String(p.points))),
    ),
    el('tr', { class: 'total' }, el('td', {}, 'Total'), el('td', {}, String(score.total))),
  );
}

function renderNotes() {
  const list = [...state.seen.values()];
  $('notes-list').replaceChildren(
    ...(list.length
      ? list.map((c) => clashCard(c))
      : [el('li', { class: 'locked' }, "No contradictions yet. They appear here when answers don't line up.")]),
  );
  scoreRows($('score-table'), liveScore());
}

function openAccuse() {
  if (state.result) {
    showResult();
    return;
  }
  const pick = $('accuse-pick');
  pick.replaceChildren(
    el('legend', { class: 'sr-only' }, 'Suspect'),
    ...state.info.suspects.map((s) =>
      el('label', {},
        el('input', { type: 'radio', name: 'who', value: s.id, onchange: () => { $('accuse-go').disabled = false; } }),
        el('span', {}, el('strong', {}, s.name), el('br'), el('span', { class: 'muted' }, s.role)),
      ),
    ),
  );
  $('accuse-go').disabled = true;
  openDialog('accuse-dlg');
}

async function accuse(suspectId) {
  try {
    state.result = await post('/api/accuse', {
      caseId: state.info.id,
      suspectId,
      history: historyForServer(),
      unlocked: [...state.evidence.keys()],
    });
    for (const c of state.result.contradictions) if (!state.seen.has(c.id)) state.seen.set(c.id, c);
    save();
    render();
    showResult();
  } catch (err) {
    toast(err instanceof TypeError ? 'No connection. Try again.' : err.message);
  }
}

function showResult() {
  const r = state.result;
  $('result-h').textContent = r.correct ? `Solved: ${r.culprit.name}` : `Not quite. It was ${r.culprit.name}.`;
  $('grade').textContent = r.score.grade;
  $('total').textContent = `${r.score.total} points`;
  $('solution').textContent = r.solution;
  scoreRows($('result-table'), r.score);
  openDialog('result-dlg');
}

/* ---------- wiring ---------- */

function wire() {
  $('ask-form').addEventListener('submit', (e) => {
    e.preventDefault();
    ask($('q').value);
  });
  $('present-clear').addEventListener('click', () => {
    state.present = null;
    render();
  });
  $('evidence-btn').addEventListener('click', () => {
    renderEvidence();
    openDialog('evidence-dlg');
  });
  $('notes-btn').addEventListener('click', () => {
    renderNotes();
    openDialog('notes-dlg');
  });
  $('accuse-btn').addEventListener('click', openAccuse);
  $('accuse-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const who = new FormData(e.target).get('who');
    if (!who) return;
    $('accuse-dlg').close();
    accuse(String(who));
  });
  $('again').addEventListener('click', () => {
    $('result-dlg').close();
    clearSaved();
    fresh();
    render();
  });
  for (const d of document.querySelectorAll('dialog')) {
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) d.close();
    });
  }
  const dock = document.querySelector('.dock');
  const fit = () => document.documentElement.style.setProperty('--dock-h', `${dock.offsetHeight}px`);
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(dock);
  fit();
}

async function init() {
  wire();
  try {
    const res = await fetch('/api/case');
    if (!res.ok) throw new Error();
    state.info = await res.json();
  } catch {
    $('loading').textContent = 'The case file did not load. Refresh to try again.';
    return;
  }
  $('case-title').textContent = state.info.title;
  $('case-intro').textContent = state.info.intro;
  fresh();
  restore();
  if (state.turns.length) $('intro').open = false;
  render();
  $('loading').remove();
  $('main').hidden = false;
}

init();

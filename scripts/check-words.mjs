// Fails when a word kept out of public text appears in the repo's public files.
// The list is assembled in pieces so this file does not match itself.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const words = ['au' + 'dit', 'pro' + 'fit', 'guarantee' + 'd?', 'launch' + 'ed', 'li' + 've'];
const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'i');
const allowed = /aria-live/gi; // an HTML attribute name, not wording
const roots = ['README.md', 'docs', 'public', 'src', 'test', '.env.example', 'wrangler.toml'];
const skip = new Set(['node_modules', '.git', '.wrangler']);

function* files(path) {
  let st;
  try { st = statSync(path); } catch { return; }
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) if (!skip.has(name)) yield* files(join(path, name));
  } else if (/\.(md|js|mjs|html|css|toml|json|txt|example)$|_headers$/.test(path)) {
    yield path;
  }
}

const hits = [];
for (const root of roots) {
  for (const file of files(root)) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (pattern.test(line.replace(allowed, ''))) hits.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
}
if (hits.length) {
  console.log(hits.join('\n'));
  console.log('words to keep out of public text: found');
  process.exit(1);
}
console.log('words to keep out of public text: none');

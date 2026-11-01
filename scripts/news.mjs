// Version number at merge time (Noah 27.10.2026 «1a»): a pull request no longer picks a version.
// It adds one file src/lib/news/<name>.js with its «What is new» entry (no version, no date). Two open
// PRs never touch the same lines, so merging one never puts the other in conflict, and the long
// browser tests run only once per PR.
//
// The number comes from the order on main: every commit on main's first-parent line after ANCHOR
// (= every merged PR) raises the version: a merge that adds a news file by one minor step (0.233.0),
// any other merge by one patch step (0.233.1). A hand-set package.json version that is higher wins
// (old-style PRs still work). The merge commit of a PR on GitHub (refs/pull/N/merge) is the
// last commit, so a PR's checks already see the number it gets when it merges next.
//
// Nothing is written to main and nothing runs after the merge: vite.config.js and
// playwright.config.js call writeNewsIndex(), which writes src/lib/news/index.gen.js (not in git).
// Without the history (a shallow clone, e.g. a Vercel preview), the numbers are a guess after the
// highest known version and EXACT is false; GitHub's checks and Pages use the full history.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** The last version numbered by hand: main at the merge of #279 (0.232.0, 27.10.2026). */
export const ANCHOR = 'a15ce2ab20df53986d59c9b9f46b9fb7aeb80c11';
export const ANCHOR_VERSION = '0.232.0';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const NEWS_DIR = 'src/lib/news';
const NAME = /^[a-z0-9][a-z0-9-]*\.js$/; // index.gen.js does not match (no dot inside a name)

export function compare(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  return 0;
}

export function bump(v, part) {
  const [a, b, c] = v.split('.').map(Number);
  return part === 'minor' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`;
}

/** The day in Zurich of an ISO time (the app's days are Zurich days). */
export const zurichDay = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date(iso));

/**
 * Pure: numbers main's history. history = [{ date, pkg?, added: [file] }], oldest first, one per
 * first-parent commit after the anchor. Returns { version, files: { file: { version, date } } }.
 */
export function numberHistory(history, start = ANCHOR_VERSION) {
  let version = start;
  const files = {};
  for (const c of history) {
    const next = bump(version, c.added.length ? 'minor' : 'patch');
    version = c.pkg && compare(c.pkg, next) > 0 ? c.pkg : next;
    for (const f of c.added) files[f] = { version, date: c.date };
  }
  return { version, files };
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).trim();
}

/** main's first-parent history after the anchor, or null when git or the anchor is missing. */
export function readHistory() {
  try {
    git(['merge-base', '--is-ancestor', ANCHOR, 'HEAD']);
    const range = `${ANCHOR}..HEAD`;
    const commits = git(['log', '--first-parent', '--reverse', '--format=%H %cI', range])
      .split('\n')
      .filter(Boolean)
      .map((l) => ({ sha: l.slice(0, 40), date: zurichDay(l.slice(41)), added: [] }));
    const bySha = new Map(commits.map((c) => [c.sha, c]));
    let cur = null;
    const added = git(['log', '--first-parent', '--diff-merges=first-parent', '--diff-filter=A', '--name-only', '--format=@%H', range, '--', NEWS_DIR]);
    for (const line of added.split('\n')) {
      if (line.startsWith('@')) cur = bySha.get(line.slice(1));
      else if (cur && line.startsWith(`${NEWS_DIR}/`)) {
        const f = line.slice(NEWS_DIR.length + 1);
        if (NAME.test(f)) cur.added.push(f);
      }
    }
    const pkgShas = git(['log', '--first-parent', '--diff-merges=first-parent', '--format=%H', range, '--', 'package.json']).split('\n').filter(Boolean);
    for (const sha of pkgShas) {
      const c = bySha.get(sha);
      if (c) c.pkg = JSON.parse(git(['show', `${sha}:package.json`])).version;
    }
    return commits;
  } catch {
    return null;
  }
}

export const newsFiles = (dir = join(ROOT, NEWS_DIR)) => (existsSync(dir) ? readdirSync(dir).filter((f) => NAME.test(f)).sort() : []);

/** The highest version numbered by hand in whatsnew.js (for the guess without history). */
function highestNumbered() {
  const src = readFileSync(join(ROOT, 'src/lib/whatsnew.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  return [...src.matchAll(/version: '(\d+\.\d+\.\d+)'/g)].map((m) => m[1]).reduce((a, b) => (compare(a, b) >= 0 ? a : b), pkg);
}

/**
 * The app version and each news file's version and date, newest first.
 * { version, exact, news: [{ file, version, date }] }
 */
export function computeNews({ history = readHistory(), files = newsFiles(), today = zurichDay(new Date().toISOString()) } = {}) {
  const exact = history != null;
  const known = exact ? numberHistory(history) : { version: highestNumbered(), files: {} };
  let version = known.version;
  const news = [];
  // files present here but not (yet) added by a commit on the line: an uncommitted file while
  // working, or no history. They follow in name order.
  for (const file of files) {
    const k = known.files[file];
    if (k) news.push({ file, ...k });
    else {
      version = bump(version, 'minor');
      news.push({ file, version, date: today });
    }
  }
  news.sort((a, b) => compare(b.version, a.version));
  return { version, exact: exact && news.every((n) => known.files[n.file]), news };
}

/** The app version (tests and workflows that used package.json's version). */
export const appVersion = () => computeNews().version;

const ident = (file) => `n_${file.slice(0, -3).replace(/-/g, '_')}`;

const DE_DIR = 'src/lib/i18n/de';

/**
 * Writes src/lib/i18n/de/auto.gen.js: every German text file that de/index.js does not import by name, so a new
 * part of the app only adds its own file in de/ and nobody edits index.js (no merge clashes). Not in git.
 */
export function writeDeAuto() {
  const dir = join(ROOT, DE_DIR);
  const files = readdirSync(dir).filter((f) => /^[\w-]+\.js$/.test(f));
  // imported by index.js or by another file in de/ (a sub-file) = already loaded
  const listed = new Set(files.flatMap((f) => [...readFileSync(join(dir, f), 'utf8').matchAll(/from '\.\/([\w-]+)\.js'/g)].map((m) => m[1])));
  const extra = files
    .filter((f) => f !== 'index.js' && !listed.has(f.slice(0, -3)))
    .sort();
  const id = (f) => `d_${f.slice(0, -3).replace(/-/g, '_')}`;
  const text = [
    '// Written by scripts/news.mjs (vite.config.js, playwright.config.js). Not in git, do not edit.',
    ...extra.map((f) => `import ${id(f)} from './${f}';`),
    `export default Object.assign({}, ${extra.map(id).join(', ') || '{}'});`,
    '',
  ].join('\n');
  const out = join(dir, 'auto.gen.js');
  if (!existsSync(out) || readFileSync(out, 'utf8') !== text) writeFileSync(out, text);
}

/** Writes src/lib/featreg/index.gen.js: every file of src/lib/featreg/ (one per new function). Not in git. */
export function writeFeatReg() {
  const dir = join(ROOT, 'src/lib/featreg');
  const files = readdirSync(dir).filter((f) => NAME.test(f) && f !== 'index.js').sort();
  const id = (f) => `p_${f.slice(0, -3).replace(/-/g, '_')}`;
  const text = [
    '// Written by scripts/news.mjs (vite.config.js, playwright.config.js). Not in git, do not edit.',
    ...files.map((f) => `import ${id(f)} from './${f}';`),
    `export const PARTS = [${files.map(id).join(', ')}];`,
    '',
  ].join('\n');
  const out = join(dir, 'index.gen.js');
  if (!existsSync(out) || readFileSync(out, 'utf8') !== text) writeFileSync(out, text);
}

/** Writes src/lib/news/index.gen.js; returns what computeNews() found. */
export function writeNewsIndex() {
  writeDeAuto();
  writeFeatReg();
  const r = computeNews();
  const lines = [
    '// Written by scripts/news.mjs (vite.config.js, playwright.config.js). Not in git, do not edit.',
    ...r.news.map((n) => `import ${ident(n.file)} from './${n.file}';`),
    `export const APP_VERSION = ${JSON.stringify(r.version)};`,
    `export const EXACT = ${r.exact};`,
    '/** The news entries of the PRs since 0.232.0, newest first, with the version and day they got. */',
    'export const NEWS = [',
    ...r.news.map((n) => `  { ...${ident(n.file)}, id: ${JSON.stringify(n.file.slice(0, -3))}, version: ${JSON.stringify(n.version)}, date: ${JSON.stringify(n.date)} },`),
    '];',
    '/** Their German texts (each file\'s `de`). */',
    `export const NEWS_DE = Object.assign({}, ${r.news.map((n) => `${ident(n.file)}.de`).join(', ') || '{}'});`,
    '',
  ];
  const out = join(ROOT, NEWS_DIR, 'index.gen.js');
  const text = lines.join('\n');
  if (!existsSync(out) || readFileSync(out, 'utf8') !== text) writeFileSync(out, text);
  return r;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = writeNewsIndex();
  console.log(process.argv.includes('--version') ? r.version : JSON.stringify(r, null, 2));
}

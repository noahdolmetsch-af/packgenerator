// «Bilder bei jeder Neuheit» (Noah 23.11.2026 «1b 2a 3a 4b 5a»): makes the pictures of «What is new» for the news files of
// this branch (or the names given), «nachher» from this branch and «vorher» from the app as main has it (its merge base).
//
//   npm run news:bilder                      the news files this branch adds against main
//   npm run news:bilder -- kleider-sets abo  these news files (names without «.js»)
//   npm run news:bilder -- all               every news file (long)
//
// It builds the base in a temporary copy (git worktree), serves it on its own port, runs tests/e2e/news-bilder.spec.js on the
// phone and cleans up. Pictures land in public/news/<name>/ (commit them with the PR). Environment: E2E_PORT (this branch,
// default 5391), BASE_PORT (the base, default 5392), BASE_REF (another commit as the base, e.g. to redo an older news file), PW_CONFIG (another Playwright config, e.g. for another browser path).
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, opts = {}) => (execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts }) ?? '').trim();

const argv = process.argv.slice(2);
let names = argv;
if (!names.length) {
  const base = run('git', ['merge-base', 'origin/main', 'HEAD']);
  names = run('git', ['diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`, '--', 'src/lib/news'])
    .split('\n')
    .concat(run('git', ['ls-files', '--others', '--exclude-standard', 'src/lib/news']).split('\n'))
    .filter((f) => /^src\/lib\/news\/[a-z0-9][a-z0-9-]*\.js$/.test(f) && !f.endsWith('.gen.js'))
    .map((f) => f.slice('src/lib/news/'.length, -3));
}
if (!names.length) {
  console.log('No news file on this branch: nothing to do (a PR without a visible change has no picture).');
  process.exit(0);
}

const basePort = process.env.BASE_PORT || '5392';
const headPort = process.env.E2E_PORT || '5391';
const tmp = join(tmpdir(), `pg-base-${process.pid}`);
let server = null;
let cleaned = false;
const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  try {
    if (server?.pid) process.kill(-server.pid); // the whole group: npx starts vite as a child
  } catch {
    /* already gone */
  }
  try {
    run('git', ['worktree', 'remove', '--force', tmp]);
  } catch {
    rmSync(tmp, { recursive: true, force: true });
  }
};
process.on('exit', cleanup);

try {
  // the base: main as this branch left it
  const mergeBase = process.env.BASE_REF ? run('git', ['rev-parse', process.env.BASE_REF]) : run('git', ['merge-base', 'origin/main', 'HEAD']);
  run('git', ['worktree', 'add', '--detach', tmp, mergeBase]);
  symlinkSync(join(ROOT, 'node_modules'), join(tmp, 'node_modules'), 'dir');
  console.log(`Building the base (${mergeBase.slice(0, 7)}) …`);
  execFileSync('npx', ['vite', 'build'], { cwd: tmp, stdio: 'ignore' });
  server = spawn('npx', ['vite', 'preview', '--port', basePort, '--strictPort'], { cwd: tmp, stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${basePort}/packgenerator/`)).ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`Taking the pictures of: ${names.join(', ')}`);
  const cfg = process.env.PW_CONFIG ? ['-c', process.env.PW_CONFIG] : [];
  execFileSync('npx', ['playwright', 'test', ...cfg, 'tests/e2e/news-bilder.spec.js', '--project=phone', '--workers=1', '--trace', 'off'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, NEWS_BILDER: names.join(' '), BASE_URL: `http://localhost:${basePort}/packgenerator/`, E2E_PORT: headPort, E2E_SKIP_GESAMTTEST: '1' },
  });
  console.log('Done. Pictures are in public/news/<name>/ — commit them with the PR (git add public/news).');
} finally {
  cleanup();
}

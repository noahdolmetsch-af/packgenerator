// The text of the GitHub release entry after every going online (Noah 27.10.2026 «5a», .github/workflows/deploy.yml
// job «release»). It lists every merge on main since the last entry, with the German «Was ist neu» title of the
// news file it brought. Run: node scripts/release-notes.mjs (prints Markdown).
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { appVersion, NEWS_DIR } from './news.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = 'https://noahdolmetsch-af.github.io/packgenerator/';
const REPO = 'https://github.com/noahdolmetsch-af/packgenerator';

/** Pure: Markdown for one entry. merges = [{ subject, pr?, news: [German title] }], newest first. */
export function formatNotes(version, merges) {
  const lines = [`Online seit diesem Lauf: **${version}** · ${LIVE}`, '', `Darin (${merges.length}):`];
  for (const m of merges) {
    const pr = m.pr ? `[#${m.pr}](${REPO}/pull/${m.pr}) ` : '';
    const news = m.news.length ? ` · Was ist neu: «${m.news.join('», «')}»` : '';
    lines.push(`- ${pr}${m.subject}${news}`);
  }
  return lines.join('\n') + '\n';
}

/** Pure: «Merge pull request #320: Title» or «Title (#296)» → { pr, subject }. */
export function parseSubject(s) {
  const m = s.match(/^Merge pull request #(\d+)(?: from \S+)?:?\s*(.*)$/) || s.match(/^(.*?)\s*\(#(\d+)\)$/);
  if (!m) return { subject: s };
  return s.startsWith('Merge pull request') ? { pr: Number(m[1]), subject: m[2] } : { pr: Number(m[2]), subject: m[1] };
}

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

async function titleOf(file) {
  try {
    const mod = (await import(pathToFileURL(join(ROOT, NEWS_DIR, file)).href)).default;
    return mod.de?.[mod.title] ?? mod.title;
  } catch {
    return file;
  }
}

async function main() {
  let last = '';
  try {
    last = git(['describe', '--tags', '--abbrev=0', '--match', 'v*', 'HEAD^']);
  } catch {}
  const range = last ? `${last}..HEAD` : 'HEAD^..HEAD';
  const merges = [];
  for (const line of git(['log', '--first-parent', '--format=%H%x09%s', range]).split('\n').filter(Boolean)) {
    const [sha, s] = line.split('\t');
    const added = git(['diff', '--name-only', '--diff-filter=A', `${sha}^1`, sha, '--', NEWS_DIR])
      .split('\n')
      .filter((f) => /\/[a-z0-9][a-z0-9-]*\.js$/.test(f));
    const news = [];
    for (const f of added) news.push(await titleOf(f.slice(NEWS_DIR.length + 1)));
    const m = parseSubject(s);
    // «Merge pull request #N from branch»: the PR title is the first line of the message body
    if (!m.subject) m.subject = git(['log', '-1', '--format=%b', sha]).split('\n').find((l) => l.trim()) ?? s;
    merges.push({ ...m, news });
  }
  process.stdout.write(formatNotes(appVersion(), merges));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

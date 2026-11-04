// Rückstand-Hinweis (Noah 04.11.2026 «Test-Plan 2»): a pull request whose branch left main more than a day before
// main's newest commit gets a yellow note on the check and in the summary: «Main hineinmergen». The check never
// turns red because of it and nothing is written to the repo: Claude merges main into the PR only with Noah's ok.
// Called from the job «build» of .github/workflows/deploy.yml; tests/behind-main.test.js checks the rule.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

export const MAX_BEHIND_DAYS = 1;

/** The note when main is more than `limit` days ahead of where the branch left it, else null. */
export function behindNote(days, commits, limit = MAX_BEHIND_DAYS) {
  if (!(days > limit) || !(commits > 0)) return null;
  const d = days >= 2 ? `${Math.floor(days)} Tage` : 'mehr als einen Tag';
  return `Dieser PR liegt ${d} und ${commits} Merges hinter main. Main hineinmergen (Claude macht das mit Noahs ok), sonst testet die Prüfung einen alten Stand.`;
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Days and commits main is ahead of the common ancestor of main and the PR head. */
export function measure(head, main = 'origin/main') {
  const base = git(['merge-base', main, head]);
  const days = (Number(git(['show', '-s', '--format=%ct', main])) - Number(git(['show', '-s', '--format=%ct', base]))) / 86400;
  const commits = Number(git(['rev-list', '--count', `${base}..${main}`]));
  return { days, commits };
}

if (process.argv[1] && process.argv[1].endsWith('behind-main.mjs')) {
  try {
    const head = process.env.PR_HEAD_SHA || 'HEAD';
    const { days, commits } = measure(head);
    const note = behindNote(days, commits);
    console.log(note ? `behind: ${days.toFixed(1)} days, ${commits} commits` : 'not behind');
    if (note) {
      console.log(`::warning title=PR liegt hinter main::${note}`);
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Rückstand\n\n${note}\n`);
    }
  } catch (e) {
    console.log(`behind-main: skipped (${e.message})`); // never fails the check
  }
}

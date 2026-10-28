/**
 * «App verstehen» (Noah 26.10.2026 21:11 UTC: «mini kurs ebenfalls auch in der app einsehbar mit links und
 * übungen … unter ich - app verstehen», «4b frei wählbar wann»): Ich › App verstehen (#/me/verstehen).
 * Seven short lessons that teach the handgrips to keep the app alive without Claude, in any order, each
 * with links and one exercise. The same course stands in docs/notfall-handbuch.md for a helper on GitHub.
 * Texts are English keys for t(); the German lives in i18n/de/verstehen.js. Plain module, no runes.
 *
 * Which lessons are done is one record in db.settings (VERSTEHEN_KEY, travels in backups). Ticking is a
 * suggestion: every tick can be taken off again, nothing reminds.
 */
export const VERSTEHEN_HASH = '#/me/verstehen';
export const VERSTEHEN_KEY = 'verstehen';

export const REPO = 'https://github.com/noahdolmetsch-af/packgenerator';
export const HANDBOOK = `${REPO}/blob/main/docs/notfall-handbuch.md`;
export const ACCOUNTS = `${REPO}/blob/main/docs/konten.md`;

/** A link: `href` starting with «#/» stays in the app, everything else opens GitHub or Vercel in a new tab. */
export const isOutside = (href) => !String(href).startsWith('#/');

export const LESSONS = [
  {
    id: 'karte',
    title: 'The map: where is what',
    goal: 'The four parts of the app and what each one does.',
    lines: [
      'The code is the building plan. It lies on GitHub, and every change is kept, so every change can be taken back.',
      'GitHub Pages is the shop window. Your devices load the app from there once and keep a copy, so it also starts without internet.',
      'Your data lies only in this browser on this device. Nobody else has it, so the backup is yours to make.',
      'The server «packgen» on Vercel runs the extras: Strava, Fitbit and Google, AI, sync between devices and reminders. If it stops, only the extras stop.',
    ],
    steps: ['Open the code on GitHub.', 'Open the file package.json and find the line «version».', 'Compare it with the version under Me › What is new.'],
    exercise: 'Find the version number on GitHub and in the app. Are they the same?',
    links: [
      { label: 'Code on GitHub', href: REPO },
      { label: 'package.json', href: `${REPO}/blob/main/package.json` },
      { label: 'What is new', href: '#/me/news' },
    ],
  },
  {
    id: 'backup',
    title: 'Make a backup and bring it back',
    goal: 'Keep your data safe, even if a phone gets lost.',
    lines: [
      'A backup is one file with all your data.',
      'Keep it in two places, for example Google Drive and a USB stick.',
      'The app reminds you when the last backup is older than the days set under Me › Own values.',
      'On a computer the app can also write a backup into a folder after every change.',
    ],
    steps: ['Me › Data and backup › Export backup.', 'Save the file in two places.', 'To bring it back: Me › Data and backup › choose the file › Check import.'],
    exercise: 'Export a backup. Then open the test link of a pull request (its own storage, nothing can break there) and import the file.',
    links: [
      { label: 'Data and backup', href: '#/me/data' },
      { label: 'Own values', href: '#/me/werte' },
    ],
  },
  {
    id: 'haken',
    title: 'Read green and red checks',
    goal: 'See at a glance whether a change is safe.',
    lines: [
      'Every change comes as a pull request: a proposal that is not online yet.',
      'Robots test it on a phone and a computer screen. A green tick means all tests passed. A red cross means something broke, so it must not go online.',
      'A yellow dot means the tests are still running, up to about 45 minutes.',
    ],
    steps: ['Open the list of pull requests.', 'Open one and scroll to the bottom, to the checks.', 'At a red one, open «Details»: the first red line says what broke.'],
    exercise: 'Open the newest pull request and look whether all its checks are green.',
    links: [
      { label: 'Pull requests', href: `${REPO}/pulls` },
      { label: 'All test runs', href: `${REPO}/actions` },
    ],
  },
  {
    id: 'mergen',
    title: 'Merge and take back',
    goal: 'Put a change online, and take it back when it is worse.',
    lines: [
      'Merge means: take the change into the app. About 30 to 60 minutes later it is online, and the app shows «Load now».',
      'Revert means: take a merged change back. GitHub makes a new pull request that undoes it.',
      'Nothing is ever lost: every older version stays on GitHub.',
    ],
    steps: ['In a pull request with green checks: Merge pull request › Confirm merge.', 'To take it back: open the merged pull request › Revert › Create pull request › merge it.'],
    exercise: 'Practise on a small pull request that only changes one sentence in the docs: merge it, then revert it.',
    links: [{ label: 'Merged pull requests', href: `${REPO}/pulls?q=is%3Amerged` }],
  },
  {
    id: 'wort',
    title: 'Change a word yourself',
    goal: 'Fix a German text of the app without a helper.',
    lines: [
      'All German texts of the app are in the folder src/lib/i18n/de. On the left is the English key, on the right the German text.',
      'Change only the right part between the quotes. The tests check it, and the test link shows it before anything goes online.',
    ],
    steps: [
      'Open the folder on GitHub and pick a file.',
      'Tap the pencil symbol.',
      'Change one word on the right side.',
      'Commit changes › Create a new branch › Propose changes › Create pull request.',
      'Wait for the checks and look at the test link.',
    ],
    exercise: 'Change one German word, look at it in the test link, then merge or close the pull request.',
    links: [{ label: 'German texts on GitHub', href: `${REPO}/tree/main/src/lib/i18n/de` }],
  },
  {
    id: 'konten',
    title: 'The round of accounts',
    goal: 'Know where things run and see whether they are fine.',
    lines: [
      'The app needs a few free accounts. The keys live only in Vercel, never in the code.',
      'Every morning a guard checks the server and the live app. Only when something is wrong you get a mail from GitHub.',
    ],
    steps: [
      'Vercel › packgen › Deployments: the top entry should say «Ready».',
      'Vercel › packgen › Settings › Environment Variables: only look, change nothing.',
      'Read the account list on GitHub.',
    ],
    exercise: 'Check in Vercel that packgen says «Ready», and print the recovery codes of your GitHub account.',
    links: [
      { label: 'Account list', href: ACCOUNTS },
      { label: 'Vercel', href: 'https://vercel.com' },
      { label: 'GitHub recovery codes', href: 'https://github.com/settings/auth/recovery-codes' },
    ],
  },
  {
    id: 'helfer',
    title: 'Brief another helper',
    goal: 'Keep the app going with another AI or a person.',
    lines: [
      'The app is normal web technology (Svelte, Vite, JavaScript). Any web developer and other AIs can work on it.',
      'Give the helper three files: CLAUDE.md, docs/projektstand.md and the emergency handbook. The handbook has a first message to copy.',
      'Never share keys or passwords. If something must change in Vercel, you click yourself.',
    ],
    steps: ['Open the emergency handbook, part 4.', 'Copy the first message and add your problem.', 'Ask the helper for a pull request that you check and merge yourself.'],
    exercise: 'Give another AI the emergency handbook and ask: «What do I do if Strava stops working?» Compare its answer with the handbook.',
    links: [
      { label: 'Emergency handbook', href: HANDBOOK },
      { label: 'CLAUDE.md', href: `${REPO}/blob/main/CLAUDE.md` },
      { label: 'Project status', href: `${REPO}/blob/main/docs/projektstand.md` },
    ],
  },
];

/** The stored record → the ids of the lessons that are ticked (unknown ids dropped). */
export function doneOf(value) {
  const ids = new Set(LESSONS.map((l) => l.id));
  return Array.isArray(value?.done) ? [...new Set(value.done.filter((id) => ids.has(id)))] : [];
}

/** Tick or untick one lesson; returns the new list in course order. */
export function toggleDone(done, id) {
  const set = new Set(done);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return LESSONS.map((l) => l.id).filter((x) => set.has(x));
}

export async function readDone(db) {
  return doneOf((await db.settings.get(VERSTEHEN_KEY))?.value);
}

export async function saveDone(db, done) {
  await db.settings.put({ key: VERSTEHEN_KEY, value: { done: doneOf({ done }) } });
}

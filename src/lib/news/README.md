# «Was ist neu»: one file per pull request

Since 27.10.2026 (Noah «1a»: version number at merge time) a pull request does **not** change the
version in `package.json` and does not add its entry at the top of `src/lib/whatsnew.js`. It adds one
new file here instead. `scripts/news.mjs` gives it its version and day from the order of merges on
`main`, so two open PRs never conflict over the number.

- File name: short, lowercase, with dashes, e.g. `kleider-sets.js`. Never rename it after the merge
  (its version is found by the commit that added it). One file per PR; a PR without a visible change
  (CI, tests, docs) adds none and gets a patch number (0.233.1).
- Content: the same fields as an entry in `whatsnew.js`, **without** `version` and `date`, plus the
  German texts in `de` and the new functions of `features.js` in `since`:

```js
// «Kleider-Sets» (Noah 27.10.2026 «1a 2a 3a 4a 5a»): what it is in one line
export default {
  title: 'Your sets',
  lead: 'Nine clothing sets are ready, change them as you like.',
  points: [{ text: 'Pick a set in «What do I wear?»', go: { href: '#/', steps: [{ sel: '[data-wear-open]' }, { text: 'Your sets' }] } }],
  small: [{ box: 'new', text: 'Each set can be renamed and deleted' }],
  test: ['On Today tap «What do I wear?» …'],
  since: ['f.wearsets'], // functions of features.js this PR brings (their «Since»)
  de: {
    'Your sets': 'Deine Sets',
    'Nine clothing sets are ready, change them as you like.': '…',
    'Pick a set in «What do I wear?»': '…',
    'Each set can be renamed and deleted': '…',
    'On Today tap «What do I wear?» …': '…',
  },
};
```

**«Ausprobieren» (Noah 27.10.2026 «1a 2a 3a 4a 5a»): every point has `go`**, the exact place it leads to
(`tests/newsgo.test.js` fails without it). A tap on the line opens the page, taps the steps (a tab, a fold, a row
that opens a window) and lets the last one glow 3 s, with the line «New here: …» (`src/lib/know/newsgo.js`,
`newsRun.js`, the steps of `src/lib/know/spot.js`):

- `go: 'f.wearsets'`: a function of `features.js`; its spot is `SPOT['f.wearsets']` in `spot.js` (add one there if
  it sits in a window or further down, the catalogue jumps there too).
- `go: { href: '#/', steps: [{ sel: '[data-wear-open]' }, { text: 'Your sets' }] }`: a place that is no function.
  A step is `{ sel }` (CSS, prefer a `data-…` attribute), `{ text }` or `{ aria }` (an English key, matched in the
  shown language).
- `go: { href: '#/live', where: 'Shows on the live map during a ride: tap «Nearby».', play: 'ride' }`: a thing
  without a fixed place: the page where it shows up and a line when (English key, German in `de`); `play`
  adds «Show it in the example» (a day of `play.js` DAYS). With `steps` too, the line shows only when a step is
  missing.
- `go: null`: no button (it is gone, or a fix without a place).

`small` lines may have `go` as well. `tests/e2e/ausprobieren.spec.js` taps every line with a `go` once.

Once only, the **first** PR with a news file changes the `newerThan('0.33.0')` line in
`tests/whatsnew.test.js` to `newerThan('0.33.0', WHATS_NEW.filter((e) => !NEWS.includes(e)))`
(import `NEWS` from `../src/lib/news/index.gen.js`). It was left as it is so that the PRs still numbered
by hand on 27.10.2026 (#282, #290, Touren c, Knöpfe) do not conflict with this change. After that,
nobody touches that list again.

`index.gen.js` is written at every build and test and is not in git. Every entry also carries its GitHub PR number (`pr`, from the merge commit; none without the whole history). The merges **without** a news file (tests, rules, repairs) are not entries; the same run writes them to `ohne.gen.js` (`RELEASES_OHNE` in `whatsnew-full.js`: version, day, time, PR number, title). The PR numbers of the hand-numbered versions (up to 0.234.0) are in `src/lib/whatsnew-alt-pr.js` (`prOf()`). The same run writes `neu.gen.js` (the newest 10 versions in full, a short line for every version, and the German the rest of the app uses) and `archiv.gen.js` (the older ones in full). The start reads only `neu.gen.js` through `src/lib/whatsnew.js`; the pages that show the whole list import `src/lib/whatsnew-all.js` (Node tests and specs: `whatsnew-full.js`).

## Bilder (Noah 23.11.2026 «1b 2a 3a 4b 5a», thread «Neuheiten in der App besser zeigen»)

Each line with an exact place gets a picture: the lit spot after the change (`nachher`, with an orange frame) and, when the
place already existed, the same cut of the same page before it (`vorher`). The app shows them in «What is new» (a slider
Vorher / Nachher) and in the card «New since your last visit» on Today.

- Make them with `npm run news:bilder` (the news files this branch adds against main), or `npm run news:bilder -- <name> …`.
  It builds the base (main as the branch left it) next to this branch, taps «Try it» of each line on the phone with the
  fictional data, and writes `public/news/<name>/<line>-nachher.webp` and `<line>-vorher.webp` (`<line>` counts the lines of
  the news file from 1, main points first, then the small things; at most three per file; about 5 to 30 KB each, WebP).
  Commit them with the PR: `git add public/news`.
- A line with `go: null`, with only `where`, or whose spot never lights gets no picture. A PR that fixes something with no
  visible place has no picture; its news file says why in its last point or its `lead`.
- Never anything from private folders in a picture: the tool uses the fictional data set only.
- `tests/newsbild.test.js` checks the names, the size (90 KB at most, WebP only: the privacy guard allows no JPG in the repository) and that each line exists. The build puts the list of
  pictures into the entry (`bilder: [{ line, vorher }]`), so nothing else needs to be listed by hand.

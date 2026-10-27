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
  points: [{ text: 'Pick a set in «What do I wear?»', href: '#/' }],
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

Once only, the **first** PR with a news file changes the `newerThan('0.33.0')` line in
`tests/whatsnew.test.js` to `newerThan('0.33.0', WHATS_NEW.filter((e) => !NEWS.includes(e)))`
(import `NEWS` from `../src/lib/news/index.gen.js`). It was left as it is so that the PRs still numbered
by hand on 27.10.2026 (#282, #290, Touren c, Knöpfe) do not conflict with this change. After that,
nobody touches that list again.

`index.gen.js` is written at every build and test and is not in git.

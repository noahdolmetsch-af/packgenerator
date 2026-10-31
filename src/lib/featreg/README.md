# A new function: one file here, no edits in the big lists

Until now every new function of the catalogue added a line at the end of five big lists
(`features.js` OWN, `moment.js` FEATURE_MOMENTS, `know/howto.js`, `handbook.js`, `know/heimat.js` HOME/GAPS).
Open PRs all appended at the same place and clashed. Now a new function adds **one file** in this folder
(`src/lib/featreg/<name>.js`, same name as the news file); `scripts/news.mjs` collects every file into
`index.gen.js` (not in git) and `index.js` merges them into the five lists. Old entries stay where they are.

```js
// «Fair auslosen» (Noah 28.10.2026 «1b 2a 3a»)
export default {
  features: [
    // the entry of features.js (id, group, title, text, href or run, words) plus its moment («app» = none)
    { id: 'f.minilos', group: 'data', title: 'Draw fairly', text: '…', href: '#/me/mini/los', words: 'losen', moment: 'alltag' },
  ],
  howto: { 'f.minilos': ['Open …', 'Tap …', 'See …'] }, // exactly 3 steps
  handbook: { 'f.minilos': { on: 'Needs …', steps: ['…', '…'], example: 'Example: …' } },
  home: { 'f.minilos': '#/me/mini/los' }, // know/heimat.js HOME
  gaps: {}, // know/heimat.js GAPS (only when not visible on the home page)
};
```

Every field is optional. An id may be in only one place: not here **and** in a big list (tests/featreg.test.js).

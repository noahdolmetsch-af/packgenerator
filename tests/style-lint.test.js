// Wächter: the style lint (scripts/style-lint.mjs, skill packgenerator-einheitlich part 3).
// Fails only when a file gets MORE violations than tests/guard-baseline.json lists for it (a new file:
// any violation). Prints a summary so the baseline can shrink release by release.
import { describe, it, expect } from 'vitest';
import { lintAll, lintFile, countsOf, readBaseline, compare, summary, globalClasses, checkDecl, RULES } from '../scripts/style-lint.mjs';

describe('style lint rules', () => {
  const globals = globalClasses('.sw { width: 10px }\n.btn.hi { color: red }\n.card, .row .x { padding: 0 }\n@media (max-width: 9px) { .sel { width: 1px } }');
  it('collects the global one-class selectors of app.css', () => {
    expect([...globals].sort()).toEqual(['card', 'sel', 'sw']);
  });
  it('catches the .sw label of 9 Oct (one letter per line)', () => {
    const v = lintFile('/x/src/lib/A.svelte', '<span class="sw">Rahmentasche</span>\n<style>\n  .sw { font-size: var(--fs-small); }\n  .row .sw { width: 4px }\n</style>', globals);
    expect(v.map((x) => [x.rule, x.line])).toEqual([['global', 3]]);
  });
  it('catches words broken mid-letter («Di ch tm ilc h»)', () => {
    expect(checkDecl('overflow-wrap', 'anywhere')).toEqual(['breakword']);
    expect(checkDecl('word-break', 'break-all')).toEqual(['breakword']);
    expect(checkDecl('overflow-wrap', 'break-word')).toEqual([]);
  });
  it('colours only through tokens', () => {
    expect(checkDecl('color', '#fff')).toEqual(['colour']);
    expect(checkDecl('background', 'rgba(0, 0, 0, 0.2)')).toEqual(['colour']);
    expect(checkDecl('border', '1px solid hsl(10 20% 30%)')).toEqual(['colour']);
    expect(checkDecl('color', 'var(--ink)')).toEqual([]);
    expect(checkDecl('background', 'transparent')).toEqual([]);
    expect(checkDecl('border-color', 'currentColor')).toEqual([]);
    expect(checkDecl('--x', '#fff')).toEqual([]);
  });
  it('font sizes only through the type scale', () => {
    expect(checkDecl('font-size', '13px')).toEqual(['fontsize']);
    expect(checkDecl('font-size', 'var(--fs-small)')).toEqual([]);
    expect(checkDecl('font-size', 'inherit')).toEqual([]);
    expect(checkDecl('font', '500 15px/1.25 var(--font-body)')).toEqual(['fontsize']);
    expect(checkDecl('font', '600 var(--fs-label)/1.3 var(--font-body)')).toEqual([]);
    expect(checkDecl('font', 'inherit')).toEqual([]);
  });
  it('reads inline styles, not ids in selectors', () => {
    const v = lintFile('/x/src/B.svelte', '<div style="color: #123456; gap: 4px" style:background="rgb(1,2,3)"></div>\n<style>\n  #main { color: var(--ink) }\n</style>', new Set());
    expect(v.map((x) => x.rule)).toEqual(['colour', 'colour']);
  });
});

describe('style lint on src/', () => {
  it('no file has more violations than its baseline', () => {
    const result = lintAll();
    const counts = countsOf(result);
    const base = readBaseline().style ?? {};
    const { worse, better } = compare(counts, base, RULES);
    console.log(`Wächter style lint\n${summary(counts, RULES, 10).text}`);
    if (better.length) console.log(`The baseline can shrink (node scripts/style-lint.mjs --update):\n${better.map((b) => `  ${b.key} ${b.rule}: ${b.was} → ${b.now}`).join('\n')}`);
    const messages = worse.flatMap((w) => [
      `${w.key}: ${w.now} ${w.rule} violation(s), baseline ${w.was}`,
      ...result[w.key].filter((v) => v.rule === w.rule).map((v) => `    ${w.key}:${v.line}  ${v.text}`),
    ]);
    const help = { colour: 'use a var(--…) token from src/app.css', breakword: 'use overflow-wrap: break-word (whole words wrap)', global: 'rename the class: app.css styles it for everyone', fontsize: 'use var(--fs-page|section|sub|body|label|small)' };
    expect(messages, `New style violations (${[...new Set(worse.map((w) => `${w.rule}: ${help[w.rule]}`))].join('; ')}):\n${messages.join('\n')}`).toEqual([]);
  });
});

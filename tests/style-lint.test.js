// Wächter: the style lint (scripts/style-lint.mjs, skill packgenerator-einheitlich part 3).
// Fails only when a file gets MORE violations than tests/guard-baseline.json lists for it (a new file:
// any violation). Prints a summary so the baseline can shrink release by release.
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { lintAll, lintFile, countsOf, readBaseline, compare, summary, globalClasses, checkDecl, RULES, STRICT_STYLE, STRICT_RULES, stillToRebuild } from '../scripts/style-lint.mjs';

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
  it('corners on the ladder and shadows in three steps (baseline-only, Noah 24.11.2026 «2a»)', () => {
    expect(checkDecl('text-transform', 'uppercase')).toEqual(['upper']);
    expect(checkDecl('text-transform', 'none')).toEqual([]);
    expect(checkDecl('border-radius', '10px')).toEqual(['radius']);
    expect(checkDecl('border-radius', '6px 6px 0 0')).toEqual(['radius']);
    for (const v of ['var(--r-ctl)', '8px', '12px', '16px 16px 0 0', '999px', '50%', '0', 'var(--radius-card)']) expect(checkDecl('border-radius', v), v).toEqual([]);
    expect(checkDecl('box-shadow', '0 8px 24px var(--shadow)')).toEqual(['shadow']);
    for (const v of ['none', 'var(--shadow-2)', 'var(--card-shadow)', '0 0 0 2px var(--paper)', 'inset 0 0 0 2px var(--accent)', 'var(--shadow-1), 0 0 0 2px var(--paper)']) expect(checkDecl('box-shadow', v), v).toEqual([]);
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
    const help = { colour: 'use a var(--…) token from src/app.css', breakword: 'use overflow-wrap: break-word (whole words wrap)', global: 'rename the class: app.css styles it for everyone', fontsize: 'use var(--fs-page|section|sub|body|label|small)', radius: 'use the ladder var(--r-1…--r-4), var(--r-pill), var(--r-ctl) or var(--radius-card)', shadow: 'use var(--shadow-1|2|3) or var(--card-shadow)', upper: 'write the heading normally (capitals only for units)' };
    expect(messages, `New style violations (${[...new Set(worse.map((w) => `${w.rule}: ${help[w.rule]}`))].join('; ')}):\n${messages.join('\n')}`).toEqual([]);
  });
});

// v0.67.0 «Übergänge 1» (Noah Ü2a): the kit and every file a release builds or brings onto it is strict:
// no baseline, no violation at all. The rest stays listed as «noch umbauen» until a release touches it.
describe('style lint: strict for the kit and the touched pages', () => {
  it('the strict files exist, have no violation and no baseline entry', () => {
    const result = lintAll();
    const base = readBaseline().style ?? {};
    for (const f of STRICT_STYLE) {
      expect(existsSync(new URL(`../${f}`, import.meta.url)), f).toBe(true);
      // radius and shadow («Feinschliff», Noah 24.11.2026 «2a») are baseline-only: the no-growth check above holds them; the old four stay at 0
      expect(Object.keys(base[f] ?? {}).filter((r) => STRICT_RULES.includes(r)), `${f} must not be in the baseline`).toEqual([]);
      expect((result[f] ?? []).filter((v) => STRICT_RULES.includes(v.rule)).map((v) => `${f}:${v.line} ${v.rule} ${v.text}`), f).toEqual([]);
    }
  });
  it('lists the files still to rebuild («noch umbauen»)', () => {
    const list = stillToRebuild(readBaseline().style ?? {});
    console.log(`noch umbauen: ${list.length} files\n${list.slice(0, 15).map(([f, n]) => `  ${String(n).padStart(4)}  ${f}`).join('\n')}`);
    expect(list.every(([f]) => !STRICT_STYLE.includes(f))).toBe(true);
  });
});

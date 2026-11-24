import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// «Nie abgeschnitten» (Noah 24.11.2026 «a und b», docs/regeln.md Block 7), the static half. Every window (<dialog>) of the app
// fits the screen and scrolls when it is longer; head and foot of the new windows (.vdlg) stay put; a soft edge shows that more follows.
// The other half is tests/e2e/fenster-nie-abgeschnitten.spec.js: real windows at 390, 1440×700, 1440×800 and 1440×900, the main
// button whole, no button cut where the window does not scroll.
const css = readFileSync('src/app.css', 'utf8');

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith('.svelte')) out.push(p);
  }
  return out;
}

/** The own classes of every <dialog> in a component and the rules of its <style> that name one of them. */
function dialogRules(src) {
  const classes = new Set();
  for (const m of src.matchAll(/<dialog\b[^>]*?class="([^"{]*)"/g)) for (const c of m[1].split(/\s+/)) if (c && !['sheet', 'vdlg', 'from-below', 'centered'].includes(c)) classes.add(c);
  const style = /<style[^>]*>([\s\S]*?)<\/style>/.exec(src)?.[1] ?? '';
  const rules = [];
  for (const m of style.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const own = m[1].split(',').some((sel) => {
      const last = sel.trim().split(/\s+/).pop() ?? '';
      return [...classes].some((c) => new RegExp(`(^|dialog)\\.${c}(\\[|:|$)`).test(last));
    });
    if (own) rules.push({ sel: m[1].trim(), body: m[2], style });
  }
  return rules;
}

describe('«Nie abgeschnitten»: every window fits and scrolls', () => {
  it('the base window is as tall as the screen allows (dvh, so also under a phone address bar) and scrolls', () => {
    expect(css).toMatch(/dialog\.sheet\s*\{[^}]*max-height:\s*calc\(100dvh - 24px\)/);
    expect(css).toMatch(/max-height:\s*94dvh/);
    expect(css).toMatch(/dialog\.sheet,\s*dialog\.calm-sheet,\s*dialog\.fact-sheet\s*\{[^}]*overflow-y:\s*auto/);
  });

  it('a window that scrolls shows a soft edge where more is hidden', () => {
    expect(css).toMatch(/dialog\.sheet\s*\{\s*background:[^;]*local[^;]*scroll/);
  });

  it('the head and the foot of the new windows (.vd-head, .vd-foot) stay put', () => {
    expect(css).toMatch(/dialog\.sheet\.vdlg \.vd-head\s*\{[^}]*position:\s*sticky/);
    expect(css).toMatch(/dialog\.sheet\.vdlg \.vd-foot\s*\{[^}]*position:\s*sticky/);
  });

  it('no window sets its own height with vh only (a phone address bar would cut it): use dvh', () => {
    const bad = [];
    for (const f of walk('src')) {
      const src = readFileSync(f, 'utf8');
      if (!src.includes('<dialog')) continue;
      for (const r of dialogRules(src)) {
        for (const m of r.body.matchAll(/max-height:\s*([^;]+)/g)) if (/\d\s*vh\b/.test(m[1]) && !/dvh/.test(r.body)) bad.push(`${f}: ${r.sel} { max-height: ${m[1].trim()} }`);
      }
    }
    expect(bad, 'add a second line with dvh after the vh line').toEqual([]);
  });

  it('a window that clips (overflow: hidden) has a part inside that scrolls', () => {
    const bad = [];
    for (const f of walk('src')) {
      const src = readFileSync(f, 'utf8');
      if (!src.includes('<dialog')) continue;
      const style = /<style[^>]*>([\s\S]*?)<\/style>/.exec(src)?.[1] ?? '';
      for (const r of dialogRules(src)) {
        if (/overflow(-y)?:\s*hidden/.test(r.body) && !/overflow(-y)?:\s*(auto|scroll)/.test(style)) bad.push(`${f}: ${r.sel}`);
      }
    }
    expect(bad, 'a window with overflow: hidden needs an inner part with overflow-y: auto').toEqual([]);
  });
});

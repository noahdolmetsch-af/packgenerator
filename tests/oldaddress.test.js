// UX-Test D-3 (08.11.2026): an address under #/flow that does not exist is «gone»; every address the source writes is known.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { flowGone, FLOW_ROUTES } from '../src/lib/flow/oldaddress.js';

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(js|svelte)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });

describe('flowGone', () => {
  it('knows the real pages, with a query or a deeper path', () => {
    for (const s of ['', 'sports', 'review/obs', 'milestones?act=meditation', 'edit/abc', 'training/a/x']) expect(flowGone(s), s).toBe(null);
  });
  it('sends the old tennis address to the sport', () => {
    expect(flowGone('tennis')).toEqual({ target: { href: '#/flow/sport/act%3Atennis', label: 'To Tennis' } });
    expect(flowGone('Tennis?x=1').target.href).toBe('#/flow/sport/act%3Atennis');
  });
  it('an unknown address is gone without a target', () => {
    expect(flowGone('gibt-es-nicht')).toEqual({ target: null });
  });
  it('every #/flow/<page> that the source writes is answered by Flow', () => {
    const seen = new Set();
    for (const f of walk('src').filter((x) => !x.endsWith('oldaddress.js') && !x.includes('/news/'))) for (const m of readFileSync(f, 'utf8').matchAll(/#\/flow\/([a-z][a-z-]*)/g)) seen.add(m[1]);
    for (const r of seen) expect(FLOW_ROUTES, `#/flow/${r}`).toContain(r);
  });
  it('Flow.svelte answers each listed page (or App.svelte does, for impulse)', () => {
    const flow = readFileSync('src/pages/Flow.svelte', 'utf8');
    for (const r of FLOW_ROUTES.filter((x) => x && x !== 'impulse')) expect(flow, r).toContain(`route[0] === '${r}'`);
  });
});

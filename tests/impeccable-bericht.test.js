// Impeccable-Nachtbericht (Noah «1-8» 26.11.2026, Schritt 7 des Test-Plans): the report turns the nightly measurements
// (tests/e2e/impeccable/sweep.spec.js) into a short German text, with classes, and never fails by itself.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { routen, bericht, klasse, TALL } from '../scripts/impeccable-bericht.mjs';

const appStand = readFileSync(new URL('../docs/app-stand.md', import.meta.url), 'utf8');
const workflow = readFileSync(new URL('../.github/workflows/impeccable-nacht.yml', import.meta.url), 'utf8');
const config = readFileSync(new URL('../playwright.config.js', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('Impeccable-Nachtbericht: addresses', () => {
  it('takes the addresses of the app list, Today first, without placeholders', () => {
    const r = routen(appStand);
    expect(r[0]).toBe('#/');
    expect(r.length).toBeGreaterThan(100);
    expect(new Set(r).size).toBe(r.length);
    for (const x of r.slice(1)) {
      expect(x.startsWith('#/')).toBe(true);
      expect(x, 'no placeholder that needs a record').not.toMatch(/[/=]$|[?&](bike|act)=|\?(neu|day|print|shop|weigh|sample|q=)/);
    }
  });

  it('drops placeholders and duplicates', () => {
    expect(routen('x #/a #/a #/b/ #/c?q= #/d?bike=1 #/e?tab=care')).toEqual(['#/', '#/a', '#/e?tab=care']);
  });
});

describe('Impeccable-Nachtbericht: report', () => {
  const part = (size, extra = {}) => ({ size, routes: 3, pages: [{ hash: '#/', h: 1200, small: 0 }, { hash: '#/lang', h: TALL + 1, small: 3 }], findings: [], ...extra });

  it('says all is fine when nothing is found', () => {
    const t = bericht([{ sizes: [part('phone', { pages: [{ hash: '#/', h: 900, small: 0 }] })] }], { datum: '2026-11-26' });
    expect(t).toContain('Impeccable-Nachtbericht 2026-11-26');
    expect(t).toContain('Alles in Ordnung');
    expect(t).not.toContain('| Klasse |');
  });

  it('classes the findings: A broken, C wording, D long pages, tap areas only counted', () => {
    expect(klasse('schiebt seitlich')).toBe('A');
    expect(klasse('lädt nicht')).toBe('A');
    expect(klasse('englisch')).toBe('C');
    const t = bericht([{ sizes: [part('phone', { findings: [{ hash: '#/x', what: 'englisch', detail: 'Save' }, { hash: '#/y', what: 'schiebt seitlich', detail: '500 > 390 px' }] })] }]);
    expect(t).toContain('A 1 · C 1 · D 1');
    expect(t).toContain('| A | Handy 390 | `#/y` | schiebt seitlich');
    expect(t).toContain('| D | Handy 390 | `#/lang` | sehr lange Seite');
    expect(t).toContain('1 Seiten mit Tippflächen unter 36 px (nur gezählt)');
  });

  it('handles the three sizes of the two parts', () => {
    const t = bericht([{ sizes: [part('phone')] }, { sizes: [part('laptop'), part('desktop')] }]);
    for (const n of ['Handy 390', 'Laptop 1440×800', 'Computer 1440×900']) expect(t).toContain(n);
  });
});

describe('Impeccable-Nachtbericht: night workflow', () => {
  it('never turns red, writes no issue and uses the Playwright image of the package', () => {
    expect(workflow).toContain('continue-on-error: true');
    expect(workflow).not.toContain('gh issue');
    expect(workflow).not.toMatch(/issues:\s*write/);
    const tag = workflow.match(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/)[1];
    expect(tag).toBe((pkg.devDependencies?.['@playwright/test'] ?? pkg.dependencies?.['@playwright/test']).replace(/^[^\d]*/, ''));
    expect(workflow).toContain("IMPECCABLE: '1'");
  });

  it('a pull request never runs the sweep', () => {
    expect(config).toContain("process.env.IMPECCABLE ? [] : ['**/impeccable/**']");
    expect(workflow).not.toContain('pull_request');
  });

  it('uses only the fictional data', () => {
    const spec = readFileSync(new URL('./e2e/impeccable/sweep.spec.js', import.meta.url), 'utf8');
    expect(spec).toContain('start(page, context, info)'); // the Gesamttest fixture import
    expect(spec).not.toMatch(/\/mnt\/project-files|private\//);
  });
});

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { scope, newsScope, partsFor, quickStage, allSpecFiles, DATA_SPEC_NAME, CORE_SPECS, MAX_SPECS } from '../scripts/ci-scope.mjs';

describe('ci-scope: which phone tests a PR needs', () => {
  it('docs and news only: no phone tests', () => {
    expect(scope(['docs/releases/x.md', 'src/lib/news/x.js']).mode).toBe('none');
  });
  it('whole spec files: only these specs', () => {
    const r = scope(['tests/e2e/pf.spec.js', 'docs/releases/x.md', 'tests/e2e/gesamttest/scenarios.spec.js']);
    expect(r).toEqual({ mode: 'specs', specs: ['tests/e2e/pf.spec.js', 'tests/e2e/gesamttest/scenarios.spec.js'], parts: 1 });
  });
  it('shared helpers or app code without a map: not decided yet (the caller builds the map and asks again)', () => {
    expect(scope(['tests/e2e/clock.js']).mode).toBe('all');
    expect(scope(['tests/e2e/gesamttest/lib.js', 'tests/e2e/pf.spec.js']).mode).toBe('all');
    expect(scope(['src/pages/Home.svelte', 'docs/releases/x.md']).mode).toBe('all');
    expect(scope(['.github/workflows/deploy.yml']).mode).toBe('all');
  });
  it('no files known: everything', () => {
    expect(scope([]).mode).toBe('all');
  });
  it('German text files alone: no phone tests; the files that wire them: everything', () => {
    expect(scope(['src/lib/i18n/de/pack.js', 'docs/releases/x.md']).mode).toBe('none');
    expect(scope(['src/lib/i18n/de/index.js']).mode).toBe('all');
    expect(scope(['src/lib/i18n/de/auto.gen.js']).mode).toBe('all');
  });
});

describe('ci-scope: app code with the map (Noah 05.11.2026 «3a ja»)', () => {
  it('the mapped specs, the PR\'s own specs and the Kern, sorted and once', () => {
    const r = scope(['src/pages/Lend.svelte', 'tests/e2e/own.spec.js', 'src/lib/i18n/de/lend.js'], () => ['tests/e2e/paket-h.spec.js', 'tests/e2e/guard.spec.js']);
    expect(r.mode).toBe('specs');
    expect(r.specs).toEqual([...new Set([...CORE_SPECS, 'tests/e2e/own.spec.js', 'tests/e2e/paket-h.spec.js'])].sort());
  });
  it('the map says unknown (null), e.g. a start file: the quick check, the Kern alone (Noah 22.11.2026 «a»)', () => {
    const r = scope(['src/lib/home/rows.js'], () => null);
    expect(r).toEqual({ mode: 'specs', specs: [...CORE_SPECS].sort(), parts: 1 });
  });
  it('a style is a view: the Kern alone, the map is not asked about it', () => {
    let asked = false;
    const r = scope(['src/app.css'], () => { asked = true; return []; });
    expect(r.mode).toBe('specs');
    expect(r.specs).toEqual([...CORE_SPECS].sort());
    expect(asked).toBe(false);
  });
  it('a config, build or workflow file, an asset or something not understood: everything, the map is not asked', () => {
    let asked = false;
    const map = () => { asked = true; return []; };
    for (const f of ['package.json', 'vite.config.js', '.github/workflows/deploy.yml', 'public/x.png', 'index.html', 'scripts/news.mjs', 'tools/x.py']) expect(scope([f], map).mode, f).toBe('all');
    expect(scope(['src/pages/Lend.svelte', 'vite.config.js'], map).mode).toBe('all');
    expect(asked).toBe(false);
  });
  it('a shared test helper is app code for the map (it reaches the specs that import it)', () => {
    expect(scope(['tests/e2e/clock.js'], () => ['tests/e2e/a.spec.js']).mode).toBe('specs');
  });
  it('too many specs (a file nearly every spec reaches): the Kern alone', () => {
    const many = Array.from({ length: MAX_SPECS + 1 }, (_, i) => `tests/e2e/s${i}.spec.js`);
    const r = scope(['src/pages/Lend.svelte'], () => many);
    expect(r.mode).toBe('specs');
    expect(r.specs).toEqual([...CORE_SPECS].sort());
  });
  it('parts: one per 20 specs, 1 to 5', () => {
    expect(partsFor(['a'])).toBe(1);
    expect(partsFor(Array(21).fill('a'))).toBe(2);
    expect(partsFor(Array(250).fill('a'))).toBe(5);
  });
});

describe('ci-scope: data, backup, sync, storage and api are checked in full on every PR (Noah 22.11.2026 «a»)', () => {
  const map = () => ['tests/e2e/a.spec.js'];
  it('the full check, the map is not used', () => {
    for (const f of ['api/booking.js', 'api/_lib/push.js', 'src/lib/db.js', 'src/lib/alltagdb.js', 'src/lib/backup.js', 'src/lib/backupcrypt.js',
      'src/lib/folderBackup.js', 'src/lib/stravasync.js', 'src/lib/sync/engine.js', 'src/lib/maintenance/snapshots.js', 'src/lib/importstep2.js',
      'src/lib/fitbitexport.js', 'src/lib/booking/client.js', 'src/pages/Backup.svelte'])
      expect(scope([f], map).mode, f).toBe('all');
    expect(scope(['src/pages/Lend.svelte', 'src/lib/db.js'], map).mode).toBe('all');
  });
  it('a word with db or sync only inside it, in a view: the full check, the safe side', () => {
    expect(scope(['src/lib/async-menu.js'], map).mode).toBe('all');
  });
  it('docs, news and German texts with such a word in the name are still light', () => {
    expect(scope(['docs/releases/backup-hinweis.md', 'src/lib/news/sync-x.js', 'src/lib/i18n/de/backup.js']).mode).toBe('none');
  });
  it('a spec about backup alone runs only that spec', () => {
    expect(scope(['tests/e2e/backup.spec.js']).specs).toEqual(['tests/e2e/backup.spec.js']);
  });
  it('a small view PR is the quick check: the Kern, the mapped specs and its own specs', () => {
    const r = scope(['src/pages/Lend.svelte', 'src/lib/i18n/de/lend.js'], () => ['tests/e2e/lend.spec.js']);
    expect(r.mode).toBe('specs');
    expect(r.specs).toEqual([...new Set([...CORE_SPECS, 'tests/e2e/lend.spec.js'])].sort());
    expect(r.parts).toBe(1);
  });
});

describe('ci-scope: which news lines «Ausprobieren» taps in a PR', () => {
  const has = () => true;
  it('only the lines of the PR\'s own news files', () => {
    expect(newsScope(['src/lib/news/a-b.js', 'src/pages/Bikes.svelte', 'src/lib/news/c.js'], has)).toBe('a-b.js c.js');
  });
  it('no news file: none', () => {
    expect(newsScope(['src/pages/Bikes.svelte', 'docs/releases/x.md'], has)).toBe('');
  });
  it('a deleted news file is left out', () => {
    expect(newsScope(['src/lib/news/gone.js'], () => false)).toBe('');
  });
  it('the update list, the go-map, the Ausprobieren code and the helpers: all lines', () => {
    for (const f of ['src/lib/whatsnew.js', 'src/lib/know/newsgo-map.js', 'src/lib/know/spot.js', 'src/lib/news/README.md', 'src/pages/WasNeu.svelte', 'tests/e2e/ausprobieren.spec.js', 'tests/e2e/clock.js', 'tests/e2e/gesamttest/lib.js'])
      expect(newsScope(['src/lib/news/x.js', f], has), f).toBe('all');
  });
  it('no files known: all lines', () => {
    expect(newsScope([], has)).toBe('all');
  });
});

describe('ci-scope: the app-wide Wächter run with every PR that changes app code (Noah 21.11.2026 «d plus b»)', () => {
  it('the Kern holds the guards that check the whole app, and each file exists', () => {
    for (const f of ['guard', 'flow', 'tippzahl', 'functions', 'heimat', 'tote-knoepfe']) expect(CORE_SPECS).toContain(`tests/e2e/${f}.spec.js`);
    for (const f of CORE_SPECS) expect(existsSync(new URL(`../${f}`, import.meta.url)), f).toBe(true);
  });
  it('a PR that touches one small page still runs them', () => {
    const r = scope(['src/pages/Lend.svelte'], () => ['tests/e2e/paket-h.spec.js']);
    expect(r.mode).toBe('specs');
    for (const f of CORE_SPECS) expect(r.specs).toContain(f);
  });
});

describe('ci-scope: the quick stage of a «Schwer» PR (Noah 24.11.2026 «a»)', () => {
  const all = ['tests/e2e/backupzeile.spec.js', 'tests/e2e/sync-hinweis.spec.js', 'tests/e2e/erwartung.spec.js', 'tests/e2e/pf.spec.js', 'tests/e2e/zuletzt-geloescht.spec.js'];
  it('the Kern, the data specs by name, sorted and once; a spec about «Erwartung» is no data spec', () => {
    const r = quickStage(['src/lib/db.js'], null, all);
    expect(r.mode).toBe('specs');
    expect(r.specs).toEqual([...new Set([...CORE_SPECS, 'tests/e2e/backupzeile.spec.js', 'tests/e2e/sync-hinweis.spec.js', 'tests/e2e/zuletzt-geloescht.spec.js'])].sort());
    expect(DATA_SPEC_NAME.test('erwartung.spec.js')).toBe(false);
    expect(DATA_SPEC_NAME.test('app-wartung.spec.js')).toBe(true);
  });
  it('adds the PR\'s own specs and the specs of the changed pages when the map knows them', () => {
    const r = quickStage(['src/lib/db.js', 'src/pages/Lend.svelte', 'tests/e2e/own.spec.js'], (changed) => (changed.includes('src/pages/Lend.svelte') ? ['tests/e2e/lend.spec.js'] : []), all);
    for (const f of ['tests/e2e/own.spec.js', 'tests/e2e/lend.spec.js', ...CORE_SPECS]) expect(r.specs).toContain(f);
  });
  it('a file every spec reaches (more than MAX_SPECS) adds nothing', () => {
    const many = Array.from({ length: MAX_SPECS + 1 }, (_, i) => `tests/e2e/s${i}.spec.js`);
    expect(quickStage(['src/lib/db.js'], () => many, []).specs).toEqual([...CORE_SPECS].sort());
  });
  it('is smaller than everything, and every file of it exists', () => {
    const real = allSpecFiles();
    expect(real.length).toBeGreaterThan(300);
    const r = quickStage(['package.json'], null, real);
    expect(r.specs.length).toBeLessThan(60);
    for (const f of r.specs) expect(existsSync(new URL(`../${f}`, import.meta.url)), f).toBe(true);
  });
  it('allSpecFiles leaves out what a PR never runs (Gesamttest, night walk, live, probes)', () => {
    for (const f of allSpecFiles()) expect(f).not.toMatch(/gesamttest|nachtrundgang|\/live\/|tmp-durchklick/);
  });
});

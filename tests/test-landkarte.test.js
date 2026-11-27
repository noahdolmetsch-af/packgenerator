// Test-Landkarte (Noah «1-8» 26.11.2026, Schritt 1 des Plans «Tests auf den neuen App-Stand bringen», docs/tests.md).
// Hält die Form: jede Test-Datei ist erfasst und hat Etage und Bereich, höchstens ein Zehntel bleibt «Sonstiges»,
// und jeder Bereich des Skripts steht auf der Seite docs/tests.md. Es zählt nichts Festes (Zahlen ändern sich mit jedem PR).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { AREAS, SONST, areaOf, routeAreaOf, landkarte, summary, toMarkdown } from '../scripts/test-landkarte.mjs';

const root = path.resolve(__dirname, '..');
const rows = landkarte(root);
const doc = fs.readFileSync(path.join(root, 'docs/tests.md'), 'utf8');

describe('scripts/test-landkarte.mjs', () => {
  it('lists every test file once, with an etage and an area', () => {
    const unit = fs.readdirSync(path.join(root, 'tests')).filter((f) => f.endsWith('.test.js')).length;
    expect(rows.filter((r) => r.etage.startsWith('4')).length).toBe(unit);
    expect(new Set(rows.map((r) => r.path)).size).toBe(rows.length);
    for (const r of rows) {
      expect(r.etage, r.path).toMatch(/^[234] /);
      expect(r.area, r.path).toBeTruthy();
    }
  });

  it('leaves at most a tenth of the files in «Sonstiges»', () => {
    const rest = rows.filter((r) => r.area === SONST).length;
    expect(rest / rows.length).toBeLessThan(0.1);
  });

  it('puts a file by its name first, by the address it opens second', () => {
    expect(areaOf('mein-tag')).toBe('Mein Tag');
    expect(areaOf('xyz-unbekannt', "await page.goto('#/trips/fuel'); await page.goto('#/trips');")).toBe('Touren');
    expect(areaOf('xyz-unbekannt')).toBe(SONST);
    expect(routeAreaOf("page.goto('#/pack')")).toBe('Packen');
  });

  it('writes a table with one row per area and a total', () => {
    const md = toMarkdown(rows);
    const areas = summary(rows).map((s) => s.area);
    for (const a of areas) expect(md).toContain(`| ${a} |`);
    expect(md).toContain('| **Zusammen** |');
  });
});

describe('docs/tests.md', () => {
  it('names every area of the script', () => {
    for (const [area] of AREAS) expect(doc, area).toContain(area);
  });

  it('names the four etagen and the eight steps of the plan', () => {
    for (const e of ['Alltagswege', 'Wächter', 'Bereichstests', 'Unit-Tests']) expect(doc, e).toContain(e);
    for (let n = 1; n <= 8; n++) expect(doc, `step ${n}`).toMatch(new RegExp(`^\\| ${n} \\|`, 'm'));
  });
});

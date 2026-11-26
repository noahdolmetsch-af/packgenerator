#!/usr/bin/env node
// Impeccable-Nachtbericht (Noah «1-8» 26.11.2026, Schritt 7 des Test-Plans, thread «Tests auf den neuen App-Stand bringen»):
// every night a robot opens every page of the app list (docs/app-stand.md) on a phone (390 px), a laptop (1440×800, Noah's Mac
// with the bookmarks bar) and a computer (1440×900), with the fictional data only (tests/fixtures/gesamttest), and writes what it
// measured (tests/e2e/impeccable/sweep.spec.js). This file turns the measurements into one short German report. It never fails a
// run (no red, only findings): Noah reads it in the morning round, the judgement «is it beautiful and clear?» stays with the daily
// impeccable check of the live app (the thread «Täglichen impeccable-Test um 4:40 einrichten»).
// Classes: A broken or wrong (does not load, error page, error in the browser, page pushes sideways, a control cut off),
// C wording (English text that has a German one), D fine print (very long pages, small tap areas: only counted).
// B (the main thing sits too low) is a judgement of the eye and is not measured here.
// Usage: node scripts/impeccable-bericht.mjs <folder with phone.json, desktop.json>   (writes <folder>/bericht.md)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const TALL = 9000; // px: a page that long on a phone is a finding of class D
export const SIZE_NAMES = { phone: 'Handy 390', laptop: 'Laptop 1440×800', desktop: 'Computer 1440×900' };

/** Class of a finding: A (kaputt oder falsch), C (Wortlaut). */
export const klasse = (what) => (what === 'englisch' ? 'C' : 'A');

/** The addresses of docs/app-stand.md that can be opened as they are (no placeholder, no address that needs a record). */
export function routen(md) {
  const found = String(md).match(/#\/[a-zA-Z0-9/_?=&.-]+/g) ?? [];
  const ok = found.filter((r) => !/[/=]$/.test(r) && !/\?(neu|day|print|shop|weigh|sample|q=)/.test(r) && !/[?&](bike|act)=/.test(r));
  return ['#/', ...[...new Set(ok)].filter((r) => r !== '#/').sort()];
}

/** One report from the part files ({ size, routes, pages: [{ hash, h, small }], findings: [{ hash, what, detail }] } per size). */
export function bericht(parts, { datum = new Date().toISOString().slice(0, 10) } = {}) {
  const sizes = parts.flatMap((p) => p.sizes ?? [p]);
  const lines = [`## Impeccable-Nachtbericht ${datum}`, '', 'Messung der ganzen App mit erfundenen Daten; nur Funde, nie rot. Das Urteil «klar und schön?» gibt der tägliche impeccable-Test der Live-App.', ''];
  const all = [];
  for (const s of sizes) {
    const name = SIZE_NAMES[s.size] ?? s.size;
    const fs = s.findings ?? [];
    const pages = s.pages ?? [];
    const tall = pages.filter((p) => p.h > TALL);
    const small = pages.filter((p) => p.small > 0).length;
    for (const f of fs) all.push({ ...f, size: name, klasse: klasse(f.what) });
    for (const p of tall) all.push({ hash: p.hash, what: 'sehr lange Seite', detail: `${p.h} px`, size: name, klasse: 'D' });
    lines.push(`- **${name}:** ${pages.length} Adressen geöffnet, ${fs.length} Funde, ${small} Seiten mit Tippflächen unter 36 px (nur gezählt).`);
  }
  lines.push('');
  const counts = Object.fromEntries(['A', 'C', 'D'].map((k) => [k, all.filter((f) => f.klasse === k).length]));
  lines.push(`**Funde:** A ${counts.A} · C ${counts.C} · D ${counts.D}${counts.A + counts.C + counts.D ? '' : '. Alles in Ordnung.'}`, '');
  if (all.length) {
    lines.push('| Klasse | Grösse | Adresse | Was | Genau |', '|---|---|---|---|---|');
    for (const f of all.sort((a, b) => a.klasse.localeCompare(b.klasse) || a.hash.localeCompare(b.hash))) {
      lines.push(`| ${f.klasse} | ${f.size} | \`${f.hash}\` | ${f.what} | ${String(f.detail ?? '').replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 200)} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function readParts(dir) {
  return readdirSync(dir)
    .filter((f) => /^(phone|desktop)\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node scripts/impeccable-bericht.mjs <folder>');
    process.exit(2);
  }
  const text = bericht(readParts(dir));
  writeFileSync(join(dir, 'bericht.md'), text);
  console.log(text);
}

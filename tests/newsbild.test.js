// «Bilder bei jeder Neuheit» (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the pictures of «What is new» live in
// public/news/<name>/<line>-nachher.webp (and -vorher.webp). The build reads the folders (scripts/news.mjs picsOf/picsFor);
// this test guards the format of the files and the folders, so the app never points at a picture that is not there.
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { picsOf, PICS_DIR, newsFiles } from '../scripts/news.mjs';
import { NEWS } from '../src/lib/news/index.gen.js';

const ROOT = new URL('../', import.meta.url).pathname;
const MAX_BYTES = 90 * 1024; // a cut of the phone screen, webp at 80: about 5 to 30 KB; more is a whole screen by mistake

describe('picsOf (the pictures of one news file)', () => {
  it('lists the lines that have a «nachher», with a flag for «vorher»', () => {
    expect(picsOf(['1-nachher.webp', '1-vorher.webp', '3-nachher.webp'])).toEqual([
      { line: 1, vorher: true },
      { line: 3, vorher: false },
    ]);
  });
  it('a «vorher» alone does not count; other files are ignored; the order is by line', () => {
    expect(picsOf(['2-vorher.webp', '10-nachher.webp', '2-nachher.webp', 'notes.txt', 'a-nachher.webp'])).toEqual([
      { line: 2, vorher: true },
      { line: 10, vorher: false },
    ]);
  });
  it('no folder, no pictures', () => {
    expect(picsOf([])).toEqual([]);
  });
});

describe('public/news', () => {
  const dir = `${ROOT}${PICS_DIR}/`;
  const folders = existsSync(dir) ? readdirSync(dir).filter((f) => statSync(dir + f).isDirectory()) : [];
  const names = new Set(newsFiles().map((f) => f.slice(0, -3)));

  it('every folder belongs to a news file', () => {
    expect(folders.filter((f) => !names.has(f))).toEqual([]);
  });

  it('every file is «<line>-nachher.webp» or «<line>-vorher.webp», small, and its line exists', () => {
    const bad = [];
    for (const f of folders) {
      const e = NEWS.find((n) => n.id === f);
      const lines = e ? e.points.length + (e.small?.length ?? 0) : 0;
      for (const file of readdirSync(dir + f)) {
        const m = /^(\d+)-(nachher|vorher)\.webp$/.exec(file);
        if (!m) bad.push(`${f}/${file}: name`);
        else if (Number(m[1]) < 1 || Number(m[1]) > lines) bad.push(`${f}/${file}: the news file has ${lines} lines`);
        else if (statSync(`${dir}${f}/${file}`).size > MAX_BYTES) bad.push(`${f}/${file}: over ${MAX_BYTES / 1024} KB`);
      }
      if (e && !picsOf(readdirSync(dir + f)).length) bad.push(`${f}: pictures but no «nachher»`);
    }
    expect(bad).toEqual([]);
  });

  it('the build gives an entry its pictures (bilder)', () => {
    for (const f of folders) {
      const e = NEWS.find((n) => n.id === f);
      expect(e?.bilder, f).toEqual(picsOf(readdirSync(dir + f)));
    }
  });
});

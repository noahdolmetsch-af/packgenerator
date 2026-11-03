// «Wächter gegen private Daten» (Noah 02.11.2026): stops every pull request that carries a personal file
// (GPX, FIT, Excel, photos, real backups) into the public repository. Rules: scripts/privatecheck.mjs.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { findPrivate, ALLOWED } from '../scripts/privatecheck.mjs';

const tracked = () => execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
const disk = (f) => (existsSync(f) ? { size: statSync(f).size, head: statSync(f).size < 3e6 ? readFileSync(f, 'utf8').slice(0, 4000) : '' } : null);

describe('no private data in the public repository', () => {
  it('no tracked file is a track, Excel list, photo or real backup', () => {
    const bad = findPrivate(tracked(), disk);
    expect(bad.map((b) => `${b.file}: ${b.why}`)).toEqual([]);
  });

  it('every allowed fictional file still exists (the list only gets shorter)', () => {
    const files = new Set(tracked());
    expect(ALLOWED.filter((f) => !files.has(f))).toEqual([]);
  });

  it('the rules catch the usual mistakes', () => {
    const fake = { 'data/real.json': { head: '{"app":"pack-generator","tables":{}}' } };
    const read = (f) => fake[f] ?? { size: 10, head: '' };
    const flagged = (f) => findPrivate([f], read).length === 1;
    for (const f of ['ride.gpx', 'x/Activity.FIT', 'liste.xlsx', 'IMG_1.jpg', 'a/b.HEIC', 'Bikepacking_Master.xlsx', 'data/real.json', 'pack-generator-2026-10-04-backup.json', 'tour.tcx']) expect(flagged(f), f).toBe(true);
    for (const f of ['src/app.js', 'public/icons/icon.png', 'docs/x.md', 'package.json']) expect(flagged(f), f).toBe(false);
    expect(findPrivate(['qa/photo.png'], () => ({ size: 3e6 })).length).toBe(1);
    expect(findPrivate([ALLOWED[0]], read)).toEqual([]);
  });
});

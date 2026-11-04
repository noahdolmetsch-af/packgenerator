import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { behindNote, MAX_BEHIND_DAYS } from '../scripts/behind-main.mjs';

describe('behind-main: the hint for a pull request that is a day behind', () => {
  it('says nothing up to one day or when main has nothing new', () => {
    expect(behindNote(0.5, 3)).toBeNull();
    expect(behindNote(MAX_BEHIND_DAYS, 3)).toBeNull();
    expect(behindNote(5, 0)).toBeNull();
    expect(behindNote(NaN, 4)).toBeNull();
  });
  it('names days and merges, and asks for the merge of main', () => {
    expect(behindNote(1.4, 6)).toBe('Dieser PR liegt mehr als einen Tag und 6 Merges hinter main. Main hineinmergen (Claude macht das mit Noahs ok), sonst testet die Prüfung einen alten Stand.');
    expect(behindNote(3.2, 11)).toMatch(/3 Tage und 11 Merges/);
  });
  it('runs in the build job of a pull request and never fails it', () => {
    const deploy = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
    expect(deploy).toMatch(/behind-main\.mjs/);
    expect(deploy).toMatch(/continue-on-error: true\n\s+run: node scripts\/behind-main\.mjs/);
  });
});

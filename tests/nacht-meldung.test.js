import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gruen, titel, text, fromEnv, neueNamen, listenNamen } from '../scripts/nacht-meldung.mjs';

const base = { datum: '25.11.', sha: 'abcdef12', e2e: 'success', gesamttest: 'success', rot: '0', neu: '0', erster: 'no', unvollstaendig: 'no', wackler: '0', rundgang: 'success', rundgangAlterH: '2', run: 'https://example.test/run/1' };

describe('night message: the short line for the morning (Noah 24.11.2026 «a-c alle», c)', () => {
  it('a green night says «alles grün» in the title and in the line', () => {
    expect(gruen(base)).toBe(true);
    expect(titel(base)).toBe('Nacht-Meldung 25.11.: alles grün');
    const t = text(base);
    expect(t).toContain('Nacht 25.11.: alles grün.');
    expect(t).toContain('abcdef12');
    expect(t).toContain('Rundgang: grün.');
    expect(t).toContain('Lauf: https://example.test/run/1');
  });
  it('a red part makes the night red even when no test name is known (timeout, crash)', () => {
    const i = { ...base, e2e: 'failure', rot: '0' };
    expect(gruen(i)).toBe(false);
    expect(titel(i)).toContain('ROT');
    expect(text(i)).toContain('Es fehlen Ergebnisse');
  });
  it('new red and old red are told apart, with singular and plural', () => {
    expect(text({ ...base, gesamttest: 'failure', rot: '3', neu: '1' })).toContain('1 Test neu rot, 2 Tests weiterhin rot.');
    expect(text({ ...base, gesamttest: 'failure', rot: '2', neu: '0' })).toContain('Nichts Neues rot, 2 Tests weiterhin rot.');
    expect(text({ ...base, e2e: 'failure', rot: '4', neu: '', erster: 'yes' })).toContain('4 Tests rot (erster Vergleich');
  });
  it('red tests make it red even when every job says success (a test failed on the retry-free list)', () => {
    expect(gruen({ ...base, rot: '2' })).toBe(false);
  });
  it('wobbly tests and a missing or old walk-through are named', () => {
    expect(text({ ...base, wackler: '2' })).toContain('Wackel-Tests, die an zwei Nächten wackelten: 2.');
    expect(text({ ...base, rundgang: '' })).toContain('Rundgang: kein frischer Lauf.');
    expect(text({ ...base, rundgangAlterH: '40' })).toContain('Rundgang: kein frischer Lauf.');
    expect(text({ ...base, rundgang: 'failure' })).toContain('Rundgang: rot.');
  });
  it('red tests are named: the new ones from the comparison report, at most five, the rest as a count', () => {
    const report = '**Neu rot seit der letzten Nacht (7):**\n\n- a\n- b\n- c\n- d\n- e\n- f\n- … und 1 weitere\n\nWeiterhin rot wie in der letzten Nacht: 2 Tests.\n';
    expect(neueNamen(report)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(neueNamen('**Nichts Neues rot.**\n')).toEqual([]);
    expect(listenNamen('x\n\ny\n')).toEqual(['x', 'y']);
    const t = text({ ...base, e2e: 'failure', rot: '9', neu: '7', namen: neueNamen(report) });
    expect(t).toContain('Rot: a; b; c; d; e; und 1 weitere.');
  });
  it('the comparison step did not run (empty values): green jobs still say green, no crash', () => {
    const i = fromEnv({ DATUM: '25.11.', SHA: 'abcdef1234567', E2E: 'success', GESAMTTEST: 'success' });
    expect(i.sha).toBe('abcdef12');
    expect(titel(i)).toContain('alles grün');
    expect(text(i)).toContain('Rundgang: kein frischer Lauf.');
  });
  it('the command line prints the title and the text from the environment', () => {
    const env = { ...process.env, DATUM: '25.11.', SHA: 'abcdef1234', E2E: 'success', GESAMTTEST: 'success', ROT: '0', RUNDGANG: 'success', RUNDGANG_ALTER_H: '1' };
    expect(execFileSync('node', ['scripts/nacht-meldung.mjs', 'titel'], { env }).toString().trim()).toBe('Nacht-Meldung 25.11.: alles grün');
    expect(execFileSync('node', ['scripts/nacht-meldung.mjs', 'text'], { env }).toString()).toContain('Rundgang: grün.');
  });
});

describe('night message: the workflows', () => {
  const v = readFileSync('.github/workflows/volle-pruefung.yml', 'utf8');
  const n = readFileSync('.github/workflows/nacht.yml', 'utf8');
  const cron = (s) => (s.match(/- cron: '([^']+)'/) || [])[1];
  it('both night runs start in the evening, so the result is there in the morning (the scheduled runs came 7 to 10 hours late)', () => {
    for (const s of [v, n]) {
      const hour = Number(cron(s).split(' ')[1]);
      expect(hour).toBeGreaterThanOrEqual(18);
      expect(hour).toBeLessThanOrEqual(22);
    }
  });
  it('the morning message overwrites one standing issue and sends no comment (no mail)', () => {
    expect(v).toContain('name: Morning message');
    expect(v).toContain('gh issue edit "$num" --title "$title" --body-file meldung.md');
    expect(v).toContain('node scripts/nacht-meldung.mjs titel');
    expect(v).toContain('VERGLEICH_DATEI: vergleich.md');
    expect(v).toContain('ROT_LISTE_DATEI: rot-liste.txt');
    const step = v.slice(v.indexOf('name: Morning message'));
    expect(step).toContain('if: always()');
    expect(step).not.toContain('gh issue comment');
  });
});

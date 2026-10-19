// Paket Q Zusatz 2: a question in everyday words finds the function that answers it.
import { describe, it, expect } from 'vitest';
import { helpAnswers, topicWords, isQuestion } from '../src/lib/clear/help.js';
import DE from '../src/lib/i18n/de/index.js';

const de = (s) => DE[s] ?? s;

describe('help search in everyday words', () => {
  it('leaves the small words out', () => {
    expect(topicWords('Wo stelle ich das Backup-Passwort ein?')).toEqual(['backup', 'passwort']);
  });
  it('knows a question', () => {
    expect(isQuestion('Wo ist das?')).toBe(true);
    expect(isQuestion('wie geht backup passwort')).toBe(true);
    expect(isQuestion('regenjacke')).toBe(false);
  });
  it('finds the backup password', () => {
    expect(helpAnswers('Wo stelle ich das Backup-Passwort ein?', de)[0].featureId).toBe('f.backuplock');
  });
  it('finds the alerts for an avalanche question', () => {
    expect(helpAnswers('Wo sehe ich die Lawinengefahr?', de).map((x) => x.featureId)).toContain('f.alerts');
  });
  it('gives the first step as the line under the title', () => {
    const r = helpAnswers('How do I lock my backup with a password?')[0];
    expect(r.featureId).toBe('f.backuplock');
    expect(r.sub).toBe('Open Me › Data and backup.');
  });
  it('nothing for only small words', () => {
    expect(helpAnswers('wo ist das?')).toEqual([]);
  });
});

// «Passt jetzt: Ideen pro Monat» (Träume und Neuland N8, Noah 27.10.2026 «1-5 a»): ideas per month, own ones too.
import { describe, it, expect } from 'vitest';
import { MONTH_IDEAS, ideasCfg, ideasFor, hiddenFor, addOwn, renameOwn, toggleOwnMonth, deleteOwn, hideStd } from '../src/lib/dreams/monatsideen.js';
import DE from '../src/lib/i18n/de/index.js';

const P = 'test_data_gtp_';

describe('ideas per month', () => {
  it('every month has at least one built-in idea, each in German', () => {
    for (let m = 1; m <= 12; m++) expect(ideasFor(ideasCfg(null), m).length, `month ${m}`).toBeGreaterThan(0);
    for (const x of MONTH_IDEAS) expect(DE[x.text], x.text).toBeTruthy();
  });

  it('cleans the saved setting', () => {
    expect(ideasCfg({ own: [{ id: 'a', text: '  ', months: [1] }, { id: 'b', text: `${P}Idee`, months: [13, 2, 2, '3'] }], hidden: ['fog', 'nope'] })).toEqual({ own: [{ id: 'b', text: `${P}Idee`, months: [2, 3] }], hidden: ['fog'] });
  });

  it('adds, renames, moves and deletes own ideas; hides and shows built-in ones', () => {
    let c = ideasCfg(null);
    c = addOwn(c, `${P}Fondue am See`, [11], 'o1');
    expect(ideasFor(c, 11).map((x) => x.id)).toContain('o1');
    expect(ideasFor(c, 11).at(-1).own).toBe(true);
    c = renameOwn(c, 'o1', `${P}Fondue im Wald`);
    expect(c.own[0].text).toBe(`${P}Fondue im Wald`);
    c = toggleOwnMonth(c, 'o1', 12);
    expect(c.own[0].months).toEqual([11, 12]);
    c = toggleOwnMonth(toggleOwnMonth(c, 'o1', 11), 'o1', 12);
    expect(c.own[0].months).toEqual([12]); // at least one month stays
    c = hideStd(c, 'fog');
    expect(ideasFor(c, 11).map((x) => x.id)).not.toContain('fog');
    expect(hiddenFor(c, 11).map((x) => x.id)).toEqual(['fog']);
    c = hideStd(c, 'fog', false);
    expect(ideasFor(c, 11).map((x) => x.id)).toContain('fog');
    expect(deleteOwn(c, 'o1').own).toEqual([]);
  });
});

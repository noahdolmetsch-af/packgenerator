// Einzelideen «Ich» of the 996 ideas (Noah 25.10.2026): 29 backup folder, 30 go on with a tour,
// 31 shortcut tips, 34 done on every device, 36 suggestions by kind.
import { describe, it, expect } from 'vitest';
import { folderErrorOf, FOLDER_FIX, FOLDER_ERROR } from '../src/lib/folderBackup.js';
import { pausedOf, pauseFor, TOURS } from '../src/lib/tour.js';
import { countClick, hintStateOf, keysOf, HINT_AT } from '../src/lib/nav/keyhint.js';
import { doneTags } from '../src/lib/push/client.js';
import { SUGGEST_AREAS, SUGGEST_KINDS, toggleArea, offOf } from '../src/lib/clear/suggest.js';
import DE from '../src/lib/i18n/de/index.js';

describe('29 backup folder gone', () => {
  it('names the reason from the browser error', () => {
    expect(folderErrorOf({ name: 'NotFoundError' })).toBe('gone');
    expect(folderErrorOf({ name: 'NotAllowedError' })).toBe('rights');
    expect(folderErrorOf({ name: 'QuotaExceededError' })).toBe('full');
    expect(folderErrorOf({ name: 'TypeError' })).toBe('other');
  });
  it('every reason has a headline and a way out in German', () => {
    for (const k of ['gone', 'rights', 'full', 'other']) {
      expect(DE[FOLDER_FIX[k]], k).toBeTruthy();
      expect(DE[FOLDER_ERROR[k]], k).toBeTruthy();
    }
  });
});

describe('30 go on with a tour', () => {
  it('keeps the step of a tour ended in the middle, not the first step nor the end', () => {
    expect(pausedOf({ id: 'app', step: 2, play: true }, 'x')).toEqual({ step: 2, play: true, at: 'x' });
    expect(pausedOf({ id: 'app', step: 0, play: false })).toBeNull();
    const end = TOURS.app.findIndex((s) => s.end);
    if (end > 0) expect(pausedOf({ id: 'app', step: end })).toBeNull();
  });
  it('reads a pause only for a known tour and a real step', () => {
    expect(pauseFor({ app: { step: 2, play: false, at: 'x' } }, 'app')).toEqual({ step: 2, play: false, at: 'x' });
    expect(pauseFor({ app: { step: 99 } }, 'app')).toBeNull();
    expect(pauseFor({ nope: { step: 2 } }, 'nope')).toBeNull();
    expect(pauseFor(null, 'app')).toBeNull();
  });
});

describe('31 shortcuts one at a time', () => {
  it('shows a shortcut once after HINT_AT mouse clicks', () => {
    let s = hintStateOf(null);
    let hint = null;
    for (let i = 0; i < HINT_AT; i++) ({ state: s, hint } = countClick(s, 't'));
    expect(hint).toBe('t');
    expect(countClick(s, 't').hint).toBeNull();
    for (let i = 0; i < HINT_AT * 2; i++) expect(countClick(s, 't').hint).toBeNull();
  });
  it('switched off: no tips', () => {
    expect(countClick({ off: true, n: { t: HINT_AT } }, 't').hint).toBeNull();
  });
  it('the keys to press', () => {
    expect(keysOf('new')).toEqual(['N']);
    expect(keysOf('t')).toEqual(['g', 't']);
  });
});

describe('34 done on every device', () => {
  it('closes shown messages of reminders done or gone, keeps open ones and other kinds', () => {
    const merken = [{ id: 'a', due: '2026-10-27' }, { id: 'b', doneAt: '2026-10-26T08:00:00Z' }];
    const notes = [{ id: 'n1', remind: { at: '2026-10-27T08:00', done: false } }];
    const tags = ['own:a:2026-10-27', 'own:b:2026-10-27', 'own:c:2026-10-27', 'note:n1:2026-10-27T08:00', 'note:n2:2026-10-27T08:00', 'eve:x', 'test'];
    expect(doneTags(tags, { merken, notes })).toEqual(['own:b:2026-10-27', 'own:c:2026-10-27', 'note:n2:2026-10-27T08:00']);
  });
});

describe('36 suggestions by kind', () => {
  it('four kinds that count on every page, each with German words', () => {
    expect(SUGGEST_KINDS.map((a) => a.key)).toEqual(['buy', 'performance', 'impulse', 'tools']);
    for (const a of SUGGEST_AREAS) expect(DE[a.label] && DE[a.text], a.key).toBeTruthy();
  });
  it('a kind switches off and on like an area', () => {
    const v = toggleArea([], 'buy', false);
    expect([...offOf(v)]).toEqual(['buy']);
    expect(toggleArea(v, 'buy', true)).toEqual([]);
  });
});

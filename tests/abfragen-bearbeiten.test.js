// Noah 20.10.2026 «… nicht nur ein- und ausblenden, sondern editieren und löschen, neue pro Gruppe erstellen,
// Gruppen editieren, hinzufügen, löschen»: the rules for changing the questions and their groups (areas),
// and «Überspringen» for one question. Fictional data only.
import { describe, it, expect } from 'vitest';
import {
  AREAS, QUESTIONS, OWN_AREA, configOf, allQuestions, questionsIn, areasOf, areaLabel, renameQuestion, moveToArea, deleteQuestion,
  restoreQuestion, goneQuestions, moveQuestion, renameArea, addArea, deleteArea, moveArea, listChanged, resetList, putOwn, newOwn,
  dueList, settingOf, setOn,
} from '../src/lib/abfragen.js';
import { checkOf } from '../src/lib/flowcheck.js';

const base = () => configOf({ since: '2026-10-01T00:00', q: {}, own: [] });
const first = QUESTIONS[0];

describe('questions of the list', () => {
  it('a changed text shows as typed; empty brings the original back', () => {
    let c = renameQuestion(base(), first.id, 'Wie war die Nacht?');
    const q = allQuestions(c).find((x) => x.id === first.id);
    expect(q.text).toBe('Wie war die Nacht?');
    expect(q.edited).toBe(true);
    c = renameQuestion(c, first.id, '');
    expect(allQuestions(c).find((x) => x.id === first.id).edited).toBeUndefined();
    expect(listChanged(c)).toBe(false);
  });
  it('delete hides it, restore brings it back; the count drops by one', () => {
    const all = allQuestions(base()).length;
    const c = deleteQuestion(base(), first.id);
    expect(allQuestions(c).length).toBe(all - 1);
    expect(goneQuestions(c).map((x) => x.id)).toEqual([first.id]);
    expect(allQuestions(restoreQuestion(c, first.id)).length).toBe(all);
  });
  it('a deleted question is no longer due', () => {
    const c = setOn(base(), first.id, true, '2026-10-01T00:00');
    expect(dueList(c, [], '2026-10-03T21:00').some((d) => d.q.id === first.id)).toBe(true);
    expect(dueList(deleteQuestion(c, first.id), [], '2026-10-03T21:00').some((d) => d.q.id === first.id)).toBe(false);
  });
  it('moves to another group and inside its group (arrows and drag)', () => {
    let c = moveToArea(base(), first.id, 'natur');
    expect(questionsIn(c, 'natur').map((x) => x.id)).toContain(first.id);
    const ids = questionsIn(c, 'natur').map((x) => x.id);
    c = moveQuestion(c, 'natur', ids.length - 1, 0);
    expect(questionsIn(c, 'natur')[0].id).toBe(ids.at(-1));
  });
});

describe('groups', () => {
  it('add an own group and a question in it', () => {
    const r = addArea(base(), 'Arbeit', 1000);
    expect(r.key).toMatch(/^area-/);
    expect(areaLabel(r.cfg, r.key)).toBe('Arbeit');
    const own = newOwn({ text: 'Pause gemacht?', area: r.key, form: { kind: 'yesno' }, every: { kind: 'daily', time: '12:00' } });
    const c = putOwn(r.cfg, own, '2026-10-01T00:00');
    expect(questionsIn(c, r.key).map((x) => x.text)).toEqual(['Pause gemacht?']);
  });
  it('rename a list group, empty back to the standard', () => {
    const c = renameArea(base(), 'spass', 'Freude');
    expect(areaLabel(c, 'spass')).toBe('Freude');
    expect(areaLabel(renameArea(c, 'spass', ''), 'spass')).toBe(AREAS.find((a) => a.key === 'spass').name);
  });
  it('delete a group: the questions go to the chosen group or to «Eigene», none is deleted', () => {
    const n = questionsIn(base(), 'sport').length;
    const all = allQuestions(base()).length;
    let c = deleteArea(base(), 'sport', null);
    expect(areasOf(c).some((a) => a.key === 'sport')).toBe(false);
    expect(questionsIn(c, OWN_AREA).length).toBe(n);
    expect(allQuestions(c).length).toBe(all);
    c = deleteArea(base(), 'sport', 'natur');
    expect(questionsIn(c, 'natur').length).toBe(questionsIn(base(), 'natur').length + n);
    expect(deleteArea(base(), OWN_AREA)).toEqual(base());
  });
  it('an own group deleted: its own questions sit under «Eigene»', () => {
    const r = addArea(base(), 'Arbeit', 2000);
    const c = putOwn(r.cfg, newOwn({ text: 'Pause?', area: r.key }), '2026-10-01T00:00');
    const d = deleteArea(c, r.key, null);
    expect(questionsIn(d, OWN_AREA).map((x) => x.text)).toEqual(['Pause?']);
  });
  it('sort the groups; back to standard keeps own questions and switches', () => {
    let c = moveArea(base(), 0, 2);
    expect(areasOf(c)[2].key).toBe(AREAS[0].key);
    c = setOn(renameQuestion(c, first.id, 'x'), first.id, false, '2026-10-02T00:00');
    const r = resetList(c);
    expect(listChanged(r)).toBe(false);
    expect(settingOf(r, first).on).toBe(false);
  });
  it('the changes survive configOf (they are saved)', () => {
    const r = addArea(renameQuestion(base(), first.id, 'x'), 'Arbeit', 3000);
    const c = configOf(JSON.parse(JSON.stringify(deleteQuestion(r.cfg, QUESTIONS[1].id))));
    expect(c.names[first.id]).toBe('x');
    expect(c.gone).toEqual([QUESTIONS[1].id]);
    expect(c.ownAreas.map((a) => a.name)).toEqual(['Arbeit']);
  });
});

describe('«Überspringen» on the check page', () => {
  it('the skipped questions of the day are kept', () => {
    expect(checkOf({ day: '2026-10-05', skip: ['sleep', 'joy'] }, '2026-10-05').skip).toEqual(['sleep', 'joy']);
    expect(checkOf(null, '2026-10-05').skip).toEqual([]);
  });
});

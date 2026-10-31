// Vorlagen mit Feldern (Noah 27.10.2026 «3b 4a 5a», 19:18 «ca. 20 zur Auswahl»). Fictional data.
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/vorlagenfelder.js';
import { FORMS, FORM_GROUPS, FIELD_TYPES, TYPE_NAME, DEFAULT_ON, formsOf, onOf, chosenForms, setOn, renameForm, removeForm, addForm, moveInGroup, backToStandard, emptyValues, filled, formText, formRecord, addField, renameField, removeField, moveField, setOptions, changeForm } from '../src/lib/notes/forms.js';
import { PLACES } from '../src/lib/eingabe/inputs.js';

const tr = (s) => `[${s}]`;

describe('the Standard templates', () => {
  it('about twenty, with Noah\'s six from the proposal, each with 3 to 7 fields', () => {
    expect(FORMS.length).toBeGreaterThanOrEqual(20);
    for (const k of ['report', 'gearlearn', 'race', 'bikestate', 'daynote', 'idea', 'todo', 'vision', 'challenge', 'strategy', 'training', 'place']) expect(FORMS.some((x) => x.key === k)).toBe(true);
    for (const x of FORMS) {
      expect(x.fields.length).toBeGreaterThanOrEqual(3);
      expect(x.fields.length).toBeLessThanOrEqual(7);
      expect(FORM_GROUPS.some((g) => g.key === x.group)).toBe(true);
      for (const p of x.places) expect(p === 'notes' || p in PLACES).toBe(true);
      for (const y of x.fields) expect(FIELD_TYPES).toContain(y.type);
    }
    expect(new Set(FORMS.map((x) => x.key)).size).toBe(FORMS.length);
    expect(DEFAULT_ON.every((k) => FORMS.some((x) => x.key === k))).toBe(true);
  });
  it('every word has German (names, labels, choices, groups, kinds)', async () => {
    const all = (await import('../src/lib/i18n/de/index.js')).default;
    const words = [...FORM_GROUPS.map((g) => g.name), ...Object.values(TYPE_NAME), ...FORMS.flatMap((x) => [x.name, ...x.fields.flatMap((y) => [y.label, ...(y.options ?? [])])])];
    expect(words.filter((w) => !(w in all))).toEqual([]);
    expect(Object.keys(DE).length).toBeGreaterThan(50);
  });
});

describe('choosing', () => {
  it('nothing stored: the Standard and the default choice; Notizen shows all chosen, a place only those that fit', () => {
    expect(formsOf(null)).toHaveLength(FORMS.length);
    expect(onOf(null)).toEqual(DEFAULT_ON);
    expect(chosenForms(null, 'notes').map((x) => x.key)).toEqual(FORMS.filter((x) => DEFAULT_ON.includes(x.key)).map((x) => x.key));
    expect(chosenForms(null, 'care').map((x) => x.key)).toEqual(['bikestate']);
  });
  it('use and stop using', () => {
    let s = setOn(null, 'vision', true);
    expect(chosenForms(s, 'dreams').map((x) => x.key)).toContain('vision');
    s = setOn(s, 'vision', false);
    expect(onOf(s)).not.toContain('vision');
    expect(s.list).toBeUndefined(); // choosing alone keeps the Standard words
  });
  it('rename, delete, add your own, move inside a group, back to the Standard', () => {
    let s = renameForm(null, 'todo', 'test_data_ Erledigen', tr);
    const todo = formsOf(s).find((x) => x.key === 'todo');
    expect(todo).toMatchObject({ name: 'test_data_ Erledigen', raw: true });
    expect(todo.fields[0]).toMatchObject({ label: '[Task]', raw: true });
    expect(formsOf(s).find((x) => x.key === 'race').name).toBe('[Race note]');
    s = removeForm(s, 'todo', tr);
    expect(formsOf(s).some((x) => x.key === 'todo')).toBe(false);
    expect(onOf(s)).not.toContain('todo');
    const r = addForm(s, 'test_data_ Gym', tr, 'form-x');
    expect(onOf(r.stored)).toContain('form-x');
    expect(formsOf(r.stored).at(-1)).toMatchObject({ key: 'form-x', name: 'test_data_ Gym', fields: [{ type: 'long' }] });
    expect(addForm(s, '  ', tr).key).toBe(null);
    const tour = formsOf(s).filter((x) => x.group === 'tour').map((x) => x.key);
    const moved = moveInGroup(s, 'tour', 0, 1, tr);
    expect(formsOf(moved).filter((x) => x.group === 'tour').map((x) => x.key)).toEqual([tour[1], tour[0], ...tour.slice(2)]);
    expect(formsOf(backToStandard())).toHaveLength(FORMS.length);
  });
  it('fields: add, rename, sort, delete, choices', () => {
    let x = formsOf(null).find((y) => y.key === 'idea');
    x = addField(x, 'test_data_ Kosten', 'number', 'k');
    expect(x.fields.at(-1)).toEqual({ key: 'k', label: 'test_data_ Kosten', type: 'number', raw: true });
    expect(addField(x, ' ', 'text')).toBe(x);
    x = renameField(x, 'what', 'test_data_ Worum');
    x = moveField(x, 0, 1);
    expect(x.fields.map((y) => y.key).slice(0, 2)).toEqual(['why', 'what']);
    x = removeField(x, 'k');
    expect(x.fields.some((y) => y.key === 'k')).toBe(false);
    x = addField(x, 'test_data_ Wo', 'choice', 'c');
    x = setOptions(x, 'c', 'Bern, Basel, ,Chur');
    expect(x.fields.at(-1).options).toEqual(['Bern', 'Basel', 'Chur']);
    const s = changeForm(null, 'idea', () => x, tr);
    expect(formsOf(s).find((y) => y.key === 'idea').fields.at(-1).options).toEqual(['Bern', 'Basel', 'Chur']);
  });
});

describe('filling in', () => {
  const race = FORMS.find((x) => x.key === 'race');
  const bike = FORMS.find((x) => x.key === 'bikestate');
  const todo = FORMS.find((x) => x.key === 'todo');
  it('empty values per kind; nothing filled', () => {
    expect(emptyValues(todo)).toEqual({ task: '', until: '', prio: '', steps: [], note: '' });
    expect(filled(todo, emptyValues(todo))).toBe(false);
    expect(filled(race, { sleep: 0 })).toBe(true);
  });
  it('the note text: name first, filled fields only, units, 1–5, choices, checklists, dates', () => {
    const v = { ...emptyValues(bike), km: 4210, chain: 'due soon', noise: 'test_data_ knackt\nhinten', due: '2026-11-03' };
    expect(formText(bike, v, tr, (d) => `<${d}>`)).toBe('[Bike condition]\n[Odometer]: 4210 km\n[Noises or play]:\ntest_data_ knackt\nhinten\n[Chain]: [due soon]\n[Next service]: <2026-11-03>');
    const w = { ...emptyValues(todo), task: 'test_data_ Schlauch', prio: 'high', steps: [{ text: 'test_data_ a', done: true }, { text: ' ', done: false }, { text: 'test_data_ b', done: false }] };
    expect(formText(todo, w, tr)).toBe('[To-do]\n[Task]: test_data_ Schlauch\n[Priority]: [high]\n[Steps]:\n- [x] test_data_ a\n- [ ] test_data_ b');
    expect(formText(FORMS.find((x) => x.key === 'daynote'), { energy: 4 }, tr)).toBe('[Day note]\n[Energy]: 4/5');
  });
  it('what the note keeps: key, the shown name and the filled values', () => {
    expect(formRecord(race, { ...emptyValues(race), race: 'test_data_ R', sleep: 3 }, tr)).toEqual({ key: 'race', name: '[Race note]', values: { race: 'test_data_ R', sleep: 3 } });
  });
});

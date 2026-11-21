import { describe, it, expect } from 'vitest';
import { wegOf, newGoal, addSteps, saveTemplate, renameTemplate, removeTemplate, setDone, templateOf } from '../src/lib/weg/weg.js';

const goal = () => {
  const g = newGoal({ title: 'Rennen im Mai', kind: 'race', start: '2026-05-15' }, { id: 'g', now: 'x' });
  return addSteps(g, [{ title: 'Plan starten', offset: 90, type: 'own', own: true }, { title: 'Packprobe', due: '2026-05-02', type: 'own', own: true }], { ids: (i) => `s${i}` });
};

describe('weg template «My ways»', () => {
  it('saves the steps with their distance to the start, without ticks, under a name', () => {
    const g = setDone(goal(), 's0', true, '2026-02-20');
    const w = saveTemplate(wegOf(null), g, ' Mein Rennen-Weg ', { id: 't1' });
    expect(w.templates).toEqual([{ id: 't1', name: 'Mein Rennen-Weg', steps: [
      { type: 'own', key: undefined, title: 'Plan starten', offset: 90, note: undefined, own: true },
      { type: 'own', key: undefined, title: 'Packprobe', offset: 13, note: undefined, own: true },
    ] }]);
    expect(JSON.stringify(w.templates)).not.toContain('done');
  });
  it('an empty name or a way without steps saves nothing', () => {
    const w = wegOf(null);
    expect(saveTemplate(w, goal(), '  ')).toBe(w);
    expect(saveTemplate(w, newGoal({ title: 'Leer' }, { id: 'e', now: 'x' }), 'Name')).toBe(w);
  });
  it('can be renamed and deleted; an empty rename is ignored', () => {
    const w = saveTemplate(wegOf(null), goal(), 'A', { id: 't1' });
    expect(renameTemplate(w, 't1', ' B ').templates[0].name).toBe('B');
    expect(renameTemplate(w, 't1', ' ')).toBe(w);
    expect(removeTemplate(w, 't1').templates).toEqual([]);
  });
  it('an older or broken record never breaks the store', () => {
    expect(wegOf({ goals: [] }).templates).toEqual([]);
    expect(wegOf({ templates: [null, { id: 'x' }, { id: 'y', name: ' ', steps: [] }, { id: 'ok', name: 'N', steps: [{ title: 'Z', offset: 'x' }, { nope: 1 }] }] }).templates)
      .toEqual([{ id: 'ok', name: 'N', steps: [{ type: 'own', key: undefined, title: 'Z', offset: null, note: undefined, own: false }] }]);
  });
  it('a saved template makes a new way with the same steps', () => {
    const w = saveTemplate(wegOf(null), goal(), 'A', { id: 't1' });
    const g2 = addSteps(newGoal({ title: 'Neu', start: '2027-05-15' }, { id: 'n', now: 'x' }), w.templates[0].steps, { ids: (i) => `n${i}` });
    expect(g2.steps.map((s) => s.title)).toEqual(['Plan starten', 'Packprobe']);
    expect(templateOf(g2).map((s) => s.offset)).toEqual([90, 13]);
  });
});

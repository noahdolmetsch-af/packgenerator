// Paket N: Ich › Mein Kompass — boxes as groups, ordered entries, goals with steps spread to the day (5a),
// AI steps taken over (5b) and the weekly «Wie läuft's?». Fictional data.
import { describe, it, expect } from 'vitest';
import { STD_BOXES, compassOf, boxName, addBox, renameBox, deleteBox, entriesOf, addEntry, moveEntry, removeEntry, spreadDates, newGoal, addSteps, takeSuggested, goalProgress, checkDue, answerCheck, mondayOf, entryToGoal, stepsPayload, goalsToCheck } from '../src/lib/compass.js';

const P = 'test_data_gtp_';
const today = '2026-10-19';

describe('boxes and entries', () => {
  it('starts with the four Standard boxes', () => {
    const c = compassOf(null);
    expect(c.boxes.map((b) => b.key)).toEqual(STD_BOXES.map((b) => b.key));
    expect(c.ai).toEqual({ off: false, hidden: false });
  });
  it('add, rename, delete a box; entries never get lost', () => {
    let c = addEntry(compassOf(null), 'ideas', `${P} Idee 1`, { id: 'e1', now: 'x' });
    c = addBox(c, `${P} Reisen`, 'own');
    expect(boxName(c.boxes, 'own', (x) => x)).toBe(`${P} Reisen`);
    c = renameBox(c, 'ideas', `${P} Einfälle`);
    expect(boxName(c.boxes, 'ideas', (x) => `T:${x}`)).toBe(`${P} Einfälle`);
    expect(boxName(renameBox(c, 'ideas', '').boxes, 'ideas', (x) => `T:${x}`)).toBe('T:Ideas|compass');
    const gone = deleteBox(c, 'ideas');
    expect(entriesOf(gone, '').map((e) => e.id)).toEqual(['e1']);
    expect(entriesOf(deleteBox(c, 'ideas', 'own'), 'own').map((e) => e.id)).toEqual(['e1']);
  });
  it('orders entries within a box, newest first when added', () => {
    let c = compassOf(null);
    for (const id of ['a', 'b', 'c']) c = addEntry(c, 'ideas', `${P} ${id}`, { id });
    c = addEntry(c, 'remember', `${P} r`, { id: 'r' });
    expect(entriesOf(c, 'ideas').map((e) => e.id)).toEqual(['c', 'b', 'a']);
    c = moveEntry(c, 'ideas', 0, 2);
    expect(entriesOf(c, 'ideas').map((e) => e.id)).toEqual(['b', 'a', 'c']);
    expect(entriesOf(removeEntry(c, 'a'), 'ideas').map((e) => e.id)).toEqual(['b', 'c']);
    expect(addEntry(c, 'ideas', '   ')).toBe(c);
  });
});

describe('goals and steps', () => {
  it('spreads dates evenly up to the day, else weekly', () => {
    expect(spreadDates(3, today, '2026-11-09')).toEqual(['2026-10-26', '2026-11-02', '2026-11-09']);
    expect(spreadDates(2, today, '')).toEqual(['2026-10-26', '2026-11-02']);
  });
  it('typed steps get dates; dated ones keep theirs', () => {
    const g = newGoal({ title: `${P} Alpenbrevet`, due: '2026-11-09' }, { id: 'g', now: 'x' });
    const g2 = addSteps(g, '- Route zeichnen\n2. Training planen\n\nAnmelden', today, { ids: (i) => `s${i}` });
    expect(g2.steps.map((s) => [s.text, s.date])).toEqual([['Route zeichnen', '2026-10-26'], ['Training planen', '2026-11-02'], ['Anmelden', '2026-11-09']]);
    const p = goalProgress({ ...g2, steps: [{ ...g2.steps[0], done: true }, ...g2.steps.slice(1)] }, '2026-11-05');
    expect(p).toMatchObject({ done: 1, total: 3, late: 1 });
    expect(p.next.text).toBe('Training planen');
  });
  it('takes over AI steps the person kept', () => {
    const g = newGoal({ title: `${P} Ziel`, due: '2026-11-09' }, { id: 'g' });
    const out = takeSuggested(g, [{ text: 'A', date: '2026-10-20' }, { text: 'B', date: '2020-01-01' }, { text: 'C', take: false }], today, { ids: (i) => `a${i}` });
    expect(out.steps.map((s) => [s.text, s.date, s.ai])).toEqual([['A', '2026-10-20', true], ['B', '2026-11-09', true]]);
    expect(stepsPayload(out, today)).toEqual({ goal: `${P} Ziel`, due: '2026-11-09', today, have: ['A', 'B'], lang: 'de' });
  });
  it('asks «Wie läuft\'s?» once a week', () => {
    expect(mondayOf('2026-10-25')).toBe('2026-10-19');
    const g = addSteps(newGoal({ title: 'x' }, { id: 'g' }), 'eins', today);
    expect(checkDue(g, today)).toBe(true);
    const a = answerCheck(g, 'good', '2026-10-21', 'now');
    expect(checkDue(a, '2026-10-25')).toBe(false);
    expect(checkDue(a, '2026-10-26')).toBe(true);
    expect(answerCheck(a, 'stuck', '2026-10-22').checks.map((c) => c.how)).toEqual(['stuck']);
    expect(goalsToCheck({ goals: [a, { ...g, id: 'h', done: true }] }, '2026-10-26').map((x) => x.id)).toEqual(['g']);
  });
  it('an idea becomes a goal; the idea is ticked and links to it', () => {
    let c = addEntry(compassOf(null), 'ideas', `${P} Ostsee umrunden`, { id: 'e' });
    c = entryToGoal(c, 'e', { id: 'g1', now: 'x' });
    expect(c.goals[0]).toMatchObject({ id: 'g1', title: `${P} Ostsee umrunden`, from: 'e' });
    expect(c.entries[0]).toMatchObject({ done: true, goalId: 'g1' });
  });
});

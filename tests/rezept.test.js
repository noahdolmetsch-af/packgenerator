// «Erfolgsrezepte» (Persönliches Lernen Idee 5): what worked on a good tour, kept as a recipe.
import { describe, it, expect } from 'vitest';
import { PARTS, TEXT_MAX, timeOf, cleanRecipe, recipesOf, newRecipe, addRecipe, changeRecipe, removeRecipe, recipeOfTrip, fromTrip, linesOf } from '../src/lib/rezept.js';

const NOW = '2026-10-10T10:00:00Z';
const mk = (o = {}) => newRecipe({ id: 'r1', name: 'Jura-Tag', parts: { breakfast: 'Porridge', start: '7:30', food: 'Riegel jede Stunde', pace: '22 km/h' }, now: NOW, ...o });

describe('a recipe', () => {
  it('has four parts', () => {
    expect(PARTS.map((p) => p.key)).toEqual(['breakfast', 'start', 'food', 'pace']);
  });
  it('reads a time as HH:MM only', () => {
    expect(timeOf('7:30')).toBe('07:30');
    expect(timeOf('07.05')).toBe('07:05');
    expect(timeOf('25:00')).toBe('');
    expect(timeOf('soon')).toBe('');
  });
  it('is made whole: trimmed, cut, a clean time', () => {
    const r = mk({ parts: { breakfast: '  Porridge   mit Banane ', start: '7:30', food: 'x'.repeat(300), pace: '' } });
    expect(r).toMatchObject({ id: 'r1', name: 'Jura-Tag', breakfast: 'Porridge mit Banane', start: '07:30', pace: '', createdAt: NOW });
    expect(r.food).toHaveLength(TEXT_MAX);
  });
  it('needs a name and at least one part', () => {
    expect(mk({ name: '' })).toBe(null);
    expect(mk({ parts: {} })).toBe(null);
    expect(mk({ name: '', trip: { id: 't', title: 'Napf' } })).toMatchObject({ name: 'Napf', tripId: 't' });
  });
});

describe('the list', () => {
  it('adds, changes, removes; a change that would empty a recipe is refused', () => {
    let list = addRecipe(null, mk());
    list = addRecipe(list, mk({ id: 'r2', name: 'Napf' }));
    expect(list.map((r) => r.id)).toEqual(['r1', 'r2']);
    list = changeRecipe(list, 'r1', { start: '6:45' });
    expect(list[0].start).toBe('06:45');
    expect(changeRecipe(list, 'r2', { breakfast: '', start: '', food: '', pace: '' })[1]).toMatchObject({ breakfast: 'Porridge' });
    expect(removeRecipe(list, 'r1').map((r) => r.id)).toEqual(['r2']);
    expect(recipesOf('x')).toEqual([]);
    expect(cleanRecipe({ name: 'x' })).toBe(null);
  });
  it('finds the recipe of a trip, the recipes of a tour and the lines', () => {
    const list = [mk({ trip: { id: 't1', title: 'A' } }), mk({ id: 'r2', name: 'B', trip: { id: 't1' }, now: '2026-10-11T10:00:00Z' })];
    expect(recipeOfTrip(list, { recipeId: 'r2' }).name).toBe('B');
    expect(recipeOfTrip(list, {})).toBe(null);
    expect(fromTrip(list, 't1').map((r) => r.id)).toEqual(['r2', 'r1']);
    expect(linesOf(mk({ parts: { start: '8:00', pace: 'ruhig' } })).map((l) => l.key)).toEqual(['start', 'pace']);
  });
});

// «Kochen» step 3 (Noah 28.10.2026 «3a», «4a»): tips of the day, taste, like, no repeat before all have come
import { describe, it, expect } from 'vitest';
import { RECIPES, MEALS } from '../src/lib/kochen/rezepte.js';
import { prefsOf, listFor } from '../src/lib/kochen/kochen.js';
import { TASTE_TAGS, candidates, fits, ensureTips, pickMeal, toggleLike, toggleDislike, setMaxMin, markAsked, tipOf, fitCount } from '../src/lib/kochen/tipps.js';
import DE from '../src/lib/i18n/de/index.js';

const D1 = '2026-10-29';
const D2 = '2026-10-30';

describe('tips of the day', () => {
  it('every meal gets a recipe of that meal, the same all day, new the next day', () => {
    const p = ensureTips(null, D1);
    for (const m of MEALS) expect(tipOf(p, m.key).meals).toContain(m.key);
    expect(ensureTips(p, D1)).toBe(p); // nothing to change
    const q = ensureTips(p, D2);
    expect(q.tips.day).toBe(D2);
    expect(MEALS.some((m) => q.tips.pick[m.key] !== p.tips.pick[m.key])).toBe(true);
  });
  it('the same day and the same choices give the same tip (no clock, no random)', () => {
    expect(ensureTips(null, D1).tips.pick).toEqual(ensureTips(null, D1).tips.pick);
  });
  it('«Another suggestion» never repeats before all fitting recipes came; then the round starts again', () => {
    let p = ensureTips(null, D1);
    const all = candidates('breakfast', p);
    const shown = [p.tips.pick.breakfast];
    for (let i = 1; i < all.length; i++) {
      p = pickMeal(p, 'breakfast', D1);
      shown.push(p.tips.pick.breakfast);
    }
    expect(new Set(shown).size).toBe(all.length);
    p = pickMeal(p, 'breakfast', D1);
    expect(p.tips.seen.breakfast).toEqual([p.tips.pick.breakfast]); // a new round
    expect(p.tips.pick.breakfast).not.toBe(shown.at(-1));
  });
  it('what you don\'t eat and the longest time keep recipes out', () => {
    let p = toggleDislike(toggleDislike(null, 'meat'), 'fish');
    p = setMaxMin(p, 10);
    for (const m of MEALS) for (const r of candidates(m.key, p)) {
      expect(r.min).toBeLessThanOrEqual(10);
      expect(r.ingredients.some((i) => i.tags.some((t) => ['meat', 'fish'].includes(t)))).toBe(false);
    }
    expect(fits(RECIPES.find((r) => r.ingredients.some((i) => i.tags.includes('fish'))), p)).toBe(false);
    p = ensureTips(p, D1);
    for (const m of MEALS) expect(fits(tipOf(p, m.key), p)).toBe(true);
    expect(toggleDislike(p, 'meat').dislikes).toEqual(['fish']);
    expect(fitCount(setMaxMin(null, 1))).toBe(0);
  });
  it('a hidden tip is replaced at once; a recipe with «Never show again» does not come back', () => {
    let p = ensureTips(null, D1);
    const id = p.tips.pick.lunch;
    p = ensureTips({ ...p, hidden: [id] }, D1);
    expect(p.tips.pick.lunch).not.toBe(id);
    expect(candidates('lunch', p).some((r) => r.id === id)).toBe(false);
  });
  it('nothing fits: no tip, no crash', () => {
    const p = ensureTips(setMaxMin(null, 1), D1);
    for (const m of MEALS) expect(tipOf(p, m.key)).toBeNull();
  });
  it('liked recipes are suggested first, and «Liked» lists them', () => {
    const lunch = candidates('lunch', null);
    const fav = lunch[5].id;
    let p = toggleLike(null, fav);
    p = pickMeal(p, 'lunch', D1);
    expect(p.tips.pick.lunch).toBe(fav);
    expect(listFor('liked', { prefs: p }).map((r) => r.id)).toEqual([fav]);
    expect(toggleLike(p, fav).liked).toEqual([]);
  });
  it('the short start is remembered; bad values are cleaned', () => {
    expect(markAsked(null).asked).toBe(true);
    expect(prefsOf({ maxMin: -3, liked: ['a', 1], dislikes: 'x', tips: { pick: { lunch: 5 } } })).toMatchObject({ maxMin: 0, liked: ['a'], dislikes: [], tips: { pick: {} } });
  });
  it('the texts of the taste have a German word', () => {
    for (const x of TASTE_TAGS) expect(DE[x.label], x.label).toBeTruthy();
    for (const r of RECIPES) for (const i of r.ingredients) for (const tag of i.tags) expect(TASTE_TAGS.some((x) => x.tag === tag), tag).toBe(true);
  });
});

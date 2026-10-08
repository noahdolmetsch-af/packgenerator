/**
 * v0.32.0 (finding 5, stage 1: words and screens): "Does the item come along?" in two words.
 *
 *   - Building block (Baustein), in 3 kinds: always with you (the block "Standard"), with the night
 *     (they come by themselves), to add (one tap when you make a trip: Rain, Light, your own).
 *   - The place "On me" (Am Körper) replaces the word "Worn" (Getragen).
 *
 * Stage 1 changes no data: the buttons in the item dialog still write the old fields, exactly as
 * the old role field and the tick "On every trip" did, so every packing list stays the same
 * (tests/stage1.test.js):
 *   Standard on  → role 'standard' + always (on the place On me: role 'worn' + always)
 *   Standard off → no role, not always
 *   On me        → role 'worn' (the old "Worn"; the default bag is not touched)
 *   a bag again  → role 'standard' (it stays in the standard set, as "Worn" was)
 * "Optional" stays a mark from the debrief ("stays at home"), shown without the word role.
 *
 * Pure functions only (no database, no screen), so they are easy to test.
 */
import { CONTEXT_SETS } from '../context.js';

/** What the dialog shows for a draft or an item: { standard, body, optional }. */
export function comesOf(d) {
  const role = d?.role || '';
  return { standard: role === 'worn' || role === 'standard' || !!d?.always, body: role === 'worn', optional: role === 'optional' };
}

/** Is the item in the block "Standard" (worn, standard pack or "on every trip")? */
export const inStandard = (item) => comesOf(item).standard;

/** The fields the "Standard" button writes. */
export function setStandard(d, on) {
  if (!on) return { role: '', always: false };
  return { role: comesOf(d).body ? 'worn' : 'standard', always: true };
}

/** The fields the place buttons write: 'body' (On me) or 'bag' (its default bag). */
export function setPlace(d, place) {
  if (place === 'body') return { role: 'worn' };
  return { role: d?.role === 'worn' ? 'standard' : d?.role || '' };
}

/** "Take along again": the mark "stays at home" goes, nothing else changes. */
export const clearOptional = (d) => ({ role: d?.role === 'optional' ? '' : d?.role || '' });

/** The 3 kinds of building blocks: 'always' (Standard), 'night' (come with the night) or 'add'. */
export const blockKind = (key) => (key === 'standard' ? 'always' : CONTEXT_SETS.includes(key) ? 'night' : 'add');

/** The items of the block "Standard", in the order given. */
export const standardItems = (items) => items.filter(inStandard);

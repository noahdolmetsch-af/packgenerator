/**
 * v0.32.0 (finding 5, stage 1): "Does the item come along?" in two words.
 *
 *   - Building block (Baustein), in 3 kinds: always with you (the block "Standard"), with the night
 *     (they come by themselves), to add (one tap when you make a trip: Rain, Light, your own).
 *   - The place "On me" (Am Körper) replaces the word "Worn" (Getragen).
 *
 * v0.33.0 (stage 2): the data moved too (blocks2026.js). Standard is the key 'standard' on
 * item.sets, "stays at home" is item.leaveHome. Data cleanup 14.10.2026 (Noah 3a): the old fields
 * role 'standard' / 'optional' and always are no longer written (cleanup.js removed them):
 *   Standard on  → sets + 'standard' (on the place On me: role 'worn' stays)
 *   Standard off → sets without 'standard', no role
 *   On me        → role 'worn' (the old "Worn"; the default bag is not touched)
 *   a bag again  → no role, sets + 'standard' (it stays in Standard, as "Worn" was)
 * "On me" keeps its own logic (role 'worn', blocks2026.js isWorn) and shows as part of Standard.
 *
 * Pure functions only (no database, no screen), so they are easy to test.
 */
import { NIGHT_BLOCKS, RIDE_BLOCKS } from '../context.js';
import { STANDARD, inStandard, isWorn, leaveHome } from '../blocks2026.js';
import { isSituation, MORE_BLOCKS, STAGE_BLOCKS } from '../situation.js';

const withStd = (d) => (d?.sets?.includes(STANDARD) ? [...d.sets] : [...(d?.sets ?? []), STANDARD]);
const withoutStd = (d) => (d?.sets ?? []).filter((k) => k !== STANDARD);
// An item from before the cleanup may still say "On every trip": off, so it does not count as Standard.
const offAlways = (d) => (d?.always ? { always: false } : {});

/** What the dialog shows for a draft or an item: { standard, body, optional }. On me counts as Standard. */
export function comesOf(d) {
  return { standard: isWorn(d) || inStandard(d), body: isWorn(d), optional: leaveHome(d) };
}

/** The fields the "Standard" button writes. */
export function setStandard(d, on) {
  if (!on) return { role: '', sets: withoutStd(d), ...offAlways(d) };
  return { role: isWorn(d) ? 'worn' : '', sets: withStd(d), ...(leaveHome(d) ? { leaveHome: false } : {}) };
}

/** The fields the place buttons write: 'body' (On me) or 'bag' (its default bag). */
export function setPlace(d, place) {
  if (place === 'body') return { role: 'worn', ...(leaveHome(d) ? { leaveHome: false } : {}) };
  if (isWorn(d)) return { role: '', sets: withStd(d) };
  return { role: d?.role || '' };
}

/** "Take along again": the mark "stays at home" goes, nothing else changes. */
export const clearOptional = (d) => ({ role: d?.role === 'optional' ? '' : d?.role || '', leaveHome: false });

/**
 * "Leave at home" (Gear, Dead weight) and the debrief's "leave at home": out of Standard and
 * marked.
 */
export const leaveHomeFields = (d) => ({ role: '', leaveHome: true, sets: withoutStd(d), ...offAlways(d) });

/**
 * The kinds of building blocks: 'always' (Standard), 'night' (come with the night), 'ride' (v0.66.0:
 * suggested on the ride, deselectable per trip: repair, charge, lights, race) or 'add'.
 */
// SN3+: the seven blocks «je nach Lage» (situation.js) are their own kind. v0.154.0: the nine new blocks with a
// rule too ('situation'); a stage (Kälte: Hände und Füsse …) is the kind 'stage' (shown inside its parent).
export const blockKind = (key) => (key === STANDARD ? 'always' : NIGHT_BLOCKS.includes(key) ? 'night' : RIDE_BLOCKS.includes(key) ? 'ride' : isSituation(key) || MORE_BLOCKS.includes(key) ? 'situation' : STAGE_BLOCKS.includes(key) ? 'stage' : 'add');

/** The items of the block "Standard" (with the ones On me), in the order given. */
export const standardItems = (items) => items.filter((i) => comesOf(i).standard);

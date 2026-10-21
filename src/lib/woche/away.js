/**
 * «Woche planen» › Ferien und Touren: the kinds of time away (English source, German through t()).
 * «Alle Daten anpassbar» (Noah 21.10.2026 «4a»): renamed, own, hidden and deleted ones come from «Listen
 * und Typen» (applists.js 'awayTypes'); an unknown kind counts as «Bike trip».
 */
import { hasId, nameOf, offered } from '../applists.js';

export const AWAY_TYPES = ['bike', 'off', 'ski'];
export const AWAY_NAMES = { bike: 'Bike trip|away', off: 'Holidays without a bike', ski: 'Ski tour|away' };
/** The Standard as list entries. */
export const AWAY_STD = AWAY_TYPES.map((id) => ({ id, name: AWAY_NAMES[id] }));
/** Is this a kind the person has (Standard or own)? */
export const isAwayType = (id) => typeof id === 'string' && (AWAY_TYPES.includes(id) || hasId('awayTypes', AWAY_STD, id));
/** The name of a kind for the page. */
export const awayName = (id, tr) => nameOf('awayTypes', AWAY_STD, id, tr, tr(AWAY_NAMES.bike));
/** The kinds offered for a new entry (keep: the kind of the entry being changed). */
export const awayOffered = (keep = null) => offered('awayTypes', AWAY_STD, keep);

/** The words of the markers (English keys for t(), German in i18n/de/marker.js). */
import { t } from '../i18n.svelte.js';
import { dayShort } from './words.js';
import { daysOf } from './marker.js';

const KIND_TEXT = { sick: 'Sick', injured: 'Injured', stress: 'Stress|marker', holiday: 'Holiday' };
/** The name of a kind, translated. */
export const kindText = (k) => t(KIND_TEXT[k] ?? 'Marker');

/** «5 Oct» for a day, «5 Oct – 9 Oct» for a stretch. */
export const periodText = (m) => (m.from === m.to ? dayShort(m.from) : `${dayShort(m.from)} – ${dayShort(m.to)}`);

/** «1 day» / «5 days» is the caller's job with tn(); this gives the number. */
export const lengthOf = (m) => daysOf(m);

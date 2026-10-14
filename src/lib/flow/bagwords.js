/** «Sporttasche»: the names of a bag and of a thing in the current language (lib/flowbag.js). */
import { lang } from '../i18n.svelte.js';

const de = () => lang.v === 'de';
export const bagName = (b) => (b ? (de() && b.nameDe ? b.nameDe : b.name) : '');
export const thingName = (x) => (x ? (de() && x.nameDe ? x.nameDe : x.name) : '');
export const thingNote = (x) => (x ? (de() && x.noteDe ? x.noteDe : x.note) || '' : '');

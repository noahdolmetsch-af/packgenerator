/**
 * P8 «Automatischer Abgleich»: how an entry is named in the question «Changed on both devices», and
 * which of its fields differ (shown short: no photo data, no long texts).
 */
import { t, locale } from '../i18n.svelte.js';

const KINDS = {
  items: 'Gear item', kits: 'Template', trips: 'Trip', debriefs: 'Debrief', learnings: 'Learning', events: 'Event',
  maintenance: 'Maintenance task', bikes: 'Bike', containers: 'Bag', weightChecks: 'Weight check', settings: 'Setting',
  visits: 'Workshop visit', photos: 'Photo', notes: 'Note', rides: 'Ride', flowActs: 'Flow activity', flowLog: 'Flow tick',
  flowChecks: 'Daily check', kmBook: 'Km entry', flowSessions: 'Session', flowTemplates: 'Timer template', flowStars: 'Star',
  abAnswers: 'Answer', timerLog: 'Timer', activities: 'Training', docs: 'Document',
};
export const kindOf = (table) => t(KINDS[table] ?? 'Entry');

/*
 * Settings by name (Noah 21.10.2026: the question showed «strava.last» and «Wert: geändert»): a setting
 * the person knows is shown with its name; any other one as «Other app setting», never the raw key.
 */
const SETTINGS = {
  homePlace: 'Home place', riderWeightG: 'Your weight', userName: 'Your name', rearLimitPct: 'Rear load limit',
  sets: 'Blocks|setting', templates: 'Templates', strava: 'Strava connection', trello: 'Trello connection', health: 'Fitbit connection',
  agenda: 'Calendar connection', 'google.own': 'Own values', homeLayout: 'Layout of Heute', homeWall: 'Tiles on Heute',
  homeGoals: 'Goals on Heute', merken: 'Remember list', 'merken.lists': 'Lists', pace: 'Your pace', challenges: 'Challenges',
  flowQuestions: 'Check questions', 'sk.off': 'Check questions switched off', tagebuch: 'Diary', compass: 'Compass',
  yearGoals: 'Year goals', listOverrides: 'Lists and types', inspectList: 'Inspection list', lake: 'Lake temperature',
  abfragen: 'Check-ins', 'race-view': 'Race page view', zusatzfragen: 'Extra questions', 'flow.fixed': 'Fixed activities',
  'flow.bags': 'Sports bags', 'flow.bagPack': 'Sports bag packing', seriesRest: 'Rest days',
};
export const settingName = (key) => t(SETTINGS[key] ?? 'Other app setting');

/** A readable name of a record. */
export function titleOf(v, id, table) {
  if (table === 'settings') return settingName(v?.key ?? id);
  const s = v?.name ?? v?.title ?? v?.label ?? v?.shop ?? (typeof v?.text === 'string' ? v.text : null) ?? v?.key ?? v?.day ?? id;
  const str = String(s ?? '');
  return str.length > 60 ? `${str.slice(0, 57)}…` : str;
}

const FIELDS = {
  name: 'Name', title: 'Title', weightG: 'Weight', qty: 'Number', note: 'Note', notes: 'Notes', status: 'Status', date: 'Date',
  startDate: 'Start', endDate: 'End', text: 'Text', km: 'km', value: 'Value', brand: 'Brand', model: 'Model', category: 'Category',
  ownership: 'Owned', packed: 'Packed', items: 'Entries', bikeId: 'Bike', tripId: 'Trip', totalChf: 'Amount', shop: 'Shop',
  photos: 'Photos', data: 'Photo', at: 'Time', amount: 'Amount', minutes: 'Minutes',
};

function short(key, v) {
  if (v === undefined || v === null || v === '') return '–';
  if (typeof v === 'boolean') return v ? t('Yes') : t('No');
  if (typeof v === 'number') return key === 'weightG' ? `${v.toLocaleString(locale())} g` : v.toLocaleString(locale());
  if (typeof v === 'string') {
    if (v.startsWith('data:')) return t('Photo');
    return v.length > 40 ? `${v.slice(0, 37)}…` : v;
  }
  if (Array.isArray(v)) return t('{n} entries', { n: v.length });
  return t('changed|sync');
}

/** The fields that differ: [{ key, label, mine, theirs }], at most `max`; the rest as one «More details» row. */
export function differences(mine, theirs, max = 4, table = '') {
  // a setting: its value is what differs; a plain value is shown as it is, an object by its fields
  if (table === 'settings') {
    const va = mine?.value;
    const vb = theirs?.value;
    const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    const as = /WeightG$/.test(String(mine?.key ?? theirs?.key ?? '')) ? 'weightG' : 'value'; // grams with «g»
    if (!obj(va) && !obj(vb)) return [{ key: 'value', label: t('Value'), mine: short(as, va), theirs: short(as, vb) }];
    return differences(obj(va) ? va : {}, obj(vb) ? vb : {}, max);
  }
  const a = mine ?? {};
  const b = theirs ?? {};
  const empty = (v) => v === undefined || v === null || v === '';
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !(empty(a[k]) && empty(b[k])) && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  const named = keys.filter((k) => FIELDS[k]);
  const rows = named.slice(0, max).map((k) => ({ key: k, label: t(FIELDS[k]), mine: short(k, a[k]), theirs: short(k, b[k]) }));
  const rest = keys.length - rows.length;
  if (rest > 0) rows.push({ key: '…', label: t('More details'), mine: t('{n} other', { n: rest }), theirs: t('{n} other', { n: rest }) });
  return rows;
}

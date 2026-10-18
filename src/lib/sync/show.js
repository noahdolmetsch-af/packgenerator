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

/** A readable name of a record. */
export function titleOf(v, id) {
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
export function differences(mine, theirs, max = 4) {
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

/**
 * Paket H, answer 3: the columns of gear items in the shared table (ui/ListTable.svelte), for Material
 * and Vorrat. A renamed item drops its built-in German name, like «Rename» in the item window.
 */
import { t, nameOf } from '../i18n.svelte.js';
import { choosable, BAGS, OWNERSHIP } from '../gear.js';

export const nameCol = () => ({
  key: 'name',
  label: t('Name'),
  type: 'text',
  required: true,
  bulk: false,
  get: (i) => nameOf(i),
  set: (i, v) => {
    const { nameDe, ...rest } = i;
    return { ...rest, name: v };
  },
});

const grams = (v) => (v == null ? null : Math.round(v));

/** The gear columns: name, category, status, weight, amount, default bag, where at home, best before, stock. */
export const gearCols = () => [
  nameCol(),
  { key: 'category', label: t('Category'), type: 'select', empty: false, options: choosable().map((c) => ({ key: c.key, name: t(c.name) })) },
  { key: 'ownership', label: t('Status'), type: 'select', empty: false, options: Object.entries(OWNERSHIP).map(([key, name]) => ({ key, name: t(name) })) },
  { key: 'weightG', label: t('Weight (g)'), type: 'number', width: '7em', set: (i, v) => ({ ...i, weightG: grams(v), weightStatus: v == null ? 'missing' : 'measured' }) },
  { key: 'qty', label: t('Quantity'), type: 'number', width: '6em', set: (i, v) => ({ ...i, qty: Math.max(1, Math.round(v ?? 1)) }) },
  { key: 'defaultBag', label: t('Default bag'), type: 'select', options: BAGS.map((b) => ({ key: b.key, name: t(b.name) })) },
  { key: 'brand', label: t('Brand'), type: 'text' },
  { key: 'homeSpot', label: t('Where at home'), type: 'text' },
  { key: 'expires', label: t('Best before'), type: 'date' },
  { key: 'stock', label: t('At home'), type: 'number', width: '6em' },
];

/** Writes table rows back (one transaction), stamped as changed now. */
export const saveItemRows = (db, pairs) => db.items.bulkPut(pairs.map((p) => ({ ...p.after, updatedAt: new Date().toISOString() })));

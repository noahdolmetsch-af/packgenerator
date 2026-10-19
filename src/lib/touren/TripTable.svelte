<script>
  /**
   * Paket H «3a und b» (Noah 19.10.2026 «für alle Listen auf der gesamten App»): every trip packed in
   * the app in the shared table (ui/ListTable): name, start, days, kind of trip and the note change
   * right in the cells; tick several to change one field for all of them or to delete them (one Undo
   * brings all back; their packing lists go with them, like «Delete» in the trip).
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { TRIP_DOMAINS, domainOf } from '../domains.js';
  import { openTrip } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import ListTable from '../ui/ListTable.svelte';

  let { trips = [], onclose } = $props();

  const rows = $derived([...trips].filter((x) => !x.idea).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))));
  const cols = $derived([
    { key: 'title', label: t('Name'), type: 'text', required: true, bulk: false },
    { key: 'startDate', label: t('Start'), type: 'date' },
    { key: 'days', label: t('Days'), type: 'number', width: '6em', set: (r, v) => ({ ...r, days: Math.max(1, Math.round(v ?? 1)) }) },
    { key: 'domain', label: t('Kind of trip'), type: 'select', empty: false, get: (r) => domainOf(r), options: TRIP_DOMAINS.map((d) => ({ key: d.key, name: t(d.sportName ?? d.name) })), readOnly: true },
    { key: 'bike', label: t('Bike'), type: 'text', readOnly: true },
    { key: 'note', label: t('Note'), type: 'text' },
  ]);
  const save = (pairs) => db.trips.bulkPut(pairs.map((p) => ({ ...p.after, ...touched({}) })));
  async function del(list) {
    const ids = list.map((r) => r.id);
    return db.transaction('rw', db.trips, async () => {
      const before = (await db.trips.bulkGet(ids)).filter(Boolean);
      await db.trips.bulkDelete(ids);
      return before;
    });
  }
  const restore = (before) => db.trips.bulkPut(before);
</script>

<ListTable {rows} {cols} nameOf={(r) => r.title || t('Your trip')} onsave={save} ondelete={del} onrestore={restore} onopen={(r) => (openTrip(r.id), (location.hash = '#/pack'))} label={t('Trips|place')} {onclose} />

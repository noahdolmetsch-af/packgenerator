<script>
  import { readLite } from '../actlite.js';
  /**
   * «Dauer nachtragen» (Noah 21.11.2026, Sportjahr S12): one fold in «Meine Aktivitäten», next to «Übliche Dauer». It lists the ticks that
   * have no measured time (the evaluation counts the usual duration there and says «ca.»). One tap on 15, 30, 45 or 60 min, or an own
   * number, writes the real duration into the tick; from then on it counts as measured. «Undo» takes it back. Nothing else changes.
   * Tour days (Noah 21.11.2026 22:47): a day of a ski or hiking trip with no Strava activity and no minutes is listed too, «Tour …, how long?»;
   * no estimate until you tap (tourtage.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { einheiten } from './einheiten.js';
  import { watchMinutesFor } from './fitbittraining.js';
  import { USUAL_KEY, usualMap } from './usualmin.js';
  import { TICKS_KEY, prefsOf } from '../stravaticks.js';
  import { dueRows, writeDuration, restoreTick, NACHTRAG_CHIPS } from './dauernachtragen.js';
  import { tourRows, writeTourDay, removeTourDay, TOUR_CHIPS } from './tourtage.js';
  import { localDay } from '../localday.js';
  import { actName } from './ui.svelte.js';
  import { dayShort } from './words.js';
  import ActIcon from './ActIcon.svelte';
  import MinInput from './MinInput.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  const SHOWN = 6;
  const q = liveQuery(async () => {
    const [log, activities, acts, usual, ticks, trips, health] = await Promise.all([db.flowLog.toArray(), readLite(db, (T) => T.toArray()), db.flowActs.toArray(), db.settings.get(USUAL_KEY), db.settings.get(TICKS_KEY), db.trips ? db.trips.toArray() : [], db.healthDays ? db.healthDays.toArray() : []]);
    const map = prefsOf(ticks?.value).map;
    const ticksDue = dueRows(einheiten({ log, activities, acts, usual: usualMap(usual?.value), map }), log);
    const tours = tourRows({ trips, acts, log, activities, map, today: localDay() }).map((r) => ({ id: r.id, day: r.day, actId: r.actId, tour: r.title || t('Tour') }));
    const rows = [...ticksDue, ...tours].sort((a, b) => b.day.localeCompare(a.day));
    return { log, acts, rows, watch: watchMinutesFor({ rows: ticksDue, health, acts }) };
  });
  const d = $derived($q);
  const actOf = $derived(new Map((d?.acts ?? []).map((a) => [a.id, a])));
  let all = $state(false);
  const rows = $derived(d?.rows ?? []);
  const shown = $derived(all ? rows : rows.slice(0, SHOWN));

  async function set(r, min) {
    if (r.tour != null) {
      const e = await writeTourDay(db, r, min);
      if (!e) return;
      const a = actOf.get(r.actId);
      offerDone(t('«{name}»: {n} min saved.', { name: a ? actName(a) : r.actId, n: e.min }), () => removeTourDay(db, e.id));
      return;
    }
    const before = await writeDuration(db, r.id, min);
    if (!before) return;
    const a = actOf.get(r.actId);
    offerDone(t('«{name}»: {n} min saved.', { name: a ? actName(a) : r.actId, n: min }), () => restoreTick(db, before));
  }
</script>

{#if rows.length}
  <details class="card fold nachtrag" data-nachtragen>
    <summary><span>{t('Add the duration')}</span><small>{tn(rows.length, '{n} entry without a measured time', '{n} entries without a measured time')}</small></summary>
    <p class="hint">{t('These entries have no minutes. Ticks count with the usual duration and are marked «ca.»; days of a tour without a time count nothing until you say. Tap the real length and it counts as measured. Where the watch knows a workout of that day, its length is offered, never taken by itself.')}</p>
    <ul class="ul">
      {#each shown as r (r.id)}
        {@const a = actOf.get(r.actId)}
        <li data-nachtrag={r.id}>
          <span class="who">
            {#if a}<ActIcon icon={a.icon} ring={a.ring} />{/if}
            <span class="nm">{a ? actName(a) : r.actId}</span>
            {#if r.tour != null}
              <small>{t('Tour «{name}» on {date}: how long?', { name: r.tour, date: dayShort(r.day) })}</small>
            {:else}
              <small>{dayShort(r.day)} · {t('ca. {n} min', { n: r.ca })}</small>
            {/if}
          </span>
          <span class="chips">
            {#if d.watch.get(r.id)}{@const w = d.watch.get(r.id)}
              <button type="button" class="chip hi" data-nachtrag-watch={w.min} onclick={() => set(r, w.min)}>{t('Take {n} min from the watch', { n: w.min })}</button>
            {/if}
            {#each r.tour != null ? TOUR_CHIPS : NACHTRAG_CHIPS as m (m)}
              <button type="button" class="chip" data-nachtrag-min={m} onclick={() => set(r, m)}>{t('{n} min', { n: m })}</button>
            {/each}
          </span>
          <MinInput value={null} chips={r.tour != null ? TOUR_CHIPS : NACHTRAG_CHIPS} onset={(m) => set(r, m)} id={`nachtrag-${r.id}`} />
        </li>
      {/each}
    </ul>
    {#if rows.length > SHOWN}
      <button type="button" class="btn btn-link" onclick={() => (all = !all)} data-nachtrag-more>{all ? t('Show fewer') : t('Show all {n}', { n: rows.length })}</button>
    {/if}
  </details>
{/if}

<style>
  .nachtrag summary small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ul li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .ul li:first-child {
    border-top: 0;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .who small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nm {
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>

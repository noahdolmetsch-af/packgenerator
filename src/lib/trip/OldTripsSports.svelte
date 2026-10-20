<script>
  /**
   * SA3 (Noah 14.10.2026 «SA1–SA3 freigegeben», «4b»): once, over «Touren»: a sport for every old bike
   * trip, suggested by bike and days (sports.js suggestSport: more days → Bikepacking, a gravel bike →
   * Gravel, a mountain bike → Cross Country, else Fahrrad). Every row can be changed; nothing changes
   * without «Alle übernehmen». «Später» closes it until the app is opened again; closing with ✕ or back
   * only closes it (the band on «Touren» stays).
   */
  import { backClose } from '../ui/backclose.js';
  import { t, tn, dateOf } from '../i18n.svelte.js';
  import { Bike, Tent, Info, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { SPORT, BIKE_SPORTS, OLD_TRIPS_DONE } from '../sports.js';
  import '../bikes/velo-dlg.css';
  import '../sports.css';

  /** rows: [{ trip, sport }] (oldTripSuggestions); bikes for their names. onclose() after either button. */
  let { rows, bikes = [], onclose } = $props();
  // svelte-ignore state_referenced_locally
  let picked = $state(Object.fromEntries(rows.map((r) => [r.trip.id, r.sport])));
  // svelte-ignore state_referenced_locally
  const sug = Object.fromEntries(rows.map((r) => [r.trip.id, r.sport]));
  const nDay = $derived(rows.filter((r) => (Number(r.trip.days) || 1) === 1).length);
  const bikeName = (id) => bikes.find((b) => b.id === id)?.name ?? '';
  let dialog;
  let busy = $state(false);
  let wasLater = false;
  $effect(() => {
    dialog.showModal();
  });
  const later = () => ((wasLater = true), dialog.close());
  async function takeAll() {
    busy = true;
    await db.transaction('rw', db.trips, db.settings, async () => {
      for (const r of rows) await db.trips.update(r.trip.id, touched({ sport: picked[r.trip.id] }));
      await db.settings.put({ key: OLD_TRIPS_DONE, value: true });
    });
    dialog.close();
  }
</script>

<dialog class="sheet vdlg sa-old" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.(wasLater)} aria-labelledby="sa-old-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="sa-old-h">{t('A sport for your old trips')}</h2>
      <p class="vd-sub">{tn(rows.length, 'New: every trip has a sport. Your {n} old bike trip has none yet. Our suggestion:', 'New: every trip has a sport. Your {n} old bike trips have none yet. Our suggestion:')}</p>
    </div>
  </div>
  <p class="sa-rule">
    <span><Bike size={15} aria-hidden="true" />{t('1 day → by the bike')} ({nDay})</span>
    <span><Tent size={15} aria-hidden="true" />{t('more days → Bikepacking')} ({rows.length - nDay})</span>
  </p>
  <ul class="sa-list">
    {#each rows as r (r.trip.id)}
      {@const own = picked[r.trip.id] !== sug[r.trip.id]}
      <li class="sa-row">
        <span class="sa-t"><b>{r.trip.title}</b><small class="num">{[dateOf(r.trip.startDate), tn(Number(r.trip.days) || 1, '{n} day', '{n} days'), bikeName(r.trip.bikeId)].filter(Boolean).join(' · ')}{#if own}{' '}· <em>{t('changed by you')}</em>{/if}</small></span>
        <select class="sa-pick" class:own bind:value={picked[r.trip.id]} aria-label={t('Sport for {name}', { name: r.trip.title })}>
          {#each BIKE_SPORTS as k (k)}<option value={k}>{t(SPORT[k].name)}</option>{/each}
        </select>
      </li>
    {/each}
  </ul>
  <p class="sa-note"><Info size={15} aria-hidden="true" /><span>{t('Nothing changes without your tap. Trips without a bike stay as they are.')}</span></p>
  <div class="vd-foot">
    <button type="button" class="btn btn-link" onclick={later}>{t('Later')}</button>
    <button type="button" class="btn hi" disabled={busy} onclick={takeAll}><Check size={17} aria-hidden="true" />{t('Take all')}</button>
  </div>
</dialog>

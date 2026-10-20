<script>
  /**
   * Paket U3 «Live-Karte», after the ride (Noah 19.10.2026): the summary of the closed recording (km, Hm when
   * the route has a profile, riding against stopped time), «Debrief» with these values («3a») and the km for
   * the bike care («4a», not twice when a Strava/Garmin ride of the same bike overlaps). Everything is a
   * suggestion: nothing is written without a tap, and the bike km come with Undo.
   * Props: ride (stopRecording()'s row), trip (or null for a free ride).
   */
  import { liveQuery } from 'dexie';
  import { ClipboardCheck, Bike, Check, Share2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { deliver } from '../tools/tools.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { saveFailed } from '../ui/ask.js';
  import { sortBikes } from '../bikes.js';
  import { makeEntry } from '../kmbook.js';
  import { addEntries, deleteEntries, ensureKmBook } from '../kmbookdb.js';
  import { PACE_KEY, paceOf } from '../pace.js';
  import { plannedFor } from '../gpx.js';
  import { kmIntoDebrief } from '../ridelist.js';
  import SensorCurve from './SensorCurve.svelte';
  import { rideSummary, rideRowOf, bikeKmPlan, bikeEntryOf, durText } from './after.js';

  let { ride, trip = null } = $props();

  // svelte-ignore state_referenced_locally
  const rowQ = liveQuery(() => db.tracks.get(ride.id));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const actsQ = liveQuery(() => db.activities.toArray());
  const bookQ = liveQuery(() => db.kmBook.toArray());

  const cur = $derived($rowQ ?? ride);
  const sum = $derived(rideSummary(cur, trip));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  let picked = $state('');
  const bikeId = $derived(trip?.bikeId ?? (picked || bikes[0]?.id || ''));
  const bike = $derived(($bikesQ ?? []).find((b) => b.id === bikeId) ?? null);
  const plan = $derived($actsQ && $bookQ ? bikeKmPlan(cur, bikeId || null, { acts: $actsQ, entries: $bookQ }) : null);
  const name = $derived(trip?.title || t('Live ride'));
  let busy = $state(false);
  let err = $state('');

  async function toDebrief() {
    if (busy) return;
    busy = true;
    err = '';
    try {
      const pace = paceOf((await db.settings.get(PACE_KEY))?.value);
      const draft = rideRowOf($state.snapshot(cur), { trip, name, basis: { kmh: pace.kmh, climbMh: pace.climbMh } });
      const row = { ...draft, plan: trip ? plannedFor(trip, draft.date, pace) : null };
      const old = await db.rides.get(row.id);
      await db.rides.put(old ? { ...row, answers: old.answers ?? {}, createdAt: old.createdAt ?? row.createdAt } : row);
      // the km of the ride into the trip's look back (as an uploaded ride does), unless it is finished
      if (trip?.bikeId) {
        const stored = await db.debriefs.get(trip.id);
        if (stored?.status !== 'done') {
          const d = kmIntoDebrief(stored, trip, [row]);
          if (d) await db.debriefs.put(d);
        }
      }
      location.hash = trip ? `#/debrief/${encodeURIComponent(trip.id)}` : `#/debrief/ride/${encodeURIComponent(row.id)}`;
    } catch (e) {
      err = saveFailed(e);
    } finally {
      busy = false;
    }
  }

  // «Bild zum Teilen» (Noah 20.10.2026 «b»): a picture of the ride for a message or a story
  let withLine = $state(true);
  let shareMsg = $state('');
  async function shareImage() {
    if (busy) return;
    busy = true;
    err = '';
    shareMsg = '';
    try {
      const { drawShareImage } = await import('./shareimage.js');
      const kmh = sum.movingS > 60 ? Math.round((sum.km / (sum.movingS / 3600)) * 10) / 10 : null;
      const stats = [
        { label: t('Distance'), value: `${num(sum.km)} km` },
        { label: t('Riding|live'), value: durText(sum.movingS) },
        ...(sum.hm != null ? [{ label: t('Climbing'), value: `${num(sum.hm)} m` }] : []),
        ...(kmh != null ? [{ label: t('Ø speed'), value: `${num(kmh)} km/h` }] : []),
        ...(sum.sensors.hr ? [{ label: t('Ø heart rate'), value: `${num(sum.sensors.hr.avg)} bpm` }] : []),
        ...(sum.sensors.power ? [{ label: t('Ø power'), value: `${num(sum.sensors.power.avg)} W` }] : []),
      ];
      const day = new Date(cur.startAt || Date.now());
      const date = day.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const canvas = drawShareImage({ pts: withLine ? (cur.pts ?? []) : [], stats, words: { title: name, date, brand: 'Pack Generator' } });
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error(t('The picture could not be made.'));
      const how = await deliver(blob, `fahrt-${cur.day || 'live'}.png`);
      shareMsg = how === 'downloaded' ? t('Saved as a picture in your downloads.') : how === 'shared' ? t('Shared.') : '';
    } catch (x) {
      err = saveFailed(x);
    } finally {
      busy = false;
    }
  }

  async function addKm() {
    if (busy || !bike || !plan?.count) return;
    busy = true;
    err = '';
    try {
      await ensureKmBook(db);
      const e = makeEntry(bikeEntryOf($state.snapshot(cur), bike.id, { name, note: t('Live map') }));
      const ids = await addEntries(db, [e]);
      await db.tracks.update(cur.id, { kmId: e.id });
      const what = { km: num(e.km), bike: bike.name };
      offerDone(t('{km} km added to {bike}.', what), async () => {
        await deleteEntries(db, ids);
        await db.tracks.update(cur.id, { kmId: null });
      });
    } catch (x) {
      err = saveFailed(x);
    } finally {
      busy = false;
    }
  }
</script>

<section class="card after" aria-labelledby="after-h" data-after-ride>
  <h2 id="after-h">{t('Your ride')}</h2>
  <dl class="nums">
    <div><dt>{t('Distance')}</dt><dd class="num" data-after-km>{num(sum.km)} km</dd></div>
    {#if sum.hm != null}<div><dt>{t('Climbing')}</dt><dd class="num" data-after-hm>{num(sum.hm)} m</dd></div>{/if}
    <div><dt>{t('Riding|live')}</dt><dd class="num" data-after-moving>{durText(sum.movingS)}</dd></div>
    <div><dt>{t('Stopped|live')}</dt><dd class="num" data-after-stopped>{durText(sum.stoppedS)}</dd></div>
    {#if sum.pausedS >= 60}<div><dt>{t('Paused|ride')}</dt><dd class="num" data-after-paused>{durText(sum.pausedS)}</dd></div>{/if}
    {#if sum.totalS}<div><dt>{t('Total time')}</dt><dd class="num" data-after-total>{durText(sum.totalS)}</dd></div>{/if}
    {#if sum.sensors.hr}<div><dt>{t('Ø heart rate')}</dt><dd class="num" data-after-hr>{num(sum.sensors.hr.avg)} bpm</dd></div>{/if}
    {#if sum.sensors.power}<div><dt>{t('Ø power')}</dt><dd class="num" data-after-power>{num(sum.sensors.power.avg)} W</dd></div>{/if}
    {#if sum.sensors.cadence}<div><dt>{t('Ø cadence')}</dt><dd class="num">{num(sum.sensors.cadence.avg)} rpm</dd></div>{/if}
  </dl>
  {#if cur.sensors?.hr?.length > 1}<SensorCurve samples={cur.sensors.hr} label={t('Heart rate')} unit="bpm" avg={sum.sensors.hr?.avg} max={sum.sensors.hr?.max} />{/if}
  {#if cur.sensors?.power?.length > 1}<SensorCurve samples={cur.sensors.power} label={t('Power')} unit="W" avg={sum.sensors.power?.avg} max={sum.sensors.power?.max} />{/if}
  {#if sum.sensors.hr || sum.sensors.power}<p class="tp-small tp-muted">{t('Measured by your sensors during the ride, kept on this device.')}</p>{/if}
  <p class="tp-small tp-muted">{sum.stops.length ? tn(sum.stops.length, '{n} pause of 2 minutes or more.', '{n} pauses of 2 minutes or more.') : t('No pause of 2 minutes or more.')} {sum.hm == null ? t('Height metres come with a route that has a profile, or later from Strava.') : ''}</p>

  <div class="row">
    <button type="button" class="btn hi" disabled={busy} onclick={toDebrief} data-after-debrief><ClipboardCheck size={18} aria-hidden="true" />{t('Debrief')}</button>
    <span class="tp-small tp-muted">{trip ? t('Opens the look back of this trip with the km and pauses filled in.') : t('Saves the ride with its km and pauses and opens it.')}</span>
  </div>

  <div class="bk" data-after-share>
    <h3><Share2 size={16} aria-hidden="true" /> {t('Picture to share')}</h3>
    <label class="chk"><input type="checkbox" bind:checked={withLine} data-after-share-line /> {t('With the shape of the ride')}</label>
    <p class="tp-small tp-muted">{withLine ? t('The shape shows where you rode. Leave it out when you start at home.') : t('Only the name, the date and the numbers.')}</p>
    <div class="row">
      <button type="button" class="btn" disabled={busy || !sum.km} onclick={shareImage} data-after-share-btn><Share2 size={18} aria-hidden="true" />{t('Share picture')}</button>
      {#if shareMsg}<span class="tp-small tp-muted" role="status" data-after-share-done>{shareMsg}</span>{/if}
    </div>
  </div>

  <div class="bk" data-after-bike>
    <h3><Bike size={16} aria-hidden="true" /> {t('Km for the bike care')}</h3>
    {#if !bikes.length && !trip?.bikeId}
      <p class="tp-small tp-muted">{t('No bike yet. Add one under Bikes to count its km.')}</p>
    {:else if plan?.why === 'added'}
      <p class="ok" data-after-added><Check size={16} aria-hidden="true" /> {t('Added to the ride ledger.')}</p>
    {:else if plan?.why === 'overlap'}
      <p class="tp-small tp-muted" data-after-overlap>{t('A Strava or Garmin ride of this bike at the same time counts already, so these km are not added twice.')}</p>
    {:else if plan?.why === 'none'}
      <p class="tp-small tp-muted">{t('No km recorded.')}</p>
    {:else if plan}
      {#if !trip?.bikeId && bikes.length > 1}
        <label class="pick">{t('Which bike?')}
          <select class="inp" bind:value={picked} data-after-pick>
            {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
          </select>
        </label>
      {/if}
      <button type="button" class="btn" disabled={busy || !bike} onclick={addKm} data-after-addkm>{t('Add {km} km to {bike}', { km: num(sum.km), bike: bike?.name ?? '' })}</button>
      <p class="tp-small tp-muted">{t('For chain, pads and tyres. Undo right after, or change it later in the ride ledger.')}</p>
    {/if}
  </div>
  {#if err}<p class="warn" role="alert">{err}</p>{/if}
</section>

<style>
  .after {
    display: grid;
    gap: 10px;
  }
  .after h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .nums {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    margin: 0;
  }
  .nums div {
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .nums dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nums dd {
    margin: 0;
    font-weight: 700;
    font-size: var(--fs-section);
  }
  .after p {
    margin: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .row :global(.btn),
  .bk :global(.btn) {
    gap: 6px;
  }
  .bk {
    display: grid;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .bk h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .chk {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-body);
  }
  .pick {
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .ok {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ok);
    font-weight: 600;
  }
  .warn {
    color: var(--bad);
  }
</style>

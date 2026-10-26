<script>
  /**
   * Paket W 1117 (Noah 20.10.2026 «2a»: «in der Tour und im Abendfenster, nicht auf Heute»): the evening
   * window «Plan B for tomorrow». From 17:00, when tomorrow is a day of a trip with a plan B and the
   * forecast of that day brings heavy rain or a storm. It works like the other evening windows
   * (home/windows.js): «Später» brings it back in one hour, «Heute nicht» puts it away until tomorrow,
   * the main button opens the trip on Unterwegs. Mounted by HomeWindow when no other window shows.
   * The forecast (open-meteo, free) is read once per evening and kept only in memory.
   */
  import { liveQuery } from 'dexie';
  import { X, CloudRain, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import { openTrip } from '../nav.js';
  import { t, num } from '../i18n.svelte.js';
  import { stage, fetchHourly } from '../ride.js';
  import { WINDOWS_KEY, mayShow, later, notToday, done } from '../home/windows.js';
  import { planBTomorrow, planBOf, badWeather, badText, hoursOfDay } from './haustuer.js';
  import '../bikes/velo-dlg.css';

  let { now, trips = [] } = $props();
  const ID = 'planb';
  const recQ = liveQuery(async () => (await db.settings.get(WINDOWS_KEY))?.value ?? {});
  const rec = $derived($recQ);
  const cand = $derived(planBTomorrow(trips, now));
  const put = (value) => db.settings.put({ key: WINDOWS_KEY, value: JSON.parse(JSON.stringify(value)) });

  // the forecast of tomorrow: the saved one of the trip when fresh (6 h), else one question to open-meteo
  let wx = $state(null);
  let askedFor = null;
  $effect(() => {
    if (!cand || !rec || !mayShow(rec, ID, now)) return;
    const key = `${cand.trip.id}:${cand.date}`;
    if (askedFor === key) return;
    askedFor = key;
    const saved = cand.trip.rideWx?.[cand.date];
    if (saved?.fetchedAt && Date.now() - new Date(saved.fetchedAt) < 6 * 36e5) return void (wx = { key, saved });
    const st = stage(cand.trip, cand.day);
    const places = [st.from ?? cand.trip.place, st.to].filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon)).map((p, i) => ({ name: i ? 'End of the day' : 'Start of the day', lat: p.lat, lon: p.lon }));
    if (!places.length || navigator.onLine === false) return;
    fetchHourly(places, cand.date)
      .then((saved) => (wx = { key, saved }))
      .catch(() => {});
  });
  const bad = $derived.by(() => {
    if (!cand || !wx || wx.key !== `${cand.trip.id}:${cand.date}`) return null;
    return badWeather(hoursOfDay(wx.saved, cand.date).filter((h) => h.h == null || (h.h >= 6 && h.h <= 21)), cand.trip.planB?.trigger);
  });
  const pb = $derived(cand ? planBOf(cand.trip) : null);
  const win = $derived(cand && bad && pb && rec && mayShow(rec, ID, now) ? { ...cand, bad, pb } : null);

  let dialog = $state();
  let shown = $state(false);
  $effect(() => {
    if (!dialog) return;
    if (win && !dialog.open) dialog.showModal();
    else if (!win && dialog.open) dialog.close();
    shown = !!win;
  });
  const soon = () => win && put(later(rec, ID, now));
  const away = () => win && put(notToday(rec, ID, now));
  function go() {
    if (!win) return;
    openTrip(win.trip.id);
    put(done(rec, ID, now));
  }
  function closed() {
    if (win && shown) soon();
  }
</script>

{#if win}
  <dialog class="sheet vdlg from-below hw" bind:this={dialog} use:backClose={closed} onclose={closed} aria-labelledby="pbw-h" data-window="planb">
    <div class="vd-head">
      <span class="ib" aria-hidden="true"><CloudRain size={18} /></span>
      <div class="vd-t">
        <h2 id="pbw-h">{t('Tomorrow: {what}', { what: badText(win.bad, t) })}</h2>
        <p class="vd-sub">{win.trip.title}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Later|mask')} onclick={soon}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="ln" data-planb-what>
      <b>{win.pb.kind === 'train' ? t('Your plan B: the train home.') : win.pb.route ? t('Your plan B: the shorter variant, {km} km.', { km: num(Math.round(win.pb.route.km)) }) : t('Your plan B:')}</b>{#if win.pb.note}{' '}{win.pb.note}{/if}
    </p>
    <div class="ft">
      <button type="button" class="btn" onclick={away} data-window-today>{t('Not today|mask')}</button>
      <button type="button" class="btn" onclick={soon} data-window-later>{t('Later|mask')}</button>
      <a class="btn hi" href="#/ride" onclick={go} data-window-go>{t('Look at plan B')}<ChevronRight size={16} aria-hidden="true" /></a>
    </div>
    <small class="hint">{t('«Later» brings this window back in one hour. «Not today» puts it away until tomorrow.')}</small>
  </dialog>
{/if}

<style>
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
    color: var(--ink-2);
  }
  .ln {
    margin: 8px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .ln b {
    color: var(--ink);
    font-weight: 600;
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .ft .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .hint {
    display: block;
    margin-top: 8px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .ft .btn {
      flex: 1 1 30%;
      min-height: 48px;
    }
  }
</style>

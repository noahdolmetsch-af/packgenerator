<script>
  /**
   * Paket Q Zusatz 3 «Für unterwegs offline speichern» (Noah 19.10.2026 «1-3 alle a»): from 3 days before a
   * trip one button loads the newest weather of the trip (stored on the trip, as the weather card does),
   * the alerts and your news onto this device. Afterwards one line says what is saved and when (this
   * device only, meta). The packing list and the checks are on the device anyway.
   */
  import { liveQuery } from 'dexie';
  import { CloudDownload } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { fetchForecast } from '../weather.js';
  import { FEEDS_KEY, feedsOf } from './news.js';
  import { loadAlerts, loadFeed } from './news.svelte.js';
  import { offlineSoon, offlinePlace, offlineLine } from './offline.js';

  let { trip } = $props();
  const KEY = 'offlineSaved'; // meta: { [tripId]: { at, parts } }
  const today = localDay();
  const savedQ = liveQuery(() => db.meta.get(KEY));
  const saved = $derived($savedQ?.value?.[trip?.id] ?? null);
  const soon = $derived(offlineSoon(trip, today));
  let busy = $state(false);
  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  $effect(() => {
    const on = () => (online = true);
    const off = () => (online = false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => (window.removeEventListener('online', on), window.removeEventListener('offline', off));
  });

  async function save() {
    if (busy) return;
    busy = true;
    const parts = { weather: false, alerts: false, news: false };
    try {
      const home = (await db.settings.get('homePlace'))?.value ?? null;
      const place = offlinePlace(trip, home);
      const jobs = [];
      if (place)
        jobs.push(
          fetchForecast(place)
            .then((forecast) => db.trips.update(trip.id, { forecast }))
            .then(() => (parts.weather = true))
            .catch(() => {}),
        );
      jobs.push(loadAlerts({ force: true }).then((a) => (parts.alerts = !a?.error)));
      const feeds = feedsOf((await db.settings.get(FEEDS_KEY))?.value);
      if (feeds.length) jobs.push(Promise.all(feeds.map((f) => loadFeed(f, { force: true }))).then((r) => (parts.news = r.some((x) => !x?.error))));
      await Promise.all(jobs);
      const all = (await db.meta.get(KEY))?.value ?? {};
      await db.meta.put({ key: KEY, value: { ...all, [trip.id]: { at: new Date().toISOString(), parts } } });
    } finally {
      busy = false;
    }
  }
  const when = (iso) => new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const line = $derived(saved ? offlineLine(saved.parts) : null);
  const NAME = { 'the weather': 'the weather|offline', 'the alerts': 'the alerts|offline', 'the news': 'the news|offline' };
</script>

{#if soon}
  <div class="offsave" data-offline-save>
    <CloudDownload size={18} aria-hidden="true" />
    <div class="os-m">
      {#if line}
        <p role="status">{t(line.text, line.vars ? { what: line.vars.what.map((w) => t(NAME[w])).join(', ') } : undefined)} <small>{t('As of {when}', { when: when(saved.at) })}</small></p>
      {:else}
        <p>{t('No internet on the way? Save the weather, the alerts and the news of this trip on the device now.')}</p>
      {/if}
    </div>
    <button type="button" class="btn sm" onclick={save} disabled={busy || !online} data-offline-save-btn>{busy ? t('Saving…') : saved ? t('Save again') : t('Save for the way')}</button>
  </div>
  {#if !online && !saved}<p class="small os-off">{t('Offline right now: this works once you are online again.')}</p>{/if}
{/if}

<style>
  .offsave {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 var(--sp-2);
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .os-m {
    flex: 1;
    min-width: 0;
  }
  .os-m p {
    margin: 0;
    font-size: var(--fs-small);
  }
  .os-m small {
    color: var(--ink-2);
  }
  .os-off {
    margin: 0 0 var(--sp-2);
  }
</style>

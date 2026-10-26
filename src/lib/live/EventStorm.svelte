<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «8», mockup G9): a thunderstorm warning for everyone. Every
   * device of the group (also friends without the app) reads the weather along the route ahead of the group
   * every 15 minutes, free from Open-Meteo, and shows the warning on top: where, in about how long, and who
   * rides toward it. «Hide» takes it away here; a new storm shows again. Nothing goes to our server.
   */
  import { onDestroy } from 'svelte';
  import { CloudLightning } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import { stormSamples, stormUrl, stormOf, towardStorm, STORM_EVERY_MS } from './event.js';
  import './event.css';

  let { route = null, rows = [], me = null, fetcher = (...a) => fetch(...a) } = $props();
  let storm = $state(null);
  let hidden = $state('');
  let readAt = 0;
  async function check() {
    if (!route || document.visibilityState === 'hidden' || navigator.onLine === false) return;
    if (Date.now() - readAt < STORM_EVERY_MS) return;
    const samples = stormSamples(route, rows);
    if (!samples.length) return;
    readAt = Date.now();
    try {
      const res = await fetcher(stormUrl(samples));
      if (res.ok) storm = stormOf(await res.json(), samples, Date.now());
    } catch {
      /* offline: the last answer stays */
    }
  }
  $effect(() => {
    void route;
    void (rows.length > 0);
    check();
  });
  const timer = setInterval(check, 60_000);
  onDestroy(() => clearInterval(timer));
  const key = $derived(storm ? `${storm.fromKm}-${storm.toKm}-${Math.floor(storm.at / 36e5)}` : '');
  const inMin = $derived(storm ? Math.max(0, Math.round((storm.at - Date.now()) / 60_000)) : 0);
  const who = $derived(towardStorm(storm, rows));
  const names = $derived(who.map((r) => (r.m === me ? t('you') : r.name || t('Without a name'))).join(', '));
</script>

{#if storm && hidden !== key}
  <div class="ev-alert warn" role="alert" data-event-storm>
    <CloudLightning size={22} aria-hidden="true" />
    <span class="ev-txt">
      <b>{inMin < 10 ? t('Thunderstorm now at km {from}–{to} of the route', { from: num(storm.fromKm), to: num(storm.toKm) }) : t('Thunderstorm in about {min} min at km {from}–{to} of the route', { min: inMin, from: num(storm.fromKm), to: num(storm.toKm) })}</b>
      <small>{who.length ? t('Riding toward it: {names}.', { names }) : ''} {t('Look for shelter in time.')}</small>
    </span>
    <button type="button" class="btn sm" onclick={() => (hidden = key)} data-event-storm-hide>{t('Hide')}</button>
  </div>
{/if}

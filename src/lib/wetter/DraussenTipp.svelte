<script>
  /**
   * Paket Y extra 8 «Draussen-Vorschlag» for Aktiv (Noah 20.10.2026 «1a»: with the Landi radar): one calm
   * line at your home place from the weather core: the next good hour outside (dry, no thunderstorm, wind
   * under 25 km/h, 5–30 °C), else when rain comes, with «Radar» (Landi) and «Wetter». Nothing without a
   * home place or without weather. Mounted with one line by the owner of Aktiv.
   */
  import { liveQuery } from 'dexie';
  import { Sun, CloudRain, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { loadCore, outdoorOk, rainWithin, LANDI_RADAR } from './kern.js';
  import { t, num, locale } from '../i18n.svelte.js';

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const place = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? $homeQ.value : null);
  let core = $state(null);
  let key = '';
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    core = null;
    if (place) loadCore(db, place).then((c) => k === key && (core = c)).catch(() => {});
  });
  const now = Date.now();
  const good = $derived(core ? outdoorOk(core, now) : null);
  const rain = $derived(core ? rainWithin(core, now, 3) : null);
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
</script>

{#if core && (good || rain)}
  <p class="dt" data-draussen>
    {#if good}<Sun size={18} aria-hidden="true" /><span>{good.now ? t('Good for outside now ({temp} °C).', { temp: num(good.temp) }) : t('Good for outside from {at} ({temp} °C).', { at: hm(good.at), temp: num(good.temp) })}</span>
    {:else}<CloudRain size={18} aria-hidden="true" /><span>{t('rain from {at}', { at: hm(rain) })}</span>{/if}
    {#if rain}<a class="btn sm" href={LANDI_RADAR} target="_blank" rel="noopener noreferrer" data-landi>{t('Radar')}</a>{/if}
    <a class="dt-more" href="#/wetter">{t('Weather')}<ChevronRight size={14} aria-hidden="true" /></a>
  </p>
{/if}

<style>
  .dt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 12px;
    overflow-wrap: break-word;
  }
  .dt .btn.sm {
    min-height: 44px;
  }
  .dt-more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-2);
  }
</style>

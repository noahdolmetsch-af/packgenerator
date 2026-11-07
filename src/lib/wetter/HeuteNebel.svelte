<script>
  /**
   * «Nebelgrenze» on Today (Noah 05.11.2026 «1a 2b»): one calm line for the home place, every day: the fog top
   * (or «no fog line»), the sight, and where your place lies. A tap opens the weather page. Offline the kept answer
   * shows with its time. It hides itself without a home place, without a value, or when switched off on the
   * weather page (setting 'fogHome'). HeuteWetter mounts it with one line, under the snow line.
   */
  import { liveQuery } from 'dexie';
  import { CloudFog } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { REFRESHED } from '../home/refresh.js';
  import { OWN_KEY } from './schneegrenze.js';
  import { summary, HOME_KEY } from './nebelgrenze.js';
  import { loadProfil } from './profil.js'; // the air layers, shared with «Temperaturen nach Höhe»
  import { t, num, locale } from '../i18n.svelte.js';

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const ownQ = liveQuery(() => db.settings.get(OWN_KEY));
  const onQ = liveQuery(() => db.settings.get(HOME_KEY));

  const place = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? { lat: Number($homeQ.value.lat), lon: Number($homeQ.value.lon) } : null);
  let fog = $state(null);
  let key = '';
  const read = (pl, k) => loadProfil(db, pl).then((f) => (k == null || k === key) && (fog = f)).catch(() => {});
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    fog = null;
    if (place) read(place, k);
  });
  $effect(() => {
    const again = () => place && read(place, null);
    globalThis.addEventListener(REFRESHED, again);
    return () => globalThis.removeEventListener(REFRESHED, again);
  });
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 5 * 60_000);
    return () => clearInterval(id);
  });

  const on = $derived($onQ?.value !== false);
  const s = $derived(fog ? summary(fog, now, $ownQ?.value) : null);
  const at = $derived(fog?.old && fog.at ? new Date(fog.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
  const sight = $derived(s?.sight ? (s.sight.over ? t('Sight over {v} km', { v: num(s.sight.v) }) : s.sight.unit === 'm' ? t('Sight {v} m', { v: num(s.sight.v) }) : t('Sight {v} km', { v: num(s.sight.v) })) : '');
</script>

{#if on && s}
  <a class="hn" href="#/wetter" data-heute-fogline>
    <CloudFog size={16} aria-hidden="true" />
    <span>
      {#if s.now.top != null}
        <b>{s.above === 'sun' ? t('Fog line about {m} m above sea level, sun above', { m: num(s.now.top) }) : s.above === 'cloud' ? t('Fog line about {m} m above sea level, clouds above', { m: num(s.now.top) }) : t('Fog line about {m} m above sea level', { m: num(s.now.top) })}</b>
        {#if s.own}<span class="hn-sub"> · {s.own.in ? t('Your place is in the fog') : t('Your place is above the fog')}</span>{/if}
        {#if s.clearing?.kind === 'clears'}<span class="hn-sub"> · {t('clears around {h} h', { h: num(s.clearing.hour) })}</span>{/if}
      {:else}
        <b>{t('No fog line: no low cloud expected')}</b>
      {/if}
      {#if sight}<span class="hn-sub"> · {sight}</span>{/if}
      {#if at}<span class="hn-sub"> · {t('As of {at}', { at })}</span>{/if}
    </span>
  </a>
{/if}

<style>
  .hn {
    flex: 1 1 100%;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .hn-sub {
    color: var(--ink-2);
  }
</style>

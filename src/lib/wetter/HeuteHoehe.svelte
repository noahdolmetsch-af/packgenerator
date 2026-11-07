<script>
  /**
   * «Temperaturen nach Höhe» on Today (Noah 05.11.2026 «1b»): one calm line for the home place, every day: the air
   * temperature now at 1000, 2000 and 3000 m. A tap opens the weather page (the whole card, more places and peaks).
   * Offline the kept answer shows with its time. It hides itself without a home place, without a value, or when
   * switched off on the weather page (setting 'hoehe.heute'). HeuteWetter mounts it with one line, under the fog line.
   */
  import { liveQuery } from 'dexie';
  import { Mountain } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { REFRESHED } from '../home/refresh.js';
  import { loadProfil } from './profil.js'; // the air layers, shared with «Nebelgrenze»
  import { briefOf, HOME_KEY } from './hoehe.js';
  import { t, num, locale } from '../i18n.svelte.js';

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const onQ = liveQuery(() => db.settings.get(HOME_KEY));

  const place = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? { lat: Number($homeQ.value.lat), lon: Number($homeQ.value.lon) } : null);
  let air = $state(null);
  let key = '';
  const read = (pl, k) => loadProfil(db, pl).then((f) => (k == null || k === key) && (air = f)).catch(() => {});
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    air = null;
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
  const rows = $derived(air ? briefOf(air, now) : null);
  const at = $derived(air?.old && air.at ? new Date(air.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
  const deg = (v) => `${v < 0 && Math.round(Math.abs(v)) > 0 ? '−' : ''}${num(Math.round(Math.abs(v)))}°`;
</script>

{#if on && rows}
  <a class="hh" href="#/wetter" data-heute-hoehe aria-label={t('Temperatures by height. Open the weather page.')}>
    <Mountain size={16} aria-hidden="true" />
    <span>
      {#each rows as r, i (r.z)}{#if i}<span class="hh-sub" aria-hidden="true">{' · '}</span>{/if}<span data-heute-hoehe-row={r.z}>{num(r.z)} m <b>{deg(r.t)}</b></span>{/each}
      {#if at}<span class="hh-sub"> · {t('As of {at}', { at })}</span>{/if}
    </span>
  </a>
{/if}

<style>
  .hh {
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
    font-variant-numeric: tabular-nums;
  }
  .hh-sub {
    color: var(--ink-2);
  }
</style>

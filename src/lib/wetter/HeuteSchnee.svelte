<script>
  /**
   * «Schneefallgrenze» on Today (Noah 04.11.2026 «2a 5a»): one calm line for the home place, every day, with
   * the snow line now and its low of the day; «Snow possible at your place» when it goes down to your height.
   * A tap opens the weather page. Offline the kept answer shows with its time («As of …»). It hides itself
   * without a home place, without a value, or when switched off on the weather page (setting 'snowHome').
   * HeuteWetter mounts it with one line.
   */
  import { liveQuery } from 'dexie';
  import { Snowflake } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { REFRESHED } from '../home/refresh.js';
  import { loadCore } from './kern.js';
  import { lineNow, lineRange, ownHeight, lowHint, OWN_KEY, HOME_KEY } from './schneegrenze.js';
  import { t, num, locale } from '../i18n.svelte.js';

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const ownQ = liveQuery(() => db.settings.get(OWN_KEY));
  const onQ = liveQuery(() => db.settings.get(HOME_KEY));

  const place = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? { lat: Number($homeQ.value.lat), lon: Number($homeQ.value.lon) } : null);
  let core = $state(null);
  let key = '';
  const read = (pl, k) => loadCore(db, pl).then((c) => (k == null || k === key) && (core = c)).catch(() => {});
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    core = null;
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
  const cur = $derived(core ? lineNow(core, now) : null);
  const range = $derived(core ? lineRange(core, now) : null);
  const hint = $derived(core ? lowHint(core, now, ownHeight(core, $ownQ?.value)) : null);
  const at = $derived(core?.old && core.at ? new Date(core.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
</script>

{#if on && cur}
  <a class="hs" href="#/wetter" data-heute-snowline>
    <Snowflake size={16} aria-hidden="true" />
    <span>
      <b>{t('Snow line {m} m above sea level', { m: num(cur.m) })}</b>
      {#if range && range.min < cur.m}<span class="hs-sub"> · {t('lowest today {m} m', { m: num(range.min) })}</span>{/if}
      {#if hint}<span class="hs-hint"> · {t('Snow possible at your place')}</span>{/if}
      {#if at}<span class="hs-sub"> · {t('As of {at}', { at })}</span>{/if}
    </span>
  </a>
{/if}

<style>
  .hs {
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
  .hs-sub {
    color: var(--ink-2);
  }
  .hs-hint {
    color: var(--bad);
  }
</style>

<script>
  /**
   * «Nebelgrenze» on the weather page (Noah 05.11.2026 «1a 2b 3a 4b»): in the card «Today», under the snow line, the top
   * of the fog deck in m above sea level, with «sun above», your place (in the fog or above it), when the fog clears,
   * six times from 6 to 21 h, the temperature above against below and the sight. Always there (also «no fog line»);
   * the line on Today can be switched off. A guess from the air layers, and the page says so.
   * wetter-seite mounts it with one line.
   */
  import { liveQuery } from 'dexie';
  import { CloudFog, Sun, Cloud, Eye, Thermometer } from '@lucide/svelte';
  import { db } from '../db.js';
  import { REFRESHED } from '../home/refresh.js';
  import { OWN_KEY } from './schneegrenze.js';
  import { summary, HOME_KEY } from './nebelgrenze.js';
  import { loadProfil } from './profil.js'; // the air layers, shared with «Temperaturen nach Höhe»
  import { t, num, locale } from '../i18n.svelte.js';

  let { core, now = Date.now() } = $props();
  const ownQ = liveQuery(() => db.settings.get(OWN_KEY));
  const homeQ = liveQuery(() => db.settings.get(HOME_KEY));

  const place = $derived(core?.place && Number.isFinite(Number(core.place.lat)) ? { lat: Number(core.place.lat), lon: Number(core.place.lon) } : null);
  let fog = $state(null);
  let key = '';
  const read = (pl, k, force = false) => loadProfil(db, pl, { force }).then((f) => (k == null || k === key) && (fog = f)).catch(() => {});
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

  const s = $derived(fog ? summary(fog, now, $ownQ?.value) : null);
  const onHome = $derived($homeQ?.value !== false);
  const at = $derived(fog?.old && fog.at ? new Date(fog.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
  const sight = $derived(s?.sight ? (s.sight.over ? t('Sight over {v} km', { v: num(s.sight.v) }) : s.sight.unit === 'm' ? t('Sight {v} m', { v: num(s.sight.v) }) : t('Sight {v} km', { v: num(s.sight.v) })) : '');
  const toggleHome = (e) => db.settings.put({ key: HOME_KEY, value: e.currentTarget.checked });
</script>

{#if s}
  <div class="nb" data-fogline>
    <p class="nb-main">
      <CloudFog size={18} aria-hidden="true" />
      <span>
        {#if s.now.top != null}
          <b data-fogline-now>{s.above === 'sun' ? t('Fog line about {m} m above sea level, sun above', { m: num(s.now.top) }) : s.above === 'cloud' ? t('Fog line about {m} m above sea level, clouds above', { m: num(s.now.top) }) : t('Fog line about {m} m above sea level', { m: num(s.now.top) })}</b>
        {:else}
          <b data-fogline-now>{t('No fog line: no low cloud expected')}</b>
        {/if}
      </span>
    </p>
    {#if s.own}
      <p class="nb-row" data-fogline-own>{#if s.own.in}<Cloud size={16} aria-hidden="true" />{t('Your place ({m} m) is in the fog', { m: num(s.own.m) })}{:else}<Sun size={16} aria-hidden="true" />{t('Your place ({m} m) is above the fog', { m: num(s.own.m) })}{/if}</p>
    {/if}
    {#if s.clearing}
      <p class="nb-row" data-fogline-clearing>
        {#if s.clearing.kind === 'clears'}{t('The fog clears around {h} h', { h: num(s.clearing.hour) })}{:else if s.clearing.kind === 'stays'}{t('The fog stays until the evening')}{:else}{t('Fog comes in around {h} h', { h: num(s.clearing.hour) })}{/if}
      </p>
    {/if}
    {#if s.slots.length}
      <ul class="nb-slots" aria-label={t('Fog line through the day')} data-fogline-slots>
        {#each s.slots as x (x.hour)}<li><span>{t('{h} h', { h: x.hour })}</span>{#if x.top != null}<b>{num(x.top)}</b><small>m</small>{:else}<b aria-label={t('no fog line')}>–</b><small>&nbsp;</small>{/if}</li>{/each}
      </ul>
    {/if}
    {#if s.up}
      <p class="nb-row" data-fogline-up><Thermometer size={16} aria-hidden="true" />{s.up.diff > 0 ? t('At {h} m it is {d} °C warmer than at your place', { h: num(s.up.h), d: num(s.up.diff) }) : t('At {h} m it is {d} °C colder than at your place', { h: num(s.up.h), d: num(-s.up.diff) })}</p>
    {/if}
    {#if sight}
      <p class="nb-row" data-fogline-sight><Eye size={16} aria-hidden="true" />{sight}</p>
    {/if}
    <p class="nb-src">{t('A guess from the air layers of the weather model, about 200 m precise. A webcam shows how it really is.')}{#if at}{' '}{t('As of {at}', { at })}{/if}</p>
    <details class="nb-set" data-fogline-set>
      <summary>{t('Set fog line')}</summary>
      <label class="nb-check"><input type="checkbox" checked={onHome} onchange={toggleHome} data-fogline-home />{t('Show the fog line on Today')}</label>
      <small class="nb-src">{t('Your height for «Your place» is set under «Set snow line».')}</small>
    </details>
  </div>
{/if}

<style>
  .nb {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
  }
  .nb-main,
  .nb-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
  }
  .nb-row {
    font-size: var(--fs-small);
  }
  .nb-slots {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 4px;
    text-align: center;
  }
  .nb-slots li {
    display: grid;
    padding: 6px 2px;
    border-radius: 8px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  .nb-slots span,
  .nb-slots small,
  .nb-src {
    color: var(--ink-2);
  }
  .nb-src {
    margin: 0;
    font-size: var(--fs-small);
  }
  .nb-set summary {
    cursor: pointer;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .nb-set > * {
    margin-top: 8px;
  }
  .nb-check {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>

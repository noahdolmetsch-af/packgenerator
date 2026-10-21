<script>
  /**
   * Paket U4 «Schlafplätze im Rennen» · 1138 «Wo schlafe ich heute?» with 1142 (spot quality) and 1143
   * (open at night): the next places to sleep ahead, with km, arrival at your pace, small signs for roof,
   * bed, water, WC, metres from the route and the night's weather. Roofs first when it rains, beds first
   * when it is cold. Used in race mode (SleepTonight.svelte, with the kind chips) and on the live map
   * (compact: the first three, no chips). Only suggestions: you decide where you sleep.
   */
  import { House, Bed, Droplet, Toilet, CloudRain, Thermometer, Star, Phone } from '@lucide/svelte';
  import { sleepOptions, SPOT, SPOTS, telOf } from '../sleep.js';
  import { hhmm, dayOfMs } from '../race.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { pois = [], own = [], pts = [], km = 0, now = Date.now(), eta = null, kmh = 18, wx = null, bagC = 5, kinds = null, onkinds = null, compact = false } = $props();

  const res = $derived(sleepOptions({ pois, own, pts, km, now, eta, kmh, wx, bagC, kinds, n: compact ? 3 : 8 }));
  const when = (ms) => (dayOfMs(ms) === dayOfMs(now) ? hhmm(ms) : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}`);
  const nameOf = (p) => p.name || t(SPOT[p.spot]?.name ?? 'Place to sleep');
  const deg = (c) => `${Math.round(c)} °C`;
  const on = (k) => !kinds || kinds.includes(k);
  function flip(k) {
    const cur = kinds ?? SPOTS.map((s) => s.key);
    onkinds?.(cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]);
  }
</script>

<div class="sl" data-sleep-list={compact ? 'compact' : 'full'}>
  {#if !compact && onkinds}
    <div class="rc-chips" role="group" aria-label={t('Show these kinds')}>
      {#each SPOTS as s (s.key)}<button type="button" class="rc-chip" aria-pressed={on(s.key)} onclick={() => flip(s.key)} data-sleep-kind={s.key}>{t(s.name)}</button>{/each}
    </div>
  {/if}
  {#if res.mode === 'rain'}<p class="rc-note" data-sleep-mode="rain"><CloudRain size={16} aria-hidden="true" /> {t('Rain tonight: places with a roof come first.')}</p>{/if}
  {#if res.mode === 'cold'}<p class="rc-note" data-sleep-mode="cold"><Thermometer size={16} aria-hidden="true" /> {t('Cold tonight: beds come first, then roofs.')}</p>{/if}
  {#if res.list.length}
    <ul class="rc-list">
      {#each res.list as p (p.id ?? `${p.spot}${p.km}`)}
        <li class="rc-row sl-row" data-sleep-row={p.spot}>
          <span class="rc-row-main">
            <b>{nameOf(p)}</b>
            <small>{t(SPOT[p.spot]?.name ?? 'Place to sleep')} · {t('in {km} km', { km: num(p.distKm) })} · {t('there about {at}', { at: when(p.at) })}</small>
            <span class="sl-signs">
              {#if p.q.bed}<span class="sl-sign" title={t('Bed')}><Bed size={14} aria-hidden="true" />{t('Bed')}</span>
              {:else if p.q.roof}<span class="sl-sign" title={t('Roof')}><House size={14} aria-hidden="true" />{t('Roof')}</span>
              {:else if p.q.roof === false}<span class="sl-sign sl-no">{t('No roof')}</span>{/if}
              {#if p.q.water}<span class="sl-sign"><Droplet size={14} aria-hidden="true" />{t('Water|poi')}</span>{/if}
              {#if p.q.wc}<span class="sl-sign"><Toilet size={14} aria-hidden="true" />{t('WC|poi')}</span>{/if}
              {#if p.q.offM != null && p.q.offM >= 50}<span class="sl-sign">{t('{m} m from the route', { m: num(p.q.offM >= 1000 ? Math.round(p.q.offM / 100) * 100 : Math.round(p.q.offM / 10) * 10) })}</span>{/if}
              {#if p.rain != null}<span class="sl-sign" class:rc-warn={p.rain >= 50}><CloudRain size={14} aria-hidden="true" />{t('rain {p} %', { p: Math.round(p.rain) })}</span>{/if}
              {#if p.low != null}<span class="sl-sign" class:rc-warn={p.low < bagC}><Thermometer size={14} aria-hidden="true" />{t('Night low {c}', { c: deg(p.low) })}</span>{/if}
              {#if p.stars}<span class="sl-sign"><Star size={14} aria-hidden="true" />{p.stars}/5</span>{/if}
              {#if p.spot === 'night' || p.q.roof == null}<span class="sl-sign sl-check" data-sleep-check>{t('check whether you may stay')}</span>{/if}
            </span>
            {#if p.src}<small>{t('From the list «{name}»', { name: p.src })}</small>{/if}
          </span>
          {#if p.phone}<a class="rc-icon" href="tel:{telOf(p.phone)}" aria-label={t('Call {name}', { name: nameOf(p) })}><Phone size={18} aria-hidden="true" /></a>{/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="rc-empty" data-sleep-empty>{pois.length ? t('No place to sleep of these kinds in the next 80 km.') : t('No places loaded yet. Load them under «Along the route».')}</p>
  {/if}
  {#if !compact}<p class="rc-src">{t('A suggestion from OpenStreetMap, your own places and the weather you loaded. Whether you may sleep somewhere, the app does not know: check it on the spot.')}</p>{/if}
</div>

<style>
  .sl {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .sl-row {
    align-items: flex-start;
  }
  .sl-signs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin-top: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sl-sign {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .sl-no {
    color: var(--ink-3);
  }
  .sl-check {
    color: var(--warn);
  }
</style>

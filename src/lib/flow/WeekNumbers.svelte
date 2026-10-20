<script>
  /**
   * «Deine Woche in Zahlen» (Noah 20.10.2026 «2a»): replaces «Velo diesen Monat» on Aktiv. Six values of
   * the last 7 days (time in motion, distance, climbing, active zone minutes, sleep, resting pulse), each
   * next to the mean week of the 4 weeks before. A tap on a value opens its 12 weeks as bars and one
   * sentence what it means. Only to look at; the sources: Strava, the rides of the app, Fitbit.
   */
  import { Timer, Route, Mountain, HeartPulse, Moon, Heart, ChevronDown, Info } from '@lucide/svelte';
  import { tableQuery } from '../messwerte-data.js';
  import { weekNumbers, weekSeries, shown, METRIC } from '../messwerte.js';
  import { health, FITBIT_HASH } from '../health/client.svelte.js';
  import { t, num } from '../i18n.svelte.js';

  let { today } = $props();
  const q = tableQuery();
  const table = $derived($q ?? new Map());
  const rows = $derived(weekNumbers(table, today));
  const ICON = { time: Timer, km: Route, hm: Mountain, azm: HeartPulse, sleep: Moon, rhr: Heart };
  const unit = (key) => (key === 'time' || key === 'sleep' ? '' : METRIC[key].unit);
  let open = $state(null);
  const series = $derived(open ? weekSeries(table, open, today, 12) : []);
  const top = $derived(Math.max(1, ...series.map((w) => w.v ?? 0)));
  const fitbitOff = $derived(!health.prefs.connected);

  function trend(r) {
    if (r.now == null) return r.m.src === 'fitbit' && fitbitOff ? t('comes with Fitbit') : t('no value yet');
    if (r.pct == null) return t('no comparison yet');
    if (r.flat) return t('as usual');
    // resting pulse: up is not «more», so the words stay neutral for every value
    return r.pct > 0 ? t('{n} % above your usual', { n: num(r.pct) }) : t('{n} % below your usual', { n: num(-r.pct) });
  }
  const wk = (w) => `${Number(w.from.slice(8, 10))}.${Number(w.from.slice(5, 7))}.`;
</script>

<div class="wn" data-section="week-numbers">
  <ul class="grid">
    {#each rows as r (r.key)}
      {@const I = ICON[r.key]}
      <li>
        <button type="button" class="val" class:on={open === r.key} aria-expanded={open === r.key} data-wn={r.key} onclick={() => (open = open === r.key ? null : r.key)}>
          <span class="lb"><I size={15} aria-hidden="true" /><span>{t(r.m.name)}</span></span>
          <b class="num">{r.now == null ? '–' : shown(r.key, r.now, num)}{#if r.now != null && unit(r.key)}{' '}<small>{t(unit(r.key))}</small>{/if}</b>
          <small class="tr" class:up={r.pct > 5} class:down={r.pct < -5}>{trend(r)}</small>
        </button>
      </li>
    {/each}
  </ul>
  {#if open}
    {@const m = METRIC[open]}
    <div class="det" data-wn-detail={open}>
      <p class="dh"><b>{t(m.name)}</b> · {t('12 weeks, one bar per week')}</p>
      <div class="bars" role="img" aria-label={t('{name}: the last 12 weeks', { name: t(m.name) })}>
        {#each series as w, i (w.from)}
          <span class="bar" class:now={i === series.length - 1} title="{wk(w)}: {w.v == null ? '–' : shown(open, w.v, num)}"><i style="height:{w.v ? Math.max(4, Math.round((w.v / top) * 100)) : 0}%"></i></span>
        {/each}
      </div>
      <div class="ax"><span>{wk(series[0])}</span><span>{t('this week')}</span></div>
      <p class="about"><Info size={15} aria-hidden="true" /><span>{t(m.about)} {m.src === 'fitbit' ? t('Source: Fitbit.') : t('Source: Strava and your rides.')}</span></p>
      {#if m.src === 'fitbit' && fitbitOff}<a class="link" href={FITBIT_HASH}>{t('Connect Fitbit')} ›</a>{/if}
    </div>
  {/if}
  <details class="how">
    <summary><Info size={15} aria-hidden="true" /><span>{t('What do these numbers mean?')}</span><ChevronDown class="cv" size={16} aria-hidden="true" /></summary>
    <p>{t('Each value counts the last 7 days, today included. Next to it: how this compares with your usual week, the mean of the 4 weeks before. Only to look at, no grades. Tap a value for its 12 weeks.')}</p>
  </details>
</div>

<style>
  .wn {
    display: grid;
    gap: 10px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .val {
    display: grid;
    align-content: start;
    gap: 2px;
    width: 100%;
    height: 100%;
    min-height: 84px;
    padding: 10px 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .val:hover,
  .val.on {
    background: var(--paper-2);
  }
  .val.on {
    border-color: var(--hi);
  }
  .lb {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    line-height: 1.25;
    overflow-wrap: break-word;
  }
  .lb :global(svg) {
    flex: none;
  }
  .lb span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .val b {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .val b small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .tr {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.25;
  }
  .det {
    display: grid;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .dh {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dh b {
    color: var(--ink);
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: end;
    gap: 4px;
    height: 90px;
  }
  .bar {
    display: flex;
    align-items: flex-end;
    height: 100%;
  }
  .bar i {
    display: block;
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: var(--line);
  }
  .bar.now i {
    background: var(--hi);
  }
  .ax {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .about,
  .how p {
    display: flex;
    gap: 8px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .about :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .how summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    cursor: pointer;
    list-style: none;
  }
  .how summary::-webkit-details-marker {
    display: none;
  }
  .how[open] :global(.cv) {
    transform: rotate(180deg);
  }
  .how p {
    padding: 0 0 6px 21px;
  }
  .link {
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  /* a phone: two values per row, so every name stays whole */
  @media (max-width: 519px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>

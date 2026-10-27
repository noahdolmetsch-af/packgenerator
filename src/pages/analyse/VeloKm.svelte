<script>
  /**
   * «Velos: km und Verschleiss» (Noah 27.10.2026, idea «Velo-km plus Verschleiss»), in Analyse under
   * «Muster und Rekorde»: the km of every bike in the period and per week (12 weeks, only counted rides of
   * the km book), and per bike its three most worn parts with «X km left» and the month it is due (the
   * same rules as Velos › Pflege › Verschleiss). Only to look at. days: the period; today.
   */
  import { ChevronRight } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../../lib/db.js';
  import { withVisits } from '../../lib/workshop.js';
  import { wearRows } from '../../lib/wear.js';
  import { bikesHash } from '../../lib/bikes.js';
  import { bikeWeeks, bikeTotals } from '../../lib/analyse/bikes.js';
  import { SERIES_COLORS } from '../../lib/analyse/diagram.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';
  import { niceScale, tickText } from '../../lib/charts/axis.js';
  import GridLines from '../../lib/charts/GridLines.svelte';
  import YTicks from '../../lib/charts/YTicks.svelte';

  let { days = [], today } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const entriesQ = liveQuery(() => db.kmBook.toArray());
  const bikes = $derived(($bikesQ ?? []).filter((b) => b && !b.archived));
  const entries = $derived($entriesQ ?? []);
  const WEEKS = 12;
  const totals = $derived(bikeTotals(entries, bikes, days));
  const top = $derived(Math.max(1, ...totals.map((x) => x.km)));
  const shownIds = $derived(totals.slice(0, SERIES_COLORS.length).map((x) => x.bike.id));
  const weeks = $derived(bikeWeeks(entries, shownIds, today, WEEKS));
  const sc = $derived(niceScale(weeks.flatMap((w) => shownIds.map((id) => w.km[id] ?? 0)), { zero: true }));
  let pickedWeek = $state(null); // the index of a tapped week; the newest week when none is tapped
  const pw = $derived(pickedWeek ?? weeks.length - 1);
  const wear = $derived(
    bikes
      .map((b) => {
        const view = withVisits(b, $visitsQ ?? []);
        const rows = wearRows(view, { entries: entries.filter((e) => e.bikeId === b.id), today }).filter((r) => r.state !== 'unknown');
        return { bike: b, rows: rows.slice(0, 3) };
      })
      .filter((x) => x.rows.length),
  );
  const W = 600;
  const H = 140;
  const PAD = 8;
  const x = (i) => PAD + (i / (WEEKS - 1)) * (W - 2 * PAD);
  const y = (km) => H - PAD - ((km - sc.lo) / (sc.hi - sc.lo || 1)) * (H - 2 * PAD);
  function tap(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const fx = ((e.clientX - r.left) / r.width) * W;
    pickedWeek = Math.max(0, Math.min(WEEKS - 1, Math.round(((fx - PAD) / (W - 2 * PAD)) * (WEEKS - 1))));
  }
  const dfmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const STATE = { due: 'due now|bikesan', soon: 'soon|bikesan', ok: 'fine|bikesan' };
</script>

{#if bikes.length}
  <section class="card vk" aria-labelledby="vk-h" data-bike-km>
    <div class="ch"><h2 id="vk-h">{t('Bikes: km and wear|bikesan')}</h2><small>{t('km book · counted rides|bikesan')}</small></div>
    {#if totals.length}
      <ul class="tot">
        {#each totals as r, i (r.bike.id)}
          <li data-bike-total={r.bike.id}>
            <span class="nm"><i class="dot" style="background:{SERIES_COLORS[i % SERIES_COLORS.length]}"></i>{r.bike.name}</span>
            <span class="bar"><i style="width:{(r.km / top) * 100}%; background:{SERIES_COLORS[i % SERIES_COLORS.length]}"></i></span>
            <b class="num">{num(r.km)} km</b>
          </li>
        {/each}
      </ul>
      <p class="pv" data-bike-week aria-live="polite">
        <b>{t('Week of {day}|bikesan', { day: dfmt(weeks[pw].key, { day: 'numeric', month: 'short' }) })}</b>
        {#each shownIds as id, i (id)}<span><i class="dot" style="background:{SERIES_COLORS[i]}"></i>{totals[i].bike.name}&nbsp;<b class="num">{num(weeks[pw].km[id] ?? 0)} km</b></span>{/each}
      </p>
      <div class="plot">
        <YTicks ticks={sc.ticks} {y} h={H} text={(v) => tickText(v, sc.step, num)} unit="km" width={56} />
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('km per week per bike|bikesan')} onclick={tap}>
          <GridLines ticks={sc.ticks} {y} x1={0} x2={W} />
          <line class="cur" x1={x(pw)} x2={x(pw)} y1={PAD} y2={H - PAD} />
          {#each shownIds as id, i (id)}
            <path class="ln" style="stroke:{SERIES_COLORS[i]}" d={weeks.map((w, j) => `${j ? 'L' : 'M'}${x(j).toFixed(1)} ${y(w.km[id] ?? 0).toFixed(1)}`).join('')} data-bike-line={id} />
            {#each weeks as w, j (w.key)}<circle class="pt" class:on={j === pw} cx={x(j)} cy={y(w.km[id] ?? 0)} r={j === pw ? 5 : 3} style="fill:{SERIES_COLORS[i]}" />{/each}
          {/each}
        </svg>
      </div>
      <div class="xl" aria-hidden="true" style="margin-left:62px"><span>{dfmt(weeks[0].key, { day: 'numeric', month: 'short' })}</span><span>{t('km per week, {n} weeks|bikesan', { n: WEEKS })}</span><span>{dfmt(weeks.at(-1).key, { day: 'numeric', month: 'short' })}</span></div>
      <p class="hint">{t('Tap a week for its exact km.|bikesan')}</p>
      <div class="srw">{#each weeks as w, j (w.key)}<button type="button" onclick={() => (pickedWeek = j)}>{dfmt(w.key, { day: 'numeric', month: 'short' })}</button>{/each}</div>
    {:else}
      <p class="hint">{t('No counted rides in this period.|bikesan')}</p>
    {/if}

    {#if wear.length}
      <h3>{t('Wear|page')}</h3>
      {#each wear as w (w.bike.id)}
        <div class="wb" data-bike-wear={w.bike.id}>
          <a class="wh" href={bikesHash({ tab: 'care', view: 'wear', bike: w.bike.id })}><b>{w.bike.name}</b><ChevronRight size={16} aria-hidden="true" /></a>
          <ul>
            {#each w.rows as r (r.key)}
              <li class={r.state} data-wear-part={r.key}>
                <span class="nm">{r.name}</span>
                <span class="bar"><i style="width:{Math.min(100, (r.frac ?? 0) * 100)}%"></i></span>
                <span class="lf">{r.left != null ? t('{km} km left|bikesan', { km: num(Math.max(0, r.left)) }) : t(STATE[r.state])}{#if r.due && r.state !== 'due'}&nbsp;· {dfmt(r.due, { month: 'short', year: 'numeric' })}{/if}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    {/if}
  </section>
{/if}

<style>
  .vk {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .ch {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 8px;
  }
  .ch h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ch small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  h3 {
    margin: 6px 0 0;
    font-size: var(--fs-body);
  }
  .tot,
  .wb ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tot li,
  .wb li {
    display: grid;
    grid-template-columns: minmax(90px, 30%) minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
  }
  .nm {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .bar {
    height: 10px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--l1);
  }
  .wb li.soon .bar i {
    background: var(--pz4);
  }
  .wb li.due .bar i {
    background: var(--pz6);
  }
  .lf {
    color: var(--ink-2);
    white-space: nowrap;
  }
  .wb {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .wh {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .plot {
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  svg {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: auto;
    cursor: crosshair;
  }
  .cur {
    stroke: var(--ink-3);
    stroke-dasharray: 3 3;
  }
  .pt {
    stroke: var(--paper);
    stroke-width: 1.5;
  }
  .pv {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    margin: 0;
    font-size: var(--fs-small);
  }
  .pv span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .srw {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .ln {
    fill: none;
    stroke-width: 2.5;
  }
  .xl {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>

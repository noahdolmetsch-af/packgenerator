<script>
  /**
   * v0.49.0 R1 (drei «A» Tour-Rückblick): a trip's saved Rückblick tells what the trip was, instead of
   * four grey tiles: km, Hm, time and pace with the weather (and per day on a trip of several days),
   * plan against real, what was not used (with the grams to save), what broke or was missing, the
   * learnings of the trip and what it means for the next trip. «Antworten ändern» stays, quiet.
   * Every number may be unknown: then a calm «–».
   */
  import { t, tn, num, nameOf } from '../i18n.svelte.js';
  import { formatWeight } from '../gear.js';
  import { tripFacts, planVsReal, dayRows, nextTripAfter, nextHints } from './rueckblick.js';
  import { n0, n1, hours, temps, kg, dates, dayLong, rainText, signedNum, signedHours, DASH } from './fmt.js';
  import { openTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { tripEnd } from '../debrief.js';
  import Band from './Band.svelte';
  import TemplateOffer from '../debrief/TemplateOffer.svelte';
  import { Check, Lightbulb, Sparkles, Sun, CloudRain, Cloud, Thermometer, Bike, Briefcase, Wrench, X, Minus, ChevronRight, Pencil } from '@lucide/svelte';

  let { trip, d, bike = null, trips = [], debriefs = [], rides = [], learnings = [], items = [], containers = [], bikes = [], counts, sugg = [], offer = null, onreopen } = $props();

  const today = localDay();
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  // The trip as a row of tripFacts (the same numbers as the Rückblick page and Past trips).
  const row = $derived(tripFacts({ trips: [{ ...trip, status: 'done' }], debriefs: debriefs.map((x) => (x.tripId === trip.id ? { ...d, status: 'done' } : x)), rides: rides.filter((r) => r.tripId === trip.id), learnings, items, containers, bikes, today: tripEnd(trip) > today ? tripEnd(trip) : today }).find((r) => r.id === trip.id) ?? null);
  const pvr = $derived(row ? planVsReal(row) : []);
  const days = $derived(row ? dayRows(row) : []);
  const next = $derived(nextTripAfter(trip, trips, today));
  const hints = $derived(nextHints({ debrief: d, next, learnings: row?.learnings ?? [], byId }));
  const unused = $derived(trip.entries.filter((e) => d.items?.[e.itemId] === 'unused' && byId[e.itemId]));
  const broken = $derived(trip.entries.filter((e) => d.items?.[e.itemId] === 'broken' && byId[e.itemId]));
  const usedN = $derived(trip.entries.filter((e) => byId[e.itemId] && !d.items?.[e.itemId]).length);
  const totalN = $derived(trip.entries.filter((e) => byId[e.itemId]).length);
  const w = (e) => (byId[e.itemId]?.weightG == null ? null : byId[e.itemId].weightG * (e.qty || 1));
  const savedOn = $derived(d.doneAt ? dayLong(d.doneAt.slice(0, 10)) : null);

  /* plan against real: two thin bars per row, drawn to the larger of both */
  const LABEL = { km: 'Distance', gainM: 'Climbing|hm', movingH: 'Moving', kmh: 'Pace|speed' };
  const fmtV = (key, v) => (key === 'movingH' ? `${hours(v)} h` : key === 'kmh' ? `${n1(v)} km/h` : key === 'gainM' ? `${n0(v)} Hm` : `${n0(v)} km`);
  const fmtD = (key, v) => (key === 'movingH' ? signedHours(v) : key === 'kmh' ? signedNum(v, n1) : signedNum(v));
  // better: more km/Hm is neutral; less time or more speed is better
  const good = (x) => (x.key === 'movingH' ? x.diff < 0 : x.key === 'kmh' ? x.diff > 0 : null);
  const timeRow = $derived(pvr.find((x) => x.key === 'movingH') ?? null);
  const DAYKIND = { unused: 'Packed again for {trip}, not used this time', missing: 'Was missing', broken: 'Broke: check it before the next trip', note: 'Your sentence for next time' };
</script>

{#snippet rainIcon(rain)}
  {#if rain?.wet === true}<CloudRain size={16} aria-hidden="true" />{:else if rain?.wet === false}<Sun size={16} aria-hidden="true" />{:else}<Cloud size={16} aria-hidden="true" />{/if}
{/snippet}

<div class="saved">
  <section class="status saved-card" aria-labelledby="saved-h"><span class="tp-okdot"><Check size={16} aria-hidden="true" /></span><span><h2 id="saved-h">{t('Saved')}</h2><small role="status">{[savedOn ? t('Debrief saved on {date}', { date: savedOn }) : t('Debrief saved'), d.applied?.length ? tn(d.applied.length, '{n} change made', '{n} changes made') : '', d.kmApplied ? (bike?.name ? t('{km} km added to {bike}', { km: num(d.kmApplied), bike: bike.name }) : t('{km} km added to the bike', { km: num(d.kmApplied) })) : ''].filter(Boolean).join(' · ')}</small></span></section>

  <div class="tp-grid2 r">
    <div class="col">
      <!-- the trip in numbers -->
      <section class="tp-card ride" aria-labelledby="sv-h">
        {#if row?.profile}<div class="bw"><Band points={row.profile} /><span class="pill ok tag"><Check size={14} aria-hidden="true" />{t('Debrief saved')}</span></div>{/if}
        <div class="in">
          <p class="kick">{[dates(trip.startDate, tripEnd(trip)), trip.days > 1 ? tn(trip.days, '{n} day', '{n} days') : t('Day ride|art')].join(' · ')}</p>
          <h2 id="sv-h" class="lt">{trip.title}</h2>
          <dl class="big">
            <div><dt>{t('Distance')}</dt><dd><b class="bignum">{n0(row?.km)}</b> <span class="u">km</span></dd></div>
            <div><dt>{t('Climbing|hm')}</dt><dd><b class="bignum">{n0(row?.gainM)}</b> <span class="u">Hm</span></dd></div>
            <div><dt>{row?.totalH && row?.movingH && row.totalH > row.movingH ? t('moving · {h} total', { h: hours(row.totalH) }) : t('moving')}</dt><dd><b class="bignum">{hours(row?.movingH)}</b> <span class="u">h</span></dd></div>
            <div><dt>{t('average while moving')}</dt><dd><b class="bignum">{n1(row?.kmh)}</b> <span class="u">km/h</span></dd></div>
          </dl>
          <ul class="facts">
            <li>{@render rainIcon(row?.rain)}{rainText(row?.rain, trip.days)}</li>
            <li><Thermometer size={16} aria-hidden="true" />{temps(row?.tmin, row?.tmax)}</li>
            <li><Bike size={16} aria-hidden="true" />{trip.bike ?? bike?.name ?? DASH}</li>
            {#if row?.baseG}<li><Briefcase size={16} aria-hidden="true" />{t('Base {w}', { w: kg(row.baseG) })}</li>{/if}
          </ul>
          {#if days.length}
            <ul class="days">
              {#each days as x (x.n)}
                <li>
                  <span class="dn">{t('Day {n}', { n: x.n })}</span>
                  <span class="dk num"><b>{n0(x.km)}</b> km</span>
                  <span class="dm num">{n0(x.gainM)} Hm · {hours(x.movingH)} h</span>
                  <span class="dw">{#if x.rain != null}{#if x.rain >= 1}<CloudRain size={14} aria-hidden="true" />{t('rain')}{:else}<Sun size={14} aria-hidden="true" />{t('dry|weather')}{/if}{/if} {temps(x.tmin, x.tmax)}</span>
                </li>
              {/each}
            </ul>
          {/if}
          {#if row?.special}<p class="special"><Sparkles size={18} aria-hidden="true" /><span>{row.special}</span></p>{/if}
        </div>
      </section>

      <!-- plan against real -->
      {#if pvr.length}
        <section class="tp-card" aria-labelledby="pvr-h">
          <h2 id="pvr-h">{t('Plan and reality')}</h2>
          {#if timeRow}
            {@const mins = Math.round(timeRow.diff * 60)}
            <p class="lead">{mins < 0 ? t('Your plan was {n} min off, in your favour.', { n: -mins }) : mins > 0 ? t('You needed {n} min more than planned.', { n: mins }) : t('Right on time, as planned.')}</p>
          {/if}
          <p class="legend"><i class="k pl"></i>{t('planned')} <i class="k re"></i>{t('ridden')}</p>
          <ul class="pvr">
            {#each pvr as x (x.key)}
              {@const top = Math.max(x.plan, x.real) || 1}
              <li>
                <span class="pl-l">{t(LABEL[x.key])}</span>
                <span class="pl-b"><i class="pl" style:width="{(x.plan / top) * 100}%"></i><i class="re" style:width="{(x.real / top) * 100}%"></i></span>
                <span class="pl-v num">{fmtV(x.key, x.plan)}<br />{fmtV(x.key, x.real)}</span>
                <span class="pl-d num" class:good={good(x) === true} class:bad={good(x) === false}>{fmtD(x.key, x.diff)}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- used and not used -->
      <section class="tp-card" aria-labelledby="un-h">
        <h2 id="un-h">{t('Not used')} <span class="r num">{t('{used} of {total} items used', { used: usedN, total: totalN })}</span></h2>
        {#if unused.length}
          {#if counts.unusedG}<p class="save"><b class="bignum">−{formatWeight(counts.unusedG)}</b><span>{t('you can save')}{#if counts.unusedUnweighed} · {t('{n} not weighed', { n: counts.unusedUnweighed })}{/if}</span></p>{/if}
          <ul class="il">
            {#each unused as e (e.itemId)}
              <li><Minus size={16} aria-hidden="true" /><span class="nm">{nameOf(byId[e.itemId])}</span><span class="num g">{w(e) == null ? DASH : formatWeight(w(e))}</span></li>
            {/each}
          </ul>
        {:else}
          <p class="tp-muted">{t('Everything on the list was used.')}</p>
        {/if}
      </section>
    </div>

    <div class="col">
      <!-- what it means for the next trip -->
      <section class="tp-card nextc" aria-labelledby="nx-h">
        <p class="eyebrow">{next ? t('Works on the next trip') : t('For next time')}</p>
        {#if next}
          <h2 id="nx-h" class="nt">{next.title}</h2>
          <p class="tp-muted tp-small">{[dates(next.startDate, tripEnd(next)), next.bike].filter(Boolean).join(' · ')}</p>
        {:else}
          <h2 id="nx-h" class="sr">{t('For next time')}</h2>
        {/if}
        {#if hints.length}
          <ul class="hints">
            {#each hints as h, i (i)}
              <li>
                <span class="hi-ic {h.kind}">{#if h.kind === 'unused'}<Minus size={16} aria-hidden="true" />{:else if h.kind === 'broken'}<Wrench size={16} aria-hidden="true" />{:else if h.kind === 'missing'}<X size={16} aria-hidden="true" />{:else}<Lightbulb size={16} aria-hidden="true" />{/if}</span>
                <span class="m"><b>{h.item ? nameOf(h.item) : h.text}</b><small>{h.kind === 'unused' ? t('Packed again for {trip}, not used this time', { trip: next.title }) : h.kind === 'missing' ? (h.packed ? t('Was missing; it is on the next list') : t('Was missing')) : t(DAYKIND[h.kind])}</small></span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="tp-muted">{t('Nothing to change: the trip went as planned.')}</p>
        {/if}
        {#if next}<a class="btn" href="#/pack" onclick={() => openTrip(next.id)}>{t('Packing list {trip}', { trip: next.title })}<ChevronRight size={18} aria-hidden="true" /></a>{/if}
      </section>

      <section class="tp-card" aria-labelledby="ln-h">
        <h2 id="ln-h"><Lightbulb size={18} aria-hidden="true" />{t('Learned|review')} <span class="r num">{num(row?.learnings.length ?? 0)}</span></h2>
        {#if row?.learnings.length}
          <ul class="il lrn">{#each row.learnings as l (l.id)}<li><span class="nm">{l.rule}{#if l.topic}<small>{t(l.topic)}</small>{/if}</span></li>{/each}</ul>
        {:else}
          <p class="tp-muted">{t('No learning from this trip.')}</p>
        {/if}
        <a class="lnk" href="#/debrief/learnings">{t('All learnings')}<ChevronRight size={16} aria-hidden="true" /></a>
      </section>

      {#if broken.length}
        <section class="tp-card" aria-labelledby="br-h">
          <h2 id="br-h"><Wrench size={18} aria-hidden="true" />{t('Broken|debrief')} <span class="r num">{num(broken.length)}</span></h2>
          <ul class="il">{#each broken as e (e.itemId)}<li><span class="nm">{nameOf(byId[e.itemId])}</span></li>{/each}</ul>
        </section>
      {/if}
      {#if d.missing?.length}
        <section class="tp-card" aria-labelledby="ms-h">
          <h2 id="ms-h"><X size={18} aria-hidden="true" />{t('Was missing')} <span class="r num">{num(d.missing.length)}</span></h2>
          <ul class="il">{#each d.missing as m (m.id)}<li><span class="nm">{m.name}<small>{m.itemId ? t('in your gear') : t('on the wishlist')}</small></span></li>{/each}</ul>
        </section>
      {/if}
      {#if offer}<TemplateOffer {trip} name={offer} />{/if}
    </div>
  </div>

  <section class="tp-card foot" aria-label={t('Debrief')}>
    <span class="m"><b>{t('Done. Good trip!')}</b>{#if sugg.length}<small>{tn(sugg.length, '{n} more suggestion is open. Change your answers to see it.', '{n} more suggestions are open. Change your answers to see them.')}</small>{/if}</span>
    <button type="button" class="tp-link" onclick={onreopen}><Pencil size={16} aria-hidden="true" />{t('Change answers')}</button>
  </section>
</div>

<style>
  .status {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 12px;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .status h2 {
    margin: 0;
    font-size: var(--fs-body);
  }
  .status small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ride {
    padding: 0;
    overflow: hidden;
  }
  .bw {
    position: relative;
  }
  .tag {
    position: absolute;
    top: 10px;
    left: 12px;
  }
  .ride .in {
    padding: 14px 16px 16px;
  }
  .kick,
  .eyebrow {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .eyebrow {
    color: var(--hi);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .lt,
  .nt {
    margin: 2px 0 10px;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-page);
    line-height: 1.05;
    overflow-wrap: break-word;
  }
  .nt {
    font-size: var(--fs-section);
    margin-bottom: 2px;
  }
  .big {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 16px;
    margin: 0;
  }
  @media (max-width: 559px) {
    .big {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .big div {
    display: flex;
    flex-direction: column-reverse;
    min-width: 0;
  }
  .big dt,
  .u {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .big dd {
    margin: 0;
    white-space: nowrap;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .facts li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .facts :global(svg) {
    color: var(--ink-3);
  }
  .days {
    display: grid;
    gap: 6px;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
    list-style: none;
    font-size: var(--fs-small);
  }
  .days li {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    gap: 2px 12px;
    align-items: baseline;
  }
  .dn {
    font-weight: 600;
  }
  .dk b {
    font-family: var(--font-brand);
    font-size: var(--fs-sub);
  }
  .dm {
    color: var(--ink-2);
    text-align: right;
  }
  .dw {
    grid-column: 2 / -1;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
  }
  .special {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--l4-soft);
  }
  .special :global(svg) {
    flex: none;
    color: var(--l4);
  }
  .lead {
    margin: 0 0 8px;
  }
  .legend {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .legend .k {
    display: inline-block;
    width: 16px;
    height: 4px;
    border-radius: 2px;
  }
  .legend .k.re {
    margin-left: 10px;
  }
  .pl {
    background: var(--bar);
  }
  .re {
    background: var(--accent);
  }
  .pvr {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pvr li {
    display: grid;
    grid-template-columns: minmax(80px, 1fr) minmax(0, 2fr) auto 56px;
    gap: 4px 12px;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  @media (max-width: 479px) {
    .pvr li {
      grid-template-columns: minmax(0, 1fr) auto 56px;
    }
    .pl-b {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
  .pl-b {
    display: grid;
    gap: 4px;
  }
  .pl-b i {
    display: block;
    height: 5px;
    border-radius: 3px;
    min-width: 2px;
  }
  .pl-v {
    color: var(--ink-3);
    text-align: right;
    white-space: nowrap;
  }
  .pl-d {
    text-align: right;
    font-weight: 600;
    color: var(--ink-2);
  }
  .pl-d.good {
    color: var(--ok);
  }
  .pl-d.bad {
    color: var(--warn);
  }
  .save {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 8px;
  }
  .save .bignum {
    color: var(--hi);
  }
  .save span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .il {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .il li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .il li:first-child {
    border-top: 0;
  }
  .il :global(svg) {
    flex: none;
    color: var(--warn);
  }
  .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .g {
    color: var(--ink-2);
    white-space: nowrap;
  }
  .nextc {
    border: 2px solid var(--accent);
  }
  .hints {
    display: grid;
    gap: 2px;
    margin: 10px 0 12px;
    padding: 0;
    list-style: none;
  }
  .hints li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .hints li:first-child {
    border-top: 0;
  }
  .hi-ic {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .hi-ic.broken,
  .hi-ic.unused {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .hints .m {
    display: grid;
    min-width: 0;
  }
  .hints .m b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .hints small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nextc .btn {
    min-height: 44px;
    width: 100%;
    justify-content: space-between;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
  }
  .lrn small {
    margin-top: 1px;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
  }
  .foot .m {
    display: grid;
    min-width: 0;
  }
  .foot small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>

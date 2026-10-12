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
  import TemplateOffer from '../debrief/TemplateOffer.svelte';
  import { Check, Lightbulb, Sparkles, Sun, CloudRain, Cloud, Thermometer, Bike, Briefcase, Wrench, X, Minus, Plus, ChevronRight, Package } from '@lucide/svelte';

  let { trip, d, bike = null, trips = [], debriefs = [], rides = [], learnings = [], items = [], containers = [], bikes = [], counts, sugg = [], offer = null } = $props();

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

<!-- v0.109.0 Design-Refresh P6 (T16 «Gespeicherter Rückblick», approved 12.10.2026): two columns as in the
     mockup. Left: «Fertig. Gute Tour!» with the four number tiles, plan and reality, not used. Right: what it
     means for the next trip, Gelernt, broken, missing and the bike. «Antworten ändern» is the button of the band. -->
<div class="saved">
  <section class="status saved-card" aria-labelledby="saved-h"><span class="tp-okdot"><Check size={16} aria-hidden="true" /></span><span><h2 id="saved-h">{t('Saved')}</h2><small role="status">{[savedOn ? t('Debrief saved on {date}', { date: savedOn }) : t('Debrief saved'), d.applied?.length ? tn(d.applied.length, '{n} change made', '{n} changes made') : ''].filter(Boolean).join(' · ')}</small></span></section>

  <div class="rv-lay">
    <div class="rv-col">
      <!-- the trip in numbers -->
      <section class="rv-box pad ride" aria-labelledby="sv-h">
        <div class="hero"><span class="tp-okdot" aria-hidden="true"><Check size={16} /></span><h2 id="sv-h">{t('Done. Good trip!')}</h2></div>
        <p class="kick">{[trip.title, dates(trip.startDate, tripEnd(trip)), trip.days > 1 ? tn(trip.days, '{n} day', '{n} days') : t('Day ride|art')].join(' · ')}</p>
        <dl class="rv-tiles big">
          <div class="rv-tile"><dd><b>{n0(row?.km)} km</b></dd><dt><small>{t('Distance')}</small></dt></div>
          <div class="rv-tile"><dd><b>{n0(row?.gainM)} Hm</b></dd><dt><small>{t('Climbing|hm')}</small></dt></div>
          <div class="rv-tile"><dd><b>{hours(row?.movingH)} h</b></dd><dt><small>{row?.totalH && row?.movingH && row.totalH > row.movingH ? t('moving · {h} total', { h: hours(row.totalH) }) : t('moving')}</small></dt></div>
          <div class="rv-tile"><dd><b>{n1(row?.kmh)} km/h</b></dd><dt><small>{t('average while moving')}</small></dt></div>
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
        {#if sugg.length}<p class="open">{tn(sugg.length, '{n} more suggestion is open. Change your answers to see it.', '{n} more suggestions are open. Change your answers to see them.')}</p>{/if}
      </section>

      <!-- plan against real -->
      {#if pvr.length}
        <section class="rv-sec" aria-labelledby="pvr-h">
          <div class="rv-h"><div><h2 id="pvr-h">{t('Plan and reality')}</h2>
            {#if timeRow}
              {@const mins = Math.round(timeRow.diff * 60)}
              <p class="rv-sub">{mins < 0 ? t('Your plan was {n} min off, in your favour.', { n: -mins }) : mins > 0 ? t('You needed {n} min more than planned.', { n: mins }) : t('Right on time, as planned.')}</p>
            {/if}</div></div>
          <div class="rv-box pad">
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
          </div>
        </section>
      {/if}

      <!-- used and not used -->
      <section class="rv-sec" aria-labelledby="un-h">
        <div class="rv-h"><div><h2 id="un-h">{t('Not used')}</h2><p class="rv-sub num">{t('{used} of {total} items used', { used: usedN, total: totalN })}</p></div></div>
        <div class="rv-box">
          {#if unused.length}
            {#if counts.unusedG}<p class="save"><b class="num">−{formatWeight(counts.unusedG)}</b><span>{t('you can save')}{#if counts.unusedUnweighed} · {t('{n} not weighed', { n: counts.unusedUnweighed })}{/if}</span></p>{/if}
            <ul class="il">
              {#each unused as e (e.itemId)}
                <li class="rv-row"><span class="rv-ic" aria-hidden="true"><Minus size={18} /></span><span class="rv-m"><span class="rv-t">{nameOf(byId[e.itemId])}</span></span><span class="rv-v">{w(e) == null ? DASH : formatWeight(w(e))}</span></li>
              {/each}
            </ul>
            <!-- v0.47.2: the same idea across all trips is the Gear view «Nie gebraucht» -->
            <a class="rv-row" href="#/gear?view=never"><span class="rv-ic" aria-hidden="true"><Package size={18} /></span><span class="rv-m"><span class="rv-t">{t('All never used items in Gear')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a>
          {:else}
            <p class="rv-row empty">{t('Everything on the list was used.')}</p>
          {/if}
        </div>
      </section>
    </div>

    <div class="rv-col">
      <!-- what it means for the next trip -->
      <section class="rv-sec nextc" aria-labelledby="nx-h">
        <div class="rv-h"><div><h2 id="nx-h">{next ? t('Works on the next trip') : t('For next time')}</h2>{#if next}<p class="rv-sub">{[next.title, dates(next.startDate, tripEnd(next)), next.bike].filter(Boolean).join(' · ')}</p>{/if}</div></div>
        <ul class="rv-box">
          {#each hints as h, i (i)}
            <li class="rv-row">
              <span class="rv-ic {h.kind}" aria-hidden="true">{#if h.kind === 'unused'}<Minus size={18} />{:else if h.kind === 'broken'}<Wrench size={18} />{:else if h.kind === 'missing'}<Plus size={18} />{:else}<Lightbulb size={18} />{/if}</span>
              <span class="rv-m"><span class="rv-t">{h.item ? nameOf(h.item) : h.text}</span><span class="rv-s">{h.kind === 'unused' ? t('Packed again for {trip}, not used this time', { trip: next.title }) : h.kind === 'missing' ? (h.packed ? t('Was missing; it is on the next list') : t('Was missing')) : t(DAYKIND[h.kind])}</span></span>
            </li>
          {:else}
            <li class="rv-row empty">{t('Nothing to change: the trip went as planned.')}</li>
          {/each}
          {#if next}<li><a class="rv-row" href="#/pack" onclick={() => openTrip(next.id)}><span class="rv-ic" aria-hidden="true"><Briefcase size={18} /></span><span class="rv-m"><span class="rv-t">{t('Packing list {trip}', { trip: next.title })}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>{/if}
        </ul>
      </section>

      <section class="rv-sec" aria-labelledby="ln-h">
        <div class="rv-h"><div><h2 id="ln-h">{t('Learned|review')}</h2><p class="rv-sub num">{tn(row?.learnings.length ?? 0, '{n} learning', '{n} learnings')}</p></div><a class="rv-more" href="#/debrief/learnings">{t('All learnings')}<ChevronRight size={16} aria-hidden="true" /></a></div>
        <ul class="rv-box">
          {#each row?.learnings ?? [] as l (l.id)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span><span class="rv-m"><span class="rv-t">{l.rule}</span>{#if l.topic}<span class="rv-s">{t(l.topic)}</span>{/if}</span></li>
          {:else}<li class="rv-row empty">{t('No learning from this trip.')}</li>{/each}
        </ul>
      </section>

      {#if broken.length}
        <section class="rv-sec" aria-labelledby="br-h">
          <div class="rv-h"><div><h2 id="br-h">{t('Broken|debrief')}</h2><p class="rv-sub num">{num(broken.length)}</p></div></div>
          <ul class="rv-box">{#each broken as e (e.itemId)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><X size={18} /></span><span class="rv-m"><span class="rv-t">{nameOf(byId[e.itemId])}</span></span></li>{/each}</ul>
        </section>
      {/if}
      {#if d.missing?.length}
        <section class="rv-sec" aria-labelledby="ms-h">
          <div class="rv-h"><div><h2 id="ms-h">{t('Was missing')}</h2><p class="rv-sub num">{num(d.missing.length)}</p></div></div>
          <ul class="rv-box">{#each d.missing as m (m.id)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Plus size={18} /></span><span class="rv-m"><span class="rv-t">{m.name}</span><span class="rv-s">{m.itemId ? t('in your gear') : t('on the wishlist')}</span></span></li>{/each}</ul>
        </section>
      {/if}
      {#if d.kmApplied}
        <section class="rv-sec" aria-labelledby="bk-h">
          <div class="rv-h"><div><h2 id="bk-h">{t('Bike')}</h2></div></div>
          <div class="rv-box"><p class="rv-row"><span class="rv-ic" aria-hidden="true"><Bike size={18} /></span><span class="rv-m"><span class="rv-t">{bike?.name ? t('{km} km added to {bike}', { km: num(d.kmApplied), bike: bike.name }) : t('{km} km added to the bike', { km: num(d.kmApplied) })}</span>{#if bike?.km != null}<span class="rv-s">{t('now {km} km', { km: num(bike.km) })}</span>{/if}</span></p></div>
        </section>
      {/if}
      {#if offer}<TemplateOffer {trip} name={offer} />{/if}
    </div>
  </div>
</div>

<style>
  .saved {
    margin-top: 6px;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
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
  .hero {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hero h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .kick {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .big {
    margin: 4px -16px 0;
  }
  .big div {
    display: flex;
    flex-direction: column;
  }
  .big dd,
  .big dt {
    margin: 0;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    list-style: none;
    margin: 0;
    padding: 0;
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
    list-style: none;
    margin: 12px 0 0;
    padding: 4px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .days li {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: baseline;
    gap: 2px 12px;
    padding: 8px 0;
  }
  .days li + li {
    border-top: 1px solid var(--line);
  }
  .dn {
    font-weight: 600;
  }
  .dk b {
    font-size: var(--fs-body);
  }
  .dm {
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .dw {
    grid-column: 1 / -1;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .special {
    display: flex;
    gap: 10px;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--hi-soft);
    overflow-wrap: break-word;
  }
  .special :global(svg) {
    flex: none;
    color: var(--hi);
  }
  .open {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
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
    background: var(--line-strong);
  }
  .re {
    background: var(--hi);
  }
  .pvr {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .pvr li {
    display: grid;
    grid-template-columns: minmax(0, 7em) minmax(0, 1fr) auto 4em;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 559px) {
    .pvr li {
      grid-template-columns: minmax(0, 1fr) auto 3.6em;
    }
    .pl-b {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
  .pl-l {
    overflow-wrap: break-word;
    min-width: 0;
  }
  .pl-b {
    display: grid;
    gap: 4px;
  }
  .pl-b i {
    display: block;
    height: 5px;
    border-radius: 3px;
  }
  .pl-v {
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .pl-d {
    font-weight: 600;
    text-align: right;
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
    flex-wrap: wrap;
    gap: 4px 10px;
    margin: 0;
    padding: 12px 0 6px;
  }
  .save b {
    font: 700 var(--fs-section) / 1.1 var(--font-body);
    color: var(--ink);
  }
  .save span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .il {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .il li + li,
  .il + .rv-row,
  .save + .il {
    border-top: 1px solid var(--line);
  }
  .rv-row.empty {
    margin: 0;
    color: var(--ink-3);
  }
  p.rv-row {
    margin: 0;
  }
  .rv-ic.broken,
  .rv-ic.unused {
    background: var(--warn-soft);
  }
</style>

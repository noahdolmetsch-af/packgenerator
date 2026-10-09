<script>
  /**
   * Past trips (v0.25.1, Noah 3a), #/pack/past.
   * v0.40.0 (design check, Noah 3a): ONE list of past trips with the debrief state, one row per trip.
   * "Debrief open" first (a small neutral badge with a dot), then "Done" with the km right in one
   * column and their sum in the head. A tap on a row opens its debrief (a trip packed outside the
   * app opens in Pack). Below: "Trips compared" and "Your pace" as rows to the debrief page, which
   * keeps the learnings, the comparison and the pace.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { pastTripList } from '../lib/hubs.js';
  import { tripRows } from '../lib/insights.js';
  import { PACE_KEY, paceOf } from '../lib/pace.js';
  import { openTrip } from '../lib/nav.js';
  import { domainOf, domainName, hasBike } from '../lib/domains.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { ChevronRight, ChartBar, Timer, Lightbulb } from '@lucide/svelte';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const list = $derived(pastTripList($tripsQ ?? [], $debriefsQ ?? [], localDay()));
  const loaded = $derived(!!$tripsQ && !!$debriefsQ);
  const compared = $derived($itemsQ ? tripRows($tripsQ ?? [], $debriefsQ ?? [], $itemsQ).length : 0);
  const pace = $derived(paceOf($paceQ?.value ?? null));

  const fmt = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), opts);
  const thisYear = String(new Date().getFullYear());
  /** "6.–7. Okt." / "19. Sept." (the year only when it is not this year). */
  const dates = (r) => {
    const y = r.start.slice(0, 4) !== thisYear ? { year: 'numeric' } : {};
    if (r.days > 1 && r.end && r.end !== r.start) return `${fmt(r.start, { day: 'numeric', ...(r.start.slice(5, 7) !== r.end.slice(5, 7) ? { month: 'short' } : {}) })}–${fmt(r.end, { day: 'numeric', month: 'short', ...y })}`;
    return fmt(r.start, { day: 'numeric', month: 'short', ...y });
  };
  const what = (r) => (!hasBike(r.trip) ? t(domainName(domainOf(r.trip))) : (r.bike ?? ''));
  /** The quiet line under the name: date · bike · what is worth knowing (no "0 missing"). */
  function line(r) {
    const parts = [dates(r), what(r)];
    if (r.state === 'open' || r.state === 'draft') parts.push(tn(r.items, '{n} item', '{n} items'));
    else if (r.state === 'done') {
      if (r.unused) parts.push(tn(r.unused, '{n} not needed', '{n} not needed'));
      if (r.missing) parts.push(tn(r.missing, '{n} missing', '{n} missing'));
    } else parts.push(r.items ? t('without a debrief') : t('packed outside the app'));
    return parts.filter(Boolean).join(' · ');
  }
  const href = (r) => (r.state === 'none' && !r.items ? '#/pack' : `#/debrief/${encodeURIComponent(r.trip.id)}`);
</script>

{#snippet row(r)}
  <li>
    <a class="lrow" href={href(r)} onclick={() => openTrip(r.trip.id)}>
      <span class="m"><span class="t">{r.trip.title}</span><span class="s">{line(r)}</span></span>
      {#if r.state === 'open' || r.state === 'draft'}
        <span class="nbadge"><span class="udot" aria-hidden="true"></span>{r.state === 'draft' ? t('started|debrief') : t('open|debrief')}</span>
      {:else}
        <span class="v num">{r.km != null ? `${num(r.km)} km` : '–'}</span>
      {/if}
      <ChevronRight class="chev" size={18} aria-hidden="true" />
    </a>
  </li>
{/snippet}

<div class="past">
  <h1 class="title">{t('Past trips')}</h1>
  {#if loaded}
    <p class="page-sub">{list.total ? [tn(list.total, '{n} trip', '{n} trips'), list.open.length ? tn(list.open.length, '{n} debrief open', '{n} debriefs open') : ''].filter(Boolean).join(' · ') : ''}</p>
    {#if list.open.length}
      <h2 class="sec-head" id="past-open"><span>{t('Debrief open')}</span><span class="n">{list.open.length}</span></h2>
      <ul class="rowlist" aria-labelledby="past-open">{#each list.open as r (r.trip.id)}{@render row(r)}{/each}</ul>
    {/if}
    {#if list.done.length}
      <h2 class="sec-head" id="past-done"><span>{t('Done|past')}</span><span class="n">{list.kmKnown ? `${num(list.km)} km` : list.done.length}</span></h2>
      <ul class="rowlist" aria-labelledby="past-done">{#each list.done as r (r.trip.id)}{@render row(r)}{/each}</ul>
    {/if}
    {#if !list.total}
      <div class="card empty">
        <b>{t('No finished trips yet.')}</b>
        <p>{t('A trip shows up here the day after it ends, or as soon as you end it on the ride day.')}</p>
        <a class="btn" href="#/pack">{t('Open Pack')}</a>
      </div>
    {/if}
    <!-- The debrief page keeps the comparison and the pace; here they are one row each. -->
    <ul class="rowlist more">
      <li><a class="lrow" href="#/debrief/compare"><span class="ic"><ChartBar size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Trips compared')}</span></span>{#if compared}<span class="nbadge num">{compared}</span>{/if}<ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
      <li><a class="lrow" href="#/debrief/pace"><span class="ic"><Timer size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Your pace')}</span></span><span class="s q">{pace ? `${num(pace.kmh)} km/h` : t('not learned yet')}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
      <li><a class="lrow" href="#/debrief/learnings"><span class="ic"><Lightbulb size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Learnings')}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
    </ul>
  {/if}
</div>

<style>
  .past {
    max-width: 880px;
    margin: 0 auto;
  }
  .sec-head {
    margin-top: 12px;
  }
  .more {
    margin-top: 16px;
  }
  .q {
    flex: none;
    color: var(--ink-3);
    font-size: 14px;
  }
  .empty {
    display: grid;
    gap: 8px;
    justify-items: start;
    margin-top: 12px;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
</style>

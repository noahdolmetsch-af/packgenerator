<script>
  /**
   * v0.29.0 (Noah 1a, 3a, 7a, 10a): the dark band of a trip, the same on Plan, Pack, On the way and
   * Debrief (like the band on Today). Trip name, dates, bike, weight (honest: "6.4 kg · 2 not weighed"),
   * weather, and the four steps as tabs inside the band, each with its short state.
   *
   * The ONE orange button of the page (snippet `action`) sits top right in the band on a big screen
   * and stays at the bottom of a phone screen, above the bottom bar (one element, CSS moves it).
   * `aside`: a small extra next to it on the phone (+ add, the packing ring, the note pencil).
   * compact (On the way, phone): only the name and the tabs, so "Now" is on top.
   * v0.35.0 (AP29, Noah variant B): the pill "{n} more" on the kicker line opens the other trips in
   * progress (InProgress.svelte); after each change of the trip (or of its debrief) a quiet
   * "Saved ✓" shows at the end of the meta line for about 2 seconds (Noah 6b).
   */
  import { liveQuery } from 'dexie';
  import { CalendarDays, Bike, Backpack, CloudSun, ShoppingBag, Check, Pencil, Clock3 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { tripStats, RAIN } from '../trips.js';
  import { hasBike, domainOf, domainName } from '../domains.js';
  import { layerSuggest, openRows } from '../layers.js';
  import { openTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { tabsOf, tabStatus, tripDates } from '../tabs.js';
  import InProgress from './InProgress.svelte';
  import FactSheet from './FactSheet.svelte';
  import StepBar from '../ui/StepBar.svelte';
  import MainBar from '../ui/MainBar.svelte';

  // weighHint: false hides the "6 not weighed" badge (v0.30.1, Noah E4: not next to the green "Day ride created" card).
  // v0.47.1 (Noah a): edit (Plan only) turns date, duration, weather and bike into chips that change the value in place.
  let { trip, tab, kicker = '', compact = false, hint = '', action, aside = null, weighHint = true, edit = null, extra = null } = $props();

  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const debriefQ = liveQuery(() => db.debriefs.toArray());
  const items = $derived($itemsQ ?? []);
  const byBike = $derived(hasBike(trip));
  const bike = $derived(byBike ? ($bikesQ ?? []).find((b) => b.id === trip.bikeId) ?? null : null);
  const stats = $derived($itemsQ && $bagsQ ? tripStats(trip, items, $bagsQ, bike, 0) : null);
  const debrief = $derived(($debriefQ ?? []).find((d) => d.tripId === trip.id) ?? null);
  const open = $derived(byBike && $itemsQ ? openRows(layerSuggest(trip, items), trip).length : 0);
  const km = $derived(debrief?.km ?? trip.route?.km ?? null);
  const status = $derived(tabStatus(trip, { open, debrief, today: localDay(), km }));
  const tabs = $derived(tabsOf(trip));
  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const weight = $derived(stats ? stats.gearG + stats.onMeG : null);
  // v0.30.1 (Noah N8): rename any trip at any time (also a past one): tap the name, type, Enter or
  // leave the field saves; Escape keeps the old name. An empty name is not saved.
  let naming = $state(false);
  let nameDraft = $state('');
  let nameEl = $state();
  function startRename() {
    nameDraft = trip.title ?? '';
    naming = true;
  }
  $effect(() => {
    if (naming && nameEl) nameEl.focus(), nameEl.select();
  });
  async function saveName() {
    if (!naming) return;
    naming = false;
    const title = nameDraft.trim();
    if (title && title !== trip.title) await db.trips.update(trip.id, { title, updatedAt: new Date().toISOString() });
  }
  function nameKey(e) {
    if (e.key === 'Enter') (e.preventDefault(), saveName());
    else if (e.key === 'Escape') (e.preventDefault(), (naming = false));
  }
  // v0.35.0 (Noah 6b): "Saved ✓" after a change: the trip's or its debrief's updatedAt moved while
  // this trip is shown (not when another trip opens, not on the first look).
  let saved = $state(false);
  let shown = $state(false); // the text stays a moment longer, so it can fade out
  let seen = { id: null, at: null };
  let savedTimer;
  const changedAt = $derived([trip.updatedAt ?? '', debrief?.updatedAt ?? ''].join('|'));
  $effect(() => {
    const at = changedAt;
    if (seen.id === trip.id && seen.at !== null && seen.at !== at && $debriefQ) {
      saved = shown = true;
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => ((saved = false), (savedTimer = setTimeout(() => (shown = false), 450))), 2000);
    }
    if ($debriefQ) seen = { id: trip.id, at };
  });
  $effect(() => () => clearTimeout(savedTimer));
  // v0.47.1 (Noah a): the duration: hours for a one-day ride, days for a longer trip.
  const tripDays = $derived(Math.max(1, Number(trip.days) || 1));
  const duration = $derived(tripDays === 1 ? (trip.hours ? t('{n} h', { n: num(trip.hours) }) : edit ? t('Set hours') : '') : tn(tripDays, '{n} day', '{n} days'));
  let factOpen = $state(null);
  const allBikes = $derived($bikesQ ?? []);
  const wx = $derived(trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C · ${t(RAIN[trip.wx.rain ?? 'none'])}` : '');
</script>

<section class="band trip-band" class:compact aria-label={t('Trip')}>
  <div class="who">
    <div class="kline">
      {#if kicker}<p class="kick">{kicker}</p>{/if}
      <InProgress current={trip.id} />
      {@render extra?.()}
    </div>
    {#if naming}
      <input class="rename" bind:this={nameEl} bind:value={nameDraft} onkeydown={nameKey} onblur={saveName} aria-label={t('Trip name')} enterkeyhint="done" />
    {:else}
      <!-- v0.45.0 (acceptance follow-up 5): focusable from code, so a new trip announces its name. -->
      <h1 tabindex="-1" data-trip-title><button type="button" class="name" title={t('Rename trip')} onclick={startRename}>{trip.title}<Pencil class="pen" size={18} aria-hidden="true" /></button></h1>
    {/if}
    <p class="meta">
      {#if edit}
        <button type="button" class="fact" aria-label={t('Date: {value}. Change', { value: tripDates(trip) })} onclick={() => (factOpen = 'date')}><CalendarDays size={16} aria-hidden="true" />{tripDates(trip)}</button>
        <button type="button" class="fact" data-fact="duration" aria-label={t('Duration: {value}. Change', { value: duration })} onclick={() => (factOpen = 'duration')}><Clock3 size={16} aria-hidden="true" />{duration}</button>
        {#if byBike}<button type="button" class="fact" aria-label={t('Bike: {value}. Change', { value: bike?.name ?? trip.bike ?? t('No bike') })} onclick={() => (factOpen = 'bike')}><Bike size={16} aria-hidden="true" />{bike?.name ?? trip.bike ?? t('No bike')}</button>{:else}<span><Backpack size={16} aria-hidden="true" />{t(domainName(domainOf(trip)))}</span>{/if}
        {#if byBike}<button type="button" class="fact" aria-label={t('Weather: {value}. Change', { value: wx || t('No weather set') })} onclick={() => (factOpen = 'weather')}><CloudSun size={16} aria-hidden="true" />{wx || t('No weather set')}</button>{:else if wx}<span><CloudSun size={16} aria-hidden="true" />{wx}</span>{/if}
        {#if stats && stats.count}<span class="num"><ShoppingBag size={16} aria-hidden="true" /><b>{weight ? kg(weight) : '–'}</b>{#if stats.unweighed && weighHint}<i class="badge">{t('{n} not weighed', { n: stats.unweighed })}</i>{/if}</span>{/if}
      {:else}
      <span><CalendarDays size={16} aria-hidden="true" />{tripDates(trip)}</span>
      {#if duration}<span data-fact="duration"><Clock3 size={16} aria-hidden="true" />{duration}</span>{/if}
      {#if byBike}<span><Bike size={16} aria-hidden="true" />{bike?.name ?? trip.bike ?? t('No bike')}</span>{:else}<span><Backpack size={16} aria-hidden="true" />{t(domainName(domainOf(trip)))}</span>{/if}
      {#if stats && stats.count}<span class="num"><ShoppingBag size={16} aria-hidden="true" /><b>{weight ? kg(weight) : '–'}</b>{#if stats.unweighed && weighHint}<i class="badge">{t('{n} not weighed', { n: stats.unweighed })}</i>{/if}</span>{/if}
      {#if wx}<span><CloudSun size={16} aria-hidden="true" />{wx}</span>{/if}
      {/if}
      <span class="saved" class:on={saved} role="status">{#if shown}<Check size={14} aria-hidden="true" />{t('Saved')}{/if}</span>
    </p>
  </div>
  <!-- L7: no button (the debrief before the last day): no empty bar at the bottom of a phone.
       v0.67.0 (kit): the one main button sits in the MainBar of the kit (bottom of a phone). -->
  {#if action || aside || hint}
    <MainBar place="band" {aside} {hint}>{@render action?.()}</MainBar>
  {/if}
  <!-- v0.67.0 (kit, Ü1 a): the steps are the kit's StepBar, the same as on the interstitials. -->
  <div class="steps"><StepBar {trip} {tabs} {status} current={tab} onpick={() => openTrip(trip.id)} /></div>
</section>
{#if factOpen && edit}<FactSheet field={factOpen} {trip} bikes={allBikes} {edit} onclose={() => (factOpen = null)} />{/if}

<style>
  .band {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    background: var(--brand);
    color: var(--brand-ink);
    border-radius: 12px;
    padding: 16px 16px 0;
    margin: 0 0 16px;
  }
  .who {
    min-width: 0;
  }
  /* The kicker left, the "{n} more" pill right; on a narrow phone the pill may sit above the name. */
  .kline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
  }
  .kline:empty {
    display: none;
  }
  .kline :global(.ipw) {
    margin-left: auto;
  }
  .kick {
    margin: 0;
    min-width: 0;
    font-size: var(--fs-tiny);
    font-weight: 600;
    color: var(--brand-ink-2);
  }
  h1 {
    margin: 2px 0 6px;
    font: 700 var(--fs-title)/1.15 var(--font-body);
    letter-spacing: -0.01em;
    overflow-wrap: break-word;
  }
  h1 .name {
    all: unset;
    display: inline-block;
    max-width: 100%;
    box-sizing: border-box;
    cursor: pointer;
    min-height: 44px;
    padding: 6px 0;
    overflow-wrap: break-word;
  }
  h1 .name:focus-visible {
    outline: 2px solid var(--focus-on-dark);
    outline-offset: 2px;
  }
  h1 :global(.pen) {
    display: inline-block;
    vertical-align: -2px;
    margin-left: 8px;
    opacity: 0.7;
  }
  .rename {
    display: block;
    width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    margin: 2px 0 6px;
    padding: 6px 10px;
    font: 700 var(--fs-section)/1.2 var(--font-body);
    color: var(--ink);
    background: var(--input);
    border: 0;
    border-radius: 8px;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0 0 6px;
    font-size: var(--fs-small);
    color: var(--brand-ink-2);
  }
  .meta span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  /* v0.47.1 (Noah a): a fact you can change: a quiet pill, 44 px high on a phone. */
  .meta .fact {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    min-height: 36px;
    margin: 0 -4px;
    padding: 4px 10px;
    border: 1px solid color-mix(in srgb, var(--brand-ink) 22%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-ink) 8%, transparent);
    color: var(--brand-ink);
    font: inherit;
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  @media (hover: hover) {
    .meta .fact:hover {
      background: color-mix(in srgb, var(--brand-ink) 16%, transparent);
    }
  }
  .meta .fact:focus-visible {
    outline: 2px solid var(--focus-on-dark);
    outline-offset: 2px;
  }
  .meta b {
    color: var(--brand-ink);
    font-weight: 600;
  }
  /* Noah 6b: small and quiet, gone after about 2 seconds (no time, nothing that stays). */
  .meta .saved {
    gap: 4px;
    font-size: var(--fs-tiny);
    font-weight: 600;
    color: var(--brand-ink);
    background: color-mix(in srgb, var(--brand-ink) 12%, transparent);
    border-radius: 99px;
    padding: 1px 8px 1px 6px;
    opacity: 0;
    transition: opacity 0.4s;
    white-space: nowrap;
  }
  .meta .saved:empty {
    padding: 0;
  }
  .meta .saved.on {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .meta .saved {
      transition: none;
    }
  }
  .badge {
    font-style: normal;
    background: color-mix(in srgb, var(--brand-ink) 12%, transparent);
    color: var(--brand-ink);
    font-size: var(--fs-tiny);
    font-weight: 500;
    padding: 1px 7px;
    border-radius: 99px;
    white-space: nowrap;
  }

  /* Phone (Noah 3a): the next step stays at the bottom, above the bottom bar. */
  @media (max-width: 719px) {
    .meta .fact {
      min-height: 44px;
    }
    .meta:has(.fact) {
      gap: 6px 12px;
    }
    /* Noah 7a: On the way, only the name and the tabs (and "Saved ✓" for a moment, v0.35.0). */
    .compact .meta > :not(.saved),
    .compact .meta:has(.saved:empty) {
      display: none;
    }
  }
  @media (min-width: 720px) {
    .band {
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 24px;
      padding: 22px 26px 0;
    }
    .meta {
      font-size: var(--fs-body);
    }
  }
  /* v0.30.1 (Noah D6): a phone turned sideways (844×390): the band was 212 of 390 px. Compact there:
     smaller name, facts on one line, a smaller button, the four steps in one 44 px row. */
  @media (max-height: 500px) {
    .band {
      column-gap: 16px;
      padding: 8px 16px 0;
      margin-bottom: 10px;
      border-radius: 10px;
    }
    .kick {
      display: none;
    }
    /* v0.35.0: the "{n} more" pill sits next to the name (no line of its own). */
    .who {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      column-gap: 12px;
    }
    .kline {
      order: 2;
    }
    h1 {
      flex: 1 1 0;
      min-width: 0;
      margin: 0 0 2px;
      font-size: var(--fs-section);
    }
    .rename {
      flex: 1 1 0;
    }
    .meta {
      order: 3;
      flex-basis: 100%;
    }
    .meta {
      gap: 2px 12px;
      margin: 0;
      font-size: var(--fs-tiny);
    }
    /* v0.47.1: sideways the facts stay one quiet line (underlined, no pill), so the band stays low. */
    .meta .fact {
      min-height: 26px;
      margin: 0;
      padding: 0 2px;
      border: 0;
      background: none;
      text-decoration: underline dotted;
      text-underline-offset: 3px;
    }
    /* On Plan the weight is in the bike card below; sideways it leaves the facts line. */
    .meta:has(.fact) > .num {
      display: none;
    }
  }
  /* v0.67.0 (kit): the step bar spans the band; the main bar is its right column on a computer. */
  .steps {
    margin: 8px -16px 0;
  }
  @media (min-width: 720px) {
    .steps {
      grid-column: 1 / -1;
      margin: 16px -26px 0;
    }
    .band > :global(.mainbar) {
      grid-column: 2;
      grid-row: 1;
    }
  }
  @media (max-height: 500px) {
    .steps {
      margin: 6px -16px 0;
    }
  }
  @media print {
    .band {
      display: none;
    }
  }
</style>

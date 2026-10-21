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
   * v0.100.0 Design-Refresh P1 (G7 «Zurück und wo du bist», approved 11.10.2026): the band is light,
   * without a dark box: «‹ Touren» above the name, the four steps as numbered cards, and the main
   * button in the bar at the bottom («Schritt 2 von 4 · Zurück zu Touren · Weiter zu …»).
   * v0.125.0 TZ-1 «Zustand sichtbar» (mockup TZ2 Tour-Kopf): the trip's state pill (ui/TripState.svelte)
   * first on the kicker line: «Geplant · morgen», «Abgeschlossen · Rückblick fehlt», «Bewertet · 6. Sept.».
   * TZ-2 «Fest nach der Fahrt» (mockup TZ2 Tour-Kopf): `note` shows the state's band under the step bar
   * (StateNote.svelte: what the state means, «Rückblick ausfüllen», «Wieder öffnen», «Bist du gefahren?»);
   * `ontemplate` opens «Save as template» from it. «Wieder öffnen?» (ReopenSheet) opens here for this trip.
   */
  import { liveQuery } from 'dexie';
  import { CalendarDays, Bike, Backpack, CloudSun, ShoppingBag, Check, Pencil, Clock3, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { rainChance } from '../wardrobe.js';
  import { wetPct } from '../rainlimit.svelte.js';
  import { tripStats, RAIN } from '../trips.js';
  import { hasBike, domainOf, domainName } from '../domains.js';
  import { layerSuggest, openRows } from '../layers.js';
  import { openTrip } from '../nav.js';
  import { phone } from '../media.svelte.js';
  import { localDay } from '../localday.js';
  import { tabsOf, stepsOf, tabStatus, tripDates } from '../tabs.js';
  import InProgress from './InProgress.svelte';
  import FactSheet from './FactSheet.svelte';
  import StepBar from '../ui/StepBar.svelte';
  import MainBar from '../ui/MainBar.svelte';
  import { selectAll } from '../ui/selectall.js';
  import { tripStateInfo, stateExtra } from '../tripstate.js';
  import { stateExtraText } from '../tripstatetext.js';
  import TripState from '../ui/TripState.svelte';
  import StateNote from './StateNote.svelte';
  import ReopenSheet from './ReopenSheet.svelte';
  import { tz2 } from './reopen.svelte.js';
  import KomootSign from '../komoot/KomootSign.svelte';

  // weighHint: false hides the "6 not weighed" badge (v0.30.1, Noah E4: not next to the green "Day ride created" card).
  // v0.47.1 (Noah a): edit (Plan only) turns date, duration, weather and bike into chips that change the value in place.
  // SN1: stateMore adds to the pill's extra («unterwegs, Tag 2 von 3»); stepText replaces «Schritt 3 von 4» in the bar.
  let { trip, tab, kicker = '', compact = false, hint = '', action, aside = null, weighHint = true, edit = null, extra = null, stateMore = '', stepText = '', note = false, ontemplate = null, below = null } = $props();
  // Impeccable 18.10.2026 (Planen 1): `below` is a snippet drawn right under the step bar (the core line of Plan)

  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const debriefQ = liveQuery(() => db.debriefs.toArray());
  const items = $derived($itemsQ ?? []);
  const byBike = $derived(hasBike(trip));
  const bike = $derived(byBike ? ($bikesQ ?? []).find((b) => b.id === trip.bikeId) ?? null : null);
  const stats = $derived($itemsQ && $bagsQ ? tripStats(trip, items, $bagsQ, bike, 0) : null);
  const debrief = $derived(($debriefQ ?? []).find((d) => d.tripId === trip.id) ?? null);
  const ridesQ = liveQuery(() => db.rides.toArray());
  // v0.125.0 TZ-1: the state of the trip (tripstate.js) once the debriefs are read
  const stInfo = $derived($debriefQ ? tripStateInfo(trip, { debrief, rides: $ridesQ ?? [], today: localDay() }) : null);
  const stExtra = $derived(stInfo ? stateExtraText(stateExtra(stInfo, { trip, debrief, today: localDay(), head: true })) : '');
  const open = $derived(byBike && $itemsQ ? openRows(layerSuggest(trip, items), trip).length : 0);
  const km = $derived(debrief?.km ?? trip.route?.km ?? null);
  const status = $derived(tabStatus(trip, { open, debrief, today: localDay(), km }));
  const tabs = $derived(tabsOf(trip));
  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const weight = $derived(stats ? stats.packG : null); // v0.137.0 DK3: the one trip weight
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
    if (!title || title === trip.title) return;
    const id = trip.id;
    const old = trip.title;
    await db.trips.update(id, { title, updatedAt: new Date().toISOString() });
    // v0.72.0 «Feinschliff» (Umbenennen 5a): the same «Renamed to … · Undo» as everywhere else.
    offerRename(title, () => db.trips.update(id, { title: old, updatedAt: new Date().toISOString() }));
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
  // G7: «Schritt 2 von 4» in the bar at the bottom
  const stepLine = $derived(tabs.includes(tab) ? t('Step {n} of {m}', { n: tabs.indexOf(tab) + 1, m: tabs.length }) : '');
  // v0.144.0 RE «Regen überall gleich»: «trocken» only while the rain chance stays under the one rain limit
  const pctNow = $derived(rainChance(trip));
  const rainWord = $derived((trip.wx?.rain ?? 'none') === 'none' && wetPct(pctNow) ? t('{n} % rain', { n: Math.round(pctNow) }) : t(RAIN[trip.wx?.rain ?? 'none']));
  const wx = $derived(trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C · ${rainWord}` : '');
</script>

<section class="band trip-band" class:compact aria-label={t('Trip')}>
  <div class="who">
    <nav class="crumb" aria-label={t('Where you are')}><a href="#/trips"><ChevronLeft size={18} aria-hidden="true" />{t('Trips|place')}</a>{#if !phone.matches}<span class="here" aria-hidden="true"><ChevronRight size={14} />{trip.title}</span>{/if}</nav>
    <div class="kline">
      {#if stInfo?.state}<TripState state={stInfo.state} size="md" extra={stExtra && stateMore ? `${stExtra}, ${stateMore}` : stExtra} />{/if}
      {#if kicker}<p class="kick">{kicker}</p>{/if}
      <InProgress current={trip.id} light />
      {@render extra?.()}
    </div>
    {#if naming}
      <input class="rename" use:selectAll bind:this={nameEl} bind:value={nameDraft} onkeydown={nameKey} onblur={saveName} aria-label={t('Trip name')} enterkeyhint="done" />
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
        {#if stats && stats.count}<span class="num"><ShoppingBag size={16} aria-hidden="true" /><b>{weight ? kg(weight) : '–'}</b>{#if stats.packMissing && weighHint}<i class="badge">{t('{n} not weighed', { n: stats.packMissing })}</i>{/if}</span>{/if}
      {:else}
      <span><CalendarDays size={16} aria-hidden="true" />{tripDates(trip)}</span>
      {#if duration}<span data-fact="duration"><Clock3 size={16} aria-hidden="true" />{duration}</span>{/if}
      {#if byBike}<span><Bike size={16} aria-hidden="true" />{bike?.name ?? trip.bike ?? t('No bike')}</span>{:else}<span><Backpack size={16} aria-hidden="true" />{t(domainName(domainOf(trip)))}</span>{/if}
      {#if stats && stats.count}<span class="num"><ShoppingBag size={16} aria-hidden="true" /><b>{weight ? kg(weight) : '–'}</b>{#if stats.packMissing && weighHint}<i class="badge">{t('{n} not weighed', { n: stats.packMissing })}</i>{/if}</span>{/if}
      {#if wx}<span><CloudSun size={16} aria-hidden="true" />{wx}</span>{/if}
      {/if}
      <!-- SN1d (Noah 13.10.2026): «In komoot öffnen», quiet, when the route came with a komoot link -->
      {#if trip.route?.komoot}<span class="kmw"><KomootSign {trip} /></span>{/if}
      <span class="saved" class:on={saved} role="status">{#if shown}<Check size={14} aria-hidden="true" />{t('Saved')}{/if}</span>
    </p>
  </div>
  <!-- L7: no button (the debrief before the last day): no empty bar at the bottom of a phone.
       v0.67.0 (kit): the one main button sits in the MainBar of the kit (bottom of a phone). -->
  {#if action || aside || hint}
    <MainBar place="band" {aside} {hint} step={stepText || stepLine} second={{ label: t('Back to Trips'), href: '#/trips' }}>{@render action?.()}</MainBar>
  {/if}
  <!-- v0.67.0 (kit, Ü1 a): the steps are the kit's StepBar, the same as on the interstitials. -->
  <!-- «Eine Tour, eine Seite» (UI-Ziele #5, 0.174): the four steps and «Auswertung» as the tabs of the one tour -->
  <div class="steps"><StepBar {trip} tabs={stepsOf(trip)} {status} current={tab} onpick={() => openTrip(trip.id)} /></div>
  {@render below?.()}
  {#if note && stInfo?.state}<div class="stnote"><StateNote {trip} info={stInfo} {debrief} {tab} {ontemplate} bike={byBike} /></div>{/if}
</section>
{#if tz2.ask === trip.id}<ReopenSheet {trip} rated={stInfo?.state === 'rated'} onclose={() => (tz2.ask = null)} />{/if}
{#if factOpen && edit}<FactSheet field={factOpen} {trip} bikes={allBikes} {edit} onclose={() => (factOpen = null)} />{/if}

<style>
  /* v0.100.0 P1 (G7): light, on the page ground, no dark box */
  .band {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    color: var(--ink);
    margin: 0 0 16px;
  }
  /* «‹ Touren › Name»: the way back and where you are (on a phone only «‹ Touren») */
  .crumb {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    margin: 0 0 2px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .crumb a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    margin-left: -6px;
    padding: 0 6px;
    border-radius: var(--r-ctl);
    color: var(--ink);
    font-weight: 500;
    text-decoration: none;
  }
  .crumb a:hover {
    background: var(--paper-2);
  }
  .crumb .here {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .who {
    min-width: 0;
  }
  /* The kicker left, the "{n} more" pill right; on a narrow phone the pill may sit above the name. */
  .kline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
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
    color: var(--ink-3);
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
    outline: 2px solid var(--focus);
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
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-3);
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
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  @media (hover: hover) {
    .meta .fact:hover {
      background: var(--paper-2);
    }
  }
  .meta .fact:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
  .meta b {
    color: var(--ink);
    font-weight: 600;
  }
  /* Noah 6b: small and quiet, gone after about 2 seconds (no time, nothing that stays). */
  .meta .saved {
    gap: 4px;
    font-size: var(--fs-tiny);
    font-weight: 600;
    color: var(--ok);
    background: var(--ok-soft);
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
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--fs-tiny);
    font-weight: 600;
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
      margin-bottom: 10px;
    }
    .crumb {
      display: none;
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
    /* TZ-1: sideways the state pill is small and shows only its word (the extra stays in its title), so the
       name keeps its line and the band stays low (D6) */
    .kline :global(.tst.md) {
      padding: 1px var(--sp-2);
      font-size: var(--fs-tiny);
    }
    .kline :global(.tst .x) {
      display: none;
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
    margin: 8px 0 0;
  }
  @media (min-width: 720px) {
    .steps {
      grid-column: 1 / -1;
      margin: 16px 0 0;
    }
    .band > :global(.mainbar) {
      grid-column: 2;
      grid-row: 1;
    }
  }
  @media (max-height: 500px) {
    .steps {
      margin: 6px 0 0;
    }
  }
  /* TZ-2: the state's band spans the band under the step bar */
  @media (min-width: 720px) {
    .stnote {
      grid-column: 1 / -1;
    }
  }
  @media print {
    .band {
      display: none;
    }
  }
</style>

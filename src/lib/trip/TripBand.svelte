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
   */
  import { liveQuery } from 'dexie';
  import { CalendarDays, Bike, Backpack, CloudSun, ShoppingBag, Check, Pencil } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { tripStats, RAIN } from '../trips.js';
  import { hasBike, domainOf, domainName } from '../domains.js';
  import { layerSuggest, openRows } from '../layers.js';
  import { openTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { TAB_NAMES, tabsOf, tabHref, tabStatus, tripDates } from '../tabs.js';

  let { trip, tab, kicker = '', compact = false, hint = '', action, aside = null } = $props();

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
    if (title && title !== trip.title) await db.trips.update(trip.id, { title });
  }
  function nameKey(e) {
    if (e.key === 'Enter') (e.preventDefault(), saveName());
    else if (e.key === 'Escape') (e.preventDefault(), (naming = false));
  }
  const wx = $derived(trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C · ${t(RAIN[trip.wx.rain ?? 'none'])}` : '');
</script>

<section class="band trip-band" class:compact aria-label={t('Trip')}>
  <div class="who">
    {#if kicker}<p class="kick">{kicker}</p>{/if}
    {#if naming}
      <input class="rename" bind:this={nameEl} bind:value={nameDraft} onkeydown={nameKey} onblur={saveName} aria-label={t('Trip name')} enterkeyhint="done" />
    {:else}
      <h1><button type="button" class="name" title={t('Rename trip')} onclick={startRename}>{trip.title}<Pencil class="pen" size={18} aria-hidden="true" /></button></h1>
    {/if}
    <p class="meta">
      <span><CalendarDays size={16} aria-hidden="true" />{tripDates(trip)}</span>
      {#if byBike}<span><Bike size={16} aria-hidden="true" />{bike?.name ?? trip.bike ?? t('No bike')}</span>{:else}<span><Backpack size={16} aria-hidden="true" />{t(domainName(domainOf(trip)))}</span>{/if}
      {#if stats && stats.count}<span class="num"><ShoppingBag size={16} aria-hidden="true" /><b>{weight ? kg(weight) : '–'}</b>{#if stats.unweighed}<i class="badge">{t('{n} not weighed', { n: stats.unweighed })}</i>{/if}</span>{/if}
      {#if wx}<span><CloudSun size={16} aria-hidden="true" />{wx}</span>{/if}
    </p>
  </div>
  <div class="act">
    {#if aside}<span class="aside">{@render aside()}</span>{/if}
    {@render action?.()}
    {#if hint}<small class="hint">{hint}</small>{/if}
  </div>
  <nav class="steps" aria-label={t('Steps of this trip')} style:--n={tabs.length}>
    {#each tabs as key (key)}
      {@const s = status[key]}
      <a href={tabHref(key, trip)} class:done={s.done} aria-current={key === tab ? 'page' : undefined} onclick={() => openTrip(trip.id)}>
        <span class="tn">{t(TAB_NAMES[key])}</span>
        {#if s.text}<small>{#if s.done}<Check size={13} aria-hidden="true" />{/if}{s.text}</small>{/if}
      </a>
    {/each}
  </nav>
</section>

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
  .kick {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--brand-ink-2);
  }
  h1 {
    margin: 2px 0 6px;
    font: 700 23px/1.15 var(--font-body);
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }
  h1 .name {
    all: unset;
    display: inline-block;
    max-width: 100%;
    box-sizing: border-box;
    cursor: pointer;
    min-height: 44px;
    padding: 6px 0;
    overflow-wrap: anywhere;
  }
  h1 .name:focus-visible {
    outline: 2px solid var(--focus-on-dark, #fff);
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
    font: 700 20px/1.2 var(--font-body);
    color: var(--ink, #111);
    background: #fff;
    border: 0;
    border-radius: 8px;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0 0 6px;
    font-size: 14px;
    color: var(--brand-ink-2);
  }
  .meta span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .meta b {
    color: var(--brand-ink);
    font-weight: 600;
  }
  .badge {
    font-style: normal;
    background: rgba(255, 255, 255, 0.12);
    color: var(--brand-ink);
    font-size: 12px;
    font-weight: 500;
    padding: 1px 7px;
    border-radius: 99px;
    white-space: nowrap;
  }
  .steps {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    margin: 8px -16px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .steps a {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    padding: 6px 2px 8px;
    color: var(--brand-ink-2);
    text-decoration: none;
    font: 500 15px/1.15 var(--font-body);
    text-align: center;
    overflow-wrap: anywhere;
  }
  .steps a small {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    margin-top: 2px;
    font-size: 12px;
    font-weight: 400;
    color: var(--brand-ink-2);
  }
  .steps a.done small {
    color: #9fd3b2;
  }
  .steps a[aria-current='page'] {
    color: #fff;
    font-weight: 600;
  }
  .steps a[aria-current='page']::after {
    content: '';
    position: absolute;
    left: 14%;
    right: 14%;
    bottom: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: var(--hi-bright);
  }
  .band :global(:focus-visible) {
    outline-color: var(--focus-on-dark);
  }
  .act :global(.btn.hi) {
    min-height: 52px;
    padding: 10px 20px;
    font-size: 17px;
    border-radius: 8px;
    gap: 8px;
  }
  .hint {
    color: var(--brand-ink-2);
    font-size: 13px;
    text-align: right;
  }
  .aside {
    display: none;
  }

  /* Phone (Noah 3a): the next step stays at the bottom, above the bottom bar. */
  @media (max-width: 719px) {
    .act {
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(62px + env(safe-area-inset-bottom));
      z-index: 5;
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px var(--gut);
      background: rgba(236, 238, 232, 0.97);
      border-top: 1px solid var(--line);
      color: var(--ink);
    }
    .act :global(.btn.hi) {
      flex: 1;
      min-width: 0;
      white-space: normal;
      line-height: 1.2;
    }
    .aside {
      display: contents;
    }
    .hint {
      display: none;
    }
    .act :global(:focus-visible) {
      outline-color: var(--focus);
    }
    /* Noah 7a: On the way, only the name and the tabs. */
    .compact .meta {
      display: none;
    }
  }
  @media (min-width: 720px) {
    .band {
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 24px;
      padding: 22px 26px 0;
    }
    h1 {
      font-size: 32px;
    }
    .meta {
      font-size: 15px;
    }
    .act {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      gap: 6px;
    }
    .act :global(.btn.hi) {
      min-width: 260px;
    }
    .steps {
      grid-column: 1 / -1;
      margin: 16px -26px 0;
      padding: 0 10px;
      grid-template-columns: repeat(var(--n), minmax(0, 200px));
    }
    .steps a {
      flex-direction: row;
      gap: 8px;
      font-size: 16px;
      min-height: 52px;
    }
    .steps a small {
      font-size: 13px;
      margin: 0;
    }
  }
  @media print {
    .band {
      display: none;
    }
  }
</style>

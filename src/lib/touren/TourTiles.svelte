<script>
  /**
   * SN4i «Kacheln» (mockup SN4i-touren-kacheln, Noah 13.10.2026, answer 7 and second answer 2b): at the end
   * of Touren › Übersicht under «Weiter» two middle tiles and one large one:
   *   DG-O1 «Gute Tage für eine Tour»: the next 7 days at home, the best days framed (the saved home forecast,
   *         touren.js weatherWindow). It never follows the filters.
   *   DG-O2 «Offene Rückblicke»: the trips shown without a Rückblick, each with «Kurz bewerten».
   *   DG-O5 «Karte aller Touren»: the routes of the trips shown, drawn from their own points (review/RouteMap,
   *         like V7: no map tiles, no outside service), large over the whole width.
   * O2 and O5 follow the filters of the list and then carry the quiet line «gefiltert: …».
   * The tiles live in the SK page state `sk.page.trips` (sk/tiles.js SK_BIG): «…» › Ausblenden with Undo, and
   * «Wieder zeigen» for a hidden one. The material tiles DG-M1–M6 are not here (later on the page Material).
   *
   * wx: { window, tried, place } (window: weatherWindow() or null); open: rows without a Rückblick; map:
   * inzahlen.js routeMap(); filtered: the words of the active filters ('' = none); go(row) opens a trip,
   * rateHref(row) its short Rückblick;
   * chips: a snippet with the active filter chips.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { normState, skKey, hideTile, showTile } from '../sk/tiles.js';
  import { SK_BIG } from '../sk/tiles.js';
  import { changePage, putPage } from '../sk/store.js';
  import { skIcon } from '../sk/icons.js';
  import SkToast from '../sk/SkToast.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import TripState from '../ui/TripState.svelte';
  import RouteMap from '../review/RouteMap.svelte';
  import HomePlaceForm from '../know/HomePlaceForm.svelte';
  import { dates } from '../review/fmt.js';
  import { EyeOff, Sun, CloudSun, CloudRain, SlidersHorizontal, MapPin, Check, Eye } from '@lucide/svelte';

  let { wx, open = [], map, filtered = '', go = () => {}, rateHref = (r) => r.href, extraOf = () => '', chips = null } = $props();

  const PAGE = 'trips';
  const stateQ = liveQuery(() => db.settings.get(skKey(PAGE)));
  const cur = $derived(normState($stateQ?.value));
  const tiles = $derived(SK_BIG[PAGE].filter((d) => !cur.hidden.includes(d.id)));
  const hidden = $derived(SK_BIG[PAGE].filter((d) => cur.hidden.includes(d.id)));
  let note = $state(null);
  let placeOpen = $state(false);

  function hide(d) {
    const before = $state.snapshot(cur);
    changePage(PAGE, (s) => hideTile(s, d.id));
    note = { text: t('«{name}» hidden', { name: t(d.label) }), undo: () => putPage(PAGE, before) };
  }
  const wd = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  const dm = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const bestText = $derived(wx.window?.best.length ? wx.window.best.map(wd).join(` ${t('and')} `) : '');
  const rangeOf = (days) => {
    const b = days.filter((d) => d.best);
    if (!b.length) return '';
    const lo = Math.min(...b.map((d) => d.min ?? d.max));
    const hi = Math.max(...b.map((d) => d.max));
    return lo === hi ? `${hi}°` : `${lo}–${hi}°`;
  };
</script>

{#snippet head(d, sub)}
  {@const Icon = skIcon(d.icon)}
  <div class="th">
    <span class="tic" aria-hidden="true"><Icon size={20} /></span>
    <div class="tm"><h3 id="tile-{d.id}">{t(d.label)}</h3>{#if sub}<p>{sub}</p>{/if}</div>
    <MoreActions title={t(d.label)} label={t('More for {what}', { what: t(d.label) })} actions={[{ name: t('Hide'), explain: t('Comes back via «Show again»'), icon: EyeOff, run: () => hide(d) }]} />
  </div>
  {#if d.filtered && filtered}<p class="fl" data-filtered><SlidersHorizontal size={14} aria-hidden="true" />{t('filtered: {what}', { what: filtered })}</p>{/if}
{/snippet}

<section class="more" aria-labelledby="more-h" data-tour-tiles>
  <h2 id="more-h">{t('More|tiles')}</h2>
  <p class="sub">{t('Weather, open debriefs and routes · map and debriefs follow the filters above, the weather does not')}</p>
  {@render chips?.()}
  <div class="grid">
    {#each tiles as d (d.id)}
      <article class="tile {d.size}" data-tile={d.id} aria-labelledby="tile-{d.id}">
        {#if d.id === 'o1'}
          {@render head(d, t('next 7 days at home · Open-Meteo'))}
          {#if wx.window}
            <ol class="days">
              {#each wx.window.days as x (x.date)}
                {@const Icon = x.rain === 'rain' ? CloudRain : x.rain === 'showers' ? CloudSun : Sun}
                <li class:best={x.best} data-day={x.date}><b>{wd(x.date)}</b><small>{dm(x.date)}</small><Icon size={18} aria-hidden="true" /><span class="num">{x.max}°</span></li>
              {/each}
            </ol>
            <p class="line">{#if bestText}<Check size={16} aria-hidden="true" /><span><b>{t('Best days: {days}', { days: bestText })}</b> · {t('dry')}, {rangeOf(wx.window.days)}</span>{:else}{t('No dry day in sight.')}{/if}</p>
            <p class="quiet">{t('Without internet the last forecast stays with its time.')}</p>
          {:else if !wx.tried}
            <p class="quiet">{t('Loading…')}</p>
          {:else if !wx.place}
            <p class="quiet">{t('Set your home place, then the best days for a ride show here.')}</p>
            {#if placeOpen}<HomePlaceForm onchosen={() => (placeOpen = false)} />{:else}<button type="button" class="btn k" onclick={() => (placeOpen = true)}><MapPin size={16} aria-hidden="true" /><span class="kl">{t('Set home place')}</span></button>{/if}
          {:else}
            <p class="quiet">{t('No forecast right now. It needs the internet once.')}</p>
          {/if}
        {:else if d.id === 'o2'}
          {@render head(d, open.length ? tn(open.length, '{n} trip still without a debrief', '{n} trips still without a debrief') : t('every trip has its debrief'))}
          {#if open.length}
            <ul class="open">
              {#each open.slice(0, 4) as r (r.id)}
                <li data-open={r.id}>
                  <span class="ot"><b>{r.title}</b><small>{dates(r.start, r.end)} · <TripState state="done" extra={extraOf(r)} /></small></span>
                  <a class="btn k" href={rateHref(r)} onclick={() => go(r)} aria-label="{t('Rate briefly')}: {r.title}"><span class="kl">{t('Rate briefly')}</span></a>
                </li>
              {/each}
            </ul>
            {#if open.length > 4}<p class="quiet">{t('{n} more in the list above.', { n: open.length - 4 })}</p>{/if}
            <p class="quiet">{t('«Rate briefly» opens the short debrief; the whole one stays in the trip.')}</p>
          {:else}
            <p class="quiet">{filtered ? t('No trip of this filter is without a debrief.') : t('Nothing open. Every trip shown has its debrief.')}</p>
          {/if}
        {:else if d.id === 'o5'}
          {@render head(d, map.routes.length ? tn(map.routes.length, '{n} route · stretches ridden often are stronger', '{n} routes · stretches ridden often are stronger') : '')}
          {#if map.routes.length}
            <RouteMap {map} />
            <p class="quiet">{t('Drawn from the points of the routes, without map tiles: works offline and costs nothing.')}</p>
          {:else}
            <p class="quiet">{t('No route saved yet. A GPX route or an uploaded ride draws it here.')}</p>
          {/if}
        {/if}
      </article>
    {/each}
  </div>
  {#if hidden.length}
    <p class="again">
      {#each hidden as d (d.id)}<button type="button" class="btn btn-link" onclick={() => changePage(PAGE, (s) => showTile(s, d.id))} data-show-tile={d.id}><Eye size={16} aria-hidden="true" />{t('Show «{name}» again', { name: t(d.label) })}</button>{/each}
    </p>
  {/if}
</section>
<SkToast bind:note />

<style>
  .more {
    margin: 32px 0 0;
  }
  .more h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
  }
  .sub {
    margin: 2px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .grid {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .tile {
    min-width: 0;
    padding: 16px 18px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .tile.big {
    grid-column: 1 / -1;
  }
  /* the map over the whole width stays at a calm height (the drawing keeps its proportions) */
  .tile.big :global(.rmap svg) {
    display: block;
    max-height: 420px;
    margin: 0 auto;
  }
  .th {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .tic {
    flex: none;
    margin-top: 2px;
    color: var(--ink-2);
  }
  .tm {
    flex: 1;
    min-width: 0;
  }
  .tm h3 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .tm p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .fl {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }
  .days li {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 0;
    padding: 8px 0;
    border: 2px solid transparent;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .days li.best {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .days b {
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .days .num {
    color: var(--ink);
    font-weight: 600;
  }
  .line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .line b {
    color: var(--ink);
  }
  .quiet {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .open {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  .open li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 8px 0;
  }
  .open li + li {
    border-top: 1px solid var(--line);
  }
  .ot {
    display: grid;
    /* Durchklick DK7a: a long trip name without spaces wraps */
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ot small {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .open .btn {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
  .again {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 10px 0 0;
  }
  .again .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
</style>

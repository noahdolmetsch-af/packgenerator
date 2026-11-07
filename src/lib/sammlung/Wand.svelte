<script>
  /**
   * «Sammel-Wand» (Neuer Schwung, Idee F, Noah 05.11.2026): Touren › Rückblick › Sammel-Wand. The stamps of the tour pass,
   * the passes, the places of the Gipfelbuch, the new ground of Neuland and the stars on one page, only to look at: a few of
   * each, «All» opens the full list. No goal, no percentage, no streak. Nothing here is changed; every shelf is edited where it lives.
   * Neuland is counted after the first paint (it loads map data) and only when something was ridden.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { PASS_KEY, stateOf as stampsOf, newestFirst as newestStamps } from '../tourenpass/pass.js';
  import { PAESSE_KEY, stateOf as passesOf, newestFirst as newestPasses } from '../paesse/sammlung.js';
  import { GB_KEY, bookOf } from '../gipfelbuch.js';
  import { readRaw, computeFrom } from '../neuland/store.js';
  import { tracksOf, neulandSummary } from '../neuland/neuland.js';
  import Stempel from '../tourenpass/Stempel.svelte';
  import Passschild from '../paesse/Passschild.svelte';
  import Empty from '../ui/Empty.svelte';
  import { SHELF_SHOWN, recent, highestPlaces, totals, isEmpty } from './wand.js';
  import { Stamp, Mountain, MountainSnow, Compass, Star, ChevronRight } from '@lucide/svelte';

  const dataQ = liveQuery(async () => {
    const [pass, paesse, gb, stars] = await Promise.all([
      db.settings.get(PASS_KEY),
      db.settings.get(PAESSE_KEY),
      db.settings.get(GB_KEY),
      db.flowStars ? db.flowStars.count().catch(() => 0) : 0,
    ]);
    return { stamps: stampsOf(pass?.value).stamps, passes: passesOf(paesse?.value).list, book: bookOf(gb?.value), stars };
  });
  const data = $derived($dataQ ?? null);

  // Neuland: counted once the data is there; null = still counting, 'none' = nothing ridden yet
  const rawQ = liveQuery(() => readRaw(db));
  let ground = $state.raw(null);
  $effect(() => {
    const raw = $rawQ;
    if (!raw) return;
    const today = localDay();
    if (!tracksOf({ trips: raw.trips, rides: raw.rides, activities: raw.activities, today }).length) return void (ground = { n: 0, parts: [] });
    let live = true;
    computeFrom(raw, { today })
      .then((r) => live && (ground = neulandSummary(r, null)))
      .catch((err) => {
        console.error(err);
        if (live) ground = { n: 0, parts: [], failed: true };
      });
    return () => (live = false);
  });

  const stamps = $derived(data ? newestStamps(data.stamps) : []);
  const passes = $derived(data ? newestPasses(data.passes) : []);
  const book = $derived(data?.book ?? bookOf(null));
  const tops = $derived(data ? highestPlaces(book) : []);
  const tot = $derived(totals({ stamps, passes, book, neuland: ground ? ground.n : null, stars: data?.stars ?? 0 }));
  const lately = $derived(data ? recent({ stamps, passes, book }) : []);

  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const KIND = { stamp: 'Stamp|wall', pass: 'Pass|wall', place: 'Place|wall' };
  const NG_LINK = (cid) => `#/neuland?c=${encodeURIComponent(cid)}`;
</script>

<div class="wand" data-wand>
  <p class="lead">{t('Everything you collected, on one page. It only shows what is there: no goal, no count of what is missing. Each shelf is changed where it lives.')}</p>

  {#if !data || (!ground && isEmpty(tot))}
    <p class="quiet" data-wand-loading>{t('Loading …')}</p>
  {:else if ground && isEmpty(tot)}
    <Empty icon={Stamp} title={t('Nothing on the wall yet')} text={t('Stamps, passes, summits and new ground appear here as soon as you collect them. They come from your looks back and your rides; you can also add your own.')} action={{ label: t('Open the tour pass'), href: '#/debrief/tourenpass', explain: t('A stamp for every trip you looked back on') }} action2={{ label: t('Open the passes'), href: '#/debrief/paesse' }} />
  {:else}
    <ul class="tiles" data-wand-tiles>
      <li><a class="tile" href="#/debrief/tourenpass" data-wand-tile="stamps"><b class="num">{num(tot.stamps)}</b><span>{t('Stamps|wall')}</span></a></li>
      <li><a class="tile" href="#/debrief/paesse" data-wand-tile="passes"><b class="num">{num(tot.passes)}</b><span>{t('Passes')}</span></a></li>
      <li><a class="tile" href="#/flow/gipfelbuch" data-wand-tile="places"><b class="num">{num(tot.places)}</b><span>{t('Places|wall')}</span></a></li>
      <li><a class="tile" href="#/neuland" data-wand-tile="neuland"><b class="num">{tot.neuland == null ? '…' : num(tot.neuland)}</b><span>{t('New ground')}</span></a></li>
      <li><a class="tile" href="#/flow/milestones" data-wand-tile="stars"><b class="num">{num(tot.stars)}</b><span>{t('Stars')}</span></a></li>
    </ul>

    {#if lately.length}
      <section aria-labelledby="wa-new" data-wand-recent>
        <h2 id="wa-new">{t('Added lately')}</h2>
        <ul class="late">
          {#each lately as r (r.kind + r.id)}
            <li><a href={r.href} data-wand-late={r.kind}><b>{r.name}</b><small>{[t(KIND[r.kind]), r.m ? t('{m} m', { m: num(r.m) }) : '', dayText(r.date)].filter(Boolean).join(' · ')}</small><ChevronRight size={16} aria-hidden="true" /></a></li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="card shelf" aria-labelledby="wa-stamps" data-shelf="stamps">
      <div class="sh">
        <h2 id="wa-stamps"><Stamp size={18} aria-hidden="true" />{t('Tour pass')}{#if tot.stamps}<span class="cnt num">{tot.stamps}</span>{/if}</h2>
        <a class="all" href="#/debrief/tourenpass">{t('All|wall')}<ChevronRight size={14} aria-hidden="true" /></a>
      </div>
      {#if stamps.length}
        <ul class="stamps">
          {#each stamps.slice(0, SHELF_SHOWN.stamps) as s (s.id)}
            <li><Stempel id={s.id} place={s.place} date={dayText(s.date)} km={s.km} /></li>
          {/each}
        </ul>
        {#if stamps.length > SHELF_SHOWN.stamps}<p class="quiet">{tn(stamps.length - SHELF_SHOWN.stamps, '{n} more stamp in the tour pass.', '{n} more stamps in the tour pass.')}</p>{/if}
      {:else}
        <p class="quiet" data-shelf-empty>{t('No stamp yet. After you save the look back of a trip, the app offers one. You can also add your own.')} <a href="#/debrief/tourenpass">{t('Open the tour pass')}</a></p>
      {/if}
    </section>

    <section class="card shelf" aria-labelledby="wa-passes" data-shelf="passes">
      <div class="sh">
        <h2 id="wa-passes"><Mountain size={18} aria-hidden="true" />{t('Passes')}{#if tot.passes}<span class="cnt num">{tot.passes}</span>{/if}</h2>
        <a class="all" href="#/debrief/paesse">{t('All|wall')}<ChevronRight size={14} aria-hidden="true" /></a>
      </div>
      {#if passes.length}
        <ul class="signs">
          {#each passes.slice(0, SHELF_SHOWN.passes) as p (p.id)}
            <li><Passschild name={p.name} m={p.m} date={dayText(p.date)} /></li>
          {/each}
        </ul>
        {#if passes.length > SHELF_SHOWN.passes}<p class="quiet">{tn(passes.length - SHELF_SHOWN.passes, '{n} more pass in your collection.', '{n} more passes in your collection.')}</p>{/if}
      {:else}
        <p class="quiet" data-shelf-empty>{t('No pass yet. Rides that crossed a well-known pass are suggested; you can also add one yourself.')} <a href="#/debrief/paesse">{t('Open the passes')}</a></p>
      {/if}
    </section>

    <section class="card shelf" aria-labelledby="wa-places" data-shelf="places">
      <div class="sh">
        <h2 id="wa-places"><MountainSnow size={18} aria-hidden="true" />{t('Summit book')}{#if tot.places}<span class="cnt num">{tot.places}</span>{/if}</h2>
        <a class="all" href="#/flow/gipfelbuch">{t('All|wall')}<ChevronRight size={14} aria-hidden="true" /></a>
      </div>
      {#if tops.length}
        <ul class="rows">
          {#each tops as r (r.id)}
            <li data-place={r.id}><b>{r.name}</b><span class="num">{t('{m} m', { m: num(r.ele) })}</span><small>{dayText(r.last)}</small></li>
          {/each}
        </ul>
        {#if tot.places > tops.length}<p class="quiet">{t('The highest ones. The others, with their sports, are in the summit book.')}</p>{/if}
      {:else if tot.places}
        <p class="quiet">{tn(tot.places, '{n} place in the summit book (without a height).', '{n} places in the summit book (without a height).')} <a href="#/flow/gipfelbuch">{t('Open the summit book')}</a></p>
      {:else}
        <p class="quiet" data-shelf-empty>{t('No place yet. A ride with a high point suggests one; you can also enter a place yourself, for any sport.')} <a href="#/flow/gipfelbuch">{t('Open the summit book')}</a></p>
      {/if}
    </section>

    <section class="card shelf" aria-labelledby="wa-ground" data-shelf="neuland">
      <div class="sh">
        <h2 id="wa-ground"><Compass size={18} aria-hidden="true" />{t('New ground')}{#if tot.neuland}<span class="cnt num">{tot.neuland}</span>{/if}</h2>
        <a class="all" href="#/neuland">{t('All|wall')}<ChevronRight size={14} aria-hidden="true" /></a>
      </div>
      {#if !ground}
        <p class="quiet" data-wand-counting>{t('Counting …')}</p>
      {:else if ground.parts.length}
        <ul class="chips">
          {#each ground.parts as p (p.cid)}
            <li><a class="chip" href={NG_LINK(p.cid)} data-wand-ground={p.cid}>{p.text}</a></li>
          {/each}
        </ul>
      {:else if ground.failed}
        <p class="quiet" data-shelf-empty>{t('New ground could not be counted just now.')} <a href="#/neuland">{t('Open New ground')}</a></p>
      {:else}
        <p class="quiet" data-shelf-empty>{t('Nothing counted yet. Cantons, municipalities, passes and lakes you reach for the first time on a ride appear here.')} <a href="#/neuland">{t('Open New ground')}</a></p>
      {/if}
    </section>

    <section class="card shelf" aria-labelledby="wa-stars" data-shelf="stars">
      <div class="sh">
        <h2 id="wa-stars"><Star size={18} aria-hidden="true" />{t('Stars')}{#if tot.stars}<span class="cnt num">{tot.stars}</span>{/if}</h2>
        <a class="all" href="#/flow/milestones">{t('All|wall')}<ChevronRight size={14} aria-hidden="true" /></a>
      </div>
      {#if tot.stars}
        <p class="quiet">{tn(tot.stars, '{n} star reached. Stars stay, even when a rhythm pauses.', '{n} stars reached. Stars stay, even when a rhythm pauses.')} <a href="#/flow/milestones">{t('Open the milestones')}</a></p>
      {:else}
        <p class="quiet" data-shelf-empty>{t('No star yet. Stars come by themselves from what you do in Aktiv and on rides; none is a duty.')} <a href="#/flow/milestones">{t('Open the milestones')}</a></p>
      {/if}
    </section>

    <p class="next" data-wand-next>{t('Next:')} <a href="#/jahr">{t('Your year as pictures')}<ChevronRight size={14} aria-hidden="true" /></a> · <a href="#/heatmap">{t('Heatmap')}<ChevronRight size={14} aria-hidden="true" /></a> · <a href="#/me/frei/sammlungen">{t('Your own collections')}<ChevronRight size={14} aria-hidden="true" /></a></p>
  {/if}
</div>

<style>
  .wand {
    display: grid;
    gap: var(--sp-4);
    max-width: 720px;
  }
  .lead,
  .quiet {
    margin: 0;
    color: var(--ink-2);
  }
  .quiet {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    font: 600 var(--fs-h3, 1.05rem) / 1.2 var(--font-body);
  }
  .sh h2 {
    margin: 0;
  }
  .cnt {
    color: var(--ink-3);
    font-weight: 500;
  }
  .sh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin-bottom: 10px;
  }
  .all,
  .next a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
  }
  .next {
    margin: 0;
    color: var(--ink-3);
  }
  .next a {
    min-height: 0;
  }
  .shelf {
    padding: 14px 16px;
  }
  .tiles,
  .late,
  .stamps,
  .signs,
  .rows,
  .chips {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 96px), 1fr));
    gap: 8px;
  }
  .tile {
    display: grid;
    gap: 2px;
    justify-items: center;
    align-content: center;
    min-height: 64px;
    padding: 8px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--card);
    color: var(--ink);
    text-align: center;
    text-decoration: none;
  }
  .tile b {
    font: 700 var(--fs-section) / 1.1 var(--font-body);
  }
  .tile span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .late {
    display: grid;
    gap: 6px;
  }
  .late a {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 8px;
    align-items: center;
    min-height: 48px;
    padding: 6px 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    color: var(--ink);
    text-decoration: none;
  }
  .late small {
    grid-column: 1;
    color: var(--ink-3);
  }
  .late b {
    overflow-wrap: break-word;
  }
  .late :global(svg) {
    grid-column: 2;
    grid-row: 1 / span 2;
    color: var(--ink-3);
  }
  .stamps {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr));
    gap: 10px;
    justify-items: center;
  }
  .signs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr));
    gap: 10px;
  }
  .rows {
    display: grid;
    gap: 6px;
  }
  .rows li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
  }
  .rows small {
    color: var(--ink-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--card-line);
    border-radius: 999px;
    color: var(--ink);
    text-decoration: none;
  }
  .shelf :global(.quiet) {
    margin-top: 8px;
  }
</style>

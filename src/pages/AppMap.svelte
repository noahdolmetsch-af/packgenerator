<script>
  /**
   * «Karte der App» (Noah 28.10.2026 «1a und c und d alle», step 5 of «Pfad auf jeder Seite anzeigen»): Ich › Karte der App
   * (#/me/karte). Since 23.11.2026 (Noah «1a 2b 3a 4a 5a», Schritte 1 und 4) a sketch: the places of the bar (read from nav.js), each
   * with its pages as points: a filled dot = opened on this device or used according to your data, a ring = never opened, a star = new
   * in the last two weeks. A tap on a point goes there. The filters «Never opened» and «New» answer «what do I not know yet?».
   * «All n functions» opens the list of a place with the path of each function. Built from the catalogue (lib/appmap.js): never out of
   * date. «Opened» is counted per device (quick/usage.js), nothing else is stored.
   */
  import { liveQuery } from 'dexie';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { db } from '../lib/db.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { ChevronDown, ChevronRight, Star } from '@lucide/svelte';
  import { buildMap, filterMap, filterPoints, markOf, freshIds, mapSize, pathText } from '../lib/appmap.js';
  import { featureData, usedOf } from '../lib/know/featureData.js';
  import { USAGE_KEYS, cleanUsage } from '../lib/quick/usage.js';
  import { deviceKind } from '../lib/quick/quicklinks.js';
  import { localDay } from '../lib/localday.js';
  import '../lib/ich/ich.css';

  const full = buildMap();
  let q = $state('');
  let filter = $state('all');
  const FILTERS = [
    { key: 'all', label: 'All|map' },
    { key: 'never', label: 'Never opened' },
    { key: 'new', label: 'New|map' },
  ];
  const dataQ = liveQuery(async () => ({ fd: await featureData(), u: cleanUsage((await db.settings.get(USAGE_KEYS[deviceKind()]))?.value) }));
  const used = $derived(usedOf($dataQ?.fd));
  const state = $derived({ opened: $dataQ?.u.opened ?? {}, used, fresh: freshIds(localDay()) });
  const total = full.reduce((n, g) => n + g.items.length, 0);
  const searching = $derived(q.trim() !== '');
  const shown = $derived(searching ? filterMap(full, q, t) : filterPoints(full, filter, state));
  const places = $derived(shown.length);
  const countOpen = (g) => g.points.filter((p) => markOf(p, state) === 'open').length;
  const markName = { open: 'Opened', never: 'Never opened', new: 'New|map' };
</script>

<div class="am-page ich-page" data-appmap>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Map of the app')} sub={t('Every place of the app and what lives there')} />

  <div class="ich-main">
    <section class="ich-sec" aria-labelledby="am-h">
      <div class="ich-h">
        <div>
          <h2 id="am-h">{t('Places of the app')}</h2>
          <p class="ich-hs" data-am-count>{searching ? t('{n} functions in {places} places', { n: mapSize(shown), places }) : $dataQ ? t('{n} of {total} tried', { n: used.size, total }) : t('{total} functions in {places} places', { total, places: full.length })}</p>
        </div>
      </div>
      <p class="am-help">{t('Each point is a page. A filled dot: you opened it or your data shows you used it. A ring: never opened. A star: new in the last two weeks. Tap a point to go there.')}</p>
      <div class="am-filter" role="group" aria-label={t('Show')}>
        {#each FILTERS as f (f.key)}
          <button type="button" class="am-chip" class:on={filter === f.key} aria-pressed={filter === f.key} onclick={() => (filter = f.key)} data-am-filter={f.key}>{t(f.label)}</button>
        {/each}
      </div>
      <p class="am-help"><a href="#/features" data-am-catalogue>{t('Functions by situation, with search ›')}</a></p>
      <input class="am-search" type="search" bind:value={q} placeholder={t('Search the map')} aria-label={t('Search the map')} data-am-search />

      {#each shown as g (g.key)}
        <section class="card am-place" data-am-place={g.key} aria-label={t(g.label)}>
          <header>
            <b>{t(g.label)}</b>
            <small>{searching ? g.items.length : t('{n} of {m} opened', { n: countOpen(g), m: g.points.length })}</small>
          </header>
          {#if !searching}
            <ul class="am-points">
              {#each g.points as p (p.path)}
                {@const m = markOf(p, state)}
                <li>
                  {#if p.href}
                    <a href={p.href} class="am-pt {m}" data-am-point={p.path} data-am-mark={m} title={t(markName[m])}><span class="am-dot" aria-hidden="true">{#if m === 'new'}<Star size={10} />{/if}</span><span class="sr">{t(markName[m])}: </span>{t(p.title)}</a>
                  {:else}
                    <span class="am-pt {m}" data-am-point={p.path} data-am-mark={m}><span class="am-dot" aria-hidden="true"></span><span class="sr">{t(markName[m])}: </span>{t(p.title)}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
          <details class="am-all" open={searching}>
            <summary>{tn(g.items.length, 'All {n} function', 'All {n} functions')}<ChevronDown class="am-chev" size={18} aria-hidden="true" /></summary>
            <ul class="am-list">
              {#each g.items as i (i.id)}
                <li data-am-item={i.id}>
                  {#if i.href}
                    <a href={i.href}>
                      <span class="am-t"><b>{t(i.title)}</b><small>{pathText(i, t)}</small></span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </a>
                  {:else}
                    <div class="am-row">
                      <span class="am-t"><b>{t(i.title)}</b><small>{pathText(i, t)}</small></span>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          </details>
        </section>
      {:else}
        <p class="am-help" data-am-none>{searching ? t('Nothing found. Try another word.') : t('Nothing here. You have opened everything in this filter.')}</p>
      {/each}
    </section>
  </div>
</div>

<style>
  .am-page {
    max-width: 760px;
  }
  .am-help {
    margin: 0 2px 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .am-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
  }
  .am-chip {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .am-chip.on {
    border-color: var(--hi);
    background: color-mix(in srgb, var(--hi) 10%, var(--paper));
  }
  .am-search {
    width: 100%;
    min-height: 44px;
    margin: 0 0 12px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 10px;
    font: inherit;
  }
  .am-place {
    margin-bottom: 10px;
    padding: 0;
  }
  .am-place > header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 12px 14px 4px;
  }
  .am-place > header small {
    margin-left: auto;
    color: var(--ink-3);
  }
  .am-points {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 6px 10px 10px;
  }
  .am-pt {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    max-width: 100%;
    padding: 0 12px 0 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    text-decoration: none;
    overflow-wrap: break-word;
  }
  a.am-pt:hover {
    border-color: var(--hi);
  }
  .am-dot {
    flex: none;
    display: grid;
    place-items: center;
    width: 12px;
    height: 12px;
    border: 2px solid var(--ink-3);
    border-radius: 50%;
    box-sizing: border-box;
    color: var(--paper);
  }
  .am-pt.open .am-dot {
    border-color: var(--hi);
    background: var(--hi);
  }
  .am-pt.new .am-dot {
    width: 16px;
    height: 16px;
    border-color: var(--hi);
    background: var(--hi);
  }
  .am-all summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 0 14px;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-small);
    cursor: pointer;
    list-style: none;
  }
  .am-all summary::-webkit-details-marker {
    display: none;
  }
  .am-all[open] :global(.am-chev) {
    transform: rotate(180deg);
  }
  .am-list {
    list-style: none;
    margin: 0;
    padding: 0 0 6px;
  }
  .am-list a,
  .am-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 6px 14px;
    color: inherit;
    text-decoration: none;
  }
  .am-t {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .am-t small {
    color: var(--ink-3);
  }
</style>

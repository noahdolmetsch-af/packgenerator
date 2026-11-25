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
  import KarteSkizze from '../lib/ich/KarteSkizze.svelte';
  import { ChevronDown, ChevronRight, Star } from '@lucide/svelte';
  import { buildMap, buildTree, filterMap, filterPoints, markOf, freshIds, mapSize, pathText } from '../lib/appmap.js';
  import { featureData, usedOf } from '../lib/know/featureData.js';
  import { USAGE_KEYS, cleanUsage } from '../lib/quick/usage.js';
  import { deviceKind } from '../lib/quick/quicklinks.js';
  import { localDay } from '../lib/localday.js';
  import '../lib/ich/ich.css';

  const full = buildMap();
  let q = $state('');
  let filter = $state('all');
  // the three views of the map (Noah 24.11.2026 «beide»): the list (the tree, the default), the cycle of a tour and the mind map
  let view = $state('list');
  const VIEWS = [
    { key: 'list', label: 'List|view' },
    { key: 'mind', label: 'Mind map|view' },
  ];
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

{#snippet pageList(pages)}
  <ul class="am-pages">
    {#each pages as p (p.path)}
      {@const m = markOf(p, state)}
      <li>
        {#if p.href}
          <a href={p.href} class="am-pg {m}" data-am-point={p.path} data-am-mark={m}><span class="am-dot" aria-hidden="true">{#if m === 'new'}<Star size={10} />{/if}</span><span class="sr">{t(markName[m])}: </span><span class="am-pt-t">{t(p.title)}</span><ChevronRight size={16} aria-hidden="true" /></a>
        {:else}
          <span class="am-pg {m}" data-am-point={p.path} data-am-mark={m}><span class="am-dot" aria-hidden="true"></span><span class="sr">{t(markName[m])}: </span><span class="am-pt-t">{t(p.title)}</span></span>
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

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
      <div class="am-filter" role="group" aria-label={t('Map view')}>
        {#each VIEWS as v (v.key)}
          <button type="button" class="am-chip" class:on={view === v.key} aria-pressed={view === v.key} onclick={() => (view = v.key)} data-am-view={v.key}>{t(v.label)}</button>
        {/each}
      </div>
      {#if view !== 'list'}
        <KarteSkizze map={full} marks={state} pages={pageList} />
      {:else}
      <p class="am-help">{t('Tap a place to see its tabs, then a tab to see its pages. A filled dot: you opened the page or your data shows you used it. A ring: never opened. A star: new in the last two weeks.')}</p>
      <div class="am-filter" role="group" aria-label={t('Show')}>
        {#each FILTERS as f (f.key)}
          <button type="button" class="am-chip" class:on={filter === f.key} aria-pressed={filter === f.key} onclick={() => (filter = f.key)} data-am-filter={f.key}>{t(f.label)}</button>
        {/each}
      </div>
      <p class="am-help"><a href="#/features" data-am-catalogue>{t('Functions by situation, with search ›')}</a></p>
      <input class="am-search" type="search" bind:value={q} placeholder={t('Search the map')} aria-label={t('Search the map')} data-am-search />

      {#each shown as g (g.key)}
        {@const tree = searching ? [] : buildTree(g)}
        {@const names = tree.filter((x) => x.key !== 'rest' && x.key !== 'windows').map((x) => t(x.label)).join(' · ')}
        <details class="card am-place" data-am-place={g.key} open={searching || filter !== 'all'}>
          <summary class="am-sum" aria-label={t(g.label)}>
            <span class="am-head">
              <b>{t(g.label)}</b>
              <small>{searching ? tn(g.items.length, '{n} function', '{n} functions') : t('{n} of {m} opened', { n: countOpen(g), m: g.points.length })}</small>
              {#if names}<small class="am-tabs" data-am-tabs>{names}</small>{/if}
            </span>
            <ChevronDown class="am-chev" size={18} aria-hidden="true" />
          </summary>
          {#if !searching}
            {#each tree as tab (tab.key)}
              {#if tree.length === 1}
                {@render pageList(tab.pages)}
              {:else}
                <details class="am-tab" data-am-tab={tab.key} open={filter !== 'all' || tab.pages.length <= 5}>
                  <summary><span>{t(tab.label)}</span><small>{tab.pages.length}</small><ChevronDown class="am-chev" size={16} aria-hidden="true" /></summary>
                  {@render pageList(tab.pages)}
                </details>
              {/if}
            {/each}
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
        </details>
      {:else}
        <p class="am-help" data-am-none>{searching ? t('Nothing found. Try another word.') : t('Nothing here. You have opened everything in this filter.')}</p>
      {/each}
      {/if}
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
  .am-sum {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 10px 14px;
    cursor: pointer;
    list-style: none;
  }
  .am-sum::-webkit-details-marker,
  .am-tab > summary::-webkit-details-marker {
    display: none;
  }
  .am-head {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
  }
  .am-head b {
    font-size: var(--fs-body);
  }
  .am-head small {
    color: var(--ink-3);
  }
  .am-place[open] > .am-sum :global(.am-chev),
  .am-tab[open] > summary :global(.am-chev) {
    transform: rotate(180deg);
  }
  .am-tab > summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 14px;
    border-top: 1px solid var(--line);
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }
  .am-tab > summary small {
    margin-left: auto;
    color: var(--ink-3);
    font-weight: 400;
  }
  .am-pages {
    list-style: none;
    margin: 0;
    padding: 0 0 6px;
  }
  .am-pg {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 4px 14px 4px 22px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .am-pt-t {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  a.am-pg:hover {
    background: color-mix(in srgb, var(--hi) 6%, var(--paper));
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
  .am-pg.open .am-dot {
    border-color: var(--hi);
    background: var(--hi);
  }
  .am-pg.new .am-dot {
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

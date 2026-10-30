<script>
  /**
   * «Karte der App» (Noah 28.10.2026 «1a und c und d alle», step 5 of «Pfad auf jeder Seite anzeigen»): Ich › Karte der App
   * (#/me/karte). Every place of the app with its functions and their path, built from the catalogue (lib/appmap.js),
   * so it is never out of date. A search narrows it; a tap on a function goes there. Nothing is stored.
   */
  import { t } from '../lib/i18n.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import { buildMap, filterMap, mapSize, pathText } from '../lib/appmap.js';
  import '../lib/ich/ich.css';

  const full = buildMap();
  let q = $state('');
  const shown = $derived(filterMap(full, q, t));
</script>

<div class="am-page ich-page" data-appmap>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Map of the app')} sub={t('Every place of the app and what lives there')} />

  <div class="ich-main">
    <section class="ich-sec" aria-labelledby="am-h">
      <div class="ich-h">
        <div>
          <h2 id="am-h">{t('Places of the app')}</h2>
          <p class="ich-hs" data-am-count>{t('{n} functions in {places} places', { n: mapSize(shown), places: shown.length })}</p>
        </div>
      </div>
      <p class="am-help">{t('Each line shows the path: the place first, then the function. Tap a line to go there. The list is made from the catalogue and is always up to date.')}</p>
      <input class="am-search" type="search" bind:value={q} placeholder={t('Search the map')} aria-label={t('Search the map')} data-am-search />

      {#each shown as g (g.key)}
        <details class="card am-place" data-am-place={g.key} open={q.trim() !== ''}>
          <summary>
            <b>{t(g.label)}</b>
            <small>{g.items.length}</small>
            <ChevronDown class="am-chev" size={20} aria-hidden="true" />
          </summary>
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
      {:else}
        <p class="am-help" data-am-none>{t('Nothing found. Try another word.')}</p>
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
  .am-place summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 14px;
    cursor: pointer;
    list-style: none;
  }
  .am-place summary::-webkit-details-marker {
    display: none;
  }
  .am-place summary small {
    margin-left: auto;
    color: var(--ink-3);
  }
  .am-place[open] :global(.am-chev) {
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

<script>
  /**
   * «Heute als Begleiter» PR 7 (Noah 28.10.2026 «1a 2a 3a»): «Belongs to packing». Small jump links to the functions of the
   * same moment. Since 26.11.2026 (Noah «Ja» to «Touren-Seite klarer», open question 2) the row no longer stands on the page:
   * it is a part of the «?» window (nav/HelpButton), so every page starts with its content (Content first). Only a suggestion.
   */
  import { liveQuery } from 'dexie';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { featureData, usedOf } from './featureData.js';
  import { goFeature } from './featureRun.js';
  import { momentName } from '../home/momentcard.js';
  import { NOT_KEY, notForMeOf } from '../ruhig/weniger.js';
  import { PAGE_MOMENT, HUB_ONLY, gehoertDazu, allHref, showsRow } from './gehoert.js';
  import { pageOf } from '../nav.js';
  import { parseBikesHash } from '../bikes.js';

  // hash: the page the «?» window belongs to; onpick: the window closes when a link is taken
  let { hash = '', onpick = () => {} } = $props();
  const page = $derived(pageOf(hash, parseBikesHash(hash).tab === 'care'));
  const moment = $derived(showsRow(page, hash) ? (PAGE_MOMENT[page] ?? null) : null);
  const dataQ = liveQuery(featureData);
  const notQ = liveQuery(async () => notForMeOf((await db.settings.get(NOT_KEY))?.value));
  const row = $derived(moment && $dataQ && $notQ ? gehoertDazu({ moment, here: `#/${page}`, used: usedOf($dataQ), notForMe: $notQ, under: HUB_ONLY.includes(page) }) : null);
</script>

{#if row && row.items.length}
  <nav class="gd" aria-labelledby="gd-h" data-gehoert={moment}>
    <h3 id="gd-h">{t('Belongs to {moment}', { moment: t(momentName(moment)) })}</h3>
    <ul>
      {#each row.items as f (f.id)}
        <li><button type="button" class="chip" onclick={() => { onpick(); goFeature(f, {}); }} data-gehoert-item={f.id}>{t(f.title)}</button></li>
      {/each}
      {#if row.total > row.items.length}<li><a class="chip more" href={allHref(moment)} onclick={onpick} data-gehoert-all>{t('all {n} ›', { n: row.total })}</a></li>{/if}
    </ul>
  </nav>
{/if}

<style>
  .gd {
    margin: 0;
  }
  h3 {
    margin: 0 0 6px;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-2);
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .more {
    border-style: dashed;
    color: var(--ink-2);
  }
</style>

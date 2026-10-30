<script>
  /**
   * «Heute als Begleiter» PR 7 (Noah 28.10.2026 «1a 2a 3a»): «Belongs to packing». Small jump links to the functions of the
   * same moment, on top of the page. Only a suggestion: «Hide» puts it away for this page (kept on this device).
   */
  import { liveQuery } from 'dexie';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { featureData, usedOf } from './featureData.js';
  import { goFeature } from './featureRun.js';
  import { momentName } from '../home/momentcard.js';
  import { NOT_KEY, notForMeOf } from '../ruhig/weniger.js';
  import { PAGE_MOMENT, gehoertDazu, allHref } from './gehoert.js';

  let { page = '', hash = '' } = $props();
  const moment = $derived(PAGE_MOMENT[page] ?? null);
  const dataQ = liveQuery(featureData);
  const notQ = liveQuery(async () => notForMeOf((await db.settings.get(NOT_KEY))?.value));
  const row = $derived(moment && $dataQ && $notQ ? gehoertDazu({ moment, here: `#/${page}`, used: usedOf($dataQ), notForMe: $notQ }) : null);
</script>

{#if row && row.items.length}
  <nav class="gd" aria-labelledby="gd-h" data-gehoert={moment}>
    <h2 id="gd-h">{t('Belongs to {moment}', { moment: t(momentName(moment)) })}</h2>
    <ul>
      {#each row.items as f (f.id)}
        <li><button type="button" class="chip" onclick={() => goFeature(f, {})} data-gehoert-item={f.id}>{t(f.title)}</button></li>
      {/each}
      {#if row.total > row.items.length}<li><a class="chip more" href={allHref(moment)} data-gehoert-all>{t('all {n} ›', { n: row.total })}</a></li>{/if}
    </ul>
  </nav>
{/if}

<style>
  .gd {
    margin: 0 0 12px;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  h2 {
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
    border-radius: 999px;
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

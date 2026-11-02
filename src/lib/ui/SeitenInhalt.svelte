<script>
  /**
   * «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a», «einverstanden»): «What you can do here» on top of a page: each
   * function of the page with what it is for, and «How it works» (steps and example) to open. × folds the card to one quiet
   * line for this page (kept in settings, so in the backup); the line opens it again. Data: src/lib/seiteninhalt.js.
   */
  import { liveQuery } from 'dexie';
  import { ChevronDown, ChevronRight, X } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { pageContent, pageKey, SHOWN, FOLD_KEY, foldedOf } from '../seiteninhalt.js';

  let { hash = '' } = $props();
  const rows = $derived(pageContent(hash));
  const key = $derived(pageKey(hash));
  const foldQ = liveQuery(async () => foldedOf((await db.settings.get(FOLD_KEY))?.value));
  const folded = $derived(!!$foldQ?.[key]);
  let all = $state(false);
  let open = $state({});
  const shown = $derived(all ? rows : rows.slice(0, SHOWN));

  async function setFold(on) {
    const cur = foldedOf((await db.settings.get(FOLD_KEY))?.value);
    if (on) cur[key] = true;
    else delete cur[key];
    await db.settings.put({ key: FOLD_KEY, value: cur });
  }
</script>

{#if rows.length && $foldQ}
  {#if folded}
    <button type="button" class="si-line" onclick={() => setFold(false)} data-seiteninhalt-line>{t('What you can do here')} <span class="num">{rows.length}</span><ChevronRight size={16} aria-hidden="true" /></button>
  {:else}
    <section class="si" aria-labelledby="si-h" data-seiteninhalt={key}>
      <div class="si-head">
        <h2 id="si-h">{t('What you can do here')}</h2>
        <button type="button" class="si-x" aria-label={t('Fold to one line')} onclick={() => setFold(true)} data-seiteninhalt-fold><X size={18} aria-hidden="true" /></button>
      </div>
      <ul>
        {#each shown as r (r.id)}
          <li data-seiteninhalt-item={r.id}>
            <b>{t(r.title)}</b>
            <span class="si-what">{t(r.text)}</span>
            {#if r.steps.length || r.example}
              <button type="button" class="si-how" aria-expanded={!!open[r.id]} onclick={() => (open = { ...open, [r.id]: !open[r.id] })}>
                {#if open[r.id]}<ChevronDown size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}{t('How it works')}
              </button>
              {#if open[r.id]}
                <div class="si-body" data-seiteninhalt-how={r.id}>
                  {#if r.steps.length}<ol>{#each r.steps as s (s)}<li>{t(s)}</li>{/each}</ol>{/if}
                  {#if r.example}<p class="si-ex">{t(r.example)}</p>{/if}
                </div>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>
      {#if rows.length > SHOWN}<button type="button" class="si-all" onclick={() => (all = !all)}>{all ? t('Show fewer') : t('Show all {n}', { n: rows.length })}</button>{/if}
    </section>
  {/if}
{/if}

<style>
  .si {
    margin: 0 0 12px;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .si-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-2);
  }
  ul {
    display: grid;
    gap: 10px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
  li b {
    display: block;
  }
  .si-what {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .si-how,
  .si-all,
  .si-line,
  .si-x {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .si-x {
    min-width: 44px;
    justify-content: center;
    color: var(--ink-3);
  }
  .si-line {
    margin: 0 0 8px;
    color: var(--ink-2);
  }
  .si-body {
    padding: 4px 0 2px;
    font-size: var(--fs-small);
  }
  .si-body ol {
    margin: 0 0 6px;
    padding-left: 20px;
  }
  .si-ex {
    margin: 0;
    color: var(--ink-3);
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>

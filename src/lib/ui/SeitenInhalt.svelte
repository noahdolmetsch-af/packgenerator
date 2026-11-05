<script>
  /**
   * «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a», «einverstanden»): «What you can do here» on top of a page: each
   * function of the page with what it is for, and «How it works» (steps and example) to open. «Fold» folds the card to one
   * line for this page (kept in settings, so in the backup); the line opens it again («Open»). Nothing is deleted. All
   * folds can be undone at once under Appearance (SeitenInhaltReset.svelte). Data: src/lib/seiteninhalt.js.
   */
  import { liveQuery } from 'dexie';
  import { ChevronDown, ChevronRight, ChevronUp, Lightbulb } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { pageContent, pagePattern, SHOWN, FOLD_KEY, SEEN_KEY, foldMapOf, isFolded, seenMapOf, newSince } from '../seiteninhalt.js';
  import { loadWissen } from '../wissen/load.js';
  import { loadHandbook } from '../handbook/load.js';

  let { hash = '' } = $props();
  // the tips load with the first card, not at the start (scripts/size-guard.mjs); rows show without them until then
  let know = $state({});
  loadWissen().then((w) => (know = w));
  // the same for the steps and examples (the handbook)
  let handbook = $state({});
  loadHandbook().then((h) => (handbook = h.HANDBOOK));
  const rows = $derived(pageContent(hash, undefined, know, handbook));
  const key = $derived(pagePattern(hash)); // one fold choice for all trips (#/debrief/:trip), not one per trip
  const foldQ = liveQuery(async () => foldMapOf((await db.settings.get(FOLD_KEY))?.value));
  const folded = $derived(isFolded($foldQ, key));
  const seenQ = liveQuery(async () => seenMapOf((await db.settings.get(SEEN_KEY))?.value));
  // new functions on this page since the card was last folded or opened: a dot on the folded line
  const fresh = $derived(newSince($seenQ, key, rows.length));
  let all = $state(false);
  let open = $state({});
  const shown = $derived(all ? rows : rows.slice(0, SHOWN));
  // a new page starts short and closed again (the card stays mounted when only the hash changes)
  let seen = '';
  $effect.pre(() => {
    if (key === seen) return;
    seen = key;
    all = false;
    open = {};
  });

  async function setFold(on) {
    const cur = foldMapOf((await db.settings.get(FOLD_KEY))?.value);
    cur[key] = on;
    await db.settings.put({ key: FOLD_KEY, value: cur });
    // what the card showed now counts as seen, so «new» only means what comes later
    const seen = seenMapOf((await db.settings.get(SEEN_KEY))?.value);
    seen[key] = rows.length;
    await db.settings.put({ key: SEEN_KEY, value: seen });
  }
</script>

{#if rows.length && $foldQ}
  {#if folded}
    <button type="button" class="si-line" onclick={() => setFold(false)} data-seiteninhalt-line>
      <Lightbulb size={16} aria-hidden="true" /><span class="si-linet">{t('What you can do here')} <span class="num">{rows.length}</span></span>{#if fresh}<span class="si-new" data-seiteninhalt-new title={t('{n} new on this page', { n: fresh })}>{t('{n} new', { n: fresh })}</span>{/if}<span class="si-open">{t('Open the card')}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
  {:else}
    <section class="si" aria-labelledby="si-h" data-seiteninhalt={key}>
      <div class="si-head">
        <h2 id="si-h">{t('What you can do here')}</h2>
        <button type="button" class="si-x" aria-label={t('Fold to one line')} onclick={() => setFold(true)} data-seiteninhalt-fold><ChevronUp size={16} aria-hidden="true" />{t('Fold the card')}</button>
      </div>
      <ul>
        {#each shown as r (r.id)}
          <li data-seiteninhalt-item={r.id}>
            <b>{t(r.title)}</b>
            <span class="si-what">{t(r.text)}</span>
            {#if r.know}<span class="si-know" data-seiteninhalt-know={r.id}><Lightbulb size={14} aria-hidden="true" /><span><b>{t('Good to know')}</b> {t(r.know)}</span></span>{/if}
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
  .si-know {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    margin-top: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .si-know :global(svg) {
    flex: none;
    margin-top: 3px;
    color: var(--hi);
  }
  .si-know b {
    display: inline;
    font-weight: 600;
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
    color: var(--ink-2);
  }
  /* the folded line: a quiet bar, but with its own frame and a word, so it is not taken for a leftover */
  .si-line {
    width: 100%;
    margin: 0 0 8px;
    padding: 0 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink-2);
  }
  .si-linet {
    flex: 1;
    text-align: left;
    white-space: nowrap;
  }
  .si-open {
    color: var(--hi);
  }
  .si-new {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--hi);
    color: var(--paper);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  /* A phone held sideways has no room above the trip band: the folded line waits until the phone is upright again. */
  @media (orientation: landscape) and (max-height: 500px) {
    .si-line {
      display: none;
    }
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

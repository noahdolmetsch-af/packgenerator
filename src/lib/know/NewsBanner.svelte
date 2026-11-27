<script>
  /**
   * v0.127.0 A-U1 «Update-Hinweis als Banner statt Fenster» (Noah 13.10.2026 «3a»), moved under Ich on 20.10.2026
   * («Heute neu» A 5b). «Banner Was ist neu» (Noah 23.11.2026 «1-5a»): back on Today under the chips, once «since your last
   * visit» (almost every merge is a version, so not one banner per version). × closes it until the next update; after
   * BANNER_DAYS days it goes by itself (wasneu.js messageOn).
   * «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a»): the line became a small card with the two newest news, each with its PR number,
   * the first step of how to test it, «Show me», «Works» and «Does not work» (know/TestRow.svelte); «+N more» opens the window
   * with every news since the last visit and all its steps (NeuSeitSheet, view by version); «All news with test steps» goes to
   * Me › What is new. The text is never cut: a title wraps (Noah 27.11.2026 «Text abgeschnitten»).
   */
  import { shortVersion } from '../whatsnew.js';
  import { NEWS_HREF } from './wasneu.js';
  import { writeMute, readResults } from './wasneuStore.js';
  import TestRow from './TestRow.svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { X, Sparkles } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { snapDb, snapshotFor } from '../maintenance/snapshots.js';

  let { entries = [], from = null, onclose } = $props();
  // «Zwei Neuheiten-Hinweise» (Noah 25.11.2026 «b»): «+N more» opens the same window as the card at the end of Today
  // (know/NeuSeitSheet.svelte); closing it counts the news as seen.
  let sheet = $state(false);
  function sheetClosed() {
    sheet = false;
    window.dispatchEvent(new CustomEvent('neuseit-seen'));
    done();
  }
  // «App-Wartung» BF4 (Noah 13.10.2026): one calm line when the app kept a copy before this update
  const snapQ = liveQuery(() => snapshotFor(snapDb(), typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : ''));
  const e = $derived(entries[0] ?? null);
  const items = $derived(entries.filter((x) => x.title).slice(0, 2).length ? entries.filter((x) => x.title).slice(0, 2) : entries.slice(0, 1));
  const more = $derived(entries.length - items.length);
  let results = $state(readResults());
  $effect(() => {
    const again = () => (results = readResults());
    window.addEventListener('pg:tested', again);
    return () => window.removeEventListener('pg:tested', again);
  });
  // × and the tap on a title close it for this version (until the next update; back under Ich › Was ist neu)
  function done() {
    if (e) writeMute(e.version);
    onclose?.();
  }
  // the jump and the catalogue load on the tap only, so Today stays light (like the tile «New»)
  async function show(entry) {
    done();
    const { goNews, tryOf } = await import('./newsRun.js');
    const row = tryOf(entry);
    if (row) goNews(row.p);
    else location.hash = NEWS_HREF;
  }
</script>

{#if e}
  <aside class="nbanner" aria-labelledby="nb-h" data-news-banner>
    <div class="nb-head">
      <Sparkles size={20} aria-hidden="true" class="nb-i" />
      <h2 id="nb-h">{t('New since your last visit')}</h2>
      <button type="button" class="nb-x" aria-label={t('Close the hint')} onclick={done} data-news-close><X size={20} aria-hidden="true" /></button>
    </div>
    {#each items as it (it.version)}
      <div class="nb-item" data-news-item={it.version}>
        <a class="nb-title" href={NEWS_HREF} onclick={done} data-news-title><b>{t('New: {title}', { title: t(it.title ?? '') })}</b></a>
        <small class="nb-pr num" data-news-pr>{it.pr ? t('PR {n}', { n: it.pr }) : ''}{it.pr ? ' · ' : ''}{t('Version {v}', { v: shortVersion(it.version) })}</small>
        <TestRow e={it} pr={it.pr ?? null} result={results.get(it.version)?.result ?? null} compact onshow={() => show(it)} />
      </div>
    {/each}
    <div class="nb-foot">
      {#if more > 0}<button type="button" class="nb-more" aria-label={tn(more, 'and {n} more thing', 'and {n} more things')} onclick={() => (sheet = true)} data-news-more>{t('+{n} more', { n: more })}</button>{/if}
      <a class="nb-all" href={NEWS_HREF} onclick={done} data-news-all>{t('All news with test steps')} ›</a>
    </div>
    {#if $snapQ}<p class="nb-snap" data-news-snapshot>{t('Your data was backed up before the update. Something wrong?')} <a href="#/me/data?at=before-updates">{t('Back to the state before the update')}</a></p>{/if}
  </aside>
{/if}
{#if sheet}
  {#await import('./NeuSeitSheet.svelte') then m}<m.default {from} view="version" onclose={sheetClosed} />{/await}
{/if}

<style>
  /* «Nie abgeschnitten» (Noah 27.11.2026): titles and steps wrap to as many lines as they need */
  .nbanner {
    margin: var(--sp-2) 0;
    padding: 4px 14px 6px;
    border-radius: var(--radius-card);
    background: var(--ok-soft);
    color: var(--ink);
  }
  .nb-head {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
  }
  .nb-head :global(.nb-i) {
    flex: none;
  }
  h2 {
    flex: 1 1 0;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .nb-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-right: -10px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }
  .nb-x:hover {
    background: color-mix(in srgb, var(--ink) 8%, transparent);
  }
  .nb-item {
    padding: 8px 0 0;
    border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  }
  .nb-title {
    display: block;
    color: var(--ink);
    font-size: var(--fs-body);
    line-height: 1.3;
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .nb-title b {
    font-weight: 600;
  }
  .nb-pr {
    display: block;
    margin-top: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nb-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--sp-3);
    border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  }
  .nb-more,
  .nb-all {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .nb-more {
    color: var(--ink-2);
  }
  .nb-snap {
    margin: 0 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .nb-snap a {
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>

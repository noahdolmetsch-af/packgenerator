<script>
  /**
   * v0.127.0 A-U1 «Update-Hinweis als Banner statt Fenster» (Noah 13.10.2026 «3a»), moved under Ich on 20.10.2026
   * («Heute neu» A 5b). «Banner Was ist neu» (Noah 23.11.2026 «1-5a»): back on Today, as ONE narrow line right
   * under the chips (the Heute owner's wish: «Abhaken» stays on top). «New: <newest> · and 3 more things», once
   * «since your last visit» (almost every merge is a version, so not one banner per version). «Show me» jumps to
   * the new place (the «Try it» of Was ist neu, know/newsRun.js), a tap on the text opens the whole list, × closes
   * it until the next update; after BANNER_DAYS days it goes by itself (wasneu.js messageOn).
   */
  import { shortVersion } from '../whatsnew.js';
  import { NEWS_HREF } from './wasneu.js';
  import { writeMute } from './wasneuStore.js';
  import { t, tn } from '../i18n.svelte.js';
  import { X, Sparkles } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { snapDb, snapshotFor } from '../maintenance/snapshots.js';

  let { entries = [], from = null, onclose } = $props();
  // «Zwei Neuheiten-Hinweise» (Noah 25.11.2026 «b»): a tap on «and N more things» opens the same window as the card at the end of Today
  // (know/NeuSeitSheet.svelte, the news by place), so there is one way into the list. Closing it counts the news as seen.
  let sheet = $state(false);
  function sheetClosed() {
    sheet = false;
    window.dispatchEvent(new CustomEvent('neuseit-seen'));
    done();
  }
  // «App-Wartung» BF4 (Noah 13.10.2026): one calm line when the app kept a copy before this update
  const snapQ = liveQuery(() => snapshotFor(snapDb(), typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : ''));
  const e = $derived(entries[0] ?? null);
  const more = $derived(entries.length - 1);
  // × «Show me» and a tap on the text all close it for this version (until the next update; back under Ich › Was ist neu)
  function done() {
    if (e) writeMute(e.version);
    onclose?.();
  }
  // the jump and the catalogue load on the tap only, so Today stays light (like the tile «New»)
  async function show(ev) {
    ev.preventDefault();
    const entry = e;
    done();
    const { goNews, tryOf } = await import('./newsRun.js');
    const row = tryOf(entry);
    if (row) goNews(row.p);
    else location.hash = NEWS_HREF;
  }
</script>

{#if e}
  <aside class="nbanner" aria-labelledby="nb-h" data-news-banner>
    <Sparkles size={20} aria-hidden="true" class="nb-i" />
    <h2 id="nb-h" class="sr">{t('New in {v}|banner', { v: shortVersion(e.version) })}</h2>
    <div class="nb-t">
      <a class="nb-title" href={NEWS_HREF} onclick={done} data-news-title><b>{t('New: {title}', { title: t(e.title) })}</b></a>
      {#if more > 0}{@const word = tn(more, 'and {n} more thing', 'and {n} more things')}<button type="button" class="nb-more" aria-label={word} onclick={() => (sheet = true)} data-news-more><span class="nb-long">{word}</span><span class="nb-short" aria-hidden="true">+{more}</span></button>{/if}
    </div>
    <a class="nb-go" href={NEWS_HREF} onclick={show} data-news-go>{t('Show me')}</a>
    <button type="button" class="nb-x" aria-label={t('Close the hint')} onclick={done}><X size={20} aria-hidden="true" /></button>
    {#if $snapQ}<p class="nb-snap" data-news-snapshot>{t('Your data was backed up before the update. Something wrong?')} <a href="#/me/data?at=before-updates">{t('Back to the state before the update')}</a></p>{/if}
  </aside>
{/if}
{#if sheet}
  {#await import('./NeuSeitSheet.svelte') then m}<m.default {from} onclose={sheetClosed} />{/await}
{/if}

<style>
  .nbanner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--sp-2);
    margin: var(--sp-2) 0;
    padding: 0 6px 0 var(--sp-3);
    min-height: 44px;
    border-radius: var(--radius-card);
    background: var(--ok-soft);
    color: var(--ink);
  }
  .nbanner :global(.nb-i) {
    flex: none;
  }
  .nb-t {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nb-title {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ink);
    font-size: var(--fs-body);
    text-decoration: none;
  }
  .nb-title b {
    font-weight: 600;
  }
  .nb-more {
    flex: 0 1 auto;
    min-width: 0;
    min-height: 44px;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-body);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .nb-short {
    display: none;
  }
  /* a phone: the title keeps its room, «and 15 more things» becomes a «+15» to tap */
  @media (max-width: 520px) {
    .nb-long {
      display: none;
    }
    .nb-short {
      display: inline;
      font-weight: 600;
    }
    .nb-more {
      flex: none;
      min-width: 44px;
      padding: 0 6px;
      color: var(--ink);
      text-decoration: none;
    }
  }
  .nb-go {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 6px;
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .nb-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }
  .nb-x:hover {
    background: color-mix(in srgb, var(--ink) 8%, transparent);
  }
  .nb-snap {
    flex: 1 0 100%;
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

<script>
  /**
   * «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a»), changed 09.11.2026 (Noah «ja, 1-3», Durchklick-Fund 1): «What you can do here»
   * is no second help any more. The content (each function with what it is for, «Good to know», «How it works») lives in the «?»
   * window of the page (nav/HelpButton, list in SeitenInhaltListe.svelte), the one help place. On the page only this one line stays,
   * behind the page's title (nachtitel.js); a tap opens the «?» window. The dot «n new» counts the functions added since the user
   * last opened it. Nothing is deleted. Data: src/lib/seiteninhalt.js.
   */
  import { liveQuery } from 'dexie';
  import { ChevronRight, Lightbulb } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { pageContent, pagePattern, SEEN_KEY, seenMapOf, newSince } from '../seiteninhalt.js';
  import { afterTitle } from './nachtitel.js';

  let { hash = '' } = $props();
  const rows = $derived(pageContent(hash));
  const key = $derived(pagePattern(hash)); // one place for all trips (#/debrief/:trip), not one per trip
  const seenQ = liveQuery(async () => seenMapOf((await db.settings.get(SEEN_KEY))?.value));
  // new functions on this page since the «?» window was last opened from this line: a dot on the line
  const fresh = $derived(newSince($seenQ, key, rows.length));

  async function openHelp() {
    window.dispatchEvent(new Event('pg:help'));
    // what the window shows now counts as seen, so «new» only means what comes later
    const seen = seenMapOf((await db.settings.get(SEEN_KEY))?.value);
    seen[key] = rows.length;
    await db.settings.put({ key: SEEN_KEY, value: seen });
  }
</script>

<div class="si-host" data-seiteninhalt-host use:afterTitle>
{#if rows.length && $seenQ}
  <button type="button" class="si-line" onclick={openHelp} aria-haspopup="dialog" data-seiteninhalt-line>
    <Lightbulb size={16} aria-hidden="true" /><span class="si-linet">{t('What you can do here')} <span class="num">{rows.length}</span></span>{#if fresh}<span class="si-new" data-seiteninhalt-new title={t('{n} new on this page', { n: fresh })}>{t('{n} new', { n: fresh })}</span>{/if}<span class="si-open">{t('Open the help')}</span><ChevronRight size={16} aria-hidden="true" />
  </button>
{/if}
</div>

<style>
  /* the host only carries the place: it has no box of its own, and is hidden until nachtitel.js has put it behind the title */
  .si-host {
    display: contents;
  }
  .si-host:not([data-placed]) {
    display: none;
  }
  .si-line {
    grid-column: 1 / -1; /* in a page laid out as a grid the line spans the row */
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    /* the line is a quiet bar, but with its own frame and a word, so it is not taken for a leftover */
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 8px 0;
    padding: 0 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink-2);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .si-linet {
    flex: 1;
    min-width: 0; /* the text may wrap on a 320 px phone: the line never makes its parent wider than the screen */
    text-align: left;
  }
  .si-open {
    color: var(--hi);
    white-space: nowrap;
  }
  .si-new {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--hi);
    color: var(--paper);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  /* A phone held sideways has no room above the trip band: the line waits until the phone is upright again. */
  @media (orientation: landscape) and (max-height: 500px) {
    .si-line {
      display: none;
    }
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>

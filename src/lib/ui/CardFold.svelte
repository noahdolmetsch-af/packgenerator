<script>
  /**
   * Durchklick Etappe 2, Frage 1a (Noah 05.11.2026): wraps a card that may start as one line on a phone («Belongs to …»,
   * «All here»). Folded: a framed line with the card's name and «Open the card». Open: the card and, on the pages that start
   * folded, a quiet «Fold the card». The choice is kept per card id in the settings. Rules: kartenzeile.js.
   */
  import { liveQuery } from 'dexie';
  import { ChevronDown, ChevronUp } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { phone } from '../media.svelte.js';
  import { CARDS_KEY, START_FOLDED, openMapOf, cardFolded } from './kartenzeile.js';

  let { id, label = '', count = 0, children } = $props();
  const mapQ = liveQuery(async () => openMapOf((await db.settings.get(CARDS_KEY))?.value));
  const first = $derived(START_FOLDED.includes(id));
  const folded = $derived($mapQ ? cardFolded($mapQ, id, phone.matches) : false);

  async function setOpen(on) {
    const cur = openMapOf((await db.settings.get(CARDS_KEY))?.value);
    cur[id] = on;
    await putSetting(db, CARDS_KEY, cur);
  }
</script>

{#if $mapQ}
  {#if folded}
    <button type="button" class="cf-line" onclick={() => setOpen(true)} data-card-line={id}>
      <span class="cf-name">{label}{#if count}{" "}<span class="num">{count}</span>{/if}</span><span class="cf-open">{t('Open the card')}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
  {:else}
    {@render children()}
    {#if first && phone.matches}
      <button type="button" class="cf-fold" onclick={() => setOpen(false)} data-card-fold={id}><ChevronUp size={16} aria-hidden="true" />{t('Fold the card')}</button>
    {/if}
  {/if}
{/if}

<style>
  .cf-line,
  .cf-fold {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  /* the folded line looks like the one of «What you can do here»: framed and with a word, so it is not taken for a leftover */
  .cf-line {
    width: 100%;
    margin: 0 0 8px;
    padding: 0 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .cf-name {
    flex: 1;
    min-width: 0;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cf-open {
    color: var(--hi);
    white-space: nowrap;
  }
  .cf-fold {
    margin: -6px 0 6px;
  }
  /* A phone held sideways keeps its few lines for the page (like «What you can do here»). */
  @media (orientation: landscape) and (max-height: 500px) {
    .cf-line {
      display: none;
    }
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>

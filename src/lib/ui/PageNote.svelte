<script>
  /**
   * Impeccable Touren (Noah 24.11.2026 «1-5a», 4c; Block 1 «Inhalt zuerst»): an explanation that used to stand as a paragraph
   * above the content of a page. Now one closed line at the end of the page; nothing is lost, it is one tap away.
   */
  import { ChevronDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { text } = $props();
</script>

<details class="pgnote" data-page-note>
  <summary><span>{t('How this page works')}</span><ChevronDown class="pgn-chev" size={18} aria-hidden="true" /></summary>
  <p class="pgn-text">{text}</p>
</details>

<style>
  .pgnote {
    margin-top: var(--sp-5, 24px);
    border-top: 1.5px solid var(--line);
  }
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    padding: 10px 2px;
    color: var(--ink-2);
    font-size: var(--fs-body);
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .pgnote[open] :global(.pgn-chev) {
    transform: rotate(180deg);
  }
  .pgn-text {
    max-width: 65ch;
    margin: 0 2px 12px;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
</style>

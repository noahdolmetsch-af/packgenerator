<script>
  /**
   * Gesamttest 21.10.2026 C7: the quiet text button under a list shortened on a phone, «{n} weitere zeigen»,
   * like «Show {n} more» in Learned.svelte (.lmore): ink colour, underlined, at least 44 px high.
   * n: how many rows are hidden; onclick shows them; any data-* attribute passes through.
   */
  import { t } from '../i18n.svelte.js';

  let { n, onclick, ...rest } = $props();
</script>

<button type="button" class="showmore" {onclick} {...rest}>{t('Show {n} more', { n })}</button>

<style>
  .showmore {
    display: block;
    min-height: 44px;
    margin-top: var(--sp-1);
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-align: left;
    cursor: pointer;
  }
</style>

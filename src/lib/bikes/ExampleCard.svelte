<script>
  /**
   * «Beispiele auf leeren Seiten» (Noah 1.11.2026): where a Velos page is empty, a small card shows how it will look
   * with fictional values. It is marked «Example», cannot be tapped and is never saved. rows: [[left, right], …].
   */
  import { t } from '../i18n.svelte.js';
  let { title, rows = [] } = $props();
</script>

<section class="ex" data-example aria-label={t('Example, not your data')}>
  <header><b>{title}</b><span class="tag">{t('Example')}</span></header>
  <ul>
    {#each rows as [a, b]}<li><span>{a}</span><span class="v">{b}</span></li>{/each}
  </ul>
  <small>{t('Made-up values. Your own show here once you add a bike.')}</small>
</section>

<style>
  .ex {
    display: grid;
    gap: 8px;
    margin-top: var(--sp-3);
    padding: var(--sp-3);
    border: 1px dashed var(--line);
    border-radius: var(--radius-card);
    color: var(--ink-2);
    font-size: var(--fs-small);
    pointer-events: none;
    user-select: none;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  header b {
    color: var(--ink);
  }
  .tag {
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2, var(--line));
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .v {
    color: var(--ink-3);
    white-space: nowrap;
  }
  small {
    color: var(--ink-3);
  }
</style>

<script>
  /** Hobby pages: the record wall, the personal bests that have data (flowms.js records). */
  import { val, dayWord } from './words.js';
  import { t } from '../../i18n.svelte.js';
  let { list = [], today } = $props();
</script>

{#if list.length}
  <ul class="wall">
    {#each list as r (r.id)}
      <li data-rec={r.id}><b class="num">{val(r.value, r.unit)}</b><small>{t(r.what)}{#if r.day}{' · '}{dayWord(r.day, today)}{/if}</small></li>
    {/each}
  </ul>
{:else}
  <p class="none">{t('Your bests appear here as soon as there is something to show.')}</p>
{/if}

<style>
  .wall {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wall li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 12px 14px;
    border-radius: var(--radius-card);
    background: var(--ink);
    color: var(--paper);
  }
  .wall b {
    font: 800 var(--fs-title)/1 var(--font-brand);
    color: var(--l2-soft);
  }
  .wall small {
    font-size: var(--fs-small);
  }
  .none {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>

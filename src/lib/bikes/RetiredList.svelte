<script>
  /**
   * «Velos ausmustern» (Noah 1.11.2026 «1-5 a»): the retired bikes at the bottom of the bike page, folded.
   * Each row: name, why and when, «Bring back» and «Edit» (the edit window also holds «Delete»).
   */
  import { Archive, RotateCcw, Pencil } from '@lucide/svelte';
  import { t, tn, dateOf } from '../i18n.svelte.js';

  let { bikes = [], onrestore, onedit } = $props();
  const WORDS = { sold: 'Sold', given: 'Given away', broken: 'Broken|reason', other: 'Other reason' };
  const line = (b) => [b.retired ? t(WORDS[b.retired.reason] ?? WORDS.other) : t('Archived'), b.retired?.at ? dateOf(b.retired.at) : '', b.retired?.note ?? ''].filter(Boolean).join(' · ');
</script>

{#if bikes.length}
  <details class="retired" data-retired-list>
    <summary><Archive size={18} aria-hidden="true" /><span>{tn(bikes.length, '{n} retired bike', '{n} retired bikes')}</span></summary>
    <p class="note">{t('Their trips, km and services stay and still count in your reviews. They are not offered when you choose a bike.')}</p>
    <ul>
      {#each bikes as b (b.id)}
        <li data-retired-row={b.id}>
          <span class="who"><b>{b.name}</b><small>{line(b)}</small></span>
          <button type="button" class="btn rb" onclick={() => onrestore?.(b)} data-retired-restore><RotateCcw size={16} aria-hidden="true" />{t('Bring back')}</button>
          <button type="button" class="btn rb" onclick={() => onedit?.(b)}><Pencil size={16} aria-hidden="true" />{t('Edit|bike')}</button>
        </li>
      {/each}
    </ul>
  </details>
{/if}

<style>
  .retired {
    margin: 24px 0 0;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 14px;
    cursor: pointer;
    font-weight: 600;
  }
  .note {
    margin: 0;
    padding: 0 14px 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
    line-height: 1.4;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0 14px 12px;
    display: grid;
    gap: 10px;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .who {
    flex: 1 1 180px;
    min-width: 0;
    display: grid;
  }
  .who b,
  .who small {
    overflow-wrap: break-word;
  }
  .who small {
    color: var(--ink-2);
  }
  .rb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
</style>

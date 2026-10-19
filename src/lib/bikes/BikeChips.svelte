<script>
  /**
   * Impeccable Runde 2 (18.10.2026, Ausstattung 2): the bike choice of the Velo pages in one place
   * (it was built four times). On a computer a row of chips that wraps, as before. On a phone ONE row
   * to swipe sideways: the chosen bike stands first, the right end fades out, so the page's content
   * starts on the first screen. Used by Werkstatt & Belege, Ausstattung and Setup; the bike page
   * (SetupBand, a tab list with «+ Velo») has the same phone look.
   *
   * bikes    the bikes in their order
   * current  the chosen bike's id (null: «all»)
   * all      the label of an «All bikes» chip in front, or '' for none
   * onpick   (id | null) => void
   */
  import { Bike } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { bikes = [], current = null, all = '', onpick, label = '' } = $props();
  let row = $state();
  // the chosen bike moves to the front; show the row from its start again
  $effect(() => {
    void current;
    if (row) row.scrollLeft = 0;
  });
</script>

<div class="bike-row" bind:this={row} role="group" aria-label={label || t('Bike')}>
  {#if all}<button type="button" class="bk" aria-pressed={!current} onclick={() => onpick?.(null)}>{all}</button>{/if}
  {#each bikes as b (b.id)}
    <button type="button" class="bk" aria-pressed={b.id === current} onclick={() => onpick?.(b.id)}>{#if b.id === current}<Bike size={16} aria-hidden="true" />{/if}<span>{b.name}</span></button>
  {/each}
</div>

<style>
  .bike-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 20px;
    min-width: 0;
  }
  .bk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    max-width: 100%;
    padding: 0 16px;
    box-sizing: border-box;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .bk span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bk:hover {
    background: var(--paper-2);
  }
  .bk[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  @media (max-width: 599px) {
    .bike-row {
      flex-wrap: nowrap;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      padding-right: 32px;
      -webkit-mask-image: linear-gradient(to right, var(--ink) calc(100% - 40px), transparent);
      mask-image: linear-gradient(to right, var(--ink) calc(100% - 40px), transparent);
    }
    .bike-row::-webkit-scrollbar {
      display: none;
    }
    .bk {
      flex: none;
      max-width: 80vw;
    }
    .bk span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bk[aria-pressed='true'] {
      order: -1;
    }
  }
</style>

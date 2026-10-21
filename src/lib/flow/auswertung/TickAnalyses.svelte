<script>
  /**
   * «Auswertung wie Training»: the analyses of the ticks, in the order and with the switches of
   * «Analysen anpassen» (training/analyses.js, group 'ticks'), the same head and cards as on the ride page.
   * A card without data draws nothing.
   */
  import AnaHead from '../../training/AnaHead.svelte';
  import { ana } from '../../training/analyses.svelte.js';
  import { keysOf } from '../../training/analyses.js';
  import TkWeeks from './TkWeeks.svelte';
  import TkSpread from './TkSpread.svelte';
  import TkLine from './TkLine.svelte';
  import TkGrid from './TkGrid.svelte';
  import TkHalves from './TkHalves.svelte';
  import TkBest from './TkBest.svelte';
  import TkMonths from './TkMonths.svelte';

  let { d } = $props();
  const keys = $derived(keysOf(ana, 'ticks'));
</script>

<section class="acta" aria-labelledby="tka-h" data-section="analyses">
  <AnaHead id="tka-h" groups={['ticks']} />
  <div class="grid">
    {#each keys as k (k)}
      {#if k === 'tkweeks'}<TkWeeks {d} />
      {:else if k === 'tkdays'}<TkSpread {d} kind="days" />
      {:else if k === 'tkhours'}<TkSpread {d} kind="hours" />
      {:else if k === 'tkline'}<TkLine {d} />
      {:else if k === 'tkgrid'}<TkGrid {d} />
      {:else if k === 'tkhalves'}<TkHalves {d} />
      {:else if k === 'tkbest'}<TkBest {d} />
      {:else if k === 'tkmonths'}<TkMonths {d} />{/if}
    {/each}
  </div>
</section>

<style>
  .acta {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .grid > :global(.wide) {
      grid-column: 1 / -1;
    }
  }
</style>

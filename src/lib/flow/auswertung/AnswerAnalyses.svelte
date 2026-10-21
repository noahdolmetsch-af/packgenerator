<script>
  /**
   * «Auswertung wie Training»: the analyses of one answer (Check-Fragen), group 'answers' of «Analysen
   * anpassen», the same head and cards as on the ride page. A card without data draws nothing.
   */
  import AnaHead from '../../training/AnaHead.svelte';
  import { ana } from '../../training/analyses.svelte.js';
  import { keysOf } from '../../training/analyses.js';
  import AnLine from './AnLine.svelte';
  import AnDays from './AnDays.svelte';
  import AnHalves from './AnHalves.svelte';
  import AnMonths from './AnMonths.svelte';

  let { d } = $props();
  const keys = $derived(keysOf(ana, 'answers'));
</script>

<section class="acta" aria-labelledby="ana-a-h" data-section="analyses">
  <AnaHead id="ana-a-h" groups={['answers']} />
  <div class="grid">
    {#each keys as k (k)}
      {#if k === 'anline'}<AnLine {d} />
      {:else if k === 'andays'}<AnDays {d} />
      {:else if k === 'anhalves'}<AnHalves {d} />
      {:else if k === 'anmonths'}<AnMonths {d} />{/if}
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

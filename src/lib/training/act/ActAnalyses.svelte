<script>
  /**
   * TR5b–TR7f: the analyses on one activity, in the order and with the switches of «Analysen anpassen»
   * (analyses.js). A card without data (e.g. no power meter) draws nothing.
   */
  import AnaHead from '../AnaHead.svelte';
  import { ana } from '../analyses.svelte.js';
  import { keysOf } from '../analyses.js';
  import AnaMore from './AnaMore.svelte';
  import AnaPzBars from './AnaPzBars.svelte';
  import AnaCadence from './AnaCadence.svelte';
  import AnaClimbs from './AnaClimbs.svelte';
  import AnaSections from './AnaSections.svelte';
  import AnaTimeline from './AnaTimeline.svelte';
  import AnaGrid from './AnaGrid.svelte';
  import AnaHalves from './AnaHalves.svelte';
  import AnaSimilar from './AnaSimilar.svelte';
  import AnaBest from './AnaBest.svelte';
  import AnaIntervals from '../inhalt/AnaIntervals.svelte';
  import AnaHomeloop from '../inhalt/AnaHomeloop.svelte';
  import AnaLaps from './AnaLaps.svelte';
  import AnaSplits from './AnaSplits.svelte';
  import AnaSegs from './AnaSegs.svelte';

  let { act, all = [], today = '' } = $props();
  const CARDS = { more: AnaMore, pzbars: AnaPzBars, cadence: AnaCadence, climbs: AnaClimbs, sections: AnaSections, timeline: AnaTimeline, grid: AnaGrid, halves: AnaHalves, similar: AnaSimilar, best: AnaBest, intervals: AnaIntervals, homeloop: AnaHomeloop, laps: AnaLaps, splits: AnaSplits, segs: AnaSegs };
  const keys = $derived(keysOf(ana, 'act'));
</script>

<section class="acta" aria-labelledby="acta-h" data-section="analyses">
  <AnaHead id="acta-h" groups={['act']} />
  <div class="grid">
    {#each keys as k (k)}
      {@const C = CARDS[k]}
      <C {act} {all} {today} />
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

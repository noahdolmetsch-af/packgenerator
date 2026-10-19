<script>
  /**
   * TR7d–TR7f: the analyses over the weeks, under the look back, in the order and with the switches of
   * «Analysen anpassen» (analyses.js). A card without data draws nothing.
   */
  import AnaHead from '../AnaHead.svelte';
  import { ana } from '../analyses.svelte.js';
  import { keysOf } from '../analyses.js';
  import { t } from '../../i18n.svelte.js';
  import AnaForm from './AnaForm.svelte';
  import AnaWLoad from './AnaWLoad.svelte';
  import AnaPCurve from './AnaPCurve.svelte';
  import AnaEff from './AnaEff.svelte';
  import AnaMonth from './AnaMonth.svelte';
  import AnaYear from './AnaYear.svelte';
  import AnaPlan from '../inhalt/AnaPlan.svelte';
  import AnaDecouple from '../inhalt/AnaDecouple.svelte';
  import AnaFtp from '../inhalt/AnaFtp.svelte';

  let { acts = [], today = '' } = $props();
  const CARDS = { form: AnaForm, wload: AnaWLoad, pcurve: AnaPCurve, eff: AnaEff, month: AnaMonth, year: AnaYear, plan: AnaPlan, decouple: AnaDecouple, ftp: AnaFtp };
  const keys = $derived(keysOf(ana, 'week'));
</script>

<section class="wka" aria-labelledby="wka-h" data-section="week-analyses">
  <AnaHead id="wka-h" title={t('Analyses over the weeks')} groups={['week']} />
  <div class="grid">
    {#each keys as k (k)}
      {@const C = CARDS[k]}
      <C {acts} {today} />
    {/each}
  </div>
</section>

<style>
  .wka {
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

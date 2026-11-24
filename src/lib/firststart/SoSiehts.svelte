<script>
  /**
   * «So sieht's aus» (Noah 23.11.2026 «1-5a», question 5a): one quiet line inside the empty card of a main page
   * (never a new block above the content): a small card that shows the sample, and «See a sample», which puts the
   * example trip, bike and gear in (marked «example», only what is missing) and opens the page again.
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { settling } from '../settled.js';
  import { tidyData } from '../tidy.js';
  import { openTrip } from '../nav.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { addExamples } from '../firststart.js';
  import { SOSIEHT, SAMPLE_TRIP_ID } from './sosieht.js';

  let { area } = $props();
  const cfg = $derived(SOSIEHT[area]);
  let busy = $state(false);

  async function see() {
    busy = true;
    try {
      await settling(async () => {
        await addExamples(db, localDay(), { interests: ['nights'] });
        await tidyData(db);
      });
      if (cfg.trip) openTrip(SAMPLE_TRIP_ID);
      if (location.hash !== cfg.hash) location.hash = cfg.hash;
      offerDone(t('The sample is in, marked «example». Me › Data and backup › «Remove the examples» takes it away again.'), null, 8000);
    } catch (err) {
      console.error(err);
      offerDone(t("That didn't work. Nothing was changed. Try again."));
    } finally {
      busy = false;
    }
  }
</script>

{#if cfg}
  <div class="ssa" data-sosieht={area}>
    <span class="mini" aria-hidden="true"><b>{t(cfg.title)}</b><small>{t(cfg.sub)}</small></span>
    <span class="txt"><b>{t('How it looks')}</b></span>
    <button type="button" class="btn sm" disabled={busy} onclick={see} data-sosieht-go>{t('See a sample')}</button>
  </div>
{/if}

<style>
  .ssa {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 6px 0 4px;
  }
  .mini {
    display: grid;
    gap: 2px;
    padding: 8px 12px;
    border: 1px dashed var(--line-strong);
    border-radius: 12px;
    background: var(--hi-soft, var(--paper));
    text-align: left;
    color: var(--ink-2);
  }
  .mini b {
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .mini small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .txt b {
    color: var(--ink);
    font-size: var(--fs-small);
  }
</style>

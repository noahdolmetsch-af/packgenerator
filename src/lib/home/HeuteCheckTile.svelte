<script>
  /**
   * «Heute-Check» (Noah 30.10.2026 «1-5a», thread «Tagescheck optimieren»): a tile that is always on Heute, also when
   * everything is answered. It shows how many answers there are today and leads straight to the questionnaire
   * (the page of the round: Morgen-Check, from the evening round time Abend-Rückblick) with the analyses one tap
   * away on the same page. `due` and `evening` come from AbCard through Home.svelte (open questions of the round).
   * Observation only: plain counts, no judgement.
   */
  import { ListChecks, ChevronRight } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { abQuery } from '../abdb.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today, due = 0, evening = false, isnew = false } = $props();
  const query = $derived(abQuery(today));
  const data = $derived($query);
  const n = $derived((data?.answers ?? []).filter((a) => a.day === today).length);
  const href = $derived(evening ? '#/check/evening' : '#/check/morning');
</script>

<section class="hc surf" aria-labelledby="hc-h" data-section="heutecheck">
  <div class="hd">
    <TileHead icon={ListChecks} id="hc-h" title={t("Today's check")} {isnew} />
  </div>
  <p class="st" data-hc-state>
    {#if due}
      {tn(due, evening ? 'Evening check · {n} question open' : 'Morning check · {n} question open', evening ? 'Evening check · {n} questions open' : 'Morning check · {n} questions open')}
    {:else}
      {evening ? t('Evening check: nothing open') : t('Morning check: nothing open')}
    {/if}
  </p>
  <p class="was" data-hc-count>{n ? tn(n, '{n} answer today', '{n} answers today') : t('No answers yet today.')}</p>
  <a class="btn hi open" {href} data-hc-open>{t('Open questionnaire')}<ChevronRight size={16} aria-hidden="true" /></a>
  <p class="lks"><a href="#/me/insights" data-hc-links>{t('What goes together')}</a><a href="#/me/history">{t('All answers')}</a></p>
</section>

<style>
  .hc {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hd :global(.th) {
    flex: 1;
  }
  .open {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
  }
  .st,
  .was {
    margin: 0;
    overflow-wrap: break-word;
  }
  .was {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
  }
  .lks a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--hi);
    font-size: var(--fs-small);
  }
</style>

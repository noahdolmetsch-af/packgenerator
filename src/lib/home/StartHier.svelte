<script>
  /**
   * «Starte hier» (Noah 23.11.2026 «1-5a», V2): the card of an empty Heute. It used to be «First steps» with three
   * rows full of buttons. Now one main button (the next step: bike, then gear, then trip), the three steps as one
   * progress line, and three quiet lines (the tour, the sample race, a backup from before). Nothing here is a must.
   */
  import { Check } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { steps, onbike, onitem, ontrip, ondata, ontour } = $props();
  const NEXT = $derived(!steps.bike ? 'bike' : !steps.gear ? 'gear' : 'trip');
  const LABEL = { bike: 'Bike|first', gear: 'Gear|first', trip: 'Trip|first' };
  const order = ['bike', 'gear', 'trip'];
</script>

<section class="card starte" aria-labelledby="sh-h" data-start-here>
  <h2 id="sh-h" class="title">{t('Start here')}</h2>
  <p class="muted">{t('One step, then Today shows your next trip.')}</p>
  {#if NEXT === 'bike'}
    <a class="btn hi big" href="#/bikes" onclick={onbike} data-start-main="bike">{t('Add your first bike')}</a>
  {:else if NEXT === 'gear'}
    <button type="button" class="btn hi big" onclick={onitem} data-start-main="gear">{t('Add your first item')}</button>
  {:else}
    <button type="button" class="btn hi big" onclick={ontrip} data-start-main="trip">{t('Plan your first trip')}</button>
  {/if}
  <ol class="prog" aria-label={t('Three steps')}>
    {#each order as k, i (k)}
      <li class:done={steps[k]} class:cur={NEXT === k}>
        {#if steps[k]}<span class="mark ok" role="img" aria-label={t('Done|task')}><Check size={14} aria-hidden="true" /></span>{:else}<span class="mark" aria-hidden="true">{i + 1}</span>{/if}
        <span class="lbl">{t(LABEL[k])}</span>
      </li>
    {/each}
  </ol>
  <ul class="quiet">
    <li data-tourline><span><b>{t('New here?')}</b> {t('Tour, 2 minutes')}</span><button type="button" class="lk" onclick={ontour}>{t('Start ›|tour')}</button></li>
    <li data-tourline-race><span><b>{t('Planning a race?')}</b></span><a class="lk" href="#/race?sample">{t('See a sample ›')}</a></li>
    <li data-start-backup><span><b>{t('Backup from before')}</b></span><button type="button" class="lk" onclick={ondata}>{t('Import ›')}</button></li>
  </ul>
</section>

<style>
  .starte h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .starte > p {
    margin: 4px 0 12px;
  }
  .big {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 48px;
    text-align: center;
  }
  .prog {
    list-style: none;
    margin: 14px 0 10px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
  .prog li {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  .prog li + li::before {
    content: '';
    width: 22px;
    border-top: 1px solid var(--line-strong);
    margin-right: 4px;
  }
  .prog li.cur .lbl {
    font-weight: 600;
    color: var(--ink);
  }
  .mark {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: 1.5px solid var(--ink-3);
    border-radius: 50%;
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .prog li.cur .mark {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
  .mark.ok {
    border-color: var(--ok);
    background: var(--ok);
    color: var(--paper);
  }
  .quiet {
    list-style: none;
    margin: 0;
    padding: 6px 0 0;
    border-top: 1px solid var(--line);
  }
  .quiet li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    min-height: 44px;
    padding: 6px 0;
  }
  .quiet span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .lk {
    flex: none;
    background: none;
    border: 0;
    padding: 8px 0 8px 8px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    font: inherit;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>

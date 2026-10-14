<script>
  /**
   * VS2 (Noah 14.10.2026 «VS1–VS4 freigegeben»): the one question at the very first new tour: which
   * bike shall new tours bring, always the standard bike or the one ridden last. Asked once; the
   * answer stays changeable under Velos › «Standard-Velo und Reihenfolge».
   */
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { Star, RotateCcw, Check } from '@lucide/svelte';
  import './velo-dlg.css';
  import './standardvelo.css';

  /** standard: the standard bike (first in the order). onanswer('standard' | 'last'). */
  let { standard, onanswer } = $props();
  let pick = $state('standard');
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  const done = () => (onanswer?.(pick), dialog.close());
</script>

<dialog class="sheet vdlg tb-ask" bind:this={dialog} use:backClose={done} aria-labelledby="tb-ask-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="tb-ask-h">{t('Which bike shall new trips bring?')}</h2>
      <p class="vd-sub">{t('Your first trip. The app asks this only once.')}</p>
    </div>
  </div>
  <div class="sv-opts">
    <button type="button" class="sv-opt" aria-pressed={pick === 'standard'} onclick={() => (pick = 'standard')}>
      <span class="sv-oi"><Star size={20} aria-hidden="true" /></span>
      <span class="sv-ot"><b>{t('Always the standard bike')}</b><small>{t('Today: {name} · you choose it on the bike page', { name: standard?.name ?? '' })}</small></span>
      <span class="sv-om">{#if pick === 'standard'}<Check size={18} aria-hidden="true" />{/if}</span>
    </button>
    <button type="button" class="sv-opt" aria-pressed={pick === 'last'} onclick={() => (pick = 'last')}>
      <span class="sv-oi"><RotateCcw size={20} aria-hidden="true" /></span>
      <span class="sv-ot"><b>{t('The bike ridden last')}</b><small>{t('The bike of your last trip or ride')}</small></span>
      <span class="sv-om">{#if pick === 'last'}<Check size={18} aria-hidden="true" />{/if}</span>
    </button>
  </div>
  <p class="sv-hint">{t('You can change this any time under Bikes › Standard bike and order.')}</p>
  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={done}><Check size={17} aria-hidden="true" />{t('Apply')}</button>
  </div>
</dialog>

<script>
  /**
   * VS4 (Noah 14.10.2026 «3a»): right after a new bike is added (and there was a bike before), the
   * app asks once whether it becomes the standard bike. «No» keeps it last in the order.
   */
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { makeStandard, saveOrder } from '../tourbike.svelte.js';
  import { Star, Bike, Check } from '@lucide/svelte';
  import './velo-dlg.css';
  import './standardvelo.css';

  /** bike: the new bike; standard: the standard bike so far; bikes: all bikes (with the new one). */
  let { bike, standard, bikes, onclose } = $props();
  let yes = $state(false);
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  async function done() {
    if (yes) await saveOrder(db, bikes, makeStandard(bikes, bike.id));
    dialog.close();
  }
</script>

<dialog class="sheet vdlg nb-std" bind:this={dialog} use:backClose={() => dialog.close()} {onclose} aria-labelledby="nb-std-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="nb-std-h">{t('New standard bike?')}</h2>
      <p class="vd-sub">{t('You added «{name}». Your standard bike is {std}.', { name: bike.name, std: standard.name })}</p>
    </div>
  </div>
  <div class="sv-opts">
    <button type="button" class="sv-opt" aria-pressed={yes} onclick={() => (yes = true)}>
      <span class="sv-oi"><Star size={20} aria-hidden="true" /></span>
      <span class="sv-ot"><b>{t('Yes, {name} becomes the standard', { name: bike.name })}</b><small>{t('Comes with every new trip and stands on top')}</small></span>
      <span class="sv-om">{#if yes}<Check size={18} aria-hidden="true" />{/if}</span>
    </button>
    <button type="button" class="sv-opt" aria-pressed={!yes} onclick={() => (yes = false)}>
      <span class="sv-oi"><Bike size={20} aria-hidden="true" /></span>
      <span class="sv-ot"><b>{t('No, {name} stays', { name: standard.name })}</b><small>{t('{name} stands last in the order', { name: bike.name })}</small></span>
      <span class="sv-om">{#if !yes}<Check size={18} aria-hidden="true" />{/if}</span>
    </button>
  </div>
  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={done}><Check size={17} aria-hidden="true" />{t('Done')}</button>
  </div>
</dialog>

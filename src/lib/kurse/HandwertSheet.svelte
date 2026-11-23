<script>
  /**
   * «Kursblick» Verteilung (Noah 23.11.2026 «Krypto, Rohstoffe, Immobilien, Sparkonto, 3a von Hand»): one window to write down a value
   * by hand (a savings account, a flat, a pillar-3a account, coins: things Kursblick has no price for) or to change it. It has a
   * name, the group it counts for and what it is worth today in francs. hand: the value to change, or null for a new one;
   * gruppen: [{ id, name }] to choose from; onsave({ name, gruppe, wert }) saves and returns '' or the text of an error.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { hand = null, gruppen = [], onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(hand?.name ?? '');
  // svelte-ignore state_referenced_locally
  let gruppe = $state(hand?.gruppe ?? '');
  // svelte-ignore state_referenced_locally
  let wert = $state(hand ? String(hand.wert) : '');
  let error = $state('');
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  async function save(e) {
    e?.preventDefault();
    error = '';
    const problem = await onsave?.({ name, gruppe, wert });
    if (problem) return (error = problem);
    dialog.close();
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="hs-h" data-hand-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="hs-h">{hand ? t('Change value') : t('Add a value by hand')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save} novalidate>
    <div class="felder">
      <label>{t('Name')} <input class="inp" bind:value={name} maxlength="60" autocomplete="off" placeholder={t('For example «Savings account»')} data-hand-name /></label>
      <label>
        {t('Group')}
        <select class="inp" bind:value={gruppe} data-hand-gruppe>
          <option value="">{t('No group')}</option>
          {#each gruppen as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
        </select>
      </label>
      <label>{t('Worth today, CHF')} <input class="inp num" type="text" inputmode="decimal" bind:value={wert} autocomplete="off" data-hand-wert /></label>
    </div>
    <p class="hint">{t('Kursblick does not follow this value: change it when it changes. What you type here stays on your devices.')}</p>
    {#if error}<p class="err" role="alert" data-hand-fehler>{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" data-hand-save>{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .felder {
    display: grid;
    gap: var(--sp-3);
  }
  .felder label {
    display: grid;
    gap: var(--sp-1);
    font-size: var(--fs-small);
  }
  .hint {
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .err {
    margin: var(--sp-2) 0 0;
    color: var(--bad);
  }
</style>

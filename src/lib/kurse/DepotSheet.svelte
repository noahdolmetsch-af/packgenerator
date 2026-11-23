<script>
  /**
   * «Kursblick» Portfolio (Noah 23.11.2026 «digitaler twin meiner richtigen portfolios», «fiktive käufe»): one window to add a
   * portfolio or to rename it and change its kind. A real portfolio counts for the whole picture, the goals and the rules; a
   * practice portfolio is made up and never does. depot: the portfolio to change, or null for a new one;
   * onsave({ name, art }) saves and returns '' or the text of an error.
   */
  import { X } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { DEPOT_ARTEN } from './journal.js';
  import '../bikes/velo-dlg.css';

  let { depot = null, onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(depot?.name ?? '');
  // svelte-ignore state_referenced_locally
  let art = $state(depot?.art ?? 'echt');
  let error = $state('');
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  async function save(e) {
    e?.preventDefault();
    error = '';
    const problem = await onsave?.({ name, art });
    if (problem) return (error = problem);
    dialog.close();
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="ds-h" data-depot-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="ds-h">{depot ? t('Change portfolio') : t('Add a portfolio')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save} novalidate>
    <div class="felder">
      <label>{t('Name')} <input class="inp" bind:value={name} maxlength="60" autocomplete="off" placeholder={art === 'echt' ? t('For example «My bank»') : t('For example «Gold test»')} data-depot-name /></label>
      <Seg label={t('Kind')} value={art} options={DEPOT_ARTEN.map((a) => ({ key: a.key, name: t(a.name) }))} onchange={(k) => (art = k)} />
    </div>
    <p class="hint">
      {#if art === 'echt'}{t('A real portfolio counts for your whole picture, your goals and your buying rules.')}
      {:else}{t('A practice portfolio is made up: you can buy and sell in it to follow what would have happened. It never counts for your whole picture, your goals or your rules.')}{/if}
      {t('What you type here stays on your devices.')}
    </p>
    {#if error}<p class="err" role="alert" data-depot-fehler>{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" data-depot-save>{t('Save')}</button>
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

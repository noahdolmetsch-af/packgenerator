<script>
  /**
   * «Kursblick» (Bauplan K6): one window to add a title (a share, a fund, a coin …) or to change one. The symbol is the
   * one thing the prices are found by (Yahoo's way of writing it, «NESN.SW»); before it is saved, the server is asked once
   * whether it knows prices for it, so a typo shows now and not as an empty row later. When the check cannot be made (no
   * network), the title can still be saved. Everything can be changed afterwards.
   *
   * titel: the title to change, or null for a new one; gruppen: [{ id, name }] (name as shown); gruppe: the group a new
   * title starts in; onsave({ name, symbol, art, gruppe }): saves, returns '' or the text of an error to show.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { ARTEN, symbolNorm, symbolOk, reihenId } from './maerkte.js';
  import { ladeReihe } from './laden.js';
  import '../bikes/velo-dlg.css';

  let { titel = null, gruppen = [], gruppe = '', onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(titel?.name ?? '');
  // svelte-ignore state_referenced_locally
  let symbol = $state(titel?.symbol ?? '');
  // svelte-ignore state_referenced_locally
  let art = $state(titel?.art ?? 'share');
  // svelte-ignore state_referenced_locally
  let wo = $state(titel ? titel.gruppe : gruppe);
  let error = $state('');
  let ungeprueft = $state(false); // the check failed: the next «Save» saves anyway
  let busy = $state(false);
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    if (!symbolOk(symbol)) {
      error = t('Write the symbol as the price service does, for example NESN.SW.');
      return;
    }
    busy = true;
    error = '';
    try {
      let given = '';
      const changed = !titel || symbolNorm(symbol) !== titel.symbol;
      if (changed && !ungeprueft) {
        try {
          given = (await ladeReihe(reihenId(symbol), { force: true })).name ?? '';
        } catch {
          ungeprueft = true;
          error = t('No prices found for this symbol. Check how it is written, or save it anyway.');
          return;
        }
      }
      const problem = await onsave?.({ name: name.trim() || (changed ? given : ''), symbol: symbolNorm(symbol), art, gruppe: wo });
      if (problem) return (error = problem);
      dialog.close();
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="ts-h" data-titel-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="ts-h">{titel ? t('Change title') : t('Add a title')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save} novalidate>
    <div class="felder">
      <label>{t('Name')} <input class="inp" bind:value={name} maxlength="80" autocomplete="off" placeholder={t('Name, as it should show')} data-titel-name /></label>
      <label>{t('Symbol|kurs')} <input class="inp" bind:value={symbol} maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NESN.SW" oninput={() => ((error = ''), (ungeprueft = false))} data-titel-symbol /></label>
      <label>{t('Kind')}
        <select class="inp" bind:value={art} data-titel-art>
          {#each ARTEN as a (a.key)}<option value={a.key}>{t(a.name)}</option>{/each}
        </select>
      </label>
      <label>{t('Group')}
        <select class="inp" bind:value={wo} data-titel-gruppe>
          <option value="">{t('No group')}</option>
          {#each gruppen as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
        </select>
      </label>
    </div>
    <p class="hint">{t('The symbol is how Yahoo Finance writes the title: shares of the Swiss exchange end in .SW (NESN.SW), coins look like BTC-USD, indices start with ^ (^SSMI).')}</p>
    {#if error}<p class="err" role="alert" data-titel-fehler>{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={busy} data-titel-save>{ungeprueft ? t('Save anyway') : t('Save')}</button>
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

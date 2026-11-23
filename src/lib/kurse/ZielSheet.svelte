<script>
  /**
   * «Kursblick» Ziele (Bauplan K13): one window to add a goal or to change one. A goal is a number the person waits for: gold in
   * francs per kilogram, the SMI in points, the price of a title, or the value of «My holdings». Kursblick checks it when it opens.
   * ziel: the goal to change, or null; onsave({ was, symbol, richtung, wert, name }): saves, returns '' or the text of an error.
   * PRIVATE: stays on the devices.
   */
  import { X } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { ZIEL_ARTEN } from './ziele.js';
  import { symbolOk } from './maerkte.js';
  import { meldung } from './meldungen.js';
  import '../bikes/velo-dlg.css';

  let { ziel = null, was = 'gold', onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let art = $state(ziel?.was ?? was);
  // svelte-ignore state_referenced_locally
  let symbol = $state(ziel?.symbol ?? '');
  // svelte-ignore state_referenced_locally
  let richtung = $state(ziel?.richtung ?? 'ueber');
  // svelte-ignore state_referenced_locally
  let wert = $state(ziel ? String(ziel.wert) : '');
  // svelte-ignore state_referenced_locally
  let name = $state(ziel?.name ?? '');
  let error = $state('');
  let busy = $state(false);
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const einheit = $derived(art === 'gold' ? t('CHF per kg') : art === 'smi' ? t('points') : art === 'bestand' ? t('CHF') : t('in the currency of the title'));

  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    if (art === 'titel' && !symbolOk(symbol)) return (error = meldung('symbol'));
    busy = true;
    error = '';
    try {
      const problem = await onsave?.({ was: art, symbol, richtung, wert, name });
      if (problem) return (error = problem);
      dialog.close();
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="zs-h" data-ziel-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="zs-h">{ziel ? t('Change goal') : t('Add a goal')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save} novalidate>
    <div class="felder">
      <label>{t('What is it about?')}
        <select class="inp" bind:value={art} data-ziel-art>
          {#each ZIEL_ARTEN as a (a.key)}<option value={a.key}>{t(a.name)}</option>{/each}
        </select>
      </label>
      {#if art === 'titel'}
        <label>{t('Symbol|kurs')} <input class="inp" bind:value={symbol} maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NESN.SW" oninput={() => (error = '')} data-ziel-symbol /></label>
      {/if}
      <Seg label={t('Reached when the number is')} value={richtung} options={[{ key: 'ueber', name: t('at or above') }, { key: 'unter', name: t('at or below') }]} onchange={(k) => (richtung = k)} />
      <label>{t('The number')} ({einheit}) <input class="inp num" type="text" inputmode="decimal" bind:value={wert} autocomplete="off" data-ziel-wert /></label>
      <label>{t('Name')} <input class="inp" bind:value={name} maxlength="80" autocomplete="off" placeholder={t('Optional')} /></label>
    </div>
    <p class="hint">{t('Kursblick checks your goals when you open it, with the close of the day before. It does not send a message while the app is closed. What you type here stays on your devices.')}</p>
    {#if error}<p class="err" role="alert" data-ziel-fehler>{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={busy} data-ziel-save>{t('Save')}</button>
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

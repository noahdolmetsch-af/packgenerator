<script>
  /**
   * «Kursblick» Journal (Noah 23.11.2026 «kurskäufe und verkäufe loggen»): one window to write down a buy, a sale, a dividend or a
   * split, or to change one. A buy or a sale has a day, how many pieces (grams for gold), the price of one in francs and a fee.
   * eintrag: the entry to change, or null; titel: the title a new one starts with; vorschlaege: the titles to pick from
   * [{ key, name }]; onsave(data) saves and returns '' or the text of an error. PRIVATE: nothing typed here leaves the device.
   */
  import { X } from '@lucide/svelte';
  import DateInput from '../ui/DateInput.svelte';
  import Seg from '../ui/Seg.svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import '../bikes/velo-dlg.css';

  let { eintrag = null, titel = 'gold', vorschlaege = [], onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let art = $state(eintrag?.art ?? 'kauf');
  // svelte-ignore state_referenced_locally
  let wahl = $state(eintrag?.titel ?? titel);
  // svelte-ignore state_referenced_locally
  let tag = $state(eintrag?.tag ?? localDay());
  // svelte-ignore state_referenced_locally
  let menge = $state(eintrag?.menge != null ? String(eintrag.menge) : '');
  // svelte-ignore state_referenced_locally
  let preis = $state(eintrag?.preis != null ? String(eintrag.preis) : '');
  // svelte-ignore state_referenced_locally
  let gebuehr = $state(eintrag?.gebuehr ? String(eintrag.gebuehr) : '');
  // svelte-ignore state_referenced_locally
  let betrag = $state(eintrag?.betrag != null ? String(eintrag.betrag) : '');
  // svelte-ignore state_referenced_locally
  let faktor = $state(eintrag?.faktor != null ? String(eintrag.faktor) : '');
  let error = $state('');
  let busy = $state(false);
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const istGold = $derived(wahl.trim().toLowerCase() === 'gold');
  const handel = $derived(art === 'kauf' || art === 'verkauf');

  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    busy = true;
    error = '';
    try {
      const problem = await onsave?.({ art, titel: wahl, tag, menge, preis, gebuehr, betrag, faktor });
      if (problem) return (error = problem);
      dialog.close();
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="es-h" data-eintrag-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="es-h">{eintrag ? t('Change entry') : t('Write down a buy or a sale')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save} novalidate>
    <div class="felder">
      <Seg label={t('Kind')} value={art} options={[{ key: 'kauf', name: t('Buy') }, { key: 'verkauf', name: t('Sale') }, { key: 'dividende', name: t('Dividend') }, { key: 'split', name: t('Split') }]} onchange={(k) => ((art = k), (error = ''))} />
      <label>{t('Title')}
        <input class="inp" bind:value={wahl} list="es-titel" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder={t('gold, or a symbol like NESN.SW')} oninput={() => (error = '')} data-eintrag-titel />
        <datalist id="es-titel">{#each vorschlaege as v (v.key)}<option value={v.key}>{v.name}</option>{/each}</datalist>
      </label>
      <label>{t('Day')} <DateInput bind:value={tag} aria-label={t('Day')} /></label>
      {#if handel}
        <label>{istGold ? t('Grams') : t('Pieces')} <input class="inp num" type="text" inputmode="decimal" bind:value={menge} autocomplete="off" data-eintrag-menge /></label>
        <label>{istGold ? t('Price per gram in CHF') : t('Price per piece in CHF')} <input class="inp num" type="text" inputmode="decimal" bind:value={preis} autocomplete="off" data-eintrag-preis /></label>
        <label>{t('Fee in CHF')} <input class="inp num" type="text" inputmode="decimal" bind:value={gebuehr} autocomplete="off" placeholder={t('Optional')} data-eintrag-gebuehr /></label>
      {:else if art === 'dividende'}
        <label>{t('Amount received, CHF')} <input class="inp num" type="text" inputmode="decimal" bind:value={betrag} autocomplete="off" data-eintrag-betrag /></label>
      {:else}
        <label>{t('Factor')} <input class="inp num" type="text" inputmode="decimal" bind:value={faktor} autocomplete="off" placeholder="2" data-eintrag-faktor /></label>
      {/if}
    </div>
    <p class="hint">
      {#if art === 'verkauf'}{t('A sale is worked out with the average price of what you hold: the cost of what you sell is its share of the cost of everything.')}
      {:else if art === 'split'}{t('After a split the price service already shows the new price, so your pieces must grow too: write 2 for a split of 2 to 1.')}
      {:else if art === 'dividende'}{t('A dividend is money you received; it counts to your profit.')}
      {:else}{t('Write the price you paid for one piece (for gold, one gram) in francs, and the fee if there was one.')}{/if}
      {t('What you type here stays on your devices.')}
    </p>
    {#if error}<p class="err" role="alert" data-eintrag-fehler>{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={busy} data-eintrag-save>{t('Save')}</button>
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

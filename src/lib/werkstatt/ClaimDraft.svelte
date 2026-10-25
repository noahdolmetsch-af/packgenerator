<script>
  /**
   * Paket B, UC-180-I2 «Reklamation vorbereiten»: on the Warranty & receipts sheet, a tidy draft for a claim:
   * which part, since when, what happens. The text is for you to check, copy or share; the app sends nothing
   * and claims no legal right. The draft is kept on the sheet (bike.sheets.warranty.claim), «Clear» empties it.
   */
  import { t, dateOf } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { claimText } from './werkstatt.js';

  let { bikeName = '', bought = '', shop = '', rows = [], claim = null, onsave } = $props();
  // svelte-ignore state_referenced_locally
  let c = $state({ part: claim?.part ?? '', since: claim?.since ?? '', what: claim?.what ?? '' });
  let open = $state(!!(claim?.what || claim?.part));
  const text = $derived(claimText({ bikeName, bought, shop, claim: c, rows }, t, dateOf));
  const keep = () => onsave?.({ ...$state.snapshot(c) });
  async function copy() {
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        offerDone(t('Copied. Paste it into a message.'));
      }
    } catch {
      /* closed */
    }
  }
  function clear() {
    const before = $state.snapshot(c);
    c = { part: '', since: '', what: '' };
    onsave?.(null);
    offerDone(t('Draft cleared.'), () => {
      c = before;
      onsave?.(before);
    });
  }
</script>

<section class="psec noprint cd" aria-labelledby="w-claim" data-claim>
  <h3 id="w-claim">{t('Prepare a claim')}</h3>
  {#if !open}
    <p class="quiet">{t('Something broke under warranty? Collect what happened in a tidy draft. You check it and send it yourself.')}</p>
    <button type="button" class="btn" onclick={() => (open = true)} data-claim-open>{t('Start a draft')}</button>
  {:else}
    <label class="fld"><span class="lbl">{t('Part')}</span>
      <select class="inp" bind:value={c.part} onchange={keep} data-claim-part>
        <option value="">{t('Choose')}</option>
        {#each rows as r (r.key)}<option value={r.key}>{r.label}</option>{/each}
      </select>
    </label>
    <label class="fld"><span class="lbl">{t('Since when')}</span><input class="inp" type="date" bind:value={c.since} onchange={keep} data-claim-since /></label>
    <label class="fld"><span class="lbl">{t('What happens')}</span><textarea class="inp" rows="3" maxlength="600" bind:value={c.what} onchange={keep} placeholder={t('e.g. the freehub slips under load, since the last ride in the rain')} data-claim-what></textarea></label>
    <pre class="cd-text" data-claim-text>{text}</pre>
    <div class="row2">
      <button type="button" class="btn ink" onclick={copy} data-claim-copy>{t('Copy or share')}</button>
      <button type="button" class="btn" onclick={clear} data-claim-clear>{t('Clear')}</button>
    </div>
    <p class="quiet">{t('Attach the receipt and photos yourself. The app sends nothing.')}</p>
  {/if}
</section>

<style>
  .cd-text {
    margin: 8px 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--paper-2);
    font: inherit;
    font-size: var(--fs-small);
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
</style>

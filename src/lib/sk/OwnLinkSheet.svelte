<script>
  /**
   * SK «Eigener Link eintragen» (SKX5): one small window for every own link (maker, shop, album,
   * workshop, music) and for «Eigener Link» as a tile (SK8). On a phone it comes from below.
   * Address and the name on the button; only http and https; the link stays on this device.
   *
   * title: «Link eintragen»; context: what it belongs to («Anleitung des Herstellers · Regenjacke»);
   * value: { url, name } now (or null); name: the name it gets when the field stays empty;
   * onsave({ url, name }) saves (url already checked); onoff: «Nicht mehr vorschlagen» (optional);
   * onremove: «Link löschen» for a link that is there (optional); onclose.
   */
  import { tick } from 'svelte';
  import { X, Lock, ExternalLink } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { safeUrl } from './links.js';
  import { t } from '../i18n.svelte.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone

  let { title = '', context = '', value = null, name: defName = '', onsave, onoff = null, onremove = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let url = $state(value?.url ?? '');
  // svelte-ignore state_referenced_locally
  let name = $state(value?.name ?? defName ?? '');
  let error = $state('');
  let dialog;
  let input;
  const good = $derived(safeUrl(url));

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  async function save(e) {
    e?.preventDefault();
    if (!good) {
      error = t('Only addresses that start with http:// or https://');
      input?.focus();
      return;
    }
    await onsave?.({ url: good, name: name.trim() || defName });
    dialog.close();
  }
</script>

<dialog class="sheet from-below sk-own" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="sk-own-h" data-sk-own>
  <form onsubmit={save} novalidate>
    <div class="sk-head">
      <div>
        <h2 id="sk-own-h">{title || t('Enter a link')}</h2>
        {#if context}<p class="sk-ctx">{context}</p>{/if}
      </div>
      <button type="button" class="sk-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <label class="sk-f"><span class="sk-lbl">{t('Address')}</span>
      <input class="inp" bind:this={input} bind:value={url} type="url" inputmode="url" autocomplete="off" placeholder="https://" oninput={() => (error = '')} aria-invalid={!!error} />
    </label>
    <label class="sk-f"><span class="sk-lbl">{t('Name on the button')}</span>
      <input class="inp" bind:value={name} autocomplete="off" maxlength="80" placeholder={defName} />
    </label>
    {#if error}<p class="sk-err" role="alert">{error}</p>{/if}
    <p class="sk-note"><Lock size={16} aria-hidden="true" /><span>{t('Stays on this device only. The app opens only this page and sends nothing along.')}</span></p>
    {#if good}<p class="sk-try"><a href={good} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />{t('Try it')}<span class="sr">{t('(opens elsewhere)')}</span></a></p>{/if}
    {#if onoff || onremove}
      <p class="sk-more">
        {#if onremove}<button type="button" class="sk-tx" onclick={() => (onremove(), dialog.close())}>{t('Delete the link')}</button>{/if}
        {#if onoff}<button type="button" class="sk-tx" onclick={() => (onoff(), dialog.close())}>{t('Don’t suggest any more')}</button>{/if}
      </p>
    {/if}
    <div class="sk-foot daumen-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .sk-own {
    width: min(460px, calc(100vw - 24px));
  }
  .sk-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sk-ctx {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .sk-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .sk-f {
    display: grid;
    gap: 4px;
    margin: 0 0 12px;
  }
  .sk-f .inp {
    width: 100%;
    min-height: 48px;
  }
  .sk-lbl {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .sk-err {
    margin: -4px 0 10px;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .sk-note {
    display: flex;
    gap: 8px;
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .sk-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .sk-try {
    margin: 0 0 6px;
  }
  .sk-try a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--ink);
    font-weight: 600;
  }
  .sk-more {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 6px 0 0;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .sk-tx {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small)/1.3 var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .sk-foot {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .sk-foot .btn.hi {
    flex: 1;
  }
</style>

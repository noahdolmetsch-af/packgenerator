<script>
  /**
   * «Neuland»: add an entry or change its name and place. The place is optional («46.87, 8.85», also
   * from a map link); with a place the app finds the entry on your routes. An empty name of a built-in
   * entry gives it its own name back.
   * kicker: the collection; title; name, place: the values now; withPlace: show the place field;
   * builtIn: a built-in entry (empty name allowed); onsave({ name, place }) → false|string to stay open.
   */
  import { X } from '@lucide/svelte';
  import { tick } from 'svelte';
  import { backClose } from '../ui/backclose.js';
  import { parsePlace } from './neuland.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { kicker = '', title, name = '', place = '', withPlace = true, builtIn = false, onsave, onclose } = $props();

  let dialog;
  let input;
  // svelte-ignore state_referenced_locally
  let n = $state(name);
  // svelte-ignore state_referenced_locally
  let p = $state(place);
  let error = $state('');
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
    tick().then(() => input?.focus());
  });

  async function submit(e) {
    e.preventDefault();
    if (!n.trim() && !builtIn) {
      error = t('Give it a name.');
      return input?.focus();
    }
    const pl = withPlace ? parsePlace(p) : undefined;
    if (pl === null) return (error = t('The place is not clear. Write it as «46.87, 8.85» (latitude, longitude).'));
    const ok = await onsave?.({ name: n.trim(), place: pl });
    if (ok === false) return;
    if (typeof ok === 'string') return (error = ok);
    dialog.close();
  }
</script>

<dialog class="sheet vdlg nl-edit" bind:this={dialog} use:backClose {onclose} aria-labelledby="nle-h">
  <form onsubmit={submit} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        {#if kicker}<p class="vd-sub">{kicker}</p>{/if}
        <h2 id="nle-h">{title}</h2>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="fld">
      <label class="nl-lbl" for="nle-n">{t('Name')}</label>
      <input id="nle-n" class="inp" bind:this={input} bind:value={n} maxlength="80" autocomplete="off" oninput={() => (error = '')} />
    </div>
    {#if withPlace}
      <div class="fld">
        <label class="nl-lbl" for="nle-p">{t('Place (optional)')}</label>
        <input id="nle-p" class="inp" bind:value={p} placeholder="46.87, 8.85" autocomplete="off" oninput={() => (error = '')} />
        <p class="hint">{t('Latitude, longitude, e.g. from a map app. With a place the app finds it on your routes.')}</p>
      </div>
    {/if}
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .nl-edit {
    width: min(460px, calc(100vw - 24px));
  }
  .fld {
    display: grid;
    gap: 4px;
    margin-top: 10px;
  }
  .nl-lbl {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    margin: 10px 0 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>

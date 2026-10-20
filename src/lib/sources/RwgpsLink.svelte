<script>
  /**
   * «Neue Quellen» › Ride with GPS (Noah 20.10.2026 «Link einfügen und als Datei»): «Link von Ride with GPS»
   * opens a small field; a pasted link (ridewithgps.com/routes/12345 or /trips/12345, also a shared link with
   * its privacy code) is loaded through the app's server (sources/rwgps.js) and handed to the page like an
   * uploaded GPX file: onload(gpxText, fileName) reads it (and may throw a plain message). The file way stays
   * next to it. Only a suggestion; nothing is stored here.
   */
  import { tick } from 'svelte';
  import { Link as LinkIcon } from '@lucide/svelte';
  import { fetchRwgpsGpx, parseRwgpsLink } from './rwgps.js';
  import { t } from '../i18n.svelte.js';

  let { onload, label = '' } = $props();

  let open = $state(false);
  let text = $state('');
  let busy = $state(false);
  let msg = $state('');
  let input = $state();
  const ref = $derived(parseRwgpsLink(text));

  async function show() {
    open = true;
    msg = '';
    await tick();
    input?.focus();
  }
  function close() {
    open = false;
    text = '';
    msg = '';
  }
  async function load(e) {
    e?.preventDefault();
    if (busy) return;
    if (!ref) return (msg = t('This is not a Ride with GPS link. Paste a link like ridewithgps.com/routes/12345.'));
    busy = true;
    msg = '';
    try {
      const { gpx, file } = await fetchRwgpsGpx(text);
      await onload?.(gpx, file);
      close();
    } catch (err) {
      msg = err?.message && err.message !== 'invalid' ? err.message : t('This file could not be read.');
    } finally {
      busy = false;
    }
  }
</script>

<div class="rw-link" data-rwgps>
  {#if !open}
    <button type="button" class="lk" onclick={show}><LinkIcon size={16} aria-hidden="true" />{label || t('Link from Ride with GPS')}</button>
  {:else}
    <form class="rw-form" onsubmit={load}>
      <div class="rw-row">
        <label class="rw-lbl"><span>{t('Link from Ride with GPS')}</span><input class="inp" bind:this={input} bind:value={text} inputmode="url" autocomplete="off" placeholder="ridewithgps.com/routes/12345" data-rwgps-input /></label>
        <button type="submit" class="btn sm" disabled={busy || !text.trim()}>{busy ? t('Loading…') : t('Load|rwgps')}</button>
        <button type="button" class="lk" onclick={close}>{t('Cancel')}</button>
      </div>
      <p class="hint">{t('Paste the link of a public route or ride (Share › Copy link). The route and its points (water, food, controls) come in as from a GPX file.')}</p>
    </form>
  {/if}
  {#if msg}<p class="warn" role="alert">{msg}</p>{/if}
</div>

<style>
  .rw-link {
    display: grid;
    gap: var(--sp-1);
    justify-items: start;
    width: 100%;
  }
  .rw-form {
    display: grid;
    gap: var(--sp-1);
    width: 100%;
  }
  .rw-lbl {
    display: grid;
    gap: var(--sp-1);
    flex: 1 1 200px;
    min-width: 0;
    font-size: var(--fs-label);
    color: var(--ink-2);
  }
  .rw-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: end;
  }
  .rw-lbl .inp {
    min-width: 0;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .hint,
  .warn {
    margin: 0;
    font-size: var(--fs-small);
  }
  .hint {
    color: var(--ink-3);
  }
  .warn {
    color: var(--warn);
  }
</style>

<script>
  /**
   * Paket 4 «Wohnungs-Hüter-Liste» (Noah 19.10.2026 «1a»): the list for the person who looks after the
   * flat, opened from a link or a QR code. Read only: the list lives in the link itself; ticks stay on
   * this page while it is open and are not saved anywhere.
   */
  import { t, locale } from '../lib/i18n.svelte.js';
  import { readKeeper } from '../lib/unterwegs/hueter.js';
  import { House, Printer } from '@lucide/svelte';

  let { code = '' } = $props();
  const list = $derived(readKeeper(code));
  let ticks = $state({});
  const dateOf = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' }) : '');
</script>

<div class="hueter" data-hueter-page>
  {#if !list}
    <h1 class="title big">{t('Link broken')}</h1>
    <p>{t('This list could not be read. Ask for the link again.')}</p>
  {:else}
    <p class="hlbl"><House size={16} aria-hidden="true" /> {t('Looking after the flat')}</p>
    <h1 class="title big">{t('Thank you for looking after the flat')}</h1>
    {#if list.from || list.until}<p class="meta">{[dateOf(list.from), dateOf(list.until)].filter(Boolean).join(' – ')}</p>{/if}
    {#if list.note}<p class="note">{list.note}</p>{/if}
    <ul class="lines">
      {#each list.lines as line, i (i)}
        <li><label><input type="checkbox" checked={!!ticks[i]} onchange={(e) => (ticks = { ...ticks, [i]: e.currentTarget.checked })} /> <span>{line}</span></label></li>
      {/each}
    </ul>
    <p class="fine">{t('This list is stored only in the link. Ticks are not saved.')}</p>
    <p class="no-print"><button type="button" class="btn" onclick={() => window.print()}><Printer size={18} aria-hidden="true" />{t('Print|pdf')}</button></p>
  {/if}
</div>

<style>
  .hueter {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    max-width: 640px;
  }
  .hueter p,
  .hueter h1 {
    margin: 0;
  }
  .hlbl {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  .note {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    overflow-wrap: break-word;
  }
  .lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .lines label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    overflow-wrap: break-word;
  }
  .lines input {
    width: 22px;
    height: 22px;
    flex: none;
  }
  .fine {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>

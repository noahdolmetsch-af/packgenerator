<script>
  /**
   * «Marker setzen» (Noah 21.11.2026, K1): the window to mark a day or a stretch as sick, injured, stress or holiday, or to change such a marker.
   * One tap on a kind, a first day, an optional last day; «Save» saves. Nothing is mandatory and everything can be changed later.
   *
   * marker: the marker to change, or null for a new one; today: the day to start from; onsave({ id?, kind, from, to }).
   */
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { X } from '@lucide/svelte';
  import { KINDS, cleanDay } from './marker.js';
  import { kindText } from './markerwords.js';
  import '../bikes/velo-dlg.css';

  let { marker = null, today, onsave, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let kind = $state(marker?.kind ?? '');
  let from = $state(marker?.from ?? today);
  let to = $state(marker && marker.to !== marker.from ? marker.to : '');
  const bad = $derived(!cleanDay(from) || (!!to && !cleanDay(to)) || (!!to && cleanDay(to) < cleanDay(from)));
  const ok = $derived(!!kind && !bad);

  function save() {
    if (!ok) return;
    onsave?.({ ...(marker ? { id: marker.id } : {}), kind, from: cleanDay(from), to: cleanDay(to) || cleanDay(from) });
    dialog.close();
  }
</script>

<dialog class="sheet vdlg mks" bind:this={dialog} use:backClose {onclose} aria-labelledby="mks-h" data-marker-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="mks-h">{marker ? t('Change marker') : t('Set a marker')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <fieldset class="kinds">
    <legend class="lbl">{t('What was it?')}</legend>
    <div class="row">
      {#each KINDS as k (k)}
        <button type="button" class="chip" class:on={kind === k} aria-pressed={kind === k} data-marker-kind={k} onclick={() => (kind = k)}>{kindText(k)}</button>
      {/each}
    </div>
  </fieldset>
  <div class="days">
    <label><span class="lbl">{t('First day')}</span><input class="inp" type="date" bind:value={from} data-marker-from /></label>
    <label><span class="lbl">{t('Last day (empty: only this day)')}</span><input class="inp" type="date" bind:value={to} min={from} data-marker-to /></label>
  </div>
  {#if bad}<p class="hint warn" role="status">{t('The last day cannot be before the first day.')}</p>{/if}
  <p class="hint">{t('The evaluations leave these days out when they compare with earlier times, and use them to explain what stands out. You can change or delete the marker at any time.')}</p>

  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={save} disabled={!ok} data-marker-save>{t('Save')}</button>
  </div>
</dialog>

<style>
  .kinds {
    margin: 0 0 12px;
    padding: 0;
    border: 0;
  }
  .kinds legend {
    margin: 0 0 6px;
    padding: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    min-width: 50px;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body)/1 var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--ok-soft);
    color: var(--accent);
  }
  .days {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }
  .days label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .warn {
    color: var(--bad);
  }
</style>

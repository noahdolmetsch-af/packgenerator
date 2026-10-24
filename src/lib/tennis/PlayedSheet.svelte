<script>
  /**
   * Paket P4 «Aktiv», mockup TN2: the sheet «Tennis gespielt» (kind, duration, court, result «nur für dich»,
   * what worked), prefilled like last time. mode 'taught' is the short sheet «Lektion gegeben» (day,
   * duration, a note). onsave(form) saves; the caller writes the entry and the tick in Aktiv.
   */
  import { untrack } from 'svelte';
  import { X } from '@lucide/svelte';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { backClose } from '../ui/backclose.js';
  import { PLAY_TYPES, PLAY_MINUTES, COURTS, RESULTS } from '../tennisday.js';
  import { t } from '../i18n.svelte.js';

  let { start, mode = 'played', title = '', onsave, onclose } = $props();

  // the sheet starts from the given values and keeps what is typed
  let f = $state(untrack(() => JSON.parse(JSON.stringify(start))));
  let other = $state(untrack(() => !PLAY_MINUTES.includes(Number(start.min))));
  let busy = $state(false);
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  const opts = (list) => list.map((x) => ({ value: x.key, label: t(x.label) }));
  const minOpts = [...PLAY_MINUTES.map((n) => ({ value: n, label: t('{n} min', { n }) })), { value: 'other', label: t('other|duration') }];
  const minPick = $derived(other ? 'other' : Number(f.min));
  function pickMin(v) {
    if (v === 'other') other = true;
    else {
      other = false;
      f.min = v;
    }
  }
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    busy = true;
    try {
      await onsave?.($state.snapshot(f));
      dialog.close();
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet from-below tn-sheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="tn-ps-h" data-played-sheet={mode}>
  <form onsubmit={save}>
    <div class="tn-head">
      <h2 id="tn-ps-h">{title || (mode === 'taught' ? t('Lesson given') : t('Tennis played'))}</h2>
      <button type="button" class="tn-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    {#if mode === 'played'}<p class="tn-fine">{t('Filled in like last time. Change what was different.')}</p>{/if}
    <label class="tn-lab">{t('Day')}<input class="inp" type="date" bind:value={f.day} required data-ps-day /></label>
    {#if mode === 'played'}
      <p class="tn-cap" id="tn-ps-type">{t('Kind|tennis')}</p>
      <ChipChoice aria-labelledby="tn-ps-type" options={opts(PLAY_TYPES)} bind:value={f.type} data-ps-type />
    {/if}
    <p class="tn-cap" id="tn-ps-min">{t('Duration')}</p>
    <ChipChoice aria-labelledby="tn-ps-min" options={minOpts} value={minPick} onchange={pickMin} data-ps-min />
    {#if other}<label class="tn-lab">{t('Minutes')}<input class="inp" type="number" min="5" max="600" step="5" bind:value={f.min} data-ps-own /></label>{/if}
    {#if mode === 'played'}
      <p class="tn-cap" id="tn-ps-court">{t('Court')}</p>
      <ChipChoice aria-labelledby="tn-ps-court" options={opts(COURTS)} bind:value={f.court} data-ps-court />
      <p class="tn-cap" id="tn-ps-res">{t('Result · only for you')}</p>
      <ChipChoice aria-labelledby="tn-ps-res" options={opts(RESULTS)} bind:value={f.result} data-ps-result />
      <label class="tn-lab">{t('What worked?')}<textarea class="inp" rows="2" maxlength="300" bind:value={f.worked} placeholder={t('e.g. the serve to the backhand')} data-ps-worked></textarea></label>
    {:else}
      <label class="tn-lab">{t('Note')}<textarea class="inp" rows="2" maxlength="300" bind:value={f.note} placeholder={t('e.g. two beginners, footwork')} data-ps-note></textarea></label>
    {/if}
    <div class="tn-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={busy} data-ps-save>{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .tn-sheet {
    width: min(480px, calc(100vw - 24px));
  }
  .tn-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .tn-head h2 {
    margin: 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .tn-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tn-fine {
    margin: 2px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tn-cap {
    margin: 12px 0 6px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .tn-lab {
    display: grid;
    gap: 4px;
    margin: 12px 0 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .tn-lab .inp {
    min-height: 44px;
    font-weight: 400;
  }
  .tn-foot {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .tn-foot .btn {
    min-height: 44px;
  }
</style>

<script>
  /**
   * Paket P4 «Aktiv», mockup TN1 «Geplant»: enter a time on the court (day, time, duration, court) after you
   * booked it in your booking app, and the booking link, set once (mode 'book'). On the day the app asks
   * «Gespielt?» (TN5). onsave(form) saves.
   */
  import { untrack } from 'svelte';
  import { X } from '@lucide/svelte';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { backClose } from '../ui/backclose.js';
  import { COURTS, safeUrl } from '../tennisday.js';
  import { t } from '../i18n.svelte.js';

  let { start, mode = 'slot', onsave, onclose } = $props();

  let f = $state(untrack(() => JSON.parse(JSON.stringify(start))));
  let err = $state('');
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  const courts = COURTS.map((x) => ({ value: x.key, label: t(x.label) }));
  const mins = [60, 90, 120].map((n) => ({ value: n, label: t('{n} min', { n }) }));
  async function save(e) {
    e.preventDefault();
    if (mode === 'book' && f.bookUrl?.trim() && !safeUrl(f.bookUrl)) {
      err = t('Please enter a web address, e.g. www.example.ch');
      return;
    }
    await onsave?.($state.snapshot(f));
    dialog.close();
  }
</script>

<dialog class="sheet from-below tn-ss" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="tn-ss-h" data-slot-sheet={mode}>
  <form onsubmit={save}>
    <div class="tn-ss-head">
      <h2 id="tn-ss-h">{mode === 'book' ? t('Booking link') : t('Enter a time on the court')}</h2>
      <button type="button" class="tn-ss-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    {#if mode === 'book'}
      <p class="tn-ss-fine">{t('The page or app where you book a court. «Book a court» opens it. Only on this device and in the backup.')}</p>
      <label class="tn-ss-lab">{t('Web address')}<input class="inp" type="text" inputmode="url" autocomplete="url" bind:value={f.bookUrl} placeholder="www.example.ch" data-book-url /></label>
      <label class="tn-ss-lab">{t('Name (optional)')}<input class="inp" maxlength="60" bind:value={f.bookName} placeholder={t('e.g. booking app')} data-book-name /></label>
      {#if err}<p class="tn-ss-err" role="alert">{err}</p>{/if}
    {:else}
      <p class="tn-ss-fine">{t('Booked in your booking app? Enter the time here. On the day the app asks «Played?».')}</p>
      <div class="tn-ss-two">
        <label class="tn-ss-lab">{t('Day')}<input class="inp" type="date" bind:value={f.day} required data-slot-day /></label>
        <label class="tn-ss-lab">{t('Time')}<input class="inp" type="time" bind:value={f.time} required data-slot-time /></label>
      </div>
      <p class="tn-ss-cap" id="tn-ss-min">{t('Duration')}</p>
      <ChipChoice aria-labelledby="tn-ss-min" options={mins} bind:value={f.min} />
      <p class="tn-ss-cap" id="tn-ss-court">{t('Court')}</p>
      <ChipChoice aria-labelledby="tn-ss-court" options={courts} bind:value={f.court} />
    {/if}
    <div class="tn-ss-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" data-slot-save>{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .tn-ss {
    width: min(480px, calc(100vw - 24px));
  }
  .tn-ss-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .tn-ss-head h2 {
    margin: 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .tn-ss-x {
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
  .tn-ss-fine {
    margin: 4px 0 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tn-ss-err {
    margin: 6px 0 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .tn-ss-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .tn-ss-cap {
    margin: 12px 0 6px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .tn-ss-lab {
    display: grid;
    gap: 4px;
    margin: 12px 0 0;
    min-width: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .tn-ss-lab .inp {
    min-height: 44px;
    min-width: 0;
    font-weight: 400;
  }
  .tn-ss-foot {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .tn-ss-foot .btn {
    min-height: 44px;
  }
</style>

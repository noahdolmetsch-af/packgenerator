<script>
  /**
   * Velo-Idee 72 «Fehlende Kilometer nachtragen»: the question before a new km reading with a jump
   * (kmgap.js). Opened by askKmGap() in kmgapask.js, never by hand. Answers: { how: 'rides', date }
   * (rides outside the app, one ride entry), { how: 'reading' } (take the new reading as it is), or
   * null (type again; nothing is saved).
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, num, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import '../ui/daumen.css';

  let { bike, gap, total, ondone } = $props();

  let dialog;
  let first = $state();
  let answer = null;
  // svelte-ignore state_referenced_locally
  let how = $state(gap.kind === 'more' ? 'rides' : 'again');
  let date = $state(localDay());
  $effect(() => {
    dialog.showModal();
    tick().then(() => first?.focus());
  });
  function ok() {
    answer = how === 'rides' ? { how, date: date || localDay() } : how === 'reading' ? { how } : null;
    dialog.close();
  }
  const close = () => ((answer = null), dialog.close());
</script>

<dialog class="sheet from-below kmgap" bind:this={dialog} use:backClose onclose={() => ondone?.(answer)} aria-labelledby="kmgap-h" data-testid="km-gap">
  <div class="head">
    <h2 id="kmgap-h">{gap.kind === 'more' ? t('{km} km more than the app knows', { km: num(gap.diff) }) : t('{km} km less than the app knows', { km: num(-gap.diff) })}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="txt">{t('{bike}: the app counts {now} km{since}, you typed {total} km.', { bike: bike.name, now: num(Math.round(gap.exact)), since: gap.since ? ` (${t('last entry {date}', { date: dateOf(gap.since) })})` : '', total: num(total) })}</p>
  <fieldset class="opts">
    <legend class="lbl">{gap.kind === 'more' ? t('Where do the km come from?') : t('What is right?')}</legend>
    {#if gap.kind === 'more'}
      <label class="opt"><input bind:this={first} type="radio" name="kmgap" value="rides" bind:group={how} data-km-gap="rides" /><span><b>{t('Rides outside the app')}</b><small>{t('One entry «Rides outside the app» with these km. Parts count them from the day you choose.')}</small></span></label>
      {#if how === 'rides'}
        <label class="day"><span class="lbl">{t('About when?')}</span><input class="inp" type="date" bind:value={date} max={localDay()} min={gap.since ?? undefined} data-km-gap-date /></label>
      {/if}
      <label class="opt"><input type="radio" name="kmgap" value="reading" bind:group={how} data-km-gap="reading" /><span><b>{t('Just the new reading')}</b><small>{t('Like before: the difference counts from today.')}</small></span></label>
      <label class="opt"><input type="radio" name="kmgap" value="again" bind:group={how} data-km-gap="again" /><span><b>{t('Typo, type again')}</b><small>{t('Nothing is saved.')}</small></span></label>
    {:else}
      <label class="opt"><input bind:this={first} type="radio" name="kmgap" value="again" bind:group={how} data-km-gap="again" /><span><b>{t('Typo, type again')}</b><small>{t('Nothing is saved.')}</small></span></label>
      <label class="opt"><input type="radio" name="kmgap" value="reading" bind:group={how} data-km-gap="reading" /><span><b>{t('It is right, take it as a correction')}</b><small>{t('The km of the bike go down by the difference.')}</small></span></label>
    {/if}
  </fieldset>
  <div class="foot daumen-foot">
    <button type="button" class="btn" onclick={close}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={ok} data-km-gap-ok>{how === 'again' ? t('Type again') : t('Save')}</button>
  </div>
</dialog>

<style>
  .kmgap {
    width: min(480px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .txt {
    margin: 8px 0 12px;
    color: var(--ink-2);
  }
  .opts {
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .opt {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    cursor: pointer;
  }
  .opt input {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    flex: none;
  }
  .opt small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .day {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0 0 0 32px;
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }
</style>

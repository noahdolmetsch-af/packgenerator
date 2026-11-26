<script>
  /**
   * «Standardwoche» (Noah 26.11.2026): ONE window to put a slot of the standard week, or to change or take one away.
   * A slot is a day and a time of one kind of unit, and it is either fixed (the unit stands there) or a wish (the unit
   * goes there when the place is free, otherwise the planner takes the best one and says so).
   *
   * slot: { type, d, t, kind: 'fix' | 'wish', choose, exists } – choose: the sport is chosen in the window (the «+» of a day); exists: the place is already set (it can be taken away);
   * sports: [{ type, name }] for that choice; taken(type): the weekdays where the sport already has a slot;
   * dayName(d, style); nameOf(type); onsave({ type, d, t, kind, from }) ; onremove(); onclose.
   */
  import { X, Trash2 } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { timeChoices, TIME_PARTS } from './wochenplan-text.js';
  import { defTime } from './wochenplan.js';
  import '../bikes/velo-dlg.css';

  let { slot, sports = [], taken = () => [], dayName, nameOf, summer = false, onsave, onremove, onclose } = $props();

  let dialog;
  /* svelte-ignore state_referenced_locally */
  let type = $state(slot.type || '');
  /* svelte-ignore state_referenced_locally */
  let kind = $state(slot.kind || 'fix');
  /* svelte-ignore state_referenced_locally */
  let d = $state(slot.d);
  /* svelte-ignore state_referenced_locally */
  let time = $state(slot.t || '');
  const from = slot.exists ? slot.d : null;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const busy = (day) => !!type && day !== from && taken(type).includes(day);
  function pickType(ty) {
    type = ty;
    time = defTime(ty, d, summer);
    if (busy(d)) d = [0, 1, 2, 3, 4, 5, 6].find((x) => !busy(x)) ?? d;
  }
  function pickDay(day) {
    if (busy(day)) return;
    d = day;
  }
  const ready = $derived(!!type && !!time && !busy(d));
  function save() {
    if (!ready) return;
    onsave?.({ type, d, t: time, kind, from });
    dialog.close();
  }
  const title = $derived(slot.choose ? (type ? t('New place: {what}', { what: nameOf(type) }) : t('New place|slot')) : nameOf(type));
</script>

<dialog class="sheet vdlg stws" bind:this={dialog} use:backClose {onclose} aria-labelledby="stws-h" data-sw-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="stws-h">{title}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if slot.choose}
    <div class="blk" role="group" aria-label={t('Kind of unit')}>
      <span class="lbl">{t('Kind of unit')}</span>
      <div class="row">
        {#each sports as s (s.type)}
          <button type="button" class="chip" aria-pressed={type === s.type} onclick={() => pickType(s.type)} data-sw-type={s.type}>{s.name}</button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="blk" role="group" aria-label={t('How firm is this place?')}>
    <span class="lbl">{t('How firm is this place?')}</span>
    <div class="row">
      <button type="button" class="chip" aria-pressed={kind === 'fix'} onclick={() => (kind = 'fix')} data-sw-kind="fix">{t('Fixed|place')}</button>
      <button type="button" class="chip" aria-pressed={kind === 'wish'} onclick={() => (kind = 'wish')} data-sw-kind="wish">{t('Wish|place')}</button>
    </div>
    <p class="hint" data-sw-kind-hint>{kind === 'fix' ? t('Fixed: it always stands on this day at this time.') : t('Wish: the app puts it here when the place is free, otherwise on the best day, and says so.')}</p>
  </div>

  <div class="blk" role="group" aria-label={t('Day')}>
    <span class="lbl">{t('Day')}</span>
    <div class="row">
      {#each [0, 1, 2, 3, 4, 5, 6] as x (x)}
        <button type="button" class="chip" aria-pressed={d === x} disabled={busy(x)} aria-label={dayName(x, 'long')} onclick={() => pickDay(x)} data-sw-day={x}>{dayName(x, 'short')}</button>
      {/each}
    </div>
  </div>

  <div class="blk" role="group" aria-label={t('Time')}>
    <span class="lbl">{t('Time')}</span>
    <div class="row">
      {#each TIME_PARTS as p (p.t)}
        <button type="button" class="chip" aria-pressed={time === p.t} onclick={() => (time = p.t)} data-sw-part={p.t}>{t(p.name)}</button>
      {/each}
    </div>
    <label class="at">
      <span>{t('start time')}</span>
      <select class="inp" bind:value={time} aria-label={t('start time')} data-sw-time>
        {#if !time}<option value="" disabled>–</option>{/if}
        {#each timeChoices(time) as c (c)}<option value={c}>{c}</option>{/each}
      </select>
    </label>
  </div>

  <div class="vd-foot">
    {#if slot.exists}<button type="button" class="btn del" onclick={() => { onremove?.(); dialog.close(); }} data-sw-remove><Trash2 size={16} aria-hidden="true" />{t('Remove')}</button>{/if}
    <button type="button" class="btn hi" onclick={save} disabled={!ready} data-sw-save>{t('Done')}</button>
  </div>
</dialog>

<style>
  .chip {
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--hi);
    color: var(--hi-ink);
    border-color: var(--hi);
  }
  .chip:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .blk {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0 0 12px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .at {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .del {
    color: var(--bad);
    margin-right: auto;
  }
</style>

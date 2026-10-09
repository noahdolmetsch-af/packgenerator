<script>
  /**
   * v0.35.0 (AP29, Noah, variant B): the small pill "{n} more ▾" on the kicker line of the dark trip
   * band. It lists the other trips and debriefs still in progress (drafts.js inProgress); a phone
   * opens a bottom sheet "In progress {n}", a computer a popover under the pill. A row opens that
   * trip at its next step; ••• has the quiet actions (Not riding, End, Finish without debrief,
   * Discard after one more question), each with Undo. Hidden when nothing else is in progress.
   */
  import { liveQuery } from 'dexie';
  import { ChevronDown, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';
  import { localDay } from '../localday.js';
  import { switchTrip } from '../nav.js';
  import { inProgress, actionChanges } from '../drafts.js';
  import ProgressRows from './ProgressRows.svelte';

  let { current = null } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const trips = $derived($tripsQ ?? []);
  const rows = $derived(inProgress(trips, $debriefsQ ?? [], localDay()));
  const others = $derived(rows.filter((r) => r.tripId !== current).length);

  let open = $state(false);
  let sheet = $state();
  let pill = $state();
  let pop = $state();
  let undo = $state.raw(null); // { before, text } after an action
  let undoTimer;

  $effect(() => {
    if (!sheet) return;
    if (open && phone.matches && !sheet.open) sheet.showModal();
    if ((!open || !phone.matches) && sheet.open) sheet.close();
  });
  // The popover (computer): a click outside or Escape closes it, the focus goes back to the pill.
  $effect(() => {
    if (!open || phone.matches) return;
    const outside = (e) => {
      if (!pop?.contains(e.target) && !pill?.contains(e.target)) open = false;
    };
    const key = (e) => {
      if (e.key === 'Escape') (open = false), pill?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    queueMicrotask(() => pop?.querySelector('a, button')?.focus());
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
    };
  });

  function go(row, e) {
    e.preventDefault();
    open = false;
    if (row.tripId === current) return;
    switchTrip(row.tripId, row.next.href);
  }
  const DONE = { skip: 'Not riding: {title}.', end: 'Ended: {title}.', noDebrief: 'Finished without debrief: {title}.', discard: 'Discarded: {title}.' };
  async function act(row, action) {
    const before = await db.trips.get(row.tripId);
    if (!before) return;
    if (action === 'discard') await db.trips.delete(row.tripId);
    else await db.trips.update(row.tripId, { ...actionChanges(action, localDay()), updatedAt: new Date().toISOString() });
    clearTimeout(undoTimer);
    undo = { before, text: t(action === 'skip' && !row.bike ? 'Not going: {title}.' : DONE[action], { title: row.title }) };
    undoTimer = setTimeout(() => (undo = null), 10000);
  }
  async function undoAct() {
    const u = undo;
    undo = null;
    clearTimeout(undoTimer);
    if (u) await db.trips.put(u.before);
  }
</script>

{#snippet body()}
  <div class="head">
    <h2 id="ip-h">{t('In progress')} <span class="n num">{rows.length}</span></h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => ((open = false), pill?.focus())}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if undo}<p class="undo" role="status">{undo.text} <button type="button" class="link" onclick={undoAct}>{t('Undo')}</button></p>{/if}
  <ProgressRows {rows} {current} {trips} onopen={go} onaction={act} />
{/snippet}

{#if others > 0 || open || undo}
  <span class="ipw">
    <button type="button" class="pill" bind:this={pill} aria-haspopup="dialog" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="num">{t('{n} more|progress', { n: others })}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {#if open && !phone.matches}
      <div class="pop" bind:this={pop} role="dialog" aria-labelledby="ip-h">{@render body()}</div>
    {/if}
  </span>
{/if}
<dialog class="ip-sheet" bind:this={sheet} onclose={() => (open = false)} aria-labelledby="ip-h">
  {#if open && phone.matches}{@render body()}{/if}
</dialog>

<style>
  .ipw {
    position: relative;
    flex: none;
  }
  /* Small to the eye, a 44 px tap area (the ::after). */
  .pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 30px;
    padding: 3px 10px 3px 12px;
    border: 0;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.12);
    color: var(--brand-ink-2);
    font: 600 13px/1.2 var(--font-body);
    cursor: pointer;
    white-space: nowrap;
  }
  .pill::after {
    content: '';
    position: absolute;
    inset: -7px -2px;
  }
  .pill:hover,
  .pill[aria-expanded='true'] {
    background: rgba(255, 255, 255, 0.2);
    color: var(--brand-ink);
  }
  .pill:focus-visible {
    outline: 2px solid var(--focus-on-dark);
    outline-offset: 2px;
  }
  .pop {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 30;
    width: min(440px, calc(100vw - 48px));
    max-height: min(70vh, 560px);
    overflow: auto;
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(15, 46, 39, 0.25);
    text-align: left;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 4px 6px 16px;
  }
  h2 {
    margin: 0;
    font: 700 17px/1.2 var(--font-body);
    color: var(--ink);
  }
  .n {
    font-weight: 500;
    color: var(--ink-3);
  }
  .x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .x:focus-visible {
    outline: var(--focus-ring);
  }
  .undo {
    margin: 0;
    padding: 4px 16px 10px;
    font-size: 14px;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .undo .link {
    min-height: 44px;
  }
  /* Phone: a sheet from the bottom. */
  .ip-sheet {
    position: fixed;
    inset: auto 0 0 0;
    width: 100%;
    max-width: 100%;
    max-height: 85vh;
    margin: 0;
    padding: 6px 0 calc(8px + env(safe-area-inset-bottom));
    box-sizing: border-box;
    overflow: auto;
    border: 0;
    border-radius: 18px 18px 0 0;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 -8px 30px rgba(15, 46, 39, 0.2);
  }
  .ip-sheet::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    margin: 4px auto 6px;
    border-radius: 4px;
    background: var(--line);
  }
  .ip-sheet::backdrop {
    background: rgba(15, 46, 39, 0.45);
  }
  .ip-sheet:not([open]) {
    display: none;
  }
</style>

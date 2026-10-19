<script>
  /**
   * «Neuland»: one item (a canton, a pass, an own café …): when you were there first and on which trip,
   * found by the app or ticked by you, and what you can change: tick or untick (you always win), give
   * the app the decision back, rename, correct the place, hide (built-in) or delete (own).
   * item, what: the collection's word; visit: visitedOf() entry or null; auto: what the app found or null;
   * nope: the person said «not there»; tripName(id); today; on*: the actions (the page saves).
   */
  import { X, Check, Undo2, Pencil, EyeOff, Trash2, MapPin } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import { dayLong } from '../review/fmt.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { item, what = '', label = '', visit = null, auto = null, nope = false, tripName = () => '', today, ontick, onuntick, onclearnope, onedit, onhide, onremove, onclose } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let day = $state(today);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const close = () => dialog?.close();
  const trip = $derived(visit?.tripId ? tripName(visit.tripId) : '');
  const hasPlace = $derived(Number.isFinite(item.lat) && Number.isFinite(item.lon));
  const sub = $derived([what, Number.isFinite(item.alt) ? `${item.alt} m` : '', item.region ?? item.kt ?? ''].filter(Boolean).join(' · '));
</script>

<dialog class="sheet vdlg nl-item" bind:this={dialog} use:backClose {onclose} aria-labelledby="nli-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="nli-h">{label || item.name}</h2>
      {#if sub}<p class="vd-sub">{sub}</p>{/if}
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if visit}
    <div class="st ok">
      <Check size={18} aria-hidden="true" />
      <div>
        <p><b>{t('First time: {day}', { day: dayLong(visit.day) })}</b></p>
        {#if visit.tripId}<p><a href="#/debrief/{visit.tripId}">{trip ? t('On the trip «{name}»', { name: trip }) : t('Open the trip')}</a></p>{/if}
        <p class="q">{visit.by === 'hand' ? t('Ticked by you.') : t('Found by the app on your route.')}</p>
      </div>
    </div>
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => (onuntick?.(), close())}><Undo2 size={16} aria-hidden="true" />{t('I was not there')}</button>
    </div>
  {:else}
    <div class="st">
      <p>{nope ? t('You marked it as «not there». The app does not count it.') : t('Not been there yet.')}</p>
      {#if nope && auto}<p class="q">{t('The app found it on {day}.', { day: dayLong(auto.day) })}</p>{/if}
    </div>
    <div class="tick">
      <label class="nl-lbl" for="nli-day">{t('Been there on')}</label>
      <DateInput id="nli-day" bind:value={day} max={today} />
    </div>
    <div class="vd-foot">
      {#if nope}<button type="button" class="btn" onclick={() => (onclearnope?.(), close())}>{t('Let the app decide again')}</button>{/if}
      <button type="button" class="btn hi" onclick={() => (ontick?.(day || today), close())}><Check size={16} aria-hidden="true" />{t('I was there')}</button>
    </div>
  {/if}

  <div class="more">
    <button type="button" class="btn" onclick={() => (onedit?.(), close())}><Pencil size={16} aria-hidden="true" />{hasPlace || item.own ? t('Name and place') : t('Rename')}</button>
    {#if hasPlace}<a class="btn" href="https://www.google.com/maps/search/?api=1&query={item.lat},{item.lon}" target="_blank" rel="noopener"><MapPin size={16} aria-hidden="true" />{t('On the map')}</a>{/if}
    {#if item.own}
      <button type="button" class="btn del" onclick={() => (onremove?.(), close())}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
    {:else}
      <button type="button" class="btn" onclick={() => (onhide?.(), close())}><EyeOff size={16} aria-hidden="true" />{t('Hide from the list')}</button>
    {/if}
  </div>
</dialog>

<style>
  .nl-item {
    width: min(480px, calc(100vw - 24px));
  }
  .st {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .st.ok :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ok);
  }
  .st p {
    margin: 0;
  }
  .st p + p {
    margin-top: 4px;
  }
  .st div {
    min-width: 0;
  }
  .q {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tick {
    display: grid;
    gap: 4px;
    margin-top: 14px;
  }
  .nl-lbl {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .more {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
</style>

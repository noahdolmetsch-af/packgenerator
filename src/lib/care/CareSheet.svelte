<script>
  /**
   * v0.144.0 RE «Pflege selbst einstellen» (mockup RE3-kette-blatt, Noah 14.10.2026 5a): the sheet of
   * one care in «Pflege für …». Top: the switch «Pflege für dieses Teil» (off: the app never reminds).
   * Then the interval «alle [150] km und/oder alle [ ] Tage» (whichever comes first, 5a), the limits
   * «Warnung ab [0,4] %, ersetzen ab [0,5] %» or the km of the check, each with «Standard: … ·
   * zurücksetzen»; a note. Bottom: «Alles auf Standard», «Abbrechen», «Speichern».
   *
   * bike: as stored; row: care/plan.js careRow; focus: 'note' puts the cursor into the note;
   * onsave(patch): the fields to store (careChange); onclose().
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, num } from '../i18n.svelte.js';
  import { PART } from '../care.js';
  import { CARE_ITEM, careChange, checkCare } from './plan.js';
  import { careStdText } from './plantext.js';

  let { bike, row, focus = null, onsave, onclose } = $props();

  let dialog;
  let noteEl = $state();
  // svelte-ignore state_referenced_locally
  const r = row;
  const item = CARE_ITEM[r.key];
  const unit = r.kind === 'wear' ? PART[item.parts[0]]?.unit ?? '' : 'km';
  const low = r.kind === 'wear' && !!PART[item.parts[0]]?.lowIsWorn;
  const show = (v) => (v == null ? '' : num(v));
  const start = r.on ? r.values : r.std;
  let on = $state(r.on);
  let km = $state(show(start.everyKm));
  let days = $state(show(start.everyDays));
  let warn = $state(show(start.warnAt));
  let limit = $state(show(start.limit));
  let note = $state(r.note);
  let error = $state('');

  const toNum = (v) => (String(v ?? '').trim() === '' ? null : Number(String(v).replace(',', '.').replace(/[’'\s]/g, '')));

  $effect(() => {
    dialog.showModal();
    if (focus === 'note') noteEl?.focus();
  });

  function toStd() {
    on = true;
    km = show(r.std.everyKm);
    days = show(r.std.everyDays);
    warn = show(r.std.warnAt);
    limit = show(r.std.limit);
    error = '';
  }
  const intervalStd = () => ((km = show(r.std.everyKm)), (days = show(r.std.everyDays)), (error = ''));
  const wearStd = () => ((warn = show(r.std.warnAt)), (limit = show(r.std.limit)), (error = ''));

  async function save(e) {
    e?.preventDefault();
    const values = r.kind === 'wear' ? { warnAt: toNum(warn), limit: toNum(limit) } : r.kind === 'check' ? { everyKm: toNum(km) } : { everyKm: toNum(km), everyDays: toNum(days) };
    const res = checkCare(r.key, values, on);
    if (res.error) {
      error = res.error === 'interval' ? t('Give km, days or both.') : res.error === 'wear' ? (low ? t('The warning has to be above the replace limit.') : t('The warning has to be below the replace limit.')) : t('Only numbers above 0.');
      return;
    }
    await onsave?.(careChange(bike, r.key, { on, values: res.values, note }));
    dialog.close();
  }
</script>

<dialog class="sheet from-below csheet" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="cs-h" data-care-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <h2 id="cs-h">{t(r.name)}</h2>
        <p class="sub">{bike.name} · {t('Set up care')}</p>
      </div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>

    <div class="sugrow">
      <span class="swt"><b id="cs-on">{t('Care for this part')}</b><small>{t('Off: the app never reminds you of it. What you recorded stays.')}</small></span>
      <button type="button" class="switch" role="switch" aria-checked={on} aria-labelledby="cs-on" onclick={() => ((on = !on), (error = ''))}><span class="knob"></span></button>
    </div>

    {#if on}
      <fieldset class="grp">
        {#if r.kind === 'interval'}
          <legend class="lbl">{t('Interval')}</legend>
          <div class="rrow">
            <span>{t('every|interval')}</span>
            <input class="inp num" type="text" inputmode="numeric" aria-label={t('Every … km')} bind:value={km} oninput={() => (error = '')} /><span class="unit">km</span>
            <span class="andor">{t('and/or')}</span>
            <span>{t('every|interval')}</span>
            <input class="inp num" type="text" inputmode="numeric" aria-label={t('Every … days')} placeholder="–" bind:value={days} oninput={() => (error = '')} /><span class="unit">{t('days')}</span>
          </div>
          <p class="src">{t('Whichever comes first counts.')} {t('Standard: {v}', { v: careStdText(r) })} · <button type="button" class="tp-link" onclick={intervalStd}>{t('reset|care')}</button></p>
        {:else if r.kind === 'check'}
          <legend class="lbl">{t('Interval')}</legend>
          <div class="rrow">
            <span>{t('every|interval')}</span>
            <input class="inp num" type="text" inputmode="numeric" aria-label={t('Every … km')} bind:value={km} oninput={() => (error = '')} /><span class="unit">km</span>
          </div>
          <p class="src">{t('Standard: {v}', { v: careStdText(r) })} · <button type="button" class="tp-link" onclick={intervalStd}>{t('reset|care')}</button></p>
        {:else}
          <legend class="lbl">{t('Measure')}</legend>
          <div class="rrow">
            <span>{t('Warning at')}</span>
            <input class="inp num" type="text" inputmode="decimal" aria-label={t('Warning at')} bind:value={warn} oninput={() => (error = '')} /><span class="unit">{unit}</span>
            <span>· {low ? t('replace below|limit') : t('replace at|limit')}</span>
            <input class="inp num" type="text" inputmode="decimal" aria-label={low ? t('replace below|limit') : t('replace at|limit')} bind:value={limit} oninput={() => (error = '')} /><span class="unit">{unit}</span>
          </div>
          <p class="src">{t('Standard: {v}', { v: careStdText(r) })} · <button type="button" class="tp-link" onclick={wearStd}>{t('reset|care')}</button></p>
        {/if}
        {#if error}<p class="err" role="alert">{error}</p>{/if}
      </fieldset>
    {/if}

    <label class="grp nt"><span class="lbl">{t('Note|care')}</span>
      <textarea class="inp" rows="2" bind:this={noteEl} bind:value={note} placeholder={t('e.g. Wax: hot wax every 600 km')}></textarea>
    </label>
    <p class="src">{t('Shows in the care card.')}</p>

    <div class="foot">
      <button type="button" class="tp-link reset" onclick={toStd}>{t('All to the standard')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .csheet {
    width: min(560px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .sugrow {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .swt {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
  }
  .swt small,
  .src,
  .err {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .err {
    margin: 6px 0 0;
    color: var(--bad);
  }
  .grp {
    display: block;
    margin: 14px 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .grp legend,
  .nt .lbl {
    display: block;
    margin-bottom: 6px;
  }
  .rrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .rrow .inp {
    width: 84px;
    min-height: 44px;
    text-align: center;
  }
  .unit,
  .andor {
    color: var(--ink-2);
  }
  .src {
    margin: 6px 0 0;
  }
  .src .tp-link {
    min-height: 32px;
  }
  .nt textarea {
    width: 100%;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .reset {
    margin-right: auto;
    min-height: 44px;
  }
  .switch {
    position: relative;
    flex: none;
    width: 56px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 28px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line-strong);
    transition: background 0.15s;
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 8px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true']::before {
    background: var(--accent);
  }
  .switch[aria-checked='true'] .knob {
    left: 28px;
  }
  @media (max-width: 719px) {
    .foot .btn.hi {
      flex: 1;
    }
  }
</style>

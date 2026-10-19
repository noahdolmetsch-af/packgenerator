<script>
  /**
   * «Velo im Griff» #193: the sheet of the whole-bike service. Three measures, each one switchable off
   * (an empty field): every [3000] km, every [100] riding hours, every [365] days, whichever comes first.
   * Below: the last service (a date and the km then, e.g. from a receipt). «All to the suggestion»,
   * «Cancel», «Save». bike: as stored; series: its hours (bikehours.js); onsave(patch); onclose().
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { keepTyped } from '../ui/keeptyped.js';
  import { t, num } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { parseKm } from '../care.js';
  import { hoursOn } from '../bikehours.js';
  import { KIND_SPEED, kindOf } from '../bikekind.js';
  import { SERVICE_STD, serviceValues, serviceChange, serviceLast } from '../bikeservice.js';

  let { bike, km = null, series = null, onsave, onclose } = $props();

  let dialog;
  const show = (v) => (v == null ? '' : String(v));
  // svelte-ignore state_referenced_locally
  const start = serviceValues(bike);
  let everyKm = $state(show(start.everyKm));
  let everyHours = $state(show(start.everyHours));
  let everyDays = $state(show(start.everyDays));
  // svelte-ignore state_referenced_locally
  let lastDay = $state(bike.service?.last?.day ?? '');
  // svelte-ignore state_referenced_locally
  let lastKm = $state(show(bike.service?.last?.km));
  // svelte-ignore state_referenced_locally
  let speed = $state(show(bike.avgKmh));
  // svelte-ignore state_referenced_locally
  const kindSpeed = KIND_SPEED[kindOf(bike)];
  let error = $state('');

  $effect(() => dialog.showModal());

  const toNum = (v) => (String(v ?? '').trim() === '' ? null : parseKm(v));
  function toStd() {
    everyKm = show(SERVICE_STD.everyKm);
    everyHours = show(SERVICE_STD.everyHours);
    everyDays = show(SERVICE_STD.everyDays);
    error = '';
  }
  async function save(e) {
    e?.preventDefault();
    const values = { everyKm: toNum(everyKm), everyHours: toNum(everyHours), everyDays: toNum(everyDays) };
    const lk = toNum(lastKm);
    const sp = toNum(speed);
    if (Object.values(values).some((v) => Number.isNaN(v) || v === 0) || Number.isNaN(lk) || Number.isNaN(sp) || sp === 0 || sp > 60) {
      error = t('Only numbers above 0.');
      return;
    }
    if (lastDay && lastDay > localDay()) {
      error = t('The last service cannot be in the future.');
      return;
    }
    let next = { ...bike, ...serviceChange(bike, values) };
    const prev = bike.service?.last ?? null;
    if ((prev?.day ?? '') !== lastDay || (prev?.km ?? null) !== lk) next = { ...next, ...serviceLast(next, { day: lastDay || null, km: lk ?? (lastDay === localDay() ? km : null), hours: lastDay ? hoursOn(series, lastDay) : null }) };
    await onsave?.({ service: next.service, ...(sp !== (bike.avgKmh ?? null) ? { avgKmh: sp } : {}) });
    dialog.close();
  }
</script>

<dialog use:keepTyped={'service:' + (bike?.id ?? '')} class="sheet from-below ssheet" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="ss-h" data-service-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <h2 id="ss-h">{t('Bike service')}</h2>
        <p class="sub">{bike.name} · {t('Set up|service')}</p>
      </div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>

    <fieldset class="grp">
      <legend class="slbl">{t('Interval')}</legend>
      <p class="src">{t('Whichever comes first counts. An empty field: not by that.')}</p>
      <label class="rrow"><span>{t('every|interval')}</span><input class="inp num" type="text" inputmode="numeric" aria-label={t('Every … km')} placeholder="–" bind:value={everyKm} oninput={() => (error = '')} data-service-km /><span class="unit">km</span></label>
      <label class="rrow"><span>{t('every|interval')}</span><input class="inp num" type="text" inputmode="numeric" aria-label={t('Every … riding hours')} placeholder="–" bind:value={everyHours} oninput={() => (error = '')} data-service-hours /><span class="unit">h</span></label>
      <label class="rrow"><span>{t('every|interval')}</span><input class="inp num" type="text" inputmode="numeric" aria-label={t('Every … days')} placeholder="–" bind:value={everyDays} oninput={() => (error = '')} data-service-days /><span class="unit">{t('days')}</span></label>
      <p class="src">{t('Suggestion: {km} km, {h} h or {d} days.', { km: num(SERVICE_STD.everyKm), h: SERVICE_STD.everyHours, d: SERVICE_STD.everyDays })} · <button type="button" class="tp-link" onclick={toStd}>{t('All to the suggestion')}</button></p>
    </fieldset>

    <fieldset class="grp">
      <legend class="slbl">{t('Last service')}</legend>
      <label class="rrow"><span>{t('Date')}</span><input class="inp" type="date" max={localDay()} bind:value={lastDay} oninput={() => (error = '')} data-service-last /></label>
      <label class="rrow"><span>{t('km then')}</span><input class="inp num" type="text" inputmode="numeric" placeholder="–" bind:value={lastKm} oninput={() => (error = '')} data-service-lastkm /><span class="unit">km</span></label>
      <p class="src">{t('From a receipt, or empty: «Service done» sets it.')}</p>
    </fieldset>

    <fieldset class="grp">
      <legend class="slbl">{t('Riding hours')}</legend>
      <label class="rrow"><span>{t('Average speed')}</span><input class="inp num" type="text" inputmode="numeric" placeholder={String(kindSpeed)} bind:value={speed} oninput={() => (error = '')} data-service-speed /><span class="unit">km/h</span></label>
      <p class="src">{t('For km without a time from Strava. Empty: {n} km/h for this kind of bike.', { n: kindSpeed })}</p>
    </fieldset>
    {#if error}<p class="err" role="alert">{error}</p>{/if}

    <div class="foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" data-service-save>{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .ssheet {
    width: min(520px, calc(100vw - 24px));
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
  .sub,
  .src {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .grp {
    margin: 0 0 14px;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .slbl {
    padding: 0;
    font-weight: 600;
  }
  .rrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 8px 0 0;
  }
  .rrow > span:first-child {
    min-width: 4.5rem;
  }
  .rrow .num {
    width: 7rem;
  }
  .err {
    color: var(--bad);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
</style>

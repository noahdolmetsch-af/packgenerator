<script>
  /**
   * v0.47.1 (Noah a): one fact of the trip band (date, duration, weather, bike) changed in place: a small
   * sheet with only that field. Every tap goes through the page's change logic (Pack.svelte change /
   * changeContext), so the packing amounts follow at once and Undo takes it back.
   * edit: { date(iso), hours(n), days(n), wx(patch), bike(bike), more(), compare(), undo(), canUndo }
   */
  import { Undo2 } from '@lucide/svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import { WX_PRESETS } from '../trips.js';
  import { wxSource } from '../dayride.js';
  import { localDay } from '../localday.js';
  import './trip.css';

  let { field, trip, bikes = [], edit, onclose } = $props();
  let el = $state();
  $effect(() => {
    if (el && !el.open) el.showModal();
  });
  const close = () => el?.close();
  const TITLES = { date: 'Change date', duration: 'Change duration', weather: 'Change weather', bike: 'Change bike' };
  const HOURS = [1, 2, 3, 4, 5, 6];
  const days = $derived(Math.max(1, Number(trip.days) || 1));
  const oneDay = $derived(days === 1 && (trip.overnight == null || trip.overnight === 'none'));
  const wx = $derived(trip.wx ?? {});
  const wet = $derived(wx.rain === 'rain' || wx.rain === 'showers');
  const tomorrow = localDay(new Date(Date.now() + 864e5));
  function typedHours(value) {
    const n = Number(String(value).replace(',', '.'));
    if (n > 0 && n <= 24) edit.hours(n);
  }
  function typedTemp(key, value) {
    const n = Math.round(Number(value));
    if (String(value).trim() !== '' && n >= -30 && n <= 45) edit.wx({ [key]: n });
  }
</script>

<dialog class="fact-sheet" bind:this={el} onclose={onclose} aria-labelledby="fact-h">
  <header><h2 id="fact-h">{t(TITLES[field])}</h2><button type="button" class="tp-link" onclick={close}>{t('Close')}</button></header>
  {#if field === 'date'}
    <div class="tp-chips" role="group" aria-label={t('Start date')}>
      <button type="button" class="tp-chip" aria-pressed={trip.startDate === localDay()} onclick={() => edit.date(localDay())}>{t('Today')}</button>
      <button type="button" class="tp-chip" aria-pressed={trip.startDate === tomorrow} onclick={() => edit.date(tomorrow)}>{t('Tomorrow')}</button>
    </div>
    <label class="field"><span class="lbl">{t('Start date')}</span><input class="inp" type="date" value={trip.startDate ?? ''} onchange={(e) => e.currentTarget.value && edit.date(e.currentTarget.value)} /></label>
  {:else if field === 'duration'}
    {#if oneDay}
      <div class="tp-chips" role="group" aria-label={t('Riding hours')}>
        {#each HOURS as h (h)}<button type="button" class="tp-chip" aria-pressed={Number(trip.hours) === h} onclick={() => edit.hours(h)}>{t('{n} h', { n: h })}</button>{/each}
      </div>
      <label class="field"><span class="lbl">{t('Riding hours')}</span><input class="inp num" type="text" inputmode="decimal" value={trip.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder={t('e.g. 6')} /></label>
    {:else}
      <div class="field">
        <span class="lbl" id="fact-days">{t('Days')}</span>
        <div class="step" role="group" aria-labelledby="fact-days">
          <button type="button" class="tp-chip" aria-label={t('One day less')} disabled={days <= 1} onclick={() => edit.days(days - 1)}>−</button>
          <b class="num" aria-live="polite">{tn(days, '{n} day', '{n} days')}</b>
          <button type="button" class="tp-chip" aria-label={t('One day more')} disabled={days >= 60} onclick={() => edit.days(days + 1)}>+</button>
        </div>
      </div>
      <label class="field"><span class="lbl">{t('Riding hours per day')}</span><input class="inp num" type="text" inputmode="decimal" value={trip.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder={t('e.g. 6')} /></label>
    {/if}
    <p class="more"><button type="button" class="tp-link" onclick={() => { close(); edit.more(); }}>{oneDay ? t('More days or a night: Edit trip') : t('Overnight stay: Edit trip')}</button></p>
  {:else if field === 'weather'}
    <div class="tp-chips" role="group" aria-label={t('Weather presets')}>
      {#each WX_PRESETS as p (p.name)}<button type="button" class="tp-chip" aria-pressed={wx.min === p.min && wx.max === p.max} onclick={() => edit.wx({ min: p.min, max: p.max })}>{t(p.name)} <small>{p.min}–{p.max}°</small></button>{/each}
    </div>
    <div class="tp-chips rain" role="group" aria-label={t('Rain')}>
      <button type="button" class="tp-chip" aria-pressed={!wet} onclick={() => edit.wx({ rain: 'none' })}>{t('Dry|weather')}</button>
      <button type="button" class="tp-chip" aria-pressed={wet} onclick={() => edit.wx({ rain: 'rain' })}>{t('Rain')}</button>
    </div>
    <div class="temps">
      <label class="field"><span class="lbl">{t('Min °C')}</span><input class="inp num" type="text" inputmode="numeric" value={wx.min ?? ''} onchange={(e) => typedTemp('min', e.currentTarget.value)} /></label>
      <label class="field"><span class="lbl">{t('Max °C')}</span><input class="inp num" type="text" inputmode="numeric" value={wx.max ?? ''} onchange={(e) => typedTemp('max', e.currentTarget.value)} /></label>
    </div>
    {#if wxSource(trip)}<p class="src tp-muted" data-wx-source>{wxSource(trip)}</p>{/if}
  {:else if field === 'bike'}
    <div class="tp-chips" role="group" aria-label={t('Bike')}>
      {#each bikes as b (b.id)}<button type="button" class="tp-chip" aria-pressed={trip.bikeId === b.id} onclick={() => edit.bike(b)}>{b.name}</button>{/each}
    </div>
    {#if bikes.length > 1}<p class="more"><button type="button" class="tp-link" onclick={() => { close(); edit.compare(); }}>{t('Compare bikes')}</button></p>{/if}
  {/if}
  <footer>
    <button type="button" class="btn ink" onclick={close}>{t('Done')}</button>
    <span role="status">{#if edit.canUndo}<button type="button" class="tp-link" onclick={edit.undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}</span>
  </footer>
</dialog>

<style>
  .fact-sheet {
    width: min(440px, calc(100vw - 32px));
    max-height: calc(100dvh - 40px);
    box-sizing: border-box;
    padding: 18px 20px 20px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-body);
  }
  .fact-sheet::backdrop {
    background: var(--scrim);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 16px;
    margin-bottom: 14px;
  }
  h2 {
    margin: 0;
    min-width: 0;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  header .tp-link {
    margin-left: auto;
  }
  .field {
    display: block;
    margin-top: 14px;
  }
  .field .inp {
    width: 100%;
    max-width: 220px;
    min-height: 44px;
    box-sizing: border-box;
  }
  .rain {
    margin-top: 10px;
  }
  .temps {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .step .tp-chip {
    justify-content: center;
    min-width: 44px;
  }
  .more {
    margin: 10px 0 0;
  }
  .src {
    margin: 10px 0 0;
    font-size: var(--fs-small);
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 18px;
    margin-top: 18px;
  }
  footer .btn {
    min-height: 44px;
    padding: 8px 22px;
  }
  @media (max-width: 719px) {
    .fact-sheet {
      margin: auto auto 0;
      width: 100vw;
      max-width: 100vw;
      border-radius: var(--radius-card) var(--radius-card) 0 0;
      padding: 16px 16px calc(18px + env(safe-area-inset-bottom));
    }
  }
</style>

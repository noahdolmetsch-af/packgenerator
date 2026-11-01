<script>
  /**
   * «Neuer Schwung» Blatt von unten (Noah 27.10.2026 «a»): on a phone «Dein Körper heute» opens this sheet
   * instead of leaving Heute. Per value a ring (where today stands between the lowest and the highest value of
   * the last 4 weeks), the mean of this week next to the week before, and «All body values» for the full page.
   * The computer keeps the tile as it is. Observation only: no colour for good or bad (body.js bodyWeek).
   */
  import { liveQuery } from 'dexie';
  import { ArrowUp, ArrowDown, ArrowRight, ChevronRight, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { addDays } from '../health.js';
  import { bodyWeek } from './body.js';
  import { backClose } from '../ui/backclose.js';
  import { t, locale } from '../i18n.svelte.js';

  let { open = $bindable(false), today } = $props();
  let dialog = $state();

  const hq = $derived(liveQuery(() => (db.healthDays ? db.healthDays.where('date').aboveOrEqual(addDays(today, -27)).toArray() : [])));
  const w = $derived(bodyWeek($hq ?? [], today));

  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  });

  const n1 = (x) => Number(x).toLocaleString(locale(), { maximumFractionDigits: 1 });
  const LABEL = { pulse: 'Resting pulse|body', sleep: 'Sleep|body', score: 'Sleep score|body', azm: 'Active zone minutes|body' };
  const fmt = (r, x) => (x == null ? '–' : r.key === 'sleep' ? `${n1(x)} h` : r.key === 'score' && r.kind === 'efficiency' ? `${n1(x)} %` : n1(r.key === 'pulse' || r.key === 'azm' ? Math.round(x) : x));
  const label = (r) => (r.key === 'score' && r.kind === 'efficiency' ? t('Sleep efficiency|body') : t(LABEL[r.key]));
  const shortDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

<dialog class="sheet from-below bsh" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="bsh-h" data-body-sheet>
  <div class="head">
    <h2 id="bsh-h" class="title">{t('Your body today')}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => (open = false)}><X size={20} /></button>
  </div>
  {#if w.any}
    <ul class="rings">
      {#each w.rows as r (r.key)}
        <li data-sheet-body={r.key}>
          <span class="ring" role="img" aria-label={r.share == null ? label(r) : t('{v}, between {min} and {max} in the last 4 weeks', { v: fmt(r, r.now), min: fmt(r, r.min), max: fmt(r, r.max) })}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="20" /><circle class="fg" cx="24" cy="24" r="20" pathLength="100" style:stroke-dashoffset={100 - (r.share ?? 0) * 100} /></svg>
            <b class="num" aria-hidden="true">{fmt(r, r.now)}</b>
          </span>
          <span class="lb">{label(r)}</span>
          {#if r.share != null}<small class="rg" data-sheet-range>{t('4 weeks: {min} to {max}|body', { min: fmt(r, r.min), max: fmt(r, r.max) })}</small>{/if}
          {#if r.day && r.day !== today}<small class="dy">{t('from {date}|body', { date: shortDay(r.day) })}</small>{/if}
          <span class="wk" data-sheet-week>
            {#if r.dir != null}<span class="ar" aria-hidden="true">{#if r.dir > 0}<ArrowUp size={14} />{:else if r.dir < 0}<ArrowDown size={14} />{:else}<ArrowRight size={14} />{/if}</span>{/if}
            <span class="num">{t('Week {a} · before {b}', { a: fmt(r, r.week), b: fmt(r, r.prev) })}</span>
          </span>
        </li>
      {/each}
    </ul>
    <p class="note">{t('The ring shows where the value stands between your lowest and highest of the last 4 weeks. «Week» is the mean of the last 7 days, «before» the 7 days before. Only to look at.')}</p>
  {:else}
    <p class="note">{t('No body values in the last 4 weeks yet.')}</p>
  {/if}
  <div class="acts">
    <a class="btn hi" href="#/me/insights" onclick={() => (open = false)} data-sheet-all>{t('All body values')}<ChevronRight size={16} aria-hidden="true" /></a>
    <button type="button" class="btn btn-link" onclick={() => (open = false)}>{t('Close')}</button>
  </div>
</dialog>

<style>
  .bsh {
    display: none;
  }
  .bsh[open] {
    display: grid;
    gap: 14px;
    align-content: start;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .head h2 {
    flex: 1;
    margin: 0;
  }
  .x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .rings {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .rings li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 6px 10px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    text-align: center;
    min-width: 0;
  }
  .ring {
    position: relative;
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
  }
  .ring > svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .ring circle {
    fill: none;
    stroke-width: 4;
  }
  .ring .bg {
    stroke: var(--line);
  }
  .ring .fg {
    stroke: var(--hi);
    stroke-linecap: round;
    stroke-dasharray: 100;
  }
  .ring b {
    font-size: var(--fs-small);
  }
  .lb {
    font-weight: 600;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .dy,
  .rg,
  .wk,
  .note {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wk {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .note {
    margin: 0;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .acts a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
  }
  @media (prefers-reduced-motion: no-preference) {
    .bsh[open] .fg {
      animation: bs-ring 700ms ease-out 120ms backwards;
    }
  }
  @keyframes bs-ring {
    from {
      stroke-dashoffset: 100;
    }
  }
</style>

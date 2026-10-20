<script>
  /**
   * Aktiv › Aktivzonenminuten (Noah 19.10.2026 «1b»): the minutes of this week against the weekly goal,
   * with one small bar per day (Monday to Sunday). The values come from the Fitbit days (healthDays),
   * observation only. The weekly goal can be changed by tapping it (db.settings AZM_WEEK_KEY).
   * Without Fitbit one quiet line with the way to the page «Fitbit».
   * tile (Garmin-Übersicht 20.10.2026, screenshot 2): the tile of «Überblick»: a ring of the week against
   * the goal, the goal under it and one small value per day.
   */
  import { liveQuery } from 'dexie';
  import { Timer, Pencil } from '@lucide/svelte';
  import { db } from '../db.js';
  import { azmWeek, addDays, AZM_WEEK_KEY, azmWeekOf } from '../health.js';
  import { health, FITBIT_HASH } from './client.svelte.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { today, tile = false } = $props();
  const daysQ = liveQuery(() => db.healthDays.where('date').aboveOrEqual(addDays(today, -7)).toArray());
  const goalQ = liveQuery(() => db.settings.get(AZM_WEEK_KEY));
  const week = $derived(azmWeek($daysQ ?? [], today));
  const of = $derived(azmWeekOf($goalQ?.value));
  const top = $derived(Math.max(30, ...week.days.map((d) => d.min ?? 0)));
  const off = $derived(health.prefs.connected && !health.prefs.values.includes('azm'));
  const wd = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });

  let editing = $state(false);
  function setOf(e) {
    const v = Math.round(Number(String(e.currentTarget.value).replace(/[^\d]/g, '')));
    if (v > 0) db.settings.put({ key: AZM_WEEK_KEY, value: { of: v } });
    editing = false;
  }
</script>

{#if week.any && tile}
  {@const pct = Math.min(1, week.sum / of)}
  <div class="card azt" data-section="azm">
    <span class="th"><Timer size={18} aria-hidden="true" /><span>{t('Active zone minutes|metric')}</span></span>
    <svg class="ring" viewBox="0 0 100 100" role="img" aria-label="{Math.round(pct * 100)} %">
      <circle cx="50" cy="50" r="40" class="tr" />
      <circle cx="50" cy="50" r="40" class="fl" stroke-dasharray="{(pct * 251.3).toFixed(1)} 251.3" transform="rotate(-90 50 50)" />
      <text x="50" y="57" text-anchor="middle" class="num" data-azm-sum>{num(week.sum)}</text>
    </svg>
    {#if editing}
      <!-- svelte-ignore a11y_autofocus -->
      <input class="inp sm num" type="text" inputmode="numeric" value={of} autofocus aria-label={t('Weekly goal for the active zone minutes')} onchange={setOf} onblur={() => (editing = false)} />
    {:else}
      <button type="button" class="ofb num" data-azm-goal onclick={() => (editing = true)} aria-label={t('Change the weekly goal for the active zone minutes')}><Pencil size={12} aria-hidden="true" />{num(of)}</button>
    {/if}
    <ul class="dl" aria-label={t('Active zone minutes per day')}>
      {#each week.days as d (d.date)}
        <li class:fut={d.future} class:now={d.today} data-day={d.date}><span class="num">{d.min ?? (d.future ? '' : '–')}</span><small>{wd(d.date).slice(0, 2)}</small></li>
      {/each}
    </ul>
  </div>
{:else if week.any}
  <div class="card azw" data-section="azm">
    <div class="hd">
      <span class="ib" aria-hidden="true"><Timer size={18} /></span>
      <b class="num" data-azm-sum>{t('{n} min', { n: num(week.sum) })}</b>
      {#if editing}
        <!-- svelte-ignore a11y_autofocus -->
        <input class="inp sm num" type="text" inputmode="numeric" value={of} autofocus aria-label={t('Weekly goal for the active zone minutes')} onchange={setOf} onblur={() => (editing = false)} />
      {:else}
        <button type="button" class="ofb num" data-azm-goal onclick={() => (editing = true)} aria-label={t('Change the weekly goal for the active zone minutes')}><Pencil size={12} aria-hidden="true" />{t('of {n} min', { n: num(of) })}</button>
      {/if}
    </div>
    <span class="bar" role="img" aria-label="{Math.min(100, Math.round((week.sum / of) * 100))} %"><i style="width:{Math.max(2, Math.min(100, Math.round((week.sum / of) * 100)))}%"></i></span>
    <ul class="days" aria-label={t('Active zone minutes per day')}>
      {#each week.days as d (d.date)}
        <li class:fut={d.future} class:now={d.today} data-day={d.date}>
          <span class="v num">{d.min ?? (d.future ? '' : '–')}</span>
          <span class="col" aria-hidden="true"><i style="height:{d.min ? Math.max(6, Math.round((d.min / top) * 100)) : 0}%"></i></span>
          <small>{wd(d.date)}</small>
        </li>
      {/each}
    </ul>
    <small class="src">{t('From your Fitbit · observation only · tap the goal to change it')}</small>
  </div>
{:else}
  <a class="card azm" href={FITBIT_HASH} data-section="azm">
    <Timer size={18} aria-hidden="true" />
    <span>
      {#if off}{t('The active zone minutes are switched off on the page Fitbit.')}
      {:else if health.prefs.connected}{t('No active zone minutes this week yet. They come when the app fetches from Fitbit.')}
      {:else}{t('Connect Fitbit: then the minutes of every activity count here.')}{/if}
      ›
    </span>
  </a>
{/if}

<style>
  .azt {
    display: grid;
    justify-items: center;
    gap: 6px;
    height: 100%;
    padding: 12px;
  }
  .th {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-self: start;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .th :global(svg) {
    flex: none;
    color: var(--warn);
  }
  .ring {
    width: 96px;
    height: 96px;
  }
  .ring .tr,
  .ring .fl {
    fill: none;
    stroke-width: 9;
  }
  .ring .tr {
    stroke: var(--paper-2);
  }
  .ring .fl {
    stroke: var(--hi);
    stroke-linecap: round;
  }
  .ring text {
    fill: var(--ink);
    font: 600 var(--fs-title) var(--font-body);
  }
  .dl {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    width: 100%;
    margin: 4px 0 0;
    padding: 6px 0 0;
    border-top: 1px solid var(--line);
    list-style: none;
  }
  .dl li {
    display: grid;
    justify-items: center;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .dl li.now {
    color: var(--ink);
    font-weight: 700;
  }
  .dl li.fut {
    color: var(--ink-3);
  }
  .azw {
    display: grid;
    gap: 10px;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .hd b {
    font: 700 var(--fs-sub) / 1.2 var(--font-body);
  }
  .ofb {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline dotted;
    cursor: pointer;
  }
  .ofb :global(svg) {
    margin-right: 4px;
    vertical-align: -1px;
  }
  .inp.sm {
    max-width: 8ch;
  }
  .bar {
    display: block;
    height: 8px;
    border-radius: 99px;
    background: var(--paper-2);
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--hi);
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .days li {
    display: grid;
    justify-items: center;
    gap: 3px;
  }
  .days .v {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    min-height: 1.2em;
  }
  .col {
    display: flex;
    align-items: flex-end;
    width: 100%;
    max-width: 28px;
    height: 48px;
    border-radius: 6px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .col i {
    display: block;
    width: 100%;
    background: var(--hi);
  }
  .days small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .days li.now small {
    color: var(--ink);
    font-weight: 600;
  }
  .days li.fut {
    opacity: 0.5;
  }
  .src {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .azm {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin: 0;
    color: var(--ink-3);
    text-decoration: none;
  }
</style>

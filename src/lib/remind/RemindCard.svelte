<script>
  /**
   * Erinnerungen überall (mockups ER1 + ER2, Noah «1a 2a 3a 4a 5b er1-er3 freigabe» 14.10.2026): the card
   * «Soll ich dich in Zukunft erinnern?» on top of the next page, in the page so it never covers a button (1a). The time comes from the
   * history (3a); «Nein danke» asks again after 30 days (2a), «Nie fragen» never. Everything is a
   * suggestion: each chip can be deselected, and Ich › Erinnerungen changes or switches it off later.
   */
  import { Bell, Check, X } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { activityReminder, tripReminders, careReminder, hourBefore } from '../remind.js';
  import { ask, acceptOffer, declineOffer, closeOffer, showPending } from './ask.svelte.js';

  const o = $derived(ask.offer);

  // ER1: rhythm chip on, «1 Std. vorher» and «Andere Zeit …» as choices
  let earlier = $state(false);
  let other = $state(false);
  let time = $state('');
  // ER2 trip: every step chosen, each one deselectable; «Andere …» shows the times
  let picked = $state({});
  let times = $state({});
  // ER2 care: one way
  let way = $state('km');
  let saved = $state(null); // { undo } for «Rückgängig»
  let savedTimer;

  $effect(() => {
    addEventListener('hashchange', showPending);
    return () => removeEventListener('hashchange', showPending);
  });

  $effect(() => {
    if (!o) return;
    earlier = false;
    other = false;
    time = o.rhythm?.at ?? '';
    picked = Object.fromEntries((o.steps ?? []).map((s) => [s.key, true]));
    times = Object.fromEntries((o.steps ?? []).map((s) => [s.key, s.at]));
    way = 'km';
  });

  const dayName = (wd) => new Date(Date.UTC(2026, 9, 12 + wd, 12)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });
  const dayOf = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });
  const rhythmLabel = (r) => (r.every === 'day' ? t('Every day {time}', { time: r.at }) : t('Every {day} {time}', { day: dayName(r.weekday), time: r.at }));
  const why = (r, name) =>
    r.every === 'day' ? t('You did {name} on {n} of the last 7 days.', { name, n: r.seen }) : r.seen >= 2 ? t('You did {name} on {n} {day}s in the last 3 weeks.', { name, n: r.seen, day: dayName(r.weekday) }) : t('A suggestion: change the time as you like.');
  const STEP = { pack: 'Pack', charge: 'Charge', weather: 'Weather' };
  const STEP_TEXT = {
    pack: (n) => t('{trip}: pack', { trip: n }),
    charge: (n) => t('{trip}: charge the devices', { trip: n }),
    weather: (n) => t('{trip}: check the weather', { trip: n }),
  };
  const WAYS = [
    ['km', 'After 300 km'],
    ['month', 'Every month'],
    ['rain', 'After rain'],
  ];

  async function yes() {
    const today = localDay();
    const now = new Date();
    const nowClock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let list = [];
    if (o.kind === 'activity') list = [activityReminder(o.act, o.rhythm, { today, nowClock, earlier: earlier && !other, at: other && time ? time : null })];
    else if (o.kind === 'trip') list = tripReminders(o.trip, o.steps.filter((s) => picked[s.key]).map((s) => ({ ...s, at: times[s.key] || s.at })), STEP_TEXT);
    else if (o.kind === 'care') list = [careReminder({ bike: o.bike, kind: o.care, text: t('{bike}: lube the chain', { bike: o.bike.name }), today, way })];
    if (!list.length) return declineOffer('no');
    const undo = await acceptOffer(list);
    clearTimeout(savedTimer);
    saved = { undo, n: list.length };
    savedTimer = setTimeout(() => (saved = null), 8000);
  }
  async function undoSaved() {
    const u = saved?.undo;
    saved = null;
    if (u) await u();
  }
</script>

{#if o}
  {#key o.id}
    <section class="rmc" aria-labelledby="rmc-h">
      <div class="q">
        <span class="ib" aria-hidden="true"><Bell size={20} /></span>
        <span class="tx">
          <b id="rmc-h">{o.kind === 'trip' ? t('Shall I remind you before the trip?') : o.kind === 'care' ? t('Remind you again when it is due?') : t('Shall I remind you in future?')}</b>
          <small>{o.kind === 'activity' ? why(o.rhythm, o.act.name) : o.kind === 'trip' ? t('Pack, charge, check the weather.') : t('Lube the chain: every 300 km or after a ride in the rain.')}</small>
        </span>
        <button type="button" class="x" onclick={closeOffer} aria-label={t('Close')}><X size={18} aria-hidden="true" /></button>
      </div>

      <div class="chips">
        {#if o.kind === 'activity'}
          <button type="button" class="chip" aria-pressed={!other} onclick={() => (other = false)}>{rhythmLabel(o.rhythm)}</button>
          <button type="button" class="chip" aria-pressed={earlier && !other} onclick={() => ((earlier = !earlier), (other = false))}>{t('1 h before')}{#if earlier && !other}{' '}· {hourBefore(o.rhythm.at)}{/if}</button>
          <button type="button" class="chip dash" aria-pressed={other} onclick={() => (other = true)}>{t('Other time …')}</button>
          {#if other}<input class="inp time" type="time" bind:value={time} aria-label={t('Time')} />{/if}
        {:else if o.kind === 'trip'}
          {#each o.steps as s (s.key)}
            <button type="button" class="chip" aria-pressed={!!picked[s.key]} onclick={() => (picked[s.key] = !picked[s.key])}>{t(STEP[s.key])}: {dayOf(s.day)} {times[s.key]}</button>
          {/each}
          <button type="button" class="chip dash" aria-pressed={other} onclick={() => (other = !other)}>{t('Other …')}</button>
        {:else}
          {#each WAYS as [k, label] (k)}<button type="button" class="chip" aria-pressed={way === k} onclick={() => (way = k)}>{t(label)}</button>{/each}
        {/if}
      </div>
      {#if o.kind === 'trip' && other}
        <div class="times">
          {#each o.steps.filter((s) => picked[s.key]) as s (s.key)}<label><span>{t(STEP[s.key])}</span><input class="inp time" type="time" bind:value={times[s.key]} /></label>{/each}
        </div>
      {/if}

      {#if saved}
        <p class="done" role="status"><Check size={16} aria-hidden="true" />{t('Reminder saved.')} <button type="button" class="lnk" onclick={undoSaved}>{t('Undo')}</button></p>
      {:else}
        <div class="row">
          <!-- Paket E CI: the card sits on top of another page, whose main button stays the only orange one (guard rule) -->
          <button type="button" class="btn" onclick={yes}>{t('Yes, remind me')}</button>
          <button type="button" class="lnk" onclick={() => declineOffer('no')}>{t('No thanks')}</button>
          <button type="button" class="lnk" onclick={() => declineOffer('never')}>{t('Never ask')}</button>
        </div>
      {/if}
      <p class="why">{o.kind === 'trip' ? t('All are chosen, each one can be deselected.') : o.kind === 'care' ? t('The km come from Strava or your counter.') : t('The app asks this once per thing. Change or switch it off under Me › Reminders.')}</p>
    </section>
  {/key}
{:else if saved}
  <p class="rmc done solo" role="status"><Check size={16} aria-hidden="true" />{t('Reminder saved.')} <button type="button" class="lnk" onclick={undoSaved}>{t('Undo')}</button> · <a href="#/me/reminders">{t('Reminders')}</a></p>
{/if}

<style>
  .rmc {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 720px;
    margin: 0 0 16px;
    padding: 14px 16px;
    border: 1.5px solid var(--accent);
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
  }
  .q {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--gold-soft, var(--paper-2));
    color: var(--gold, var(--ink));
  }
  .tx {
    flex: 1;
    min-width: 0;
  }
  .tx b {
    display: block;
    font-size: var(--fs-sub);
  }
  .tx small {
    color: var(--ink-2);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px -8px 0 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip.dash {
    border-style: dashed;
    color: var(--ink-2);
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    border-style: solid;
    color: var(--paper);
  }
  .time {
    width: 120px;
  }
  .times {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .times label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    align-items: center;
  }
  .lnk {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .why {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .done {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-weight: 500;
  }
  .solo {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 6px 14px;
  }
</style>

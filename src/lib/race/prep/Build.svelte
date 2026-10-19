<script>
  /** Vorbereiten › Countdown and dress rehearsal (7), Training for the race (32). */
  import { liveQuery } from 'dexie';
  import RaceBox from '../RaceBox.svelte';
  import { db } from '../../db.js';
  import { countdown, trainingPlan, longestByWeek } from '../race.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { ctx } = $props();
  const start = $derived(ctx.trip.startDate ?? '');
  const cd = $derived(start ? countdown(start, ctx.today) : null);
  const probe = $derived(ctx.stored.probe ?? {});
  const days = $derived(ctx.plan?.days?.length ?? 0);
  const dayKm = $derived(days && ctx.route?.km ? ctx.route.km / days : 0);
  const dayUp = $derived(days && ctx.route?.gainM ? ctx.route.gainM / days : 0);
  const weeks = $derived(start && dayKm ? trainingPlan(start, ctx.today, dayKm) : []);
  const actsQ = liveQuery(() => db.activities.where('kind').anyOf('bike', 'ride').toArray());
  const longest = $derived(longestByWeek($actsQ ?? []));
  const day = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
  const setProbe = (patch) => ctx.save((s) => ({ ...s, probe: { ...(s.probe ?? {}), ...patch } }));
</script>

<RaceBox
  id="prep-countdown"
  title={t('Countdown and dress rehearsal')}
  what="Counts the days to the start and suggests a dress rehearsal: two days like the race, with everything packed."
  why="On the rehearsal you find what rattles, rubs or is missing while there is still time to change it."
  from="The start date of the trip and the plan of this race."
>
  {#if cd}
    <div class="rc-stat">
      <div><b>{num(Math.max(0, cd.days))}</b><small>{t('days to the start')}</small></div>
      <div><b>{num(Math.max(0, cd.weeks))}</b><small>{t('weeks')}</small></div>
      <div><b>{day(cd.probeBy)}</b><small>{t('rehearsal by')}</small></div>
    </div>
    <p class="rc-text">
      {t('Suggestion: by {date} ride two days in a row with the full packing, like in the race.', { date: day(cd.probeBy) })}
      {#if dayKm}{t('That is about {km} km and {up} m up per day.', { km: num(Math.round(dayKm)), up: num(Math.round(dayUp)) })}{/if}
    </p>
    <div class="rc-form">
      <label class="rc-lab">{t('Date of the rehearsal')}<input class="inp" type="date" value={probe.date ?? ''} max={start} onchange={(e) => setProbe({ date: e.currentTarget.value })} data-race-probe-date /></label>
      <label class="rc-inline"><input type="checkbox" checked={!!probe.done} onchange={(e) => setProbe({ done: e.currentTarget.checked })} data-race-probe-done />{t('Done')}</label>
      <label class="rc-lab">{t('What I learned')}<textarea class="inp" rows="2" maxlength="1000" value={probe.note ?? ''} onchange={(e) => setProbe({ note: e.currentTarget.value })} data-race-probe-note></textarea></label>
    </div>
    {#if probe.date && probe.date > cd.probeBy && !probe.done}<p class="rc-warn">{t('That is less than 2 weeks before the start: little time to change things.')}</p>{/if}
  {:else}
    <p class="rc-empty">{t('Give the trip a start date first (on the trip page).')}</p>
  {/if}
</RaceBox>

<RaceBox
  id="prep-training"
  title={t('Training for the race')}
  what="A simple build-up week by week: how long the longest ride should be, when two long days follow each other, when to ride easier."
  why="You arrive used to long days, and rested."
  from="Your plan (km per day) and your rides from Strava (the longest of each week)."
>
  {#if weeks.length}
    <div class="rc-scroll">
      <table class="rc-table" data-race-training>
        <thead><tr><th>{t('Week from')}</th><th class="num">{t('Long ride')}</th><th class="num">{t('Done')}</th><th>{t('Note')}</th></tr></thead>
        <tbody>
          {#each weeks as w (w.week)}
            {@const got = longest[w.week]}
            <tr>
              <td>{day(w.week)}</td>
              <td class="num">{num(w.longKm)} km</td>
              <td class="num" class:rc-ok={got >= w.longKm} class:rc-warn={w.week < ctx.today && got != null && got < w.longKm * 0.8}>{got ? `${num(Math.round(got))} km` : '–'}</td>
              <td>{w.taper ? t('Easier: rest for the race') : w.b2b ? t('Two long days back to back') : ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <ul class="rc-list">
      <li class="rc-row"><span>{t('From 6 weeks before: two long days back to back, on Saturday and Sunday.')}</span></li>
      <li class="rc-row"><span>{t('Ride one night through once, to practise light, cold and tiredness.')}</span></li>
    </ul>
  {:else if !start}
    <p class="rc-empty">{t('Give the trip a start date first (on the trip page).')}</p>
  {:else if !dayKm}
    <p class="rc-empty">{t('Load the route and set the start (Strategy) first: the plan gives the km per day.')}</p>
  {:else}
    <p class="rc-empty">{t('The race is this week or over: no build-up left.')}</p>
  {/if}
  {#if weeks.length && !Object.keys(longest).length}<p class="rc-note">{t('No rides from Strava yet: connect Strava under Training to compare.')}</p>{/if}
</RaceBox>

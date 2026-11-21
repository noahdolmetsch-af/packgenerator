<script>
  /**
   * «Wochenrückblick» as a card on Heute (Noah 10.11.2026 «1b»; Noah 19.11.2026 «3a»: the window «Your week in review» stays).
   * From Sunday 17:00 until Monday 12:00: the finished week in three numbers, on Sundays the own tasks that slide to Monday,
   * and the way on to the review and to «Woche planen». «Not today» puts it away until tomorrow; the main button until
   * next Sunday. A line «New in the app» counts the changes of the week and links to «What is new» (Noah 21.11.2026 «4a»). Nothing is loaded outside its time. The rules are in home/wochenkarte.js, the numbers in weekreview.js.
   */
  import { liveQuery } from 'dexie';
  import { ChevronRight, CalendarCheck } from '@lucide/svelte';
  import { db } from '../db.js';
  import { weekQuery } from '../woche/load.js';
  import { buildWeek } from '../woche.js';
  import { weekClose } from '../woche/abschluss.js';
  import { SLEEP_Q, MOOD_Q, weekFive, hasAnything, diffText } from '../weekreview.js';
  import { normAct, tripDays } from '../flow.js';
  import { PLAN_KEY, planOf, hmm } from '../training.js';
  import { homeTrips } from './heute.js';
  import { dayOfStamp as dayOf } from './windows.js';
  import { CARD_KEY, cardShown, cardAway, cardDone, cardNumbers, cardOpen, cardNews } from './wochenkarte.js';
  import { NEWS_INDEX_ALL } from '../whatsnew.js';
  import { NEWS_HREF } from '../know/wasneu.js';
  import { t, num } from '../i18n.svelte.js';

  let { now } = $props();
  const today = $derived(dayOf(now));
  const recQ = liveQuery(async () => (await db.settings.get(CARD_KEY))?.value ?? {});
  const rec = $derived($recQ);
  const week = $derived(rec ? cardShown(rec, now) : null);

  // everything once, only inside the card's time (a person's data is small; the week only picks from it)
  const dataQ = $derived(
    week
      ? liveQuery(async () => {
          const [acts, flowActs, log, checks, answers, plan, trips] = await Promise.all([
            db.activities.toArray(),
            db.flowActs.toArray(),
            db.flowLog.toArray(),
            db.flowChecks.toArray(),
            db.abAnswers.where('qid').anyOf([SLEEP_Q, MOOD_Q]).toArray(),
            db.settings.get(PLAN_KEY),
            db.trips.toArray(),
          ]);
          return { acts, flowActs: flowActs.map(normAct), log, checks, answers, sessions: planOf(plan?.value), tripDays: tripDays(homeTrips(trips), today) };
        })
      : null,
  );
  const data = $derived(dataQ ? $dataQ : null);
  const srcQ = $derived(week?.isSunday ? weekQuery(today) : null);
  const src = $derived(srcQ ? $srcQ : null);

  const nums = $derived(data && week ? cardNumbers(weekFive(data, week.monday, today)) : []);
  const open = $derived(src && week?.isSunday ? cardOpen(weekClose(buildWeek({ ...src, forecast: null, monday: week.monday, today }).days, week.monday, today)) : { n: 0, titles: [] });
  const news = $derived(week ? cardNews(NEWS_INDEX_ALL, week) : 0);
  const any = $derived(!!data && !!week && hasAnything(data, week.monday));
  const show = $derived(!!week && !!data && (any || open.n > 0));

  const NAME = { hours: 'Hours|five', km: 'Bike', n: 'Sessions' };
  const valueOf = (f) => (f.key === 'hours' ? `${hmm(f.value)} h` : f.key === 'km' ? `${num(f.value)} km` : num(f.value));
  const changeOf = (f) => {
    if (!f.diff) return t('same as the week before');
    return t('{diff} against the week before', { diff: `${diffText(f.diff, { seconds: f.key === 'hours', fmt: num })}${f.key === 'hours' ? ' h' : f.key === 'km' ? ' km' : ''}` });
  };

  const put = (value) => db.settings.put({ key: CARD_KEY, value: JSON.parse(JSON.stringify(value)) });
  const away = () => put(cardAway(rec, now));
  const opened = () => put(cardDone(rec, week));
</script>

{#if show}
  <section class="wk" aria-labelledby="wk-h" data-section="week-card">
    <p class="when">{week.isSunday ? t('Weekly review · Sunday') : t('Weekly review · Monday')}</p>
    <h2 id="wk-h">{t('Your week in three numbers')}</h2>
    {#if any}
      <ul class="nums">
        {#each nums as f (f.key)}
          <li data-wk-num={f.key}><b>{valueOf(f)}</b><small>{t(NAME[f.key])}</small><i>{changeOf(f)}</i></li>
        {/each}
      </ul>
    {/if}
    {#if open.n > 0}
      <p class="ln" data-wk-open><b>{t('Slides to Monday:')}</b> {open.n === 1 ? t('1 open task') : t('{n} open tasks', { n: open.n })}{#if open.titles.length}{' '}({open.titles.join(', ')}){/if}</p>
    {/if}
    {#if news > 0}
      <p class="ln" data-wk-news><b>{t('New in the app:')}</b> {news === 1 ? t('1 change this week') : t('{n} changes this week', { n: news })} · <a href={NEWS_HREF}>{t('What is new')}</a></p>
    {/if}
    <div class="acts">
      {#if any}<a class="btn hi" href="#/flow/review" onclick={opened} data-wk-go>{t('Open the review')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
      <a class="btn" href="#/week" onclick={opened} data-wk-plan><CalendarCheck size={16} aria-hidden="true" />{week.isSunday ? t('Plan next week') : t('Plan the week')}</a>
      <button type="button" class="btn q" onclick={away} data-wk-today>{t('Not today|mask')}</button>
    </div>
  </section>
{/if}

<style>
  .wk {
    display: grid;
    gap: 10px;
    margin: 0 0 14px;
    padding: 14px 16px;
    border: 1px solid var(--ok);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: 0 0 0 2px var(--ok-soft);
  }
  .when {
    margin: 0;
    font-size: var(--fs-label);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ok);
  }
  h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .nums {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .nums li {
    display: grid;
    gap: 2px;
    align-content: start;
    min-width: 0;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .nums b {
    font-size: var(--fs-section);
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    overflow-wrap: break-word;
  }
  .nums small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .nums i {
    font-size: var(--fs-small);
    font-style: normal;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .ln {
    margin: 0;
    font-size: var(--fs-body);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .btn.q {
    color: var(--ink-3);
    border-color: var(--line);
  }
</style>

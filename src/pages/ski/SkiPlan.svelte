<script>
  /**
   * Paket P2 «Skitour» (mockups V1/V2/V5 and R8, Noah 21.10.2026 «1a … 4a»): #/ski/plan[/<trip>] plans a ski
   * tour the evening before. The avalanche danger level of the bulletin (1–5 and the sub-level, typed in by
   * the user; the app never decides), «Dein Morgen» (get up, leave, ascent, peak, turnaround, last train),
   * the conditions (temperature, wind, a note), and the plan in numbers (metres climbed, time moving) that
   * «Nach der Tour» compares with what really happened. Everything saves on its own and stays changeable.
   * No trip given: the next ski tour.
   */
  import { ChevronLeft, ExternalLink, TriangleAlert } from '@lucide/svelte';
  import { skiQuery, setPlan, setSki } from '../../lib/ski/skidb.js';
  import { nextSkiTrip, turnTime, parseDuration, durationText, SKI } from '../../lib/ski.js';
  import { DANGER_LEVELS, SUB_LEVELS, BULLETIN_URL, MORNING, dangerOf } from '../../lib/skiplan.js';
  import { newTrip } from '../../lib/nav.js';
  import { localDay } from '../../lib/localday.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import { t, locale } from '../../lib/i18n.svelte.js';

  let { id = '' } = $props();
  const today = localDay();
  const q = skiQuery();
  const data = $derived($q);
  const trip = $derived(data ? (id ? (data.trips.find((x) => x.id === id) ?? null) : (nextSkiTrip(data.trips, today)?.trip ?? null)) : null);
  const ski = $derived(trip?.ski ?? {});
  const plan = $derived(ski.plan ?? {});
  const level = $derived(dangerOf(plan.level));
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const SUB_NAMES = { '-': 'low within the level', '=': 'middle', '+': 'high within the level' };

  const pickLevel = (n) => setPlan(trip.id, plan.level === n ? { level: null, sub: '' } : { level: n, sub: n === 5 ? '' : (plan.sub ?? '') });
  const pickSub = (s) => setPlan(trip.id, { sub: plan.sub === s ? '' : s });
  const timeOf = (r) => (r.at === 'plan' ? plan[r.key] : ski[r.key]) ?? '';
  const setTime = (r, value) => {
    const v = turnTime(value) || '';
    return r.at === 'plan' ? setPlan(trip.id, { [r.key]: v }) : setSki(trip.id, { [r.key]: v });
  };
  const setNum = (key, value) => {
    const n = Number(String(value).replace(/[^\d-]/g, ''));
    return setPlan(trip.id, { [key]: String(value).trim() && Number.isFinite(n) ? n : null });
  };
</script>

<div class="sk">
  <p class="sk-back"><a href="#/ski"><ChevronLeft size={16} aria-hidden="true" />{t('Ski tours')}</a></p>
  <div>
    <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Plan the tour')}</h1>
    {#if trip}<p class="sk-sub">{trip.ski?.peak?.trim() || trip.title} · {longDay(trip.startDate)}</p>{/if}
  </div>
  {#if data && !trip}
    <Empty text={t('No ski tour planned yet. Plan one first, then the morning and the danger level.')} action={{ label: t('Plan a ski tour'), onclick: () => newTrip('standard', SKI) }} />
  {:else if trip}
    <p class="sk-quiet">{t('Everything here saves on its own and stays changeable. «After the tour» compares the plan with the day.')}</p>
    <div class="sk-cols">
      <div class="col">
        <section class="surf sk-pad box" aria-labelledby="dg-h" data-plan="danger">
          <h2 id="dg-h" class="sk-title">{t('Avalanche danger')}</h2>
          <p class="sk-quiet">{t('Read the bulletin and tap its level. The app does not judge the slope: that stays your decision.')}</p>
          <div class="sk-chips" role="group" aria-labelledby="dg-h">
            {#each DANGER_LEVELS as d (d.level)}
              <button type="button" class="sk-chip lv lv{d.level}" aria-pressed={plan.level === d.level} onclick={() => pickLevel(d.level)} data-level={d.level}><b class="num">{d.level}</b>{t(d.name)}</button>
            {/each}
          </div>
          {#if level}
            {#if level.level < 5}
              <div class="sk-chips" role="group" aria-label={t('Sub-level')}>
                {#each SUB_LEVELS as s (s)}
                  <button type="button" class="sk-chip num" aria-pressed={plan.sub === s} onclick={() => pickSub(s)} data-sub={s} title={t(SUB_NAMES[s])}>{level.level}{s === '-' ? '−' : s}<span class="sr">{t(SUB_NAMES[s])}</span></button>
                {/each}
              </div>
            {/if}
            <p class="sk-tip" data-level-text>{#if level.level >= 4}<TriangleAlert size={16} aria-hidden="true" />{/if}<span>{t(level.text)}</span></p>
          {/if}
          <a class="ext" href={BULLETIN_URL} target="_blank" rel="noopener">{t('Open the avalanche bulletin (SLF)')}<ExternalLink size={14} aria-hidden="true" /></a>
        </section>

        <section class="surf sk-pad box" aria-labelledby="cd-h" data-plan="conditions">
          <h2 id="cd-h" class="sk-title">{t('Conditions')}</h2>
          <div class="sk-grid2">
            <label class="sk-field"><span>{t('Temperature at the start (°C)')}</span><input class="inp num" inputmode="numeric" value={plan.temp ?? ''} onchange={(e) => setNum('temp', e.currentTarget.value)} data-f="temp" /></label>
            <label class="sk-field"><span>{t('Wind')}</span><input class="inp" value={plan.wind ?? ''} onchange={(e) => setPlan(trip.id, { wind: e.currentTarget.value.trim() })} placeholder={t('e.g. «north-west, strong on the ridge»')} data-f="wind" /></label>
          </div>
          <label class="sk-field"><span>{t('Notes for the plan')}</span><textarea class="inp sk-text" value={plan.notes ?? ''} onchange={(e) => setPlan(trip.id, { notes: e.currentTarget.value.trim() })} placeholder={t('e.g. «key spot: the steep step below the saddle»')} data-f="notes"></textarea></label>
        </section>
      </div>
      <div class="col">
        <section class="surf sk-pad box" aria-labelledby="mo-h" data-plan="morning">
          <h2 id="mo-h" class="sk-title">{t('Your morning')}</h2>
          <p class="sk-quiet">{t('Only what helps you. Turnaround and last train are the same as in the start check.')}</p>
          <div class="sk-grid2">
            {#each MORNING as r (r.key)}
              <label class="sk-field"><span>{t(r.name)}</span><input class="inp num" type="time" value={timeOf(r)} onchange={(e) => setTime(r, e.currentTarget.value)} data-time={r.key} /></label>
            {/each}
          </div>
        </section>

        <section class="surf sk-pad box" aria-labelledby="pl-h" data-plan="numbers">
          <h2 id="pl-h" class="sk-title">{t('The plan in numbers')}</h2>
          <div class="sk-grid2">
            <label class="sk-field"><span>{t('Metres climbed (planned)')}</span><input class="inp num" inputmode="numeric" value={plan.hm ?? ''} onchange={(e) => setNum('hm', e.currentTarget.value)} data-f="hm" /></label>
            <label class="sk-field"><span>{t('Time moving (planned)')}</span><input class="inp num" value={durationText(plan.timeMin)} placeholder="3:30" onchange={(e) => setPlan(trip.id, { timeMin: parseDuration(e.currentTarget.value) })} data-f="time" /></label>
          </div>
        </section>
        <a class="btn hi sk-go" href="#/ski" data-plan-done>{t('Done')}</a>
      </div>
    </div>
  {/if}
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .box {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .lv b {
    margin-right: 6px;
  }
  .lv1[aria-pressed='true'] b {
    color: var(--ok);
  }
  .lv3[aria-pressed='true'] b,
  .lv4[aria-pressed='true'] b,
  .lv5[aria-pressed='true'] b {
    color: var(--warn);
  }
  .ext {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    align-self: flex-start;
  }
  @media (max-width: 359px) {
    .sk-grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>

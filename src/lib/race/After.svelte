<script>
  /**
   * Paket U «Rennen» · Nach dem Rennen: section analysis (38), stop analysis (6), recovery (15), the bike
   * check after the race (22), the same race year by year (16) and the race report (24, Briefing.svelte
   * with ?report=1). Learning: the 11 sectors of the files are the sections; 1005 km and 33 700 m up →
   * brake pads first.
   */
  import { liveQuery } from 'dexie';
  import { FileText, Lightbulb } from '@lucide/svelte';
  import RaceBox from './RaceBox.svelte';
  import EditList from './EditList.svelte';
  import { db } from '../db.js';
  import { checkpointRows, stopAnalysis, recovery, sameRace, raceOf, schedule, nightRows, sleepTotal, addDay, hm } from './race.js';
  import { sectionAnalysis, careAfter } from './more.js';
  import { cacheQuery } from './store.js';
  import { rideTimes, tripDays, sleptMin } from './ride-lib.js';
  import { raceHref } from './parts.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let { ctx } = $props();
  const id = ctx.trip.id;
  const days = $derived(tripDays(ctx.trip));
  const endDay = $derived(days.at(-1) ?? '');

  /* 38 sections */
  const sections = $derived(ctx.plan ? sectionAnalysis(checkpointRows(ctx.race, ctx.plan), ctx.plan.start) : []);
  const pm = (h) => (h == null ? '–' : `${h > 0 ? '+' : ''}${hm(h)}`);

  /* 6 stops */
  const ridesQ = liveQuery(() => db.rides.where('tripId').equals(id).toArray());
  const years = $derived(sameRace(ctx.trip, ctx.trips, ctx.races));
  const daysKey = $derived([...new Set([...days, ...years.flatMap(tripDays)])].join(','));
  const actsQ = $derived.by(() => {
    const ds = daysKey ? daysKey.split(',') : [];
    return liveQuery(() => (ds.length ? db.activities.where('day').anyOf(ds).toArray() : []));
  });
  const stops = $derived(stopAnalysis(rideTimes($ridesQ ?? [], $actsQ ?? [], days)));
  async function keepLearning() {
    const all = await db.learnings.toArray();
    const lid = Math.max(0, ...all.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
    const rule = t(stops.learn);
    await db.learnings.put({ id: lid, rule, action: '', topic: 'race', priority: 'medium', itemIds: [], source: t('Race: {name}', { name: ctx.trip.title }), appliesTo: ['all'], confirmed: 0, tripId: id, createdAt: new Date().toISOString() });
    offerDone(t('"{name}" saved.', { name: rule }), () => db.learnings.delete(lid));
  }

  /* 15 recovery */
  const startDay = $derived(ctx.trip.startDate ?? '');
  const healthQ = $derived.by(() => {
    const a = startDay;
    const b = endDay;
    return liveQuery(() => (a && b ? db.healthDays.where('date').between(addDay(a, -28), addDay(b, 21), true, true).toArray() : []));
  });
  const rec = $derived(recovery($healthQ ?? [], startDay, endDay));

  /* 22 bike check */
  const roadsQ = cacheQuery('race-roads:' + id);
  const gravel = $derived(Number.isFinite(Number(ctx.stored.gravelPct)) && ctx.stored.gravelPct !== '' && ctx.stored.gravelPct != null ? Number(ctx.stored.gravelPct) : ($roadsQ?.data?.gravelShare ?? 0));
  const care = $derived(careAfter({ km: ctx.route?.km ?? 0, rainH: Number(ctx.stored.rainH) || 0, gravelShare: gravel }));
  const done = $derived(ctx.race.postDone);
  const tick = (key) => ctx.save({ postDone: done.includes(key) ? done.filter((k) => k !== key) : [...done, key] });
  const ownChecks = $derived(ctx.race.postCheck ?? []);

  /* 16 years */
  const yearRow = (tr) => {
    const st = ctx.races[tr.id] ?? {};
    const r = raceOf(st, tr);
    const rt = st.route ?? tr.route ?? null;
    const plan = rt?.km ? schedule(r, rt.km, rt.profile) : null;
    const log = Array.isArray(st.sleepLog) ? st.sleepLog : [];
    const nights = nightRows(r, plan).filter((n) => n.kind !== 'through');
    const trDays = tripDays(tr);
    const secs = ($actsQ ?? []).filter((a) => trDays.includes(a.day) && (a.kind ?? 'bike') === 'bike').reduce((s, a) => s + (a.movingS || 0), 0);
    return { tr, year: tr.startDate.slice(0, 4), days: trDays.length, km: rt?.km ?? null, nights: nights.length, sleepH: (log.length ? sleptMin(log) : sleepTotal(nights)) / 60, rideH: secs ? secs / 3600 : null, note: st.yearNote ?? '' };
  };
  const yearRows = $derived(years.map(yearRow));
</script>

<div class="rc-grid">
  <RaceBox id="after-sections" title={t('Section analysis')} what="Per section from one checkpoint to the next: the planned hours against the real ones; where you lost and where you won time." why="Shows which part of the race cost the time, so the next plan gets better there." from="Your checkpoints with the times you noted in race mode, and your plan. The sectors of your route files are the sections.">
    {#if sections.some((s) => s.actualH != null)}
      <div class="rc-scroll">
        <table class="rc-table" data-race-sections>
          <thead><tr><th>{t('Section')}</th><th class="num">{t('km')}</th><th class="num">{t('Plan')}</th><th class="num">{t('Actual')}</th><th class="num">±</th></tr></thead>
          <tbody>
            {#each sections as s, i (i)}
              <tr>
                <td>{s.name || t('Checkpoint')}</td>
                <td class="num">{num(Math.round(s.fromKm))}–{num(Math.round(s.toKm))}</td>
                <td class="num">{s.planH == null ? '–' : hm(s.planH)}</td>
                <td class="num">{s.actualH == null ? '–' : hm(s.actualH)}</td>
                <td class="num" class:rc-warn={s.diffH > 0} class:rc-ok={s.diffH < 0}>{pm(s.diffH)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="rc-note">{t('+ = time lost against the plan, − = time won.')}</p>
    {:else}
      <p class="rc-empty">{t('No times yet. In race mode, tap «I am at … now» at each checkpoint.')}</p>
    {/if}
  </RaceBox>

  <RaceBox id="after-stops" title={t('Stop analysis')} what="Riding against the whole time: how much you stood still, how many long stops." why="In a long race the stops decide more than the speed." from="Your uploaded rides of this trip (Rides) and your Strava rides on the race days (Training).">
    {#if stops}
      <div class="rc-stat">
        <div><b>{hm(stops.movingH)}</b><small>{t('riding')}</small></div>
        <div><b>{hm(stops.totalH)}</b><small>{t('in total')}</small></div>
        <div><b>{stops.share} %</b><small>{t('standing still')}</small></div>
        <div><b>{stops.long}</b><small>{t('stops of 20 min or more')}</small></div>
      </div>
      {#if stops.learn}
        <p class="rc-text">{t(stops.learn)}</p>
        <button type="button" class="btn" onclick={keepLearning} data-race-learn><Lightbulb size={16} aria-hidden="true" />{t('Save as learning')}</button>
      {/if}
    {:else}
      <p class="rc-empty">{t('No rides of this race yet. Upload the GPX under Rides or connect Strava under Training.')}</p>
    {/if}
  </RaceBox>

  <RaceBox id="after-recovery" title={t('Recovery')} what="Your resting pulse and HRV in the 21 days after the race against your normal (the 4 weeks before)." why="You see when your body is back to normal. An observation, not advice." from="Your Fitbit days (Me › Health).">
    {#if rec?.after.length}
      <p class="rc-text" data-race-back>{rec.days != null ? tn(rec.days, 'Back to your normal after {n} day.', 'Back to your normal after {n} days.') : t('Not back to your normal yet in these days.')}</p>
      <p class="rc-note">{t('Your normal: resting pulse {hr}, HRV {hrv}', { hr: rec.base.restingHr ?? '–', hrv: rec.base.hrvMs ?? '–' })}</p>
      <div class="rc-scroll">
        <table class="rc-table">
          <thead><tr><th>{t('Day')}</th><th class="num">{t('Resting pulse')}</th><th class="num">{t('HRV')}</th><th>{t('Normal')}</th></tr></thead>
          <tbody>
            {#each rec.after as d (d.date)}<tr><td>{dateOf(d.date)}</td><td class="num">{d.restingHr ?? '–'}</td><td class="num">{d.hrvMs ?? '–'}</td><td>{d.back ? '✓' : ''}</td></tr>{/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="rc-empty">{rec?.base && rec.base.restingHr == null && rec.base.hrvMs == null ? t('Not enough days before the race to know your normal.') : t('No health days after the race yet.')}</p>
    {/if}
  </RaceBox>

  <RaceBox id="after-bike" title={t('Bike check after the race')} what="What the bike needs now, from the km, the rain hours and the gravel share; tick what is done and add your own checks." why="After a long race the wear is hidden: on long climbs and descents the brake pads go first." from="The km of your route, the gravel share from «Along the route» (or your number), the rain hours you type.">
    <div class="rc-acts">
      <label class="rc-lab">{t('Hours in the rain')}<input class="inp rc-num" type="number" min="0" step="1" value={ctx.stored.rainH ?? ''} onchange={(e) => ctx.save({ rainH: e.currentTarget.value === '' ? null : Number(e.currentTarget.value) })} data-race-rain /></label>
      <label class="rc-lab">{t('Gravel %')}<input class="inp rc-num" type="number" min="0" max="100" step="5" value={gravel} onchange={(e) => ctx.save({ gravelPct: e.currentTarget.value === '' ? null : Number(e.currentTarget.value) })} data-race-gravel /></label>
    </div>
    <ul class="rc-list" data-race-care>
      {#each care as c, i (c)}
        <li class="rc-row"><label class="rc-inline"><input type="checkbox" checked={done.includes(`c${i}`)} onchange={() => tick(`c${i}`)} />{t(c)}</label></li>
      {/each}
    </ul>
    <EditList rows={ownChecks} onchange={(list) => ctx.save({ postCheck: list })} label={t('Own check')} addLabel={t('Add')} placeholder={t('e.g. check the rack bolts')} name={t('Own check')} testid="post-check">
      {#snippet row(r)}<input type="checkbox" aria-label={t('Done: {name}', { name: r.text })} checked={done.includes(r.id)} onchange={() => tick(r.id)} />{/snippet}
    </EditList>
  </RaceBox>

  <RaceBox id="after-years" title={t('Same race, year by year')} what="Your other years of this race side by side: days, km, sleep, riding hours and a note." why="Shows whether you get better and what changed." from="Your race trips with the same name (the year does not count), your sleep logs, your Strava rides on those days.">
    {#if yearRows.length > 1}
      <div class="rc-scroll">
        <table class="rc-table" data-race-years>
          <thead><tr><th>{t('Year')}</th><th class="num">{t('Days')}</th><th class="num">{t('km')}</th><th class="num">{t('Sleep')}</th><th class="num">{t('Riding')}</th><th>{t('Note')}</th></tr></thead>
          <tbody>
            {#each yearRows as y (y.tr.id)}
              <tr>
                <td><a href={raceHref(y.tr.id, 'after')}>{y.year}</a></td>
                <td class="num">{y.days}</td>
                <td class="num">{y.km ? num(Math.round(y.km)) : '–'}</td>
                <td class="num">{tn(y.nights, '{n} night', '{n} nights')} · {hm(y.sleepH)}</td>
                <td class="num">{y.rideH == null ? '–' : hm(y.rideH)}</td>
                <td>{y.note}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="rc-empty">{t('No other year of this race yet. Give next year’s trip the same name.')}</p>
    {/if}
    <label class="rc-lab">{t('Note for this year')}<input class="inp" value={ctx.stored.yearNote ?? ''} maxlength="200" onchange={(e) => ctx.save({ yearNote: e.currentTarget.value.trim() })} data-race-year-note /></label>
  </RaceBox>

  <RaceBox id="after-report" title={t('Race report')} what="One page with your times against the plan, food, sleep, contact points and stops; print it or save it as PDF." why="To keep, to share, and to read before next year’s race." from="Everything you logged in race mode and the rides of this trip.">
    <a class="btn hi" href="#/race/brief/{encodeURIComponent(id)}?report=1" data-race-report><FileText size={16} aria-hidden="true" />{t('Open the report')}</a>
  </RaceBox>
</div>

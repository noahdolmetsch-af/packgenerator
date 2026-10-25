<script>
  /**
   * Paket C › Woher stammt ein Wert? (#/me/ruhig/herkunft; 996 Ideen UC-095-I2, UC-235-I1, UC-052-I1,
   * UC-075-I1): «Besondere Tage», «Gegenbeispiele», «Schlafplätze: selbst erlebt oder vermutet», «Wie
   * sicher das Gewicht ist». Observation only, nothing is judged. Logic: herkunft.js.
   */
  import { liveQuery } from 'dexie';
  import { CalendarHeart, Scale3d, Tent, Weight, Settings2 } from '@lucide/svelte';
  import Card from './Card.svelte';
  import KindsEdit from './KindsEdit.svelte';
  import { db } from '../db.js';
  import { historyQuery } from '../abdb.js';
  import { configOf } from '../abfragen.js';
  import { seriesOf, insights, lastDays, ownNumberQuestions, WINDOW_DAYS, OWN_OFF_KEY } from '../erkenntnisse.js';
  import { loadDayData } from '../daydata.js';
  import { ownQuery, saveOwn, ownLabel } from '../map/ownpoints.js';
  import { formatWeight } from '../gear.js';
  import { t, tn, num, nameOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, realTrips, tripEnd } from './base.js';
  import { kindName } from './kinds.js';
  import { DAYS_KEY, specialDaysOf, flipDay, dayKindCount, dropDayKind, recentDays, SERIES_NAME, counterDays, ORIGINS, originOf, sleepByOrigin, weightSure } from './herkunft.js';

  const today = localDay();
  const first = openFromHash();
  let open = $state({ days: first === 'days', counter: first === 'counter', sleep: first === 'sleep', weight: first === 'weight' });
  const nm = (k) => kindName(k, t);

  /* Besondere Tage */
  const dQ = settingQ(DAYS_KEY);
  const s = $derived(specialDaysOf($dQ));
  const saveS = (x) => saveSetting(DAYS_KEY, x);
  const sportQ = liveQuery(async () => {
    const [km, log, acts] = await Promise.all([db.kmBook.toArray(), db.flowLog.toArray(), db.activities.toArray().catch(() => [])]);
    return [...new Set([...km.filter((e) => e?.date && Number(e.km) > 0 && e.state !== 'removed').map((e) => String(e.date).slice(0, 10)), ...log.map((l) => l?.day).filter(Boolean), ...acts.map((a) => a?.day).filter(Boolean)])];
  });
  const recent = $derived(recentDays(s, $sportQ ?? [], today, 14));
  let markDay = $state(today);
  let editKinds = $state(false);

  /* Gegenbeispiele: the same series as Erkenntnisse */
  const hist = historyQuery();
  const healthQ = liveQuery(() => db.healthDays.toArray());
  const medQ = liveQuery(() => db.flowLog.where('actId').equals('meditation').toArray());
  const dayQ = liveQuery(() => loadDayData(db));
  const offQ = liveQuery(async () => (await db.settings.get(OWN_OFF_KEY))?.value ?? []);
  const own = $derived(ownNumberQuestions(ownNumberQuestions(configOf($hist?.cfg).own), $offQ ?? []));
  const span = lastDays(today, WINDOW_DAYS);
  const series = $derived(open.counter ? seriesOf({ rows: $hist?.rows ?? [], health: $healthQ ?? [], log: $medQ ?? [], days: lastDays(today, WINDOW_DAYS + 1), weather: $dayQ?.weather, events: $dayQ?.events, own }) : {});
  const shown = $derived(open.counter ? insights(series, today, { own }).filter((x) => x.shown) : []);
  let pick = $state('');
  const pair = $derived(shown.find((x) => x.id === pick) ?? shown[0] ?? null);
  const days = $derived(pair ? counterDays(pair, series, span) : { fit: [], counter: [] });
  const sname = (k, p) => (k?.startsWith('own:') ? p?.name || t('Own question') : t(SERIES_NAME[k] ?? k));
  const pairName = (p) => t('{x} and {y}', { x: sname(p.x, p), y: sname(p.y, p) });
  const markNames = (day) => (s.marks[day] ?? []).map((id) => s.kinds.find((k) => k.id === id)).filter(Boolean).map(nm).join(', ');

  /* Schlafplätze */
  const ownQ = ownQuery();
  const sleep = $derived(sleepByOrigin($ownQ ?? []));
  const sleepN = $derived(Object.values(sleep).reduce((a, l) => a + l.length, 0));
  const setOrigin = (id, origin) => saveOwn((list) => list.map((p) => (p.id === id ? { ...p, origin } : p)));
  const ORIGIN_NAME = Object.fromEntries(ORIGINS.map((o) => [o.key, o.label]));

  /* Gewicht */
  const gearQ = liveQuery(async () => ({ trips: await db.trips.toArray(), items: await db.items.toArray() }));
  const wTrips = $derived(realTrips($gearQ?.trips ?? []).filter((x) => (x.entries ?? []).length).sort((a, b) => (tripEnd(a) >= today) - (tripEnd(b) >= today) || b.startDate.localeCompare(a.startDate)).reverse());
  let wTrip = $state('');
  const trip = $derived(wTrips.find((x) => x.id === wTrip) ?? wTrips[0] ?? null);
  const byId = $derived(Object.fromEntries(($gearQ?.items ?? []).map((i) => [i.id, i])));
  const ws = $derived(trip ? weightSure(trip.entries, byId) : null);
</script>

<ul class="rh-cards">
  <Card id="days" icon={CalendarHeart} title={t('Special days')} lead={t('Mark a lot of work, travelling or being ill; missing sport data is then not the only explanation')} bind:open={open.days}>
    <div class="rh-row">
      <input class="inp" type="date" max={today} bind:value={markDay} aria-label={t('Day')} />
      <div class="rh-chips">{#each s.kinds as k (k.id)}<button type="button" class="rh-chip" aria-pressed={(s.marks[markDay] ?? []).includes(k.id)} onclick={() => saveS(flipDay(s, markDay, k.id))} data-day-kind={k.id}>{nm(k)}</button>{/each}</div>
    </div>
    <p class="rh-sub">{t('The last 14 days')}</p>
    <ul class="rh-list rh-days" data-special-days>
      {#each recent as d (d.day)}
        <li>
          <span class="rh-grow"><b>{dmy(d.day)}</b><small>{d.sport ? t('with sport or a tick') : d.marks.length ? t('no sport data · explained by the day') : t('no sport data · nothing marked, that is fine too')}</small></span>
          {#if d.marks.length}<span class="rh-tag">{markNames(d.day)}</span>{/if}
        </li>
      {/each}
    </ul>
    <button type="button" class="btn sm" onclick={() => (editKinds = !editKinds)} aria-expanded={editKinds}><Settings2 size={14} aria-hidden="true" />{t('Change the kinds of days')}</button>
    {#if editKinds}
      <KindsEdit kinds={s.kinds} count={(id) => dayKindCount(s, id)} what={(n) => tn(n, '{n} day', '{n} days')} none={t('Without this mark')} noneHint={t('The days stay, only the mark goes.')} label={t('New kind, e.g. Exams')}
        onsave={(kinds) => saveS({ ...s, kinds })} ondelete={async (id, to) => { const snap = s; await saveS(dropDayKind(s, id, to)); return snap; }} onundo={(snap) => saveS(snap)} />
    {/if}
  </Card>

  <Card id="counter" icon={Scale3d} title={t('Counter-examples')} lead={t('Each insight also with the days that do not fit')} bind:open={open.counter}>
    {#if shown.length}
      <select class="inp" value={pair?.id} onchange={(e) => (pick = e.currentTarget.value)} aria-label={t('Insight')}>{#each shown as p (p.id)}<option value={p.id}>{pairName(p)}</option>{/each}</select>
      <p class="rh-help">{t('On {fit} days it went together, on {counter} days not. Going together is no cause.', { fit: days.fit.length, counter: days.counter.length })}</p>
      <div class="rh-bar" aria-hidden="true"><span style="flex:{days.fit.length || 0.0001}"></span><span class="c" style="flex:{days.counter.length || 0.0001}"></span></div>
      {#if days.counter.length}
        <p class="rh-sub">{t('Days against it')}</p>
        <ul class="rh-list" data-counter-days>
          {#each days.counter.slice(0, 10) as d (d.day)}<li><span class="rh-grow"><b>{dmy(d.day)}</b><small>{sname(pair.x, pair)} {num(d.x)} · {sname(pair.y, pair)} {num(d.y)}</small></span>{#if markNames(d.day)}<span class="rh-tag">{markNames(d.day)}</span>{/if}</li>{/each}
        </ul>
      {/if}
      <a class="btn sm btn-link" href="#/me/insights">{t('All insights')}</a>
    {:else}<p class="rh-empty">{t('No insight yet. From 14 days with answers and values, «Insights» shows what goes together, and here the days against it.')}</p>{/if}
  </Card>

  <Card id="sleep" icon={Tent} title={t('Places to sleep: known or guessed')} lead={t('Slept there yourself, described by others, or only imported')} bind:open={open.sleep}>
    {#if sleepN}
      {#each [...ORIGINS.map((o) => o.key), ''] as k (k)}
        {#if sleep[k].length}
          <p class="rh-sub">{k ? t(ORIGIN_NAME[k]) : t('Not known yet')} · {sleep[k].length}</p>
          <ul class="rh-list" data-origin={k || 'none'}>
            {#each sleep[k] as p (p.id)}
              <li><span class="rh-grow">{ownLabel(p, t)}{#if p.night}<small>{t('night of {day}', { day: dmy(p.night) })}</small>{/if}</span>
                <select class="inp rh-o" value={originOf(p)} onchange={(e) => setOrigin(p.id, e.currentTarget.value)} aria-label={t('Where it comes from: {name}', { name: ownLabel(p, t) })}><option value="">–</option>{#each ORIGINS as o (o.key)}<option value={o.key}>{t(o.label)}</option>{/each}</select>
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    {:else}<p class="rh-empty">{t('No place to sleep among your own points yet. On the map, a point of the kind «Place to sleep» shows here.')}</p>{/if}
  </Card>

  <Card id="weight" icon={Weight} title={t('How sure the weight is')} lead={t('The total of a packing list: weighed, estimated and unknown')} bind:open={open.weight}>
    {#if trip && ws}
      <select class="inp" value={trip.id} onchange={(e) => (wTrip = e.currentTarget.value)} aria-label={t('Trip')}>{#each wTrips as x (x.id)}<option value={x.id}>{x.title} · {dmy(x.startDate)}</option>{/each}</select>
      <p class="rh-big num" data-weight-sure>{formatWeight(ws.total)}{#if ws.unknown.n}{' '}+ ?{/if}</p>
      <div class="rh-bar" aria-hidden="true"><span style="flex:{ws.measured.g || 0.0001}"></span><span class="e" style="flex:{ws.estimated.g || 0.0001}"></span></div>
      <ul class="rh-list">
        <li><span class="rh-grow">{t('Weighed yourself')}<small>{tn(ws.measured.n, '{n} thing', '{n} things')}</small></span><b class="num">{formatWeight(ws.measured.g)}</b></li>
        <li><span class="rh-grow">{t('From a list or the maker')}<small>{tn(ws.estimated.n, '{n} thing', '{n} things')}</small></span><b class="num">{formatWeight(ws.estimated.g)}</b></li>
        <li><span class="rh-grow">{t('Unknown')}<small>{t('not in the total')}</small></span><b class="num">{tn(ws.unknown.n, '{n} thing', '{n} things')}</b></li>
      </ul>
      <p class="rh-help">{t('{p} % of the known weight is weighed.', { p: ws.share })}</p>
      {#if ws.toWeigh.length}
        <p class="rh-sub">{t('Weigh these first, they count most')}</p>
        <ul class="rh-list">{#each ws.toWeigh.slice(0, 5) as w (w.id)}<li><span class="rh-grow">{nameOf(byId[w.id])}</span><span class="num">{formatWeight(w.g)}</span></li>{/each}</ul>
        <a class="btn sm" href="#/gear">{t('Weigh in Gear')}</a>
      {/if}
    {:else}<p class="rh-empty">{t('No packing list yet.')}</p>{/if}
  </Card>
</ul>

<style>
  .rh-bar {
    display: flex;
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--paper-2);
  }
  .rh-bar span {
    background: var(--accent);
  }
  .rh-bar span.c {
    background: var(--warn);
  }
  .rh-bar span.e {
    background: var(--line-strong);
  }
  .rh-big {
    margin: 0;
    font: 700 var(--fs-title) / 1.1 var(--font-body);
  }
  .rh-o {
    width: auto;
    max-width: 48%;
    flex: none;
  }
</style>

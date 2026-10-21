<script>
  /**
   * Paket U «Rennen» › Strategie (Noah 19.10.2026 17:12: «die Strategie im Frontend genau wie hier
   * durchspielen … welche Annahmen dahinter stecken und diese auch ändern und ergänzen können»).
   * Start, the three ways side by side, the stages of the chosen way (they set the time plan of all parts),
   * every assumption with its source, own assumptions, your rides (loaded or light) and earlier attempts.
   */
  import { RotateCcw, Check, Moon } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import RaceBox from './RaceBox.svelte';
  import RaceSheet from './RaceSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { db } from '../db.js';
  import { WAYS, ASSUMPTIONS, ASSUME_GROUPS, OWN_KINDS, raceTime } from './strategy.js';
  import { hm, localOf, msOf, newId, sameRace, seriesKey, countdown } from './race.js';
  import { raceHref } from './parts.js';
  import { t, tn, isDe, num } from '../i18n.svelte.js';
  import { stravaName } from '../stravanames.js';

  let { ctx } = $props();
  const learnQ = liveQuery(() => db.learnings.toArray());
  const way = $derived(ctx.way);
  const sims = $derived(ctx.sims);
  const sim = $derived(ctx.sim);
  const stored = $derived(ctx.stored);
  const dayFmt = (ms) => new Date(ms).toLocaleDateString(isDe() ? 'de-CH' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' });
  const timeOf = (ms) => localOf(ms).slice(11, 16);
  const finishText = (r) => (r ? `${dayFmt(r.finish)} ${timeOf(r.finish)}` : '–');
  const SRC = { yours: 'yours', loaded: 'your loaded rides', rides: 'your rides', standard: 'standard' };

  // start of the race (learning 17:22: start day and time are inputs; they set the Sundays and day 1)
  let startDay = $state('');
  let startTime = $state('');
  $effect(() => {
    startDay = ctx.race.start ? ctx.race.start.slice(0, 10) : '';
    startTime = ctx.race.start ? ctx.race.start.slice(11, 16) : '08:00';
  });
  const saveStart = () => startDay && ctx.save({ start: `${startDay}T${startTime || '08:00'}` });
  const target = $derived(Number(stored.targetDays) || null);
  const needH = $derived(target && ctx.route?.km && sim ? sim.days.reduce((s, d) => s + d.rideH, 0) / target : null);

  // assumptions
  const setAssume = (key, value) => ctx.save((cur) => ({ ...cur, assume: { ...(cur.assume ?? {}), [key]: value } }));
  const resetAssume = (key) =>
    ctx.save((cur) => {
      const a = { ...(cur.assume ?? {}) };
      delete a[key];
      return { ...cur, assume: a };
    });
  const numIn = (a, e) => {
    const v = e.currentTarget.value;
    if (a.unit === 'time') return /^\d\d:\d\d$/.test(v) && setAssume(a.key, v);
    const n = Number(v);
    if (Number.isFinite(n) && v !== '') setAssume(a.key, n);
  };
  const unitOf = (u) => (u === 'time' ? '' : u === '1–5' ? t('1 bad … 5 good') : u);

  // own assumptions
  let own = $state(null); // draft { id?, name, kind, value }
  const ownList = $derived(stored.ownAssume ?? []);
  function saveOwn() {
    const name = String(own.name ?? '').trim();
    if (!name) return t('Please give it a name.');
    const row = { id: own.id ?? newId('a'), name, kind: own.kind, value: own.kind === 'note' ? '' : Number(own.value) || 0 };
    ctx.save((cur) => {
      const list = cur.ownAssume ?? [];
      return { ...cur, ownAssume: own.id ? list.map((x) => (x.id === own.id ? row : x)) : [...list, row] };
    });
  }
  async function deleteOwn() {
    const r = ownList.find((x) => x.id === own.id);
    if ((await askDelete({ title: t('Delete «{name}»?', { name: r.name }) })) !== 'delete') return false;
    const before = ownList;
    await deleteWithUndo({ run: () => ctx.save({ ownAssume: ownList.filter((x) => x.id !== r.id) }), undo: () => ctx.save({ ownAssume: before }), text: t('«{name}» deleted.', { name: r.name }), name: r.name });
  }
  const ownLine = (o) => (o.kind === 'minDay' ? t('{n} min every day', { n: o.value }) : o.kind === 'min100' ? t('{n} min every 100 km', { n: o.value }) : o.kind === 'pct' ? t('{n} % faster (minus = slower)', { n: o.value }) : t('Note'));

  // nights you set yourself (learning: «Nacht 1 noch offen lassen»)
  const fixed = $derived(stored.fixedNights ?? {});
  const setNight = (n, v) =>
    ctx.save((cur) => {
      const f = { ...(cur.fixedNights ?? {}) };
      if (v) f[n] = v;
      else delete f[n];
      return { ...cur, fixedNights: f };
    });

  // your rides: the longest 15 with «loaded»
  const marked = $derived(new Set((stored.loadedIds ?? []).map(String)));
  const longRides = $derived(
    (ctx.acts ?? [])
      .filter((a) => (a.kind === 'ride' || a.kind === 'bike' || /ride/i.test(a.type ?? '')) && a.km >= 40 && a.movingS > 0)
      .sort((a, b) => b.km - a.km)
      .slice(0, 15),
  );
  const toggleLoaded = (id) =>
    ctx.save((cur) => {
      const s = new Set((cur.loadedIds ?? []).map(String));
      s.has(String(id)) ? s.delete(String(id)) : s.add(String(id));
      return { ...cur, loadedIds: [...s] };
    });

  // earlier attempts and their learnings (learning 5)
  const others = $derived(sameRace(ctx.trip, ctx.trips, ctx.races).filter((x) => x.id !== ctx.trip.id));
  const key = $derived(seriesKey(ctx.trip.title));
  const learned = $derived(
    ($learnQ ?? [])
      .filter((l) => {
        const src = seriesKey(l.source ?? '');
        return (key && src && (src.includes(key) || key.includes(src))) || others.some((o) => l.tripId === o.id) || /\b(rennen|race|ultra|biwak|bivy|hotel|zelt|tent)\b/i.test(l.rule ?? '');
      })
      .slice(0, 10),
  );
  const cd = $derived(ctx.trip.startDate ? countdown(ctx.trip.startDate, ctx.today) : null);
</script>

<div class="rc-grid">
  <RaceBox id="start" title={t('Start and goal')} what="The day and time of the start and how many days you give yourself." why="Everything else follows from it: the stages, the Sundays, the dark hours, the depot day." from="Your input; the trip's first day as the suggestion.">
    <div class="rc-inline">
      <label class="rc-lab">{t('Start day')}<input class="inp" type="date" bind:value={startDay} onchange={saveStart} data-race-start-day /></label>
      <label class="rc-lab">{t('Start time')}<input class="inp" type="time" bind:value={startTime} onchange={saveStart} data-race-start-time /></label>
    </div>
    <label class="rc-lab">{t('Goal: days')}<input class="inp rc-num" type="number" min="1" max="40" value={stored.targetDays ?? ''} placeholder={t('open')} onchange={(e) => ctx.save({ targetDays: e.currentTarget.value === '' ? null : Number(e.currentTarget.value) })} data-race-target /></label>
    {#if needH}<p class="rc-text">{t('For {n} days you ride about {h} a day (without stops).', { n: target, h: hm(needH) })}</p>{/if}
    {#if cd && cd.days > 0}<p class="rc-note">{tn(cd.weeks, 'Still {n} week to the start.', 'Still {n} weeks to the start.')}</p>{/if}
  </RaceBox>

  <RaceBox id="ways" title={t('Hotel, mixed or tent?')} what="Plays the whole race through three times: only hotels, hotels with an emergency bivy, and the tent." why="You see days, riding hours, sleep, weight, costs and risks side by side and choose with a calm head." from="Your route and stops, your rides and the assumptions below (change any of them).">
    {#if !ctx.route?.km}
      <p class="rc-empty">{t('Load the route under «Prepare» first.')} <a href={raceHref(ctx.trip.id, 'prepare')}>{t('Prepare')}</a></p>
    {:else if !sims.length}
      <p class="rc-empty">{t('Set the start day above.')}</p>
    {:else}
      <div class="rc-scroll">
        <table class="rc-table" data-race-ways>
          <thead>
            <tr><th></th>{#each WAYS as w (w.key)}<th scope="col">{t(w.name)}</th>{/each}</tr>
          </thead>
          <tbody>
            <tr><th scope="row">{t('Days')}</th>{#each sims as r (r.way)}<td class="num" data-way-days={r.way}>{r.days.length}</td>{/each}</tr>
            <tr><th scope="row">{t('Finish')}</th>{#each sims as r (r.way)}<td>{finishText(r)}</td>{/each}</tr>
            <tr><th scope="row">{t('Riding a day')}</th>{#each sims as r (r.way)}<td class="num">{hm(r.days.reduce((s, d) => s + d.rideH, 0) / Math.max(1, r.days.length))}</td>{/each}</tr>
            <tr><th scope="row">{t('Sleep in total')}</th>{#each sims as r (r.way)}<td class="num">{hm(r.sleepH)}</td>{/each}</tr>
            <tr><th scope="row">{t('Sleeping kit')}</th>{#each sims as r (r.way)}<td class="num">{r.kg.toFixed(1)} kg</td>{/each}</tr>
            <tr><th scope="row">{t('Costs')}</th>{#each sims as r (r.way)}<td class="num">CHF {Math.round(r.chf)}</td>{/each}</tr>
            <tr><th scope="row">{t('Good for my head')}</th>{#each sims as r (r.way)}<td class="num">{r.mind ?? '–'} / 5</td>{/each}</tr>
            <tr><th scope="row">{t('Risks')}</th>{#each sims as r (r.way)}<td><ul class="rc-risks">{#each r.risks as [k, vars], i (i)}<li>{t(k, vars)}</li>{:else}<li>{t('None found')}</li>{/each}</ul></td>{/each}</tr>
            <tr>
              <th scope="row">{t('My plan')}</th>
              {#each sims as r (r.way)}
                <td>
                  {#if way === r.way}<span class="rc-ok"><Check size={16} aria-hidden="true" /> {t('chosen')}</span>
                  {:else}<button type="button" class="btn sm" onclick={() => ctx.save({ way: r.way })} data-race-way={r.way}>{t('Choose')}</button>{/if}
                </td>
              {/each}
            </tr>
          </tbody>
        </table>
      </div>
      <p class="rc-note">{t('Your choice sets the time plan of every other part: stages end at the place to sleep.')}</p>
    {/if}
  </RaceBox>

  {#if sim}
    <RaceBox id="stages" title={t('Stages: {name}', { name: t(WAYS.find((w) => w.key === way)?.name ?? '') })} what="Day by day: where you start and end, how far, how much up, how long you ride and where you sleep." why="Stages that end at a bed instead of somewhere; the first night and the Sundays are marked." from="Your route, the beds of your stop file (and OpenStreetMap) and the assumptions.">
      <div class="rc-scroll">
        <table class="rc-table" data-race-stages>
          <thead><tr><th>{t('Day')}</th><th>{t('km')}</th><th class="num">{t('m up')}</th><th class="num">{t('Riding')}</th><th>{t('Arrival')}</th><th>{t('Sleep')}</th><th>{t('Night|race')}</th></tr></thead>
          <tbody>
            {#each sim.days as d (d.n)}
              <tr data-stage={d.n}>
                <td>{d.n} · {dayFmt(d.leave)}{#if d.sunday}{' '}<b class="rc-warn">{t('Sunday')}</b>{/if}</td>
                <td>{d.fromKm}–{d.toKm}</td>
                <td class="num">{num(d.upM ?? 0)}</td>
                <td class="num">{hm(d.rideH)}</td>
                <td class:rc-warn={d.late}>{timeOf(d.arrive)}{#if d.late}{' '}· {t('late')}{/if}</td>
                <td>{d.bed === 'finish' ? t('Finish') : d.place || (d.bed === 'tent' ? t('Wild camp') : t('Bivy on the way'))}</td>
                <td>
                  {#if d.bed !== 'finish'}
                    <select class="inp" value={fixed[d.n] ?? ''} onchange={(e) => setNight(d.n, e.currentTarget.value)} aria-label={t('Night {n}', { n: d.n })} data-race-night={d.n}>
                      <option value="">{t('as planned')}</option>
                      <option value="bivy">{t('Bivy where the day ends')}</option>
                    </select>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if sim.days[0] && sim.days[0].bed !== 'finish'}
        <p class="rc-note"><Moon size={14} aria-hidden="true" /> {t('Night 1: {where}, arrival {time}.', { where: sim.days[0].place || t('Bivy on the way'), time: timeOf(sim.days[0].arrive) })}</p>
      {/if}
    </RaceBox>
  {/if}

  <RaceBox id="assume" title={t('The assumptions')} what="Every number the plan uses, with where it comes from: yours, your rides or the standard." why="You see what is behind the plan and change it; the plan recalculates at once." from="Your Strava rides and recorded rides (loaded apart from light), else standard values from bikepacking races.">
    {#each ASSUME_GROUPS.filter((g) => g.key !== 'own') as g (g.key)}
      <h3 class="rc-h3">{t(g.name)}</h3>
      <ul class="rc-list">
        {#each ASSUMPTIONS.filter((a) => a.group === g.key) as a (a.key)}
          {@const cur = ctx.as[a.key]}
          <li class="rc-row" data-assume={a.key}>
            <span class="rc-row-main"><b>{t(a.name)}</b><small class="rc-src">{t(SRC[cur.src])}</small></span>
            {#if a.unit === 'time'}
              <input class="inp rc-num" type="time" value={cur.value} onchange={(e) => numIn(a, e)} aria-label={t(a.name)} />
            {:else}
              <input class="inp rc-num" type="number" min={a.min} max={a.max} step={a.step} value={cur.value} onchange={(e) => numIn(a, e)} aria-label={t(a.name)} data-assume-in={a.key} />
            {/if}
            <span class="rc-note">{unitOf(a.unit)}</span>
            {#if cur.src === 'yours'}<button type="button" class="rc-icon" aria-label={t('Back to the suggestion for {name}', { name: t(a.name) })} onclick={() => resetAssume(a.key)}><RotateCcw size={16} aria-hidden="true" /></button>{/if}
          </li>
        {/each}
      </ul>
    {/each}
    <h3 class="rc-h3">{t('My own assumptions')}</h3>
    {#if ownList.length}
      <ul class="rc-list">
        {#each ownList as o (o.id)}
          <li><button type="button" class="rc-row rc-row-main" onclick={() => (own = { ...o })} data-own-assume={o.id}><b>{o.name}</b><small>{ownLine(o)}</small></button></li>
        {/each}
      </ul>
    {/if}
    <div class="rc-acts"><button type="button" class="btn" onclick={() => (own = { name: '', kind: 'minDay', value: 30 })} data-race-own-add>{t('Add my own assumption')}</button></div>
  </RaceBox>

  <RaceBox id="pace" title={t('From your rides')} what="Your speed on the flat and your climbing rate, fitted on your rides of 40 km or more." why="Loaded is slower than light: rides on a trip of two days or more count as loaded, and you can mark others." from="Strava (Aktiv › Training) and your recorded rides.">
    {#if ctx.fromRides?.light || ctx.fromRides?.loaded}
      <div class="rc-stat">
        {#if ctx.fromRides.light}<div><b>{ctx.fromRides.light.flatKmh} km/h · {ctx.fromRides.light.climbMh} m/h</b><small>{tn(ctx.fromRides.light.n, 'light, {n} ride', 'light, {n} rides')}</small></div>{/if}
        {#if ctx.fromRides.loaded}<div><b>{ctx.fromRides.loaded.flatKmh} km/h · {ctx.fromRides.loaded.climbMh} m/h</b><small>{tn(ctx.fromRides.loaded.n, 'loaded, {n} ride', 'loaded, {n} rides')}</small></div>{:else}<div><b>–</b><small>{t('loaded: fewer than 3 rides, the standard counts')}</small></div>{/if}
      </div>
    {:else}
      <p class="rc-empty">{t('Fewer than 3 rides of 40 km or more: the plan uses the standard values.')}</p>
    {/if}
    {#if longRides.length}
      <h3 class="rc-h3">{t('Your longest rides: which were loaded?')}</h3>
      <ul class="rc-list">
        {#each longRides as a (a.id)}
          <li class="rc-row">
            <span class="rc-row-main"><b>{stravaName(a.name) || a.day}</b><small>{a.day} · {Math.round(a.km)} km · {Math.round(a.hm ?? 0)} m · {hm(a.movingS / 3600)}</small></span>
            <button type="button" class="rc-chip" aria-pressed={marked.has(String(a.id))} onclick={() => toggleLoaded(a.id)} data-race-loaded={a.id}>{t('loaded')}</button>
          </li>
        {/each}
      </ul>
    {/if}
  </RaceBox>

  <RaceBox id="before" title={t('Earlier attempts')} what="Your other years of the same race and the learnings that fit." why="What you learned last time goes into this plan (for example: the tent was never used)." from="Your trips with the same name and your learnings (Rückblick).">
    {#if others.length}
      <ul class="rc-list">
        {#each others as o (o.id)}
          <li><a class="rc-row" href={raceHref(o.id)}><span class="rc-row-main"><b>{o.title}</b><small>{o.startDate} · {tn(Number(o.days) || 1, '{n} day', '{n} days')}</small></span></a></li>
        {/each}
      </ul>
    {/if}
    {#if learned.length}
      <ul class="rc-list" data-race-learned>
        {#each learned as l (l.id)}<li class="rc-row"><span class="rc-row-main"><b>{l.rule}</b>{#if l.source}<small>{l.source}</small>{/if}</span></li>{/each}
      </ul>
    {/if}
    {#if !others.length && !learned.length}<p class="rc-empty">{t('No earlier attempt and no learning found yet.')}</p>{/if}
  </RaceBox>
</div>

{#if own}
  <RaceSheet title={own.id ? t('Change assumption') : t('My own assumption')} onsave={saveOwn} ondelete={own.id ? deleteOwn : null} onclose={() => (own = null)}>
    <label class="rc-lab">{t('Name')}<input class="inp" bind:value={own.name} maxlength="80" placeholder={t('e.g. Shower and laundry in the evening')} data-own-name /></label>
    <label class="rc-lab">{t('What it does')}
      <select class="inp" bind:value={own.kind}>{#each OWN_KINDS as k (k.key)}<option value={k.key}>{t(k.name)}</option>{/each}</select>
    </label>
    {#if own.kind !== 'note'}<label class="rc-lab">{t('Value')}<input class="inp rc-num" type="number" bind:value={own.value} data-own-value /></label>{/if}
  </RaceSheet>
{/if}

<style>
  .rc-h3 {
    margin: 8px 0 0;
    font: 700 var(--fs-body) var(--font-body);
  }
  .rc-risks {
    margin: 0;
    padding-left: 16px;
  }
  .rc-row .rc-num {
    flex: none;
  }
  button.rc-row {
    width: 100%;
    border: 0;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
</style>

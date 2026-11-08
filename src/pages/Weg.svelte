<script>
  /**
   * «Weg zum Ziel» (Idee G, Noah 05.11.2026 «1b 2b 3a 4a 5a»): Touren › Weg zum Ziel (#/trips/weg, #/trips/weg?g=<id>).
   * A big goal with a start day; the app counts back from the start day and lays out steps on a timeline. Everything
   * is a suggestion: every step can be renamed, moved to another day, ticked, deleted (with Undo); own steps can be
   * added; goals can be renamed, moved and deleted. The kinds of steps (training, bike ready …) live in lib/weg/types/;
   * what the app already knows ticks a step by itself (never takes a tick back).
   * Data: settings WEG_KEY (lib/weg/weg.js), in every backup. Nothing is fetched online.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { RACES_KEY, racesOf } from '../lib/race/race.js';
  import { raceChoices } from '../lib/training/plans.js';
  import { WEG_KEY, KINDS, PHASE_NAMES, wegOf, newGoal, addGoal, renameGoal, removeGoal, moveGoal, setStart, setPeriod, addSteps, addOwnStep, renameStep, removeStep, setDone, setDue, timeline, progress, typeProgress, untilStart, applyAuto } from '../lib/weg/weg.js';
  import { TYPES, typeOf, suggestions } from '../lib/weg/types/index.js';
  import { milestones } from '../lib/weg/types/proben.js';
  import { windowOf, sayWindow } from '../lib/weg/wetter.js';
  import { goalPeriod, suggestion } from '../lib/weg/startvorschlag.js';
  import { DREAM_WX, refreshDreamWx, placeOf, placeKey } from '../lib/dreams/wetterfenster.js';
  import { rainLimit } from '../lib/rainlimit.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import Empty from '../lib/ui/Empty.svelte';
  import DateInput from '../lib/ui/DateInput.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { Flag, Plus, Check, Pencil, Trash2, ChevronRight, CalendarClock, Ellipsis, Sun, CloudRain } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const today = localDay();
  const storeQ = liveQuery(() => db.settings.get(WEG_KEY));
  const racesQ = liveQuery(() => db.settings.get(RACES_KEY));
  const w = $derived(wegOf($storeQ?.value));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const raceMap = $derived(racesOf($racesQ?.value)); // the race notes by trip, for the kinds of steps
  const races = $derived(raceChoices($tripsQ ?? [], $racesQ?.value ?? null, today)); // the races ahead to choose from

  let hash = $state(location.hash);
  $effect(() => {
    const on = () => (hash = location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });
  const wanted = $derived(new URLSearchParams(hash.split('?')[1] ?? '').get('g') ?? '');
  const goal = $derived(w.goals.find((g) => g.id === wanted) ?? w.goals[0] ?? null);
  const gi = $derived(goal ? w.goals.findIndex((g) => g.id === goal.id) : -1);

  async function save(next) {
    await db.settings.put({ key: WEG_KEY, value: { goals: next.goals, onToday: next.onToday } });
  }
  const putGoal = (g) => save({ ...w, goals: w.goals.map((x) => (x.id === g.id ? g : x)) });
  const pick = (id) => (location.hash = `#/trips/weg?g=${encodeURIComponent(id)}`);

  // ---- what the kinds of steps know: ctx for applyAuto (each type may bring its own part with load(db))
  let ctx = $state({});
  $effect(() => {
    void $storeQ;
    const g = goal; // a kind of step may need to know the goal (its trip, its start day)
    let live = true;
    (async () => {
      const own = {};
      for (const ty of TYPES) {
        try {
          if (ty.load) own[ty.type] = await ty.load(db, g);
        } catch {
          /* a type that cannot load adds nothing; its steps stay for you to tick */
        }
      }
      if (live) ctx = own;
    })();
    return () => (live = false);
  });
  let ticking = false;
  $effect(() => {
    if (!goal || ticking) return;
    const next = applyAuto(goal, TYPES, { ...ctx, races: raceMap, today });
    if (next === goal) return;
    ticking = true;
    putGoal(next).finally(() => (ticking = false));
  });

  const rows = $derived(goal ? timeline(goal, today) : []);
  const prog = $derived(goal ? progress(goal, today) : null);
  const until = $derived(goal ? untilStart(goal, today) : null);
  // the strip «Organisation: 3 of 5 settled» (Noah «1d»)
  const orga = $derived(goal ? typeProgress(goal, 'orga', today) : null);
  const orgaNext = $derived.by(() => {
    const s = orga?.soon;
    if (!s) return '';
    const name = s.row.step.title;
    if (s.days === 0) return t('Next deadline: {name}, today', { name });
    if (s.days < 0) return tn(-s.days, 'Next deadline: {name}, {n} day late', 'Next deadline: {name}, {n} days late', { name });
    return tn(s.days, 'Next deadline: {name}, in {n} day', 'Next deadline: {name}, in {n} days', { name });
  });
  // the strip «Practice rides» (Noah «3a»): circles for 50 / 100 / 200 km
  const proben = $derived(goal ? milestones(goal, today, { ...ctx.proben, today }) : { best: 0, items: [] });
  // the weather window from 7 days before the start (Noah «4a»): the forecast the tour has saved
  const wetter = $derived(goal ? windowOf(goal, $tripsQ ?? [], today, rainLimit()) : null);
  const wDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });
  const wWord = (d) => `${wDay(d)} ${Number(d.slice(8))}.`;
  const wsay = $derived.by(() => {
    if (!wetter) return null;
    const s = sayWindow(wetter);
    const vars = { ...s.vars, ...(s.vars.from ? { from: wWord(s.vars.from), to: wWord(s.vars.to) } : {}) };
    return { title: t(s.title, vars), text: t(s.text, vars), extra: s.extra ? t(s.extra) : '' };
  });
  // the start suggestion for an open period (Noah «4a», G3 lower card): dry days of the home place inside the period
  const homeQ = liveQuery(async () => (await db.settings.get('homePlace'))?.value ?? null);
  const wxQ = liveQuery(async () => (await db.meta.get(DREAM_WX)) ?? null);
  const period = $derived(goal ? goalPeriod(goal) : null);
  const homeAt = $derived(placeOf({}, $homeQ));
  let skip = $state(0);
  let askPeriod = $state(false);
  let pFrom = $state('');
  let pTo = $state('');
  $effect(() => {
    if (!period || $homeQ === undefined) return;
    refreshDreamWx(db, [{}], $homeQ).catch(() => {});
  });
  const startSugg = $derived(goal && period ? suggestion(goal, homeAt ? $wxQ?.places?.[placeKey(homeAt)] : null, today, { hasPlace: !!homeAt, skip }) : null);
  const startSay = $derived.by(() => {
    if (!startSugg) return '';
    const v = { from: wWord(startSugg.period.from), to: wWord(startSugg.period.to), last: startSugg.lastDay ? wWord(startSugg.lastDay) : '' };
    if (startSugg.state === 'noplace') return t('Set your home place in Me › Settings: the forecast needs a place.');
    if (startSugg.state === 'nodata') return t('No forecast kept yet. It loads once the app is online.');
    if (startSugg.state === 'far') return t('The forecast reaches only until {last}. Your period starts later; look again then.', v);
    if (startSugg.state === 'none') return t('No 3 dry days in a row from {from} to {to} so far.', v);
    return t('Dry from {from} to {to}: {n} days in a row.', { from: wWord(startSugg.win.from), to: wWord(startSugg.win.to), n: num(startSugg.win.n) });
  });
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  function takeStart() {
    if (startSugg?.state !== 'window') return;
    skip = 0;
    putGoal(setStart({ goals: [goal] }, goal.id, startSugg.win.start).goals[0]);
  }
  function savePeriod() {
    const next = setPeriod({ goals: [goal] }, goal.id, pFrom, pTo).goals[0];
    if (!next.period) return;
    skip = 0;
    askPeriod = false;
    putGoal(next);
  }
  function dropPeriod() {
    skip = 0;
    pFrom = pTo = '';
    putGoal(setPeriod({ goals: [goal] }, goal.id, '', '').goals[0]);
  }
  function toOrgaList() {
    const li = document.querySelector('[data-weg-step][data-type="orga"]:not(.done)') ?? document.querySelector('[data-weg-step][data-type="orga"]');
    li?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  const groups = $derived.by(() => {
    const out = [];
    for (const r of rows) {
      const last = out.at(-1);
      if (last && last.phase === r.phase) last.rows.push(r);
      else out.push({ phase: r.phase, rows: [r] });
    }
    return out;
  });
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : t('No day yet'));
  const KIND_NAMES = { race: 'Race', trip: 'Trip', free: 'Free goal' };
  const kindName = (k) => t(KIND_NAMES[k] ?? 'Free goal');

  // ---- new way
  let adding = $state(false);
  let nTitle = $state('');
  let nKind = $state('race');
  let nStart = $state('');
  let nPick = $state({});
  let nRace = $state('');
  const openRaces = $derived(races);
  function pickRace(id) {
    nRace = id;
    const r = races.find((x) => x.id === id);
    if (r) {
      if (!nTitle.trim()) nTitle = r.title;
      if (r.day) nStart = r.day;
    }
  }
  const nGoal = $derived(newGoal({ title: nTitle || ' ', kind: nKind, start: nStart, tripId: nKind === 'race' ? nRace : ''}, { id: 'draft', now: '' }));
  const sugg = $derived(suggestions(nGoal));
  const suggKey = (s, i) => `${s.type}:${s.key ?? i}`;
  function openAdd() {
    adding = true;
    nTitle = '';
    nKind = 'race';
    nStart = '';
    nPick = {};
    nRace = '';
  }
  async function create(e) {
    e.preventDefault();
    if (!nTitle.trim()) return;
    let g = newGoal({ title: nTitle, kind: nKind, start: nStart, tripId: nKind === 'race' ? nRace : '' });
    g = addSteps(g, sugg.filter((s, i) => nPick[suggKey(s, i)] !== false).map((s) => ({ ...s, title: t(s.title), note: s.note ? t(s.note) : s.note }))); // the titles are English keys: stored in your language, then yours to change
    await save(addGoal(w, g));
    adding = false;
    pick(g.id);
  }

  // ---- goal: rename, delete, order
  let renaming = $state(null); // { kind: 'goal' } | { kind: 'step', id }
  async function removeThisGoal() {
    const g = goal;
    if (!g || (await askDelete({ title: t('Delete the way "{name}"?', { name: g.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = $state.snapshot(w);
    await deleteWithUndo({ run: async () => (await save(removeGoal(w, g.id)), before), undo: (snap) => save(snap), text: t('"{name}" deleted.', { name: g.title }), name: g.title });
  }
  const stepGoal = (dir) => goal && save(moveGoal(w, gi, gi + dir));

  // ---- the «…» menus: one open at a time, for the way or for one step (Noah 07.11. «a»: calm rows, editing behind «…»)
  let menu = $state(null); // { kind: 'goal' } | { kind: 'step', id }
  const isOpen = (kind, id = '') => menu?.kind === kind && (menu.id ?? '') === id;
  const toggleMenu = (kind, id = '') => (menu = isOpen(kind, id) ? null : { kind, id });
  // the line «Today» stands before the first step after today (or at the end of the dated ones)
  const todayBefore = $derived(rows.find((r) => !r.due || r.due > today)?.step.id ?? '');
  let ownOpen = $state(false);

  // ---- steps
  let sTitle = $state('');
  let sDue = $state('');
  async function addOwn(e) {
    e.preventDefault();
    if (!goal || !sTitle.trim()) return;
    const next = addOwnStep(goal, { title: sTitle, due: sDue });
    sTitle = ''; // clear at once, so what you type next is not wiped when the save ends
    sDue = '';
    ownOpen = false;
    await putGoal(next);
  }
  async function removeThisStep(r) {
    const g = goal;
    if ((await askDelete({ title: t('Delete the step "{name}"?', { name: r.step.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = $state.snapshot(g);
    await deleteWithUndo({ run: async () => (await putGoal(removeStep(g, r.step.id)), before), undo: (snap) => putGoal(snap), text: t('"{name}" deleted.', { name: r.step.title }), name: r.step.title });
  }
  const linkOf = (r) => {
    try {
      return typeOf(r.step.type).link?.(goal, r.step) || '';
    } catch {
      return '';
    }
  };
  const renameValue = $derived(renaming?.kind === 'goal' ? goal?.title : goal?.steps.find((s) => s.id === renaming?.id)?.title);
</script>

<div class="ich-page weg" data-page="weg">
  <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Way to the goal')} sub={t('Count back from a big day: the app lays out the steps')} />
  <p class="wg-intro">{t('Name a big goal and its start day. The app counts back and suggests steps. Everything is a suggestion: change, move or delete any step.')}</p>

  {#if !goal && !adding}
    <Empty icon={Flag} text={t('No way yet. Name a big goal with a start day, for example a race in May.')} action={{ label: t('New way'), onclick: openAdd }} />
  {/if}

  {#if w.goals.length > 1 && !adding}
    <div class="wg-goals" role="group" aria-label={t('Your ways')}>
      {#each w.goals as g (g.id)}
        <button type="button" class="chip" class:on={g.id === goal?.id} aria-pressed={g.id === goal?.id} onclick={() => pick(g.id)}>{g.title}</button>
      {/each}
    </div>
  {/if}

  {#if adding}
    <form class="card pad wg-new" onsubmit={create} data-weg-new>
      <h2>{t('New way')}</h2>
      <label class="wg-f"><span>{t('What are you aiming at?')}</span><input class="inp" bind:value={nTitle} maxlength="80" placeholder={t('For example: Race in May')} data-weg-title /></label>
      <div class="wg-f"><span id="wg-kind">{t('Kind')}</span><Seg labelledby="wg-kind" options={KINDS.map((k) => ({ key: k, name: kindName(k) }))} value={nKind} onchange={(v) => (nKind = v)} /></div>
      {#if nKind === 'race' && openRaces.length}
        <label class="wg-f"><span>{t('One of your races (optional)')}</span><select class="inp" value={nRace} onchange={(e) => pickRace(e.currentTarget.value)}><option value="">{t('No race chosen')}</option>{#each openRaces as r (r.id)}<option value={r.id}>{r.title}</option>{/each}</select></label>
      {/if}
      <div class="wg-f"><span>{t('Start day')}</span><DateInput bind:value={nStart} data-weg-start /><small class="ich-help">{t('Leave it empty if the day is still open. You can set it later.')}</small></div>
      {#if sugg.length}
        <div class="wg-f"><span>{t('Steps to suggest (untick what you do not want)')}</span>
          {#each sugg as s, i (suggKey(s, i))}
            <label class="wg-pick"><input type="checkbox" checked={nPick[suggKey(s, i)] !== false} onchange={(e) => (nPick = { ...nPick, [suggKey(s, i)]: e.currentTarget.checked })} /> {t(s.title)}</label>
          {/each}
        </div>
      {:else}
        <p class="ich-help">{t('You add the steps yourself. More kinds of steps (training, bike, packing) come in later versions.')}</p>
      {/if}
      <div class="wg-acts"><button type="submit" class="btn hi" disabled={!nTitle.trim()}>{t('Create way')}</button><button type="button" class="btn" onclick={() => (adding = false)}>{t('Cancel')}</button></div>
    </form>
  {/if}

  {#if goal && !adding}
    <section class="wg-hero" aria-label={goal.title} data-weg-goal>
      <div class="wg-top">
        <div class="wg-head">
          <p class="wg-kicker">{kindName(goal.kind)}</p>
          <h2>{goal.title}</h2>
          <p class="wg-when">
            {#if goal.start}{dayText(goal.start)}{' · '}{/if}
            {#if until && until.days >= 14}{tn(until.weeks, 'Start in {n} week', 'Start in {n} weeks')}
            {:else if until && until.days >= 2}{tn(until.days, 'Start in {n} day', 'Start in {n} days')}
            {:else if until && until.days === 1}{t('Start tomorrow')}
            {:else if until && until.days === 0}{t('Start today')}
            {:else if until}{t('The start day is over.')}
            {:else}{t('The start day is still open.')}{/if}
          </p>
        </div>
        <button type="button" class="wg-dots" aria-expanded={isOpen('goal')} aria-label={t('Edit {name}', { name: goal.title })} onclick={() => toggleMenu('goal')} data-weg-menu><Ellipsis size={20} aria-hidden="true" /></button>
      </div>
      {#if prog?.total}
        <div class="wg-bar" role="progressbar" aria-valuemin="0" aria-valuemax={prog.total} aria-valuenow={prog.done} aria-label={t('Steps done')}><i style:width="{Math.round((prog.done / prog.total) * 100)}%"></i></div>
        <p class="wg-prog">{t('{done} of {total} steps done', { done: num(prog.done), total: num(prog.total) })}{#if prog.late}{' · '}{tn(prog.late, '{n} late', '{n} late')}{/if}</p>
      {/if}
      {#if isOpen('goal')}
        <div class="wg-menu" data-weg-menu-panel>
          <label class="wg-startf"><span><CalendarClock size={14} aria-hidden="true" /> {t('Start day')}</span><DateInput value={goal.start} onchange={(v) => putGoal(setStart({ goals: [goal] }, goal.id, v).goals[0])} data-weg-start-edit /></label>
          <div class="wg-acts">
            {#if w.goals.length > 1}<SortArrows name={goal.title} i={gi} n={w.goals.length} onstep={stepGoal} />{/if}
            <button type="button" class="btn" onclick={() => { menu = null; renaming = { kind: 'goal' }; }} aria-label={t('Rename {name}', { name: goal.title })}><Pencil size={16} aria-hidden="true" /> {t('Rename')}</button>
            <button type="button" class="btn" onclick={removeThisGoal} aria-label={t('Delete {name}', { name: goal.title })} data-weg-delete><Trash2 size={16} aria-hidden="true" /> {t('Delete')}</button>
          </div>
        </div>
      {/if}
    </section>

    {#if orga?.total}
      <section class="card pad wg-orga" class:all={orga.done === orga.total} data-weg-orga aria-label={t('Organisation')}>
        <div class="wg-orga-text">
          <b>{orga.done === orga.total ? t('Organisation: all {total} settled', { total: num(orga.total) }) : t('Organisation: {done} of {total} settled', { done: num(orga.done), total: num(orga.total) })}</b>
          {#if orgaNext}<span class="wg-sub">{orgaNext}</span>{/if}
        </div>
        <button type="button" class="btn" onclick={toOrgaList} data-weg-orga-go>{t('To the list')} <ChevronRight size={14} aria-hidden="true" /></button>
      </section>
    {/if}

    {#if proben.items.length}
      <section class="card pad wg-proben" data-weg-proben aria-label={t('Practice rides')}>
        <h3>{t('Practice rides')}</h3>
        <div class="wg-circles">
          {#each proben.items as m (m.id)}
            {@const done = goal.steps.find((s) => s.id === m.id)?.done}
            <div class="wg-circle-box">
              <button type="button" class="wg-circle" class:on={done} class:late={!done && m.state === 'late'} aria-pressed={!!done} aria-label={done ? t('Practice ride of {km} km, done', { km: m.km }) : t('Practice ride of {km} km, open', { km: m.km })} onclick={() => putGoal(setDone(goal, m.id, !done))} data-weg-proben-circle>
                {#if done}<Check size={28} aria-hidden="true" />{:else}{num(m.km)}{/if}
              </button>
              <b>{t('{km} km', { km: num(m.km) })}</b>
              <span class="wg-sub">{dayText(m.due)}</span>
            </div>
          {/each}
        </div>
        <p class="wg-sub wg-proben-note">{proben.best ? t('Longest ride so far: {km} km', { km: num(proben.best) }) : t('No ride counted yet. Strava rides tick the circles by themselves; tap a circle to tick by hand.')}</p>
      </section>
    {/if}

    {#if goal && !goal.start}
      <section class="card pad wg-wetter wg-open" data-weg-startvorschlag aria-label={t('Find a dry start')}>
        <h3>{t('While the start day is open')}</h3>
        {#if period && startSugg}
          <b class="wg-wtitle">{t('Find a dry start')}</b>
          <p class="wg-sub">{t('Your period: {from} to {to}.', { from: wWord(period.from), to: wWord(period.to) })} {startSay}</p>
          <div class="wg-acts">
            {#if startSugg.state === 'window'}
              <button type="button" class="btn hi" onclick={takeStart} data-weg-start-take>{t('Set start {day}', { day: longDay(startSugg.win.start) })}</button>
              {#if startSugg.count > 1}<button type="button" class="btn" onclick={() => (skip += 1)} data-weg-start-other>{t('Another window')}</button>{/if}
            {/if}
            <button type="button" class="btn" onclick={dropPeriod} data-weg-start-no>{t('No thanks')}</button>
          </div>
        {:else if askPeriod}
          <p class="wg-sub">{t('Name a period, for example the next two weeks. The app looks in the forecast for 3 dry days in a row and suggests a start day. It is only a suggestion.')}</p>
          <div class="wg-prow">
            <label class="wg-startf"><span>{t('Period from')}</span><DateInput bind:value={pFrom} data-weg-period-from /></label>
            <label class="wg-startf"><span>{t('Period to')}</span><DateInput bind:value={pTo} data-weg-period-to /></label>
          </div>
          <div class="wg-acts">
            <button type="button" class="btn hi" onclick={savePeriod} disabled={!pFrom || !pTo || pFrom > pTo} data-weg-period-save>{t('Look for dry days')}</button>
            <button type="button" class="btn" onclick={() => (askPeriod = false)}>{t('Cancel')}</button>
          </div>
        {:else}
          <p class="wg-sub">{t('The steps have no days yet. Name a period and the app looks for dry days to suggest a start day.')}</p>
          <div class="wg-acts"><button type="button" class="btn" onclick={() => (askPeriod = true)} data-weg-period-open>{t('Find a dry start')}</button></div>
        {/if}
      </section>
    {/if}

    {#if wetter && wsay}
      <section class="card pad wg-wetter" data-weg-wetter aria-label={t('Weather window, 7 days before the start')}>
        <h3>{t('Weather window for the start')}</h3>
        <b class="wg-wtitle">{wsay.title}</b>
        <p class="wg-sub">{wsay.text}{#if wsay.extra}{' '}{wsay.extra}{/if}</p>
        {#if wetter.days.length}
          <ul class="wg-days">
            {#each wetter.days as d (d.date)}
              <li class:wet={d.wet} class:start={d.isStart} aria-label={t('{pct} % rain on {day}', { pct: num(d.pct), day: wWord(d.date) })}>
                <b>{wWord(d.date)}</b>
                {#if d.wet}<CloudRain size={22} aria-hidden="true" />{:else}<Sun size={22} aria-hidden="true" />{/if}
                <small>{num(d.pct)} %</small>
              </li>
            {/each}
          </ul>
          <p class="wg-sub">{t('Rain chance per day, from the forecast saved with the tour.')}</p>
        {:else}
          <a class="wg-go" href="#/pack">{t('Open')} <ChevronRight size={14} aria-hidden="true" /></a>
        {/if}
      </section>
    {/if}

    {#if !rows.length}
      <Empty icon={Flag} text={t('No steps yet. Add your first step below: it stays a suggestion, you can change it any time.')} />
    {/if}

    {#if rows.length}
      <section class="card pad wg-timeline" aria-label={t('Way to the goal')}>
        <ol class="wg-line">
          {#each rows as r, i (r.step.id)}
            {#if i === 0 || rows[i - 1].phase !== r.phase}
              <li class="wg-ph" aria-hidden="true">{t(PHASE_NAMES[r.phase])}</li>
            {/if}
            {#if r.step.id === todayBefore}
              <li class="wg-today" aria-label={t('Today')}><span>{t('Today')} · {dayText(today)}</span></li>
            {/if}
            <li class="wg-row" class:done={r.state === 'done'} class:late={r.state === 'late'} data-weg-step data-type={r.step.type}>
              <button type="button" class="wg-check" class:on={r.step.done} aria-pressed={r.step.done} aria-label={t('Done: {name}', { name: r.step.title })} onclick={() => putGoal(setDone(goal, r.step.id, !r.step.done))}><span class="wg-dot">{#if r.step.done}<Check size={14} aria-hidden="true" />{/if}</span></button>
              <div class="wg-body">
                <span class="wg-sub">{dayText(r.due)}{#if r.state === 'late'}{' · '}<em>{t('Late|step')}</em>{/if}{#if r.step.by === 'auto'}{' · '}{t('ticked by the app')}{/if}</span>
                <b>{r.step.title}</b>
                {#if r.step.note}<span class="wg-note">{r.step.note}</span>{/if}
                {#if linkOf(r)}<a class="wg-go" href={linkOf(r)}>{t('Open')} <ChevronRight size={14} aria-hidden="true" /></a>{/if}
              </div>
              <button type="button" class="wg-dots" aria-expanded={isOpen('step', r.step.id)} aria-label={t('Edit {name}', { name: r.step.title })} onclick={() => toggleMenu('step', r.step.id)}><Ellipsis size={18} aria-hidden="true" /></button>
              {#if isOpen('step', r.step.id)}
                <div class="wg-menu">
                  <label class="wg-startf"><span><CalendarClock size={14} aria-hidden="true" /> {t('Day (optional)')}</span><DateInput value={r.step.due || r.due} onchange={(v) => putGoal(setDue(goal, r.step.id, v))} aria-label={t('Day of {name}', { name: r.step.title })} /></label>
                  <div class="wg-acts">
                    <button type="button" class="btn" onclick={() => { menu = null; renaming = { kind: 'step', id: r.step.id }; }} aria-label={t('Rename {name}', { name: r.step.title })}><Pencil size={16} aria-hidden="true" /> {t('Rename')}</button>
                    <button type="button" class="btn" onclick={() => removeThisStep(r)} aria-label={t('Delete {name}', { name: r.step.title })}><Trash2 size={16} aria-hidden="true" /> {t('Delete')}</button>
                  </div>
                </div>
              {/if}
            </li>
          {/each}
          {#if todayBefore === '' && rows.length}
            <li class="wg-today" aria-label={t('Today')}><span>{t('Today')} · {dayText(today)}</span></li>
          {/if}
        </ol>
      </section>
    {/if}

    {#if ownOpen}
      <form class="card pad wg-own" onsubmit={addOwn} data-weg-own>
        <h3>{t('Add your own step')}</h3>
        <div class="wg-own-row">
          <input class="inp" bind:value={sTitle} maxlength="120" placeholder={t('For example: book the train')} aria-label={t('Step')} data-weg-step-title />
          <DateInput bind:value={sDue} aria-label={t('Day (optional)')} />
          <button type="submit" class="btn hi" disabled={!sTitle.trim()}><Plus size={16} aria-hidden="true" /> {t('Add')}</button>
        </div>
      </form>
    {:else}
      <p class="wg-more"><button type="button" class="btn" onclick={() => (ownOpen = true)} data-weg-own-open><Plus size={16} aria-hidden="true" /> {t('Add your own step')}</button></p>
    {/if}
  {/if}

  {#if w.goals.length && !adding}
    <p class="wg-more"><button type="button" class="btn" onclick={openAdd} data-weg-add><Plus size={16} aria-hidden="true" /> {t('New way')}</button></p>
  {/if}
</div>

{#if renaming && goal}
  <RenameSheet
    kicker={renaming.kind === 'goal' ? t('Way|kicker') : t('Step')}
    title={renaming.kind === 'goal' ? t('Rename way') : t('Rename step')}
    value={renameValue}
    onsave={async (name) => {
      await putGoal(renaming.kind === 'goal' ? renameGoal({ goals: [goal] }, goal.id, name).goals[0] : renameStep(goal, renaming.id, name));
      offerDone(t('Renamed to "{name}".', { name }));
    }}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  .wg-intro { max-width: 65ch; margin: 0 0 var(--sp-4); }
  .wg-goals { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-bottom: var(--sp-3); }
  .wg-f { display: grid; gap: var(--sp-1); margin: var(--sp-3) 0; }
  .wg-f > span { font-size: var(--fs-small); font-weight: 600; }
  .wg-pick { display: flex; gap: var(--sp-2); align-items: center; min-height: 44px; }
  .wg-acts { display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center; }
  .wg-sub { font-size: var(--fs-small); color: var(--ink-3); }

  /* the head of the way: dark, calm, one glance (mockup G1) */
  .wg-hero { background: var(--ink); color: var(--paper); border-radius: 18px; padding: var(--sp-4); margin-bottom: var(--sp-4); }
  .wg-top { display: flex; justify-content: space-between; gap: var(--sp-3); align-items: flex-start; }
  .wg-head { min-width: 0; }
  .wg-hero h2 { margin: 0; color: var(--paper); overflow-wrap: break-word; }
  .wg-kicker { margin: 0; font-size: var(--fs-small); font-weight: 600; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.04em; }
  .wg-when { margin: var(--sp-1) 0 0; font-weight: 600; }
  .wg-prog { margin: var(--sp-2) 0 0; font-size: var(--fs-small); opacity: 0.85; }
  .wg-bar { height: 10px; border-radius: 6px; background: var(--ink-3); overflow: hidden; margin-top: var(--sp-3); }
  .wg-bar i { display: block; height: 100%; background: var(--accent); border-radius: 6px; }
  .wg-hero .wg-dots { color: var(--paper); border-color: var(--ink-3); background: transparent; }
  .wg-hero .wg-menu { border-top-color: var(--ink-3); }
  .wg-hero .wg-startf > span { color: var(--paper); }

  /* «…»: the one place for rename, move and delete */
  .wg-dots { flex: none; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line); background: var(--paper); color: var(--ink-3); display: grid; place-items: center; cursor: pointer; }
  .wg-menu { flex-basis: 100%; display: grid; gap: var(--sp-3); margin-top: var(--sp-3); padding-top: var(--sp-3); border-top: 1px solid var(--line); }
  .wg-startf { display: grid; gap: var(--sp-1); }
  .wg-startf > span { font-size: var(--fs-small); font-weight: 600; display: inline-flex; gap: var(--sp-1); align-items: center; }

  /* the strips above the line */
  .wg-orga { display: flex; gap: var(--sp-3); align-items: center; justify-content: space-between; flex-wrap: wrap; border-left: 4px solid var(--warn); }
  .wg-orga.all { border-left-color: var(--ok); }
  .wg-orga-text { display: grid; gap: var(--sp-1); min-width: 0; }
  .wg-proben h3 { margin: 0 0 var(--sp-3); font-size: var(--fs-small); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-3); }
  .wg-circles { display: flex; justify-content: center; gap: var(--sp-6); flex-wrap: wrap; }
  .wg-circle-box { display: grid; justify-items: center; gap: 2px; text-align: center; }
  .wg-circle { width: 64px; height: 64px; border-radius: 50%; border: 2px dashed var(--line); background: var(--paper); color: var(--ink-3); font-weight: 700; display: grid; place-items: center; cursor: pointer; margin-bottom: var(--sp-1); }
  .wg-circle.on { border-style: solid; background: var(--accent); border-color: var(--accent); color: var(--brand-ink); }
  .wg-circle.late { border-color: var(--warn); }
  .wg-proben-note { margin: var(--sp-3) 0 0; text-align: center; }
  .wg-wetter h3 { margin: 0 0 var(--sp-2); font-size: var(--fs-small); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-3); }
  .wg-wtitle { font-size: var(--fs-sub); }
  .wg-days { list-style: none; margin: var(--sp-3) 0 var(--sp-2); padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(3.6rem, 1fr)); gap: var(--sp-2); }
  .wg-days li { display: grid; justify-items: center; gap: 2px; padding: var(--sp-2) var(--sp-1); border-radius: 12px; border: 1px solid var(--line); background: var(--paper-2); color: var(--ink); text-align: center; }
  .wg-days li:not(.wet) { border-color: var(--ok); }
  .wg-days li.start { outline: 2px solid var(--ink); outline-offset: 1px; }
  .wg-days li.wet { color: var(--ink-3); }
  .wg-prow { display: flex; flex-wrap: wrap; gap: var(--sp-3); margin: var(--sp-2) 0; }
  .wg-open .wg-acts { margin-top: var(--sp-3); }
  .wg-days small { font-size: var(--fs-small); }
  .wg-orga, .wg-proben, .wg-wetter, .wg-open, .wg-timeline, .wg-own, .wg-new { margin-bottom: var(--sp-4); }

  /* the way: one line with dots, «Today» marked on it (mockup G1) */
  .wg-line { list-style: none; margin: 0; padding: 0; position: relative; }
  .wg-line::before { content: ''; position: absolute; left: 21px; top: 8px; bottom: 8px; width: 3px; background: var(--line); border-radius: 3px; }
  .wg-ph { position: relative; margin: var(--sp-4) 0 0 56px; padding-bottom: var(--sp-1); border-bottom: 1px solid var(--line); font-size: var(--fs-small); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-3); }
  .wg-ph:first-child { margin-top: 0; }
  .wg-today { position: relative; margin: var(--sp-3) 0; padding-left: 56px; }
  .wg-today::before { content: ''; position: absolute; left: 12px; top: 50%; width: 21px; height: 21px; margin-top: -10px; border-radius: 50%; background: var(--warn); border: 3px solid var(--paper); box-sizing: border-box; }
  .wg-today span { display: inline-block; font-size: var(--fs-small); font-weight: 700; color: var(--warn); }
  .wg-row { position: relative; display: flex; gap: var(--sp-2); align-items: flex-start; padding: var(--sp-3) 0 var(--sp-3) 56px; flex-wrap: wrap; }
  .wg-row + .wg-row { border-top: 1px solid var(--line); }
  .wg-row .wg-check { position: absolute; left: 0; top: var(--sp-2); width: 44px; height: 44px; padding: 0; border: 0; background: transparent; display: grid; place-items: center; cursor: pointer; }
  .wg-dot { width: 24px; height: 24px; border-radius: 50%; border: 3px solid var(--line); background: var(--paper); color: var(--brand-ink); display: grid; place-items: center; box-sizing: border-box; }
  .wg-check.on .wg-dot { background: var(--ok); border-color: var(--ok); }
  .wg-row.late .wg-dot { border-color: var(--warn); }
  .wg-row.late .wg-sub em { color: var(--warn); font-style: normal; font-weight: 600; }
  .wg-row.done .wg-body b { color: var(--ink-3); }
  .wg-body { flex: 1; min-width: 12ch; display: grid; gap: 2px; }
  .wg-body b { font-size: var(--fs-body); }
  .wg-note { font-size: var(--fs-small); color: var(--ink-3); }
  .wg-go { display: inline-flex; align-items: center; font-weight: 600; min-height: 32px; }
  .wg-row .wg-menu { margin-left: 0; }
  .wg-own h3 { margin: 0 0 var(--sp-2); font-size: var(--fs-small); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-3); }
  .wg-own-row { display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center; }
  .wg-own-row .inp { flex: 1; min-width: 14ch; }
  .wg-more { margin: var(--sp-3) 0 var(--sp-6); }
</style>

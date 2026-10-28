<script>
  /**
   * Paket U «Rennen» › Plan (Noah 19.10.2026 17:23 «genau diese Infos im Frontend», «1b 2a und b»):
   * the whole race on one page, fed from your own race data and recalculated live:
   * summary, assumptions as cards (with their source), the day plan, hotel / mixed / tent with a
   * recommendation, saved scenarios side by side, the 40 cases and the learnings to tick off.
   */
  import { RotateCcw, Check, ChevronRight } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import RaceBox from './RaceBox.svelte';
  import RaceSheet from './RaceSheet.svelte';
  import EditList from './EditList.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { db } from '../db.js';
  import { WAYS, ASSUMPTIONS, OWN_KINDS } from './strategy.js';
  import { hm, localOf, newId, seriesKey, sameRace } from './race.js';
  import { summaryOf, recommend, casesOf, scenarioFrom, applyScenario, playScenario, CASE_GROUPS } from './overview.js';
  import { viewQ, setBox, stateOf } from './view.js';
  import { raceHref } from './parts.js';
  import { SAMPLE_TASKS, tasksDone } from './sample.js';
  import { t, tn, isDe } from '../i18n.svelte.js';
  import { FUEL_KEY } from '../fuel.js';
  import { RIDER_KEY } from '../weight.js';
  import { riderKg } from '../energie.js';

  let { ctx } = $props();
  const learnQ = liveQuery(() => db.learnings.toArray());
  // Paket X: the one energy rule needs your weight and your Verpflegung values
  const fuelQ = liveQuery(() => db.settings.get(FUEL_KEY));
  const kgQ = liveQuery(() => db.settings.get(RIDER_KEY));
  const stored = $derived(ctx.stored);
  const sim = $derived(ctx.sim);
  const km = $derived(ctx.route?.km ?? 0);
  const dayFmt = (ms) => new Date(ms).toLocaleDateString(isDe() ? 'de-CH' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' });
  const timeOf = (ms) => localOf(ms).slice(11, 16);
  const when = (ms) => `${dayFmt(ms)} ${timeOf(ms)}`;
  const wayName = (k) => t(WAYS.find((w) => w.key === k)?.name ?? '');
  const SRC = { yours: 'yours', loaded: 'your loaded rides', rides: 'your rides', standard: 'standard' };

  const sum = $derived(summaryOf({ sim, pois: ctx.pois, km }));
  const rec = $derived(recommend(ctx.sims, t));
  const cases = $derived(casesOf({ ...ctx, km, fuel: $fuelQ?.value ?? null, kg: riderKg($kgQ?.value) }, t));
  const filled = $derived(cases.filter((c) => !c.open).length);
  const offCount = $derived(($viewQ?.off ?? []).length);
  const hiddenCount = $derived(($viewQ?.hidden ?? []).length);

  // assumptions as cards (the most important ones; all of them under «Strategy»)
  const MAIN = ['flatKmh', 'climbMh', 'fatiguePct', 'pausePct', 'startAt', 'maxRideH', 'stopBy', 'checkInBy', 'hotelSleepH', 'bedOffKm'];
  const notes = $derived(stored.assumeNote ?? {});
  const setAssume = (key, value) => ctx.save((cur) => ({ ...cur, assume: { ...(cur.assume ?? {}), [key]: value } }));
  const resetAssume = (key) =>
    ctx.save((cur) => {
      const a = { ...(cur.assume ?? {}) };
      delete a[key];
      return { ...cur, assume: a };
    });
  const setNote = (key, text) => ctx.save((cur) => ({ ...cur, assumeNote: { ...(cur.assumeNote ?? {}), [key]: text.trim() } }));
  function numIn(a, e) {
    const v = e.currentTarget.value;
    if (a.unit === 'time') return /^\d\d:\d\d$/.test(v) && setAssume(a.key, v);
    const n = Number(v);
    if (Number.isFinite(n) && v !== '') setAssume(a.key, n);
  }
  const srcText = (a, cur) => notes[a.key] || t(SRC[cur.src]);

  // own assumptions (the same list as under «Strategy»)
  let own = $state(null);
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

  // scenarios (Noah «2a und b»: e.g. 8 against 10 days side by side)
  let scName = $state('');
  const scenarios = $derived(stored.scenarios ?? []);
  const played = $derived(scenarios.map((sc) => ({ sc, r: playScenario(sc, { km, profile: ctx.route?.profile ?? [], pois: ctx.pois, fromRides: ctx.fromRides, trip: ctx.trip }) })));
  function saveScenario(e) {
    e?.preventDefault();
    const name = scName.trim() || t('Scenario {n}', { n: scenarios.length + 1 });
    ctx.save((cur) => ({ ...cur, scenarios: [...(cur.scenarios ?? []), scenarioFrom(cur, name, newId('s'))] }));
    scName = '';
  }
  async function loadScenario(sc) {
    const before = structuredClone(stored);
    await ctx.save((cur) => applyScenario(cur, sc));
    await deleteWithUndo({ run: () => {}, undo: () => ctx.save(() => before), text: t('«{name}» is the plan now.', { name: sc.text }), name: sc.text });
  }

  // learnings to tick off: your learnings that fit this race, and your own for it
  const others = $derived(sameRace(ctx.trip, ctx.trips, ctx.races).filter((x) => x.id !== ctx.trip.id));
  const key = $derived(seriesKey(ctx.trip.title));
  const learned = $derived(
    ($learnQ ?? [])
      .filter((l) => {
        const src = seriesKey(l.source ?? '');
        return (key && src && (src.includes(key) || key.includes(src))) || others.some((o) => l.tripId === o.id) || /\b(rennen|race|ultra|biwak|bivy|hotel|zelt|tent)\b/i.test(l.rule ?? '');
      })
      .slice(0, 12),
  );
  // sample race: the hands-on tasks (8a), each ticks itself
  const done = $derived(new Set(tasksDone(stored)));
  const tickTask = (k) =>
    ctx.save((cur) => {
      const s = new Set(cur.tasksTicked ?? []);
      s.has(k) ? s.delete(k) : s.add(k);
      return { ...cur, tasksTicked: [...s] };
    });
  const ticks = $derived(new Set(stored.learnTicks ?? []));
  const tick = (id) =>
    ctx.save((cur) => {
      const s = new Set(cur.learnTicks ?? []);
      s.has(id) ? s.delete(id) : s.add(id);
      return { ...cur, learnTicks: [...s] };
    });
</script>

{#if !km}
  <RaceBox id="plan-empty" title={t('The plan')} what="The whole race on one page: summary, assumptions, day plan, the three ways and the 40 cases." why="One look shows if the plan works and what is still open." from="Your route, your stops, your rides and your assumptions.">
    <p class="rc-empty">{t('Load the route under «Prepare» first.')} <a href={raceHref(ctx.trip.id, 'prepare')}>{t('Prepare')}</a></p>
  </RaceBox>
{:else}
  <div class="rc-grid">
    {#if stored.sample}
      <RaceBox id="tasks" title={t('Try it out')} what="Small tasks on the sample race; each ticks itself when you did it." why="You see what the app can do and what you can change, with a made-up race." from="The sample race; nothing of it touches your own races.">
        <p class="rc-note">{t('{n} of {m} done. Now: {d} days, finish {when}.', { n: done.size, m: SAMPLE_TASKS.length, d: sim?.days.length ?? '–', when: sim ? when(sim.finish) : '–' })}</p>
        <ul class="rc-list" data-sample-tasks>
          {#each SAMPLE_TASKS as x (x.key)}
            <li class="rc-row"><label class="rc-tick"><input type="checkbox" checked={done.has(x.key)} onchange={() => tickTask(x.key)} data-sample-task={x.key} /><span class="rc-row-main"><b class:rc-done={done.has(x.key)}>{t(x.text)}</b></span></label></li>
          {/each}
        </ul>
      </RaceBox>
    {/if}
    <RaceBox id="summary" title={t('In short')} what="The finish, the Sundays, night 1, the depot day and the longest stretches without a shop." why="The five things that decide if the plan holds." from="The way you chose under «Strategy», played through with your route, stops and assumptions.">
      {#if sum}
        <div class="rc-stat" data-race-summary>
          <div><b>{when(sum.finish)}</b><small>{tn(sum.days, 'finish after {n} day', 'finish after {n} days')} · {wayName(ctx.way)}</small></div>
          <div><b>{hm(sum.rideH)}</b><small>{t('riding in total')}</small></div>
          <div><b>{sum.sundays.length ? sum.sundays.map((s) => t('day {n}', { n: s.n })).join(', ') : t('none')}</b><small>{t('Sundays: shops may be closed')}</small></div>
          {#if sum.night1}<div><b>{sum.night1.place || (sum.night1.bed === 'tent' ? t('Wild camp') : t('Bivy on the way'))}</b><small>{t('Night 1 at km {km}, arrival {time}', { km: sum.night1.km, time: timeOf(sum.night1.arrive) })}</small></div>{/if}
          {#if sum.depot}<div><b>{t('Day {n}, about {time}', { n: sum.depot.n, time: timeOf(sum.depot.at) })}</b><small>{t('Depot at km {km}', { km: sum.depot.km })}</small></div>{/if}
        </div>
        {#if sum.sundays.length}
          <ul class="rc-list">
            {#each sum.sundays as s (s.n)}<li class="rc-row"><span class="rc-row-main"><b>{t('Sunday, day {n}', { n: s.n })}</b><small>{t('km {a}–{b}: {n} shops on the way. Buy before.', { a: s.fromKm, b: s.toKm, n: s.shops })}</small></span></li>{/each}
          </ul>
        {/if}
        {#if sum.gaps.length}
          <p class="rc-text"><b>{t('Longest stretches without a shop')}:</b> {sum.gaps.map((g) => t('km {a}–{b} ({k} km)', { a: g.fromKm, b: g.toKm, k: g.km })).join(', ')}</p>
        {:else}
          <p class="rc-note">{t('Load your stops under «Prepare» to see the gaps.')}</p>
        {/if}
      {:else}
        <p class="rc-empty">{t('Set the start day under «Strategy».')} <a href={raceHref(ctx.trip.id, 'strategy')}>{t('Strategy')}</a></p>
      {/if}
    </RaceBox>

    <RaceBox id="plan-assume" title={t('The assumptions')} what="The numbers behind the plan as cards, each with where it comes from. Change a value or write your own source." why="You see what the plan assumes and change it; everything on this page recalculates at once." from="Your loaded rides, your own values, else standard values. All of them under «Strategy».">
      <div class="rc-cards">
        {#each ASSUMPTIONS.filter((a) => MAIN.includes(a.key)) as a (a.key)}
          {@const cur = ctx.as[a.key]}
          <div class="rc-card" data-assume-card={a.key}>
            <span class="rc-card-name">{t(a.name)}</span>
            <span class="rc-inline">
              {#if a.unit === 'time'}
                <input class="inp rc-num" type="time" value={cur.value} onchange={(e) => numIn(a, e)} aria-label={t(a.name)} />
              {:else}
                <input class="inp rc-num" type="number" min={a.min} max={a.max} step={a.step} value={cur.value} onchange={(e) => numIn(a, e)} aria-label={t(a.name)} data-assume-card-in={a.key} />
                <span class="rc-note">{a.unit}</span>
              {/if}
              {#if cur.src === 'yours'}<button type="button" class="rc-icon" aria-label={t('Back to the suggestion for {name}', { name: t(a.name) })} onclick={() => resetAssume(a.key)}><RotateCcw size={16} aria-hidden="true" /></button>{/if}
            </span>
            <input class="inp rc-srcin" value={notes[a.key] ?? ''} placeholder={srcText(a, cur)} maxlength="60" onchange={(e) => setNote(a.key, e.currentTarget.value)} aria-label={t('Source for {name}', { name: t(a.name) })} data-assume-src={a.key} />
          </div>
        {/each}
        {#each ownList as o (o.id)}
          <button type="button" class="rc-card own" onclick={() => (own = { ...o })} data-own-card={o.id}><span class="rc-card-name">{o.name}</span><small>{ownLine(o)}</small></button>
        {/each}
      </div>
      <div class="rc-acts">
        <button type="button" class="btn" onclick={() => (own = { name: '', kind: 'minDay', value: 30 })} data-plan-own-add>{t('+ my own assumption')}</button>
        <a class="btn sm" href={raceHref(ctx.trip.id, 'strategy')}>{t('All assumptions')}<ChevronRight size={16} aria-hidden="true" /></a>
      </div>
    </RaceBox>

    {#if sim}
      <RaceBox id="dayplan" title={tn(sim.days.length, 'The {n}-day plan', 'The {n}-day plan')} what="Day by day: date, km, metres up, riding time, arrival and where you sleep." why="Your race as a table; it changes as soon as you change an assumption or the way." from="The way you chose, your route, your stops and the assumptions.">
        <div class="rc-scroll">
          <table class="rc-table" data-plan-days>
            <thead><tr><th>{t('Day')}</th><th>{t('Date')}</th><th class="num">{t('km')}</th><th class="num">{t('m up')}</th><th class="num">{t('Riding')}</th><th>{t('Arrival')}</th><th>{t('Sleep')}</th></tr></thead>
            <tbody>
              {#each sim.days as d (d.n)}
                <tr data-plan-day={d.n}>
                  <td>{d.n}</td>
                  <td>{dayFmt(d.leave)}{#if d.sunday}{' '}<b class="rc-warn">{t('Sunday')}</b>{/if}</td>
                  <td class="num">{d.fromKm}–{d.toKm}</td>
                  <td class="num">{(d.upM ?? 0).toLocaleString('de-CH')}</td>
                  <td class="num">{hm(d.rideH)}</td>
                  <td class:rc-warn={d.late}>{timeOf(d.arrive)}</td>
                  <td>{d.bed === 'finish' ? t('Finish') : d.place || (d.bed === 'tent' ? t('Wild camp') : t('Bivy on the way'))}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RaceBox>
    {/if}

    {#if ctx.sims.length}
      <RaceBox id="plan-ways" title={t('Hotel, mixed or tent?')} what="The three ways side by side, with a recommendation and its reasons." why="A calm choice before the race instead of a tired one at night." from="The three ways played through with your assumptions; the recommendation weighs your head score, late hotels, long days, weight and the finish.">
        <div class="rc-ways">
          {#each ctx.sims as r (r.way)}
            <div class="rc-way" class:best={rec?.way === r.way} data-plan-way={r.way}>
              <b>{wayName(r.way)}</b>
              {#if rec?.way === r.way}<span class="rc-ok">{t('Recommended')}</span>{/if}
              <small>{tn(r.days.length, '{n} day', '{n} days')} · {t('finish {when}', { when: when(r.finish) })}</small>
              <small>{t('Sleeping kit')} {r.kg.toFixed(1)} kg · CHF {Math.round(r.chf)}</small>
              <small>{t('Good for my head')} {r.mind ?? '–'} / 5</small>
              <ul class="rc-risks">{#each r.risks as [k, vars], i (i)}<li>{t(k, vars)}</li>{:else}<li>{t('None found')}</li>{/each}</ul>
              {#if ctx.way === r.way}<span class="rc-ok"><Check size={16} aria-hidden="true" /> {t('chosen')}</span>
              {:else}<button type="button" class="btn sm" onclick={() => ctx.save({ way: r.way })} data-plan-choose={r.way}>{t('Choose')}</button>{/if}
            </div>
          {/each}
        </div>
        {#if rec}
          <p class="rc-text"><b>{t('Why {name}', { name: wayName(rec.way) })}:</b></p>
          <ul class="rc-risks" data-plan-reasons>{#each rec.reasons as x, i (i)}<li>{x}</li>{/each}</ul>
          <p class="rc-note">{t('Only a suggestion: you decide.')}</p>
        {/if}
      </RaceBox>
    {/if}

    <RaceBox id="scenarios" title={t('Scenarios')} what="Saves the current assumptions, nights, way, start and goal under a name, and plays all saved ones through side by side." why="Compare for example 8 against 10 days, or hotels against the tent, and go back to one with a tap." from="Your saved scenarios; each is played through with your route and stops as they are now.">
      <form class="rc-inline" onsubmit={saveScenario}>
        <input class="inp" bind:value={scName} maxlength="60" placeholder={t('e.g. 10 days with hotels')} aria-label={t('Name of the scenario')} data-scenario-name />
        <button type="submit" class="btn hi" data-scenario-save>{t('Save scenario')}</button>
      </form>
      {#if played.length}
        <div class="rc-scroll">
          <table class="rc-table" data-scenario-table>
            <thead><tr><th></th><th>{t('Now')}</th>{#each played as p (p.sc.id)}<th scope="col">{p.sc.text}</th>{/each}</tr></thead>
            <tbody>
              <tr><th scope="row">{t('Way')}</th><td>{wayName(ctx.way)}</td>{#each played as p (p.sc.id)}<td>{wayName(p.sc.way ?? 'mixed')}</td>{/each}</tr>
              <tr><th scope="row">{t('Days')}</th><td class="num">{sim?.days.length ?? '–'}</td>{#each played as p (p.sc.id)}<td class="num">{p.r?.days.length ?? '–'}</td>{/each}</tr>
              <tr><th scope="row">{t('Finish')}</th><td>{sim ? when(sim.finish) : '–'}</td>{#each played as p (p.sc.id)}<td>{p.r ? when(p.r.finish) : '–'}</td>{/each}</tr>
              <tr><th scope="row">{t('Riding a day')}</th><td class="num">{sim ? hm(sim.days.reduce((s, d) => s + d.rideH, 0) / sim.days.length) : '–'}</td>{#each played as p (p.sc.id)}<td class="num">{p.r ? hm(p.r.days.reduce((s, d) => s + d.rideH, 0) / Math.max(1, p.r.days.length)) : '–'}</td>{/each}</tr>
              <tr><th scope="row">{t('Sleep in total')}</th><td class="num">{sim ? hm(sim.sleepH) : '–'}</td>{#each played as p (p.sc.id)}<td class="num">{p.r ? hm(p.r.sleepH) : '–'}</td>{/each}</tr>
              <tr><th scope="row">{t('Costs')}</th><td class="num">{sim ? `CHF ${Math.round(sim.chf)}` : '–'}</td>{#each played as p (p.sc.id)}<td class="num">{p.r ? `CHF ${Math.round(p.r.chf)}` : '–'}</td>{/each}</tr>
              <tr><th scope="row">{t('Risks')}</th><td class="num">{sim?.risks.length ?? '–'}</td>{#each played as p (p.sc.id)}<td class="num">{p.r?.risks.length ?? '–'}</td>{/each}</tr>
              <tr><th scope="row"></th><td></td>{#each played as p (p.sc.id)}<td><button type="button" class="btn sm" onclick={() => loadScenario(p.sc)} data-scenario-load={p.sc.id}>{t('Use this one')}</button></td>{/each}</tr>
            </tbody>
          </table>
        </div>
        <h3 class="rc-h3">{t('Rename, sort or delete')}</h3>
        <EditList rows={scenarios} onchange={(list) => ctx.save({ scenarios: list })} label={t('Scenarios')} testid="scenarios" name={t('Scenario')} />
      {:else}
        <p class="rc-empty">{t('No scenario saved yet. Change the assumptions, then save.')}</p>
      {/if}
    </RaceBox>

    <RaceBox id="cases" title={t('All 40 functions')} what="Every function of the race pages with its result for this race, a button to try it and a switch to hide it." why="You see what the app can do for this race, try each one where it lives, and switch off what you do not need." from="Your race data in all parts of this page.">
      <p class="rc-note">{t('{n} of 40 with a result.', { n: filled })} {t('Switched off: {n}.', { n: offCount })}</p>
      {#if offCount || hiddenCount}<div class="rc-acts"><button type="button" class="btn sm" onclick={() => setBox('*', 'shown')} data-cases-all>{t('Show all again')}</button></div>{/if}
      {#each CASE_GROUPS as g (g.key)}
        <h3 class="rc-h3">{t(g.name)}</h3>
        <ul class="rc-cases" data-plan-cases={g.key}>
          {#each cases.filter((c) => c.part === g.key) as c (c.n)}
            {@const on = stateOf($viewQ, c.box) !== 'off'}
            <li>
              <details data-case={c.n}>
                <summary><span class="rc-case-n">{c.n}</span> <b class:rc-done={!on}>{c.title}</b>{#if c.open}{' '}<small class="rc-src">{t('open')}</small>{/if}{#if !on}{' '}<small class="rc-src">{t('off')}</small>{/if}</summary>
                <p class="rc-text">{c.text}</p>
                <div class="rc-acts">
                  <a class="btn sm" href={`${raceHref(ctx.trip.id, c.part)}?box=${c.box}`} data-case-go={c.n}>{t('Try it')}<ChevronRight size={16} aria-hidden="true" /></a>
                  {#if !c.core}<label class="rc-tick sm"><input type="checkbox" checked={on} onchange={() => setBox(c.box, on ? 'off' : 'shown')} data-case-on={c.n} />{t('On|switch')}</label>{/if}
                </div>
              </details>
            </li>
          {/each}
        </ul>
      {/each}
    </RaceBox>

    <RaceBox id="learn" title={t('Learnings to tick off')} what="Your learnings that fit this race, and your own for it, each with a tick when the plan takes care of it." why="What went wrong last time does not happen again." from="Your learnings (Rückblick) with the race name or about sleeping, hotels and tents, and the ones you add here.">
      {#if learned.length}
        <ul class="rc-list" data-plan-learned>
          {#each learned as l (l.id)}
            <li class="rc-row">
              <label class="rc-tick"><input type="checkbox" checked={ticks.has(`l:${l.id}`)} onchange={() => tick(`l:${l.id}`)} data-learn-tick={l.id} /><span class="rc-row-main"><b>{l.rule}</b>{#if l.source}<small>{l.source}</small>{/if}</span></label>
            </li>
          {/each}
        </ul>
      {/if}
      <EditList rows={stored.learnOwn ?? []} onchange={(list) => ctx.save({ learnOwn: list })} label={t('My learnings for this race')} addLabel={t('Add a learning')} placeholder={t('e.g. Book the hotels early')} testid="learn-own" name={t('Learning|race')}>
        {#snippet row(r)}<input type="checkbox" class="rc-check" checked={ticks.has(`o:${r.id}`)} onchange={() => tick(`o:${r.id}`)} aria-label={t('Done: {name}', { name: r.text })} />{/snippet}
      </EditList>
    </RaceBox>
  </div>
{/if}

{#if own}
  <RaceSheet title={own.id ? t('Change assumption') : t('My own assumption')} onsave={saveOwn} ondelete={own.id ? deleteOwn : null} onclose={() => (own = null)}>
    <label class="rc-lab">{t('Name')}<input class="inp" bind:value={own.name} maxlength="80" placeholder={t('e.g. Shower and laundry in the evening')} /></label>
    <label class="rc-lab">{t('What it does')}
      <select class="inp" bind:value={own.kind}>{#each OWN_KINDS as k (k.key)}<option value={k.key}>{t(k.name)}</option>{/each}</select>
    </label>
    {#if own.kind !== 'note'}<label class="rc-lab">{t('Value')}<input class="inp rc-num" type="number" bind:value={own.value} /></label>{/if}
  </RaceSheet>
{/if}

<style>
  /* a place or «Bivy on the way» fits as whole words; the tiles get a bit wider */
  [data-race-summary] {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  [data-race-summary] b {
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .rc-h3 {
    margin: 8px 0 0;
    font: 700 var(--fs-body) var(--font-body);
  }
  .rc-cards,
  .rc-ways {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: 8px;
  }
  .rc-card,
  .rc-way {
    display: grid;
    gap: 6px;
    align-content: start;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    font: inherit;
    text-align: left;
    min-width: 0;
  }
  .rc-way.best {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .rc-card.own {
    cursor: pointer;
  }
  .rc-card-name {
    font-weight: 600;
  }
  .rc-srcin {
    font-size: var(--fs-small);
  }
  .rc-risks {
    margin: 0;
    padding-left: 16px;
  }
  .rc-cases {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .rc-cases details {
    border-bottom: 1px solid var(--line);
    padding: 8px 0;
  }
  .rc-cases summary {
    cursor: pointer;
    min-height: 32px;
  }
  /* Klick-Rundgang 2: each case line is 44 px high to tap */
  .rc-cases summary {
    cursor: pointer;
    padding-block: 6px;
  }
  .rc-case-n {
    display: inline-block;
    min-width: 2ch;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .rc-done {
    text-decoration: line-through;
    color: var(--ink-2);
  }
  .rc-tick.sm {
    width: auto;
    align-items: center;
  }
  .rc-tick {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    width: 100%;
  }
  .rc-tick input,
  .rc-check {
    width: 22px;
    height: 22px;
    flex: none;
    margin-top: 2px;
  }
</style>

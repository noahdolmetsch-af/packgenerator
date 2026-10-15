<script>
  /**
   * Hobby pages, package 1: Aktiv › Aktivität (mockup A, Noah 10.10.2026, H14a–H20a, H29a).
   *   #/flow/activity   the six favourite tiles (playful names, one line each), the three rings with this
   *                     week, the big milestone block over all activities, more actions suggested by
   *                     itself, recovery and fun, connections (v0.86.0: only working ones, no «Diese Seite kann»).
   * Everything is a suggestion: names, favourites, lines, suggestions and ideas can be changed, hidden or
   * removed. A tile opens the activity's editor until its own page comes (H29a).
   */
  import { ChevronUp, ChevronDown, Plus, EyeOff, X, Cloud, Activity as Pulse, CalendarDays, Sun, LineChart, Music, Lightbulb, Star, Heart, Link } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import Rows from '../../lib/flow/kit/Rows.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import WeekStrip from '../../lib/flow/kit/WeekStrip.svelte';
  import SuggestTile from '../../lib/ui/SuggestTile.svelte';
  import ChallengeSheet from '../../lib/ui/ChallengeSheet.svelte';
  import { weekDays, activeCount } from '../../lib/home/bausteine.js';
  import { CHALLENGES_KEY, suggestKey, toggleTick, tickedToday, challengesOf, newChallenge, countOf, activeFor, stepChallenges, freshDone, monthEnd } from '../../lib/challenge.js';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import RenameSheet from '../../lib/ui/RenameSheet.svelte';
  import { offerRename } from '../../lib/ui/rename.svelte.js';
  import ActTile from '../../lib/flow/hobby/ActTile.svelte';
  import RingsWeek from '../../lib/flow/hobby/RingsWeek.svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import { db } from '../../lib/db.js';
  import { hobbyQuery, seedHobby } from '../../lib/flow/data.svelte.js';
  import { actState, flowStates, rings as ringsOf } from '../../lib/flow.js';
  import { msContext, allMilestones, newStars, zurichHour } from '../../lib/flowms.js';
  import { favActs, moveFav, moveFavTo, tileLine, ringWeek, TILE_LINES, TILE_LINE_NAMES, lineOf, MAX_FAVS } from '../../lib/flowtiles.js';
  import { suggestions, openIdeas, actFromTemplate, connections, ALWAYS, HIDDEN_KEY } from '../../lib/flowsugg.js';
  import { saveStars, putSetting, putActs, deleteAct } from '../../lib/flowdb.js';
  import { tickWith, toast, actName } from '../../lib/flow/ui.svelte.js';
  import { tileName } from '../../lib/flow/hobby/words.js';
  import { localDay } from '../../lib/localday.js';
  import { withStravaRides, bikeActs } from '../../lib/kmbook.js';
  import { t, tn, lang } from '../../lib/i18n.svelte.js';
  import SortGrip from '../../lib/ui/SortGrip.svelte';
  import { sortable } from '../../lib/ui/sortable.js';

  const today = localDay();
  const q = hobbyQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedHobby(data);
  });

  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const list = $derived(ctx ? allMilestones(ctx, stored, data.tune) : []);
  // the stars reached are kept for ever (flowStars)
  $effect(() => {
    const fresh = newStars(list, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const shown = $derived(list.filter((r) => !r.off));

  /* the tiles */
  const favs = $derived(data ? favActs(data.acts) : []);
  // hobby pages 2: Kissenzeit has its own page (B1); the other tiles open the editor until theirs come (H29a)
  const hrefOf = (a) => (a.page === 'meditation' || a.id === 'meditation' ? `#/flow/act/${encodeURIComponent(a.id)}` : `#/flow/edit/${encodeURIComponent(a.id)}?from=activity`);
  const tiles = $derived(
    data
      ? favs.map((a) => ({
          state: actState(a, data.log, today, data.tripDays),
          line: tileLine(a, { log: data.log, today, tripDays: data.tripDays, ms: shown.filter((r) => r.m.actId === a.id) }),
        }))
      : [],
  );
  let editing = $state(false);
  const others = $derived((data?.acts ?? []).filter((a) => !a.fav && !a.paused));
  async function moveTile(a, dir) {
    const out = moveFav(favs, a.id, dir);
    if (out.length) await putActs(db, out);
  }
  async function dropTile(from, to) {
    const out = moveFavTo(favs, favs[from].id, to);
    if (out.length) await putActs(db, out);
  }
  const setLine = (a, v) => putActs(db, [{ ...a, tileLine: v }]);
  const unfav = (a) => putActs(db, [{ ...a, fav: false }]);
  const addFav = (a) => putActs(db, [{ ...a, fav: true, favOrder: favs.length }]);

  /* rename: the playful name (an empty name goes back to the activity's own name) */
  let renaming = $state(null);
  async function rename(nm) {
    const a = renaming;
    const before = { nick: a.nick, nickDe: a.nickDe };
    const next = { ...a, nick: nm || null, nickDe: null };
    await putActs(db, [next]);
    offerRename(nm || actName(a), async () => {
      const live = data.acts.find((x) => x.id === a.id) ?? next;
      await putActs(db, [{ ...live, ...before }]);
    });
  }

  /* the rings */
  const rings = $derived(ringsOf(states, data?.log ?? [], today));
  const week = $derived(data ? ringWeek(data.acts, data.log, today) : []);
  const ringNames = $derived(Object.fromEntries(['mind', 'move', 'rest'].map((r) => [r, states.filter((s) => s.act.ring === r && !s.resting).map((s) => tileName(s.act))])));


  /* more actions, suggested by itself (H18a) */
  const sugg = $derived(data ? suggestions({ acts: data.acts, log: data.log, today, hour: zurichHour(new Date().toISOString()) ?? 12, dry: data.weather ? data.weather.rain === 'none' : null, rings, favs: favs.map((a) => a.id), hidden: data.hidden, tripDays: data.tripDays }) : []);
  const suggName = (s) => (s.act ? tileName(s.act) : lang.v === 'de' ? s.tpl.nameDe : s.tpl.name);
  async function doSugg(s) {
    let a = s.act;
    if (!a) {
      a = actFromTemplate(s.tpl, data.acts);
      await putActs(db, [a]);
    }
    await tickWith(a, { day: today });
  }
  const hide = (s) => putSetting(db, HIDDEN_KEY, [...data.hidden, s.id]);
  const unhide = () => putSetting(db, HIDDEN_KEY, null);

  /* recovery and fun (H19a) */
  const always = $derived((data?.acts ?? []).filter((a) => !a.paused && (ALWAYS.includes(a.id) || a.fromIdea)));
  const ideas = $derived(openIdeas(data?.acts ?? []));
  const ideaName = (i) => (lang.v === 'de' ? i.nameDe : i.name);
  async function addIdea(i) {
    const a = actFromTemplate(i, data.acts);
    await putActs(db, [a]);
    toast(t('{name} added', { name: ideaName(i) }), () => deleteAct(db, a.id));
  }
  const tickAct = (a) => tickWith(a, { day: today });

  /* connections (H20a); v0.86.0 «Meditation einfach» (Noah «1-5 a»): only what works today, no grey «geplant» rows */
  const conns = $derived(connections(data?.weather ?? null).filter((c) => c.state === 'active' || c.state === 'setup'));
  const ICON = { strava: Pulse, fitbit: Pulse, ics: CalendarDays, weather: Sun, intervals: LineChart, media: Music };
  const STATE = { planned: 'planned', active: 'active', later: 'later', setup: 'not set up' };


  /* v0.105.0 Design-Refresh P8 «Aktiv» (A7): this week (B18), «Vorschlag für heute» as a suggestion tile
     with alternatives and a challenge (Noah «d1-d5 freigeben»: any suggestion can become a challenge),
     the rest folded under «Mehr» */
  // v0.121.0 (Noah «1a»): the counted Strava rides count too
  const kmBookQ = liveQuery(() => db.kmBook.toArray());
  const actQ = liveQuery(() => bikeActs(db));
  const weekStrip = $derived(data ? weekDays({ today, log: data.log, rides: withStravaRides(data.rides, $kmBookQ ?? [], $actQ ?? []) }) : []);
  const SG_KEY = suggestKey('aktiv');
  const sgQ = liveQuery(async () => {
    const [s, c] = await Promise.all([db.settings.get(SG_KEY), db.settings.get(CHALLENGES_KEY)]);
    return { s: s?.value ?? null, list: challengesOf(c?.value) };
  });
  const sgOf = (v = {}) => ({
    pick: typeof v.pick === 'string' ? v.pick : null,
    own: Array.isArray(v.own) ? v.own.filter((x) => typeof x === 'string' && x.trim()) : [],
    ticks: v.ticks && typeof v.ticks === 'object' ? v.ticks : {},
  });
  const sg = $derived(sgOf($sgQ?.s ?? {}));
  // the chosen one and the running challenges stay among the options once ticked (the suggestion itself
  // then drops out of the list, being done today)
  const sgKeep = $derived([sg.pick, ...($sgQ?.list ?? []).filter((c) => c.area === 'aktiv' && !c.stopped && !c.doneOn).map((c) => c.what)].filter(Boolean));
  const sgOptions = $derived([...new Set([...sugg.slice(0, 4).map(suggName), ...sg.own, ...sgKeep])]);
  const sgPick = $derived(sgOptions.includes(sg.pick) ? sg.pick : (sgOptions[0] ?? null));
  const sgSugg = $derived(sugg.find((s) => suggName(s) === sgPick) ?? null);
  const sgReason = $derived(sgSugg ? `${t('suggested:')} ${t(sgSugg.key, sgSugg.vars)}` : '');
  const sgDone = $derived(!!sgPick && tickedToday(sg, sgPick, today));
  const clist = $derived($sgQ?.list ?? []);
  const running = $derived(sgPick ? activeFor(clist, sgPick, today, 'aktiv') : null);
  const challenge = $derived(running ? { ...running, n: countOf(running, sg) } : null);
  const reached = $derived(freshDone(clist, today).find((c) => c.area === 'aktiv' && c.what === sgPick) ?? null);
  let sheet = $state(false);
  const saveSg = (next) => putSetting(db, SG_KEY, next);
  function addOwnSg(name) {
    const n = String(name ?? '').trim().slice(0, 40);
    if (n) saveSg({ ...sg, own: [...new Set([...sg.own, n])].slice(0, 8), pick: n });
  }
  // 0.133.0 (fix 14.10.): one tap at a time, toggled on the saved record (the live query lags behind,
  // so a quick double tap ticked twice and the next tap could not take it back)
  let sgTicking = false;
  async function tickSg() {
    if (sgTicking) return;
    sgTicking = true;
    try {
      const cur = sgOf((await db.settings.get(SG_KEY))?.value ?? {});
      const was = !!sgPick && tickedToday(cur, sgPick, today);
      const next = { ...toggleTick(cur, sgPick, today), pick: sgPick };
      await saveSg(next);
      // the suggestion of an activity is ticked there too (once); an own one only counts here
      if (!was && sgSugg) await doSugg(sgSugg);
      const r = stepChallenges(clist, { aktiv: next }, today);
      if (r.reached.length) await putSetting(db, CHALLENGES_KEY, r.list);
    } finally {
      sgTicking = false;
    }
  }
  async function saveChallenge({ times, until }) {
    const next = running ? clist.map((c) => (c.id === running.id ? { ...c, times, until } : c)) : [...clist, newChallenge({ area: 'aktiv', what: sgPick, times, until, today })];
    await putSetting(db, CHALLENGES_KEY, stepChallenges(next, { aktiv: sg }, today).list);
  }
  const stopChallenge = () => putSetting(db, CHALLENGES_KEY, clist.map((c) => (c.id === running?.id ? { ...c, stopped: true } : c)));

  let openRow = $state(null);
  const toggle = (k) => (openRow = openRow === k ? null : k);
  const soonN = $derived(shown.filter((r) => r.soon).length);
  const moreRows = $derived([
    { key: 'ms', icon: Star, title: t('Milestones'), sub: soonN ? tn(soonN, '{n} soon within reach', '{n} soon within reach') : t('over all activities'), href: '#/flow/milestones' },
    { key: 'rings', icon: Pulse, title: t('Three rings'), sub: [t('Move|ring'), t('Mindful|ring'), t('Recovery|ring')].join(', '), onclick: () => toggle('rings'), expanded: openRow === 'rings' },
    { key: 'sugg', icon: Lightbulb, title: t('More actions without their own page'), sub: tn(sugg.length, '{n} suggestion', '{n} suggestions'), onclick: () => toggle('sugg'), expanded: openRow === 'sugg' },
    { key: 'fun', icon: Heart, title: t('Recovery and fun'), sub: always.map((a) => actName(a)).slice(0, 3).join(', '), onclick: () => toggle('fun'), expanded: openRow === 'fun' },
    ...(conns.length ? [{ key: 'conn', icon: Link, title: t('Connections'), sub: conns.map((c) => (c.id === 'ics' || c.id === 'weather' ? t(c.name) : c.name)).join(', '), onclick: () => toggle('conn'), expanded: openRow === 'conn' }] : []),
  ]);
</script>

<div class="hob">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Activity|tab')} />
    <PageHead title={t('Activity|tab')} text={t('Over all activities · each tile shows one line instead of a date')} />
  </header>

  {#if data}
    <div class="lay">
      <div class="col">
        <Sec id="tiles-h" title={t('Your tiles')} sub={t('Tap opens · line: milestone, history, week, nudge, streak or best')} more={{ label: editing ? t('Done') : t('Change tiles'), onclick: () => (editing = !editing), expanded: editing }}>
          {#if editing}
            <section class="card ted" aria-labelledby="tiles-ed-h">
              <h3 id="tiles-ed-h" class="sh">{t('Tiles: order, line, favourites')}</h3>
              <ul class="ed" use:sortable={{ onmove: dropTile }}>
                {#each favs as a, i (a.id)}
                  <li data-sort-id={a.id}>
                    <SortGrip name={tileName(a)} onstep={(dir) => moveTile(a, dir)} />
                    <span class="en"><b>{tileName(a)}</b><small>{actName(a)} · <button type="button" class="lnk" onclick={() => (renaming = a)} aria-label={t('Rename {name}', { name: tileName(a) })}>{t('rename')}</button></small></span>
                    <label class="el"><span class="sr">{t('Line on {name}', { name: tileName(a) })}</span>
                      <select class="sel" value={lineOf(a)} onchange={(e) => setLine(a, e.currentTarget.value)}>
                        {#each TILE_LINES as k (k)}<option value={k}>{t(TILE_LINE_NAMES[k])}</option>{/each}
                      </select>
                    </label>
                    <button type="button" class="ib" disabled={i === 0} aria-label={t('Move {name} up', { name: tileName(a) })} onclick={() => moveTile(a, -1)}><ChevronUp size={18} aria-hidden="true" /></button>
                    <button type="button" class="ib" disabled={i === favs.length - 1} aria-label={t('Move {name} down', { name: tileName(a) })} onclick={() => moveTile(a, 1)}><ChevronDown size={18} aria-hidden="true" /></button>
                    <button type="button" class="ib" aria-label={t('Remove {name} from the tiles', { name: tileName(a) })} onclick={() => unfav(a)}><X size={18} aria-hidden="true" /></button>
                  </li>
                {/each}
              </ul>
              {#if favs.length < MAX_FAVS && others.length}
                <p class="hint">{t('Add as a tile:')}</p>
                <div class="chips">{#each others as a (a.id)}<button type="button" class="chip" onclick={() => addFav(a)}><Plus size={16} aria-hidden="true" />{tileName(a)}</button>{/each}</div>
              {/if}
            </section>
          {/if}
          <div class="tiles">
            {#each tiles as x (x.state.act.id)}<ActTile state={x.state} line={x.line} href={hrefOf(x.state.act)} />{/each}
            <a class="addt" href="#/flow/new"><Plus size={20} aria-hidden="true" /><span>{t('Activity')}</span></a>
          </div>
          <p class="hint">{t('The names are playful suggestions, renamable any time.')}<Sugg /></p>
        </Sec>

        <Sec id="week-h" title={t('This week')} sub={t('Monday to Sunday · today framed')}>
          <div class="card"><WeekStrip days={weekStrip} acts={data.acts} {today} label={t('This week: {n} active days', { n: activeCount(weekStrip) })} /></div>
        </Sec>
      </div>

      <aside class="col">
        {#if sugg.length || sg.own.length}
          <Sec id="sg-h" title={t('Suggestion for today')} sub={t('by day, weather and rings')}>
            <SuggestTile icon={Lightbulb} id="sg-aktiv" title={sgPick ?? ''} sub={sgReason} options={sgOptions} pick={sgPick} done={sgDone} {challenge} {reached} onpick={(o) => saveSg({ ...sg, pick: o })} onadd={addOwnSg} ontick={tickSg} onchallenge={() => (sheet = true)} />
          </Sec>
        {/if}
        <Sec id="more-h" title={t('More|item')}>
          <Rows rows={moreRows} open={moreOpen} />
        </Sec>
      </aside>
    </div>
  {/if}
</div>

{#snippet moreOpen(r)}
  {#if r.key === 'rings'}
    <RingsWeek {rings} {week} names={ringNames} />
  {:else if r.key === 'sugg'}
    <ul class="sugg">
      {#each sugg as s (s.id)}
        {@const ring = s.act?.ring ?? s.tpl?.ring}
        <li data-sugg={s.id}>
          <span class="dot {ring}" aria-hidden="true"></span>
          <span class="sn"><b>{suggName(s)}</b>{#if s.min}<span class="sm">{s.id === 'cold' ? t('1 tip') : t('{n} min', { n: s.min })}</span>{/if}<small>{t('suggested:')} {t(s.key, s.vars)}</small></span>
          <button type="button" class="ib" aria-label={t('Hide {name}', { name: suggName(s) })} onclick={() => hide(s)}><EyeOff size={18} aria-hidden="true" /></button>
          <button type="button" class="ib plus" aria-label={t('Tick {name}', { name: suggName(s) })} onclick={() => doSugg(s)}><Plus size={20} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    {#if !sugg.length}<p class="hint">{t('No suggestion right now.')}</p>{/if}
    <p class="hint">{t('Suggested by itself by day, weather and rings.')}<Sugg />{#if data.hidden.length}{' · '}<button type="button" class="lnk" onclick={unhide}>{tn(data.hidden.length, 'show {n} hidden again', 'show {n} hidden again')}</button>{/if}</p>
  {:else if r.key === 'fun'}
    <p class="cap">{t('Always there')}</p>
    <div class="chips">{#each always as a (a.id)}<button type="button" class="chip" data-always={a.id} aria-label={t('Tick {name}', { name: tileName(a) })} onclick={() => tickAct(a)}><Plus size={16} aria-hidden="true" />{actName(a)}{#if tileName(a) !== actName(a)}{' '}«{tileName(a)}»{/if}</button>{/each}</div>
    {#if ideas.length}
      <p class="cap">{t('More ideas, tap to add')}<Sugg /></p>
      <div class="chips">{#each ideas as i (i.id)}<button type="button" class="chip idea" data-idea={i.id} onclick={() => addIdea(i)}><Plus size={16} aria-hidden="true" />{ideaName(i)}</button>{/each}</div>
    {/if}
  {:else if r.key === 'conn'}
    <ul class="conn">
      {#each conns as c (c.id)}
        {@const Icon = ICON[c.id] ?? Cloud}
        <li class:on={c.state === 'active'} data-conn={c.id}>
          <span class="ch"><Icon size={18} aria-hidden="true" /><b>{c.id === 'ics' || c.id === 'weather' ? t(c.name) : c.name}</b><span class="pill st {c.state}">{t(STATE[c.state])}</span></span>
          <small>{t(c.key, c.vars)}{#if c.href}{' '}<a href={c.href}>{t('Me|place')}</a>{/if}</small>
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<ChallengeSheet bind:open={sheet} what={sgPick ?? ''} times={running?.times ?? 10} until={running?.until ?? monthEnd(today)} min={today} running={!!running} onsave={saveChallenge} onstop={stopChallenge} />

{#if renaming}
  <RenameSheet kicker={actName(renaming)} title={t('Rename tile')} value={tileName(renaming)} max={40} hint={t('Only the name on the tile. The activity, its goal and history stay.')} empty={t('Empty: the activity’s own name')} onsave={rename} onclose={() => (renaming = null)} />
{/if}

<style>
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A7): two columns as on Aktiv, white cards, the rest folded */
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .ted {
    margin-bottom: var(--sp-3);
  }
  .sh {
    margin: 0 0 10px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 899px) {
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
  }
  .addt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 110px;
    border: 1.5px dashed var(--line-strong);
    border-radius: var(--radius-card);
    color: var(--ink-2);
    text-decoration: none;
    font-weight: 500;
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tiles + .hint {
    margin-top: var(--sp-2);
  }
  .cap {
    margin: 0 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cap + .chips + .cap,
  .chips + .cap {
    margin-top: 14px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small)/1.3 var(--font-body);
    cursor: pointer;
  }
  .chip.idea {
    border-color: var(--line);
    color: var(--ink-2);
  }
  .ed {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ed li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .ed li:first-child {
    border-top: 0;
  }
  .en {
    flex: 1 1 160px;
    min-width: 0;
    line-height: 1.3;
  }
  .en b {
    display: block;
    font-weight: 600;
  }
  .en small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .el select {
    min-height: 44px;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ib.plus {
    color: var(--ink);
    border-color: var(--line-strong);
  }
  .sugg {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (max-width: 719px) {
    .sugg {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sugg li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 10px 12px 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .dot.move {
    background: var(--hi);
  }
  .dot.mind {
    background: var(--accent);
  }
  .dot.rest {
    background: var(--l3);
  }
  .sn {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .sn b {
    font-weight: 600;
  }
  .sm {
    margin-left: 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sn small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lnk {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .lnk::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 44px;
    transform: translateY(-50%);
  }
  .conn {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (max-width: 899px) {
    .conn {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .conn li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .ch {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
  }
  .ch b {
    flex: 1 1 auto;
    font-weight: 600;
  }
  .st.active {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .st.later,
  .st.planned,
  .st.setup {
    color: var(--ink-3);
  }
  .conn small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .conn li:not(.on) small {
    color: var(--ink-3);
  }
  .conn a {
    color: var(--accent);
  }
</style>

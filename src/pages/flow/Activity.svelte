<script>
  /**
   * Hobby pages, package 1: Aktiv › Aktivität (mockup A, Noah 10.10.2026, H14a–H20a, H29a).
   *   #/flow/activity   the six favourite tiles (playful names, one line each), the three rings with this
   *                     week, the big milestone block over all activities, more actions suggested by
   *                     itself, recovery and fun, connections, «Diese Seite kann».
   * Everything is a suggestion: names, favourites, lines, suggestions and ideas can be changed, hidden or
   * removed. A tile opens the activity's editor until its own page comes (H29a).
   */
  import { ChevronLeft, ChevronUp, ChevronDown, Plus, EyeOff, X, Cloud, Activity as Pulse, CalendarDays, Sun, LineChart, Music } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import RenameSheet from '../../lib/ui/RenameSheet.svelte';
  import { offerRename } from '../../lib/ui/rename.svelte.js';
  import ActTile from '../../lib/flow/hobby/ActTile.svelte';
  import RingsWeek from '../../lib/flow/hobby/RingsWeek.svelte';
  import MsBlock from '../../lib/flow/hobby/MsBlock.svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import CanDo from '../../lib/flow/hobby/CanDo.svelte';
  import { db } from '../../lib/db.js';
  import { hobbyQuery, seedHobby } from '../../lib/flow/data.svelte.js';
  import { actState, flowStates, rings as ringsOf } from '../../lib/flow.js';
  import { msContext, allMilestones, newStars, records as recordsOf, zurichHour, REWARD_KEY } from '../../lib/flowms.js';
  import { favActs, moveFav, tileLine, ringWeek, TILE_LINES, TILE_LINE_NAMES, lineOf, MAX_FAVS } from '../../lib/flowtiles.js';
  import { suggestions, openIdeas, actFromTemplate, connections, ALWAYS, HIDDEN_KEY } from '../../lib/flowsugg.js';
  import { saveStars, putSetting, putActs, deleteAct } from '../../lib/flowdb.js';
  import { tickWith, toast, actName } from '../../lib/flow/ui.svelte.js';
  import { tileName } from '../../lib/flow/hobby/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, lang } from '../../lib/i18n.svelte.js';

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
  const cross = $derived(shown.filter((r) => !r.m.actId));
  const allCross = $derived(cross.slice().sort((a, b) => b.progress - a.progress));

  /* the tiles */
  const favs = $derived(data ? favActs(data.acts) : []);
  const hrefOf = (a) => `#/flow/edit/${encodeURIComponent(a.id)}?from=activity`;
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

  /* the records and the reward */
  const recs = $derived(ctx ? recordsOf(ctx, data.rides) : []);
  const saveReward = (v) => putSetting(db, REWARD_KEY, v);

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

  /* connections (H20a) */
  const conns = $derived(connections(data?.weather ?? null));
  const ICON = { strava: Pulse, fitbit: Pulse, ics: CalendarDays, weather: Sun, intervals: LineChart, media: Music };
  const STATE = { planned: 'planned', active: 'active', later: 'later', setup: 'not set up' };

  const CAN = [
    'six favourite activities as tiles, each with its own name',
    'one useful line per tile instead of a date',
    'three rings Mindful · Move · Recover with this week',
    'milestones over all activities, with «soon» and «recently»',
    'a reward from the wishlist on a star',
    'more actions suggested by itself, ticked with one tap',
    'recovery and fun: sauna, walk and more ideas',
    'connections: weather now, Strava, Fitbit and calendar planned',
  ];
</script>

<div class="hob">
  <p class="back"><a href="#/flow"><ChevronLeft size={16} aria-hidden="true" />{t('In the flow')}</a></p>
  <PageHead title={t('Activity|tab')} />

  {#if data}
    <div class="intro">
      <p>{tn(favs.length, 'Your favourite activity.', 'Your {n} favourite activities.')} {t('The names are playful suggestions, renamable any time.')}<Sugg /></p>
      <button type="button" class="btn ibtn" aria-expanded={editing} onclick={() => (editing = !editing)}>{editing ? t('Done') : t('Change tiles')}</button>
    </div>

    {#if editing}
      <section class="surf pad" aria-labelledby="tiles-ed-h">
        <h2 id="tiles-ed-h" class="sh">{t('Tiles: order, line, favourites')}</h2>
        <ul class="ed">
          {#each favs as a, i (a.id)}
            <li>
              <span class="en"><b>{tileName(a)}</b><small>{actName(a)}</small></span>
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
      {#each tiles as x (x.state.act.id)}<ActTile state={x.state} line={x.line} href={hrefOf(x.state.act)} onrename={(a) => (renaming = a)} />{/each}
      <a class="addt" href="#/flow/new"><Plus size={20} aria-hidden="true" /><span>{t('Activity')}</span></a>
    </div>
    <p class="hint">{t('Instead of a date each tile shows one line: milestone, history, week, nudge, streak or best.')}<Sugg /></p>

    <h2 class="zlabel hs">{t('Three rings')}</h2>
    <section class="surf pad"><RingsWeek {rings} {week} names={ringNames} /></section>

    <h2 class="zlabel hs">{t('Milestones')} <span class="hsub">· {t('over all activities')}</span></h2>
    <MsBlock list={cross} all={allCross.slice(0, 3)} allMore={{ href: '#/flow/milestones', label: tn(cross.length, 'the {n} and those per activity ›', 'all {n} and those per activity ›') }} records={recs} reward={data.reward} wishlist={data.wishlist} onreward={saveReward} {today} tuneHref="#/flow/milestones?tune=1" />

    <h2 class="zlabel hs">{t('More actions without their own page')}</h2>
    {#if sugg.length}
      <ul class="sugg">
        {#each sugg as s (s.id)}
          {@const ring = s.act?.ring ?? s.tpl?.ring}
          <li data-sugg={s.id}>
            <span class="dot {ring}" aria-hidden="true"></span>
            <span class="sn"><b>{suggName(s)}</b>{#if s.min}<span class="sm">{s.id === 'cold' ? t('1 tip') : `${s.min} min`}</span>{/if}<small>{t('suggested:')} {t(s.key, s.vars)}</small></span>
            <button type="button" class="ib" aria-label={t('Hide {name}', { name: suggName(s) })} onclick={() => hide(s)}><EyeOff size={18} aria-hidden="true" /></button>
            <button type="button" class="ib plus" aria-label={t('Tick {name}', { name: suggName(s) })} onclick={() => doSugg(s)}><Plus size={20} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="hint">{t('No suggestion right now.')}</p>
    {/if}
    <p class="hint">{t('Suggested by itself by day, weather and rings.')}<Sugg />{#if data.hidden.length}{' · '}<button type="button" class="lnk" onclick={unhide}>{tn(data.hidden.length, 'show {n} hidden again', 'show {n} hidden again')}</button>{/if}</p>

    <h2 class="zlabel hs">{t('Recovery and fun')}</h2>
    <section class="surf pad">
      <p class="cap">{t('Always there')}</p>
      <div class="chips">{#each always as a (a.id)}<button type="button" class="chip" data-always={a.id} aria-label={t('Tick {name}', { name: tileName(a) })} onclick={() => tickAct(a)}><Plus size={16} aria-hidden="true" />{actName(a)}{#if tileName(a) !== actName(a)}{' '}«{tileName(a)}»{/if}</button>{/each}</div>
      {#if ideas.length}
        <p class="cap">{t('More ideas, tap to add')}<Sugg /></p>
        <div class="chips">{#each ideas as i (i.id)}<button type="button" class="chip idea" data-idea={i.id} onclick={() => addIdea(i)}><Plus size={16} aria-hidden="true" />{ideaName(i)}</button>{/each}</div>
      {/if}
    </section>

    <h2 class="zlabel hs">{t('Connections')}<Sugg /></h2>
    <ul class="conn">
      {#each conns as c (c.id)}
        {@const Icon = ICON[c.id] ?? Cloud}
        <li class:on={c.state === 'active'} data-conn={c.id}>
          <span class="ch"><Icon size={18} aria-hidden="true" /><b>{c.id === 'ics' || c.id === 'weather' ? t(c.name) : c.name}</b><span class="pill st {c.state}">{t(STATE[c.state])}</span></span>
          <small>{t(c.key, c.vars)}{#if c.href}{' '}<a href={c.href}>{t('Me|place')}</a>{/if}</small>
        </li>
      {/each}
    </ul>

    <CanDo items={CAN} />
  {/if}
</div>

{#if renaming}
  <RenameSheet kicker={actName(renaming)} title={t('Rename tile')} value={tileName(renaming)} max={40} hint={t('Only the name on the tile. The activity, its goal and history stay.')} empty={t('Empty: the activity’s own name')} onsave={rename} onclose={() => (renaming = null)} />
{/if}

<style>
  .hob {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .intro {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 16px;
  }
  .intro p {
    flex: 1 1 320px;
    margin: 0;
    color: var(--ink-2);
  }
  .ibtn {
    min-height: 44px;
    border-radius: 10px;
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  @media (min-width: 720px) {
    .pad {
      padding: 20px 24px;
    }
  }
  .sh {
    margin: 0 0 10px;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .hs {
    margin: 18px 0 0;
    color: var(--pc);
  }
  .hsub {
    color: var(--ink-3);
    font-weight: 500;
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

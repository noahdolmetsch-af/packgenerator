<script>
  /**
   * «Meine Sportarten» (Noah 22.10.2026, spec «Aktiv-Bereich: Beschreibung», Runde 2 «4a»): «Ziele», «Aktivität»
   * and «Sportarten» are one list. Every sport with its symbol, its goal («3× in 7 Tagen»), the dots of the last
   * 7 days and its state («im Soll», «heute offen»); a tap opens the sport's own page (Sport.svelte; Meditation
   * keeps its page with the timer, Runde 3 «1b»). The order (arrows and drag) is the order of «Heute abhaken».
   * «Neue Sportart» on top; rename, hide and delete (with Undo) in the editor, as before.
   * Below: the season (was Aktiv › Mehr › Saison), the sports of trips, deleted sports to restore, the year
   * goals and the mosaic of all sports (was the top of #/flow/sports). Addresses #/flow/sports, …/goals and
   * …/activity all show this page.
   */
  import { Search, Plus, Lightbulb, ChevronRight, Pencil, EyeOff, Pause, Play, Trash, ChevronUp, ChevronDown, ArrowUpToLine, ArrowDownToLine } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../../lib/db.js';
  import { flowQuery, seedIfNeeded } from '../../lib/flow/data.svelte.js';
  import { flowStates, lastDays, halfOf, halfEnds, halfSince, moveAct, gridRow, activeGoals } from '../../lib/flow.js';
  import { saveOrder, saveAct, removeAct, undoAct } from '../../lib/flowdb.js';
  import { askDelete, deleteWithUndo } from '../../lib/ui/ask.js';
  import RenameSheet from '../../lib/ui/RenameSheet.svelte';
  import { OVERRIDES_KEY, listFor } from '../../lib/standard.js';
  import { saveList, edit, addOwn, remove, toggleHidden } from '../../lib/lists.js';
  import RowMenu from '../../lib/ui/RowMenu.svelte';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { actGoalText, goalsText, dayShort } from '../../lib/flow/words.js';
  import { seasonNow } from '../../lib/flow/aktiv.js';
  import { similarNames } from '../../lib/flow/similar.js';
  import { GROUPS_KEY, addGroup, renameGroup, toggleCollapsed, moveGroup, removeGroup, sections, filterActs } from '../../lib/flow/sportgroups.js';
  import GroupDeleteSheet from '../../lib/ui/GroupDeleteSheet.svelte';
  import { isMedAct } from '../../lib/flow/hobby/medstart.js';
  import ActIcon from '../../lib/flow/ActIcon.svelte';
  import GoneActs from '../../lib/flow/GoneActs.svelte';
  import YearGoals from '../../lib/flow/YearGoals.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import SortArrows from '../../lib/ui/SortArrows.svelte';
  import SortGrip from '../../lib/ui/SortGrip.svelte';
  import { sortable } from '../../lib/ui/sortable.js';
  import { saveCfg } from '../../lib/sportsdb.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import AreaIntro from '../../lib/intro/AreaIntro.svelte';
  import SportsMosaic from '../../lib/sportpage/SportsMosaic.svelte';
  import { DOMAINS } from '../../lib/domains.js';
  import { allSports, orderedSports, moveId } from '../../lib/sportsbase.js';
  import { sportDays, goalOf } from '../../lib/sportshelp.js';
  import { sportCfg } from '../../lib/sportsbase.js';
  import { stravaOf } from '../../lib/sportsprogress.js';
  import { sportsQuery } from '../../lib/sportpage/data.js';
  import { sportName } from '../../lib/sportpage/words.js';
  import { sportHref } from '../../lib/flow/mysports.js';
  import { localDay } from '../../lib/localday.js';
  import { offerDone, offerRename } from '../../lib/ui/rename.svelte.js';
  import { t, tn } from '../../lib/i18n.svelte.js';
  import QuickLinks from '../../lib/ui/QuickLinks.svelte';
  import NextGoalRow from '../../lib/flow/NextGoalRow.svelte';
  import '../../lib/sportpage/sport.css';

  const today = localDay();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const stateOf = $derived(new Map(states.map((s) => [s.act.id, s])));
  const week = lastDays(today, 7);
  const all = $derived(data?.acts ?? []);
  const season = $derived(data ? seasonNow(data.acts, today) : null);
  const seasonal = $derived(states.filter((s) => s.act.season));

  /* the sports of trips (Paket O) and the mosaic over all sports */
  const sq = sportsQuery();
  const sdata = $derived($sq);
  const cfg = $derived(sdata?.cfg ?? {});
  // the lists of Ich › Listen (names, hidden, own sports) change DOMAINS; a change of the setting redraws the sports
  const ovQ = liveQuery(() => db.settings.get(OVERRIDES_KEY));
  const sports = $derived(sdata && ($ovQ, true) ? orderedSports(allSports({ domains: DOMAINS, acts: sdata.acts }), cfg) : []);
  const tripSports = $derived(sports.filter((s) => s.kind === 'trip'));
  // the sports of trips keep their own order (arrows and drag), as on the old page «Sportarten»
  async function moveTrip(id, to) {
    const ids = sports.map((s) => s.id);
    const target = sports.indexOf(tripSports[Math.max(0, Math.min(tripSports.length - 1, to))]);
    await saveCfg({ ...cfg, _order: moveId(ids, id, target) });
  }
  const tripStep = (s, dir) => moveTrip(s.id, tripSports.indexOf(s) + dir);
  const tripDragged = (from, to) => moveTrip(tripSports[from].id, to);
  const rows = $derived(
    sdata
      ? sports.map((s) => {
          const dayMap = sportDays(s, { log: sdata.log, trips: sdata.trips, values: sdata.items, strava: stravaOf(sdata.activities, s.id), today });
          return { sport: s, dayMap, goal: goalOf(s, sportCfg(cfg, s.id).goal, s.act ? activeGoals(s.act, today) : []) };
        })
      : [],
  );

  /* the order: one grip to drag (always there), arrows only in «Sort» mode (Noah 02.11.2026 «1a»); the same order as «Heute abhaken» */
  async function move(id, to) {
    const before = moveAct(all, id, all.findIndex((x) => x.id === id)); // the order as it is now, to undo
    const a = all.find((x) => x.id === id);
    await saveOrder(db, moveAct(all, id, to));
    offerDone(t('«{name}» moved to place {n}.', { name: actName(a), n: Math.max(1, Math.min(all.length, to + 1)) }), () => saveOrder(db, before));
  }
  // paused and resting sports wait in their own folded block (Noah 02.11.2026 «4a»); the order below counts them in
  const isOff = (a) => !!a.paused || !!stateOf.get(a.id)?.resting;
  const active = $derived(all.filter((a) => !isOff(a)));
  const off = $derived(all.filter(isOff));
  // a place among the shown sports of one section → the place in the whole list
  const moveIn = (list, a, to) => {
    const k = Math.max(0, Math.min(list.length - 1, to));
    return move(a.id, all.findIndex((x) => x.id === list[k].id));
  };
  const stepIn = (list, a, dir) => moveIn(list, a, list.findIndex((x) => x.id === a.id) + dir);

  /* groups, search and filter (Noah 02.11.2026 «3a»): own groups of sports, folded or open; the order of «Tick off today» stays one list */
  const grpQ = liveQuery(() => db.settings.get(GROUPS_KEY));
  const groups = $derived($grpQ?.value ?? []);
  let find = $state('');
  let openOnly = $state(false);
  const filtering = $derived(!!find.trim() || openOnly);
  const shownActive = $derived(filterActs(active, { q: find, open: openOnly }, actName, (id) => {
    const st = stateOf.get(id);
    return st ? { open: goalPill(st).key === 'today' } : null;
  }));
  const secs = $derived(sections(shownActive, groups).filter((x) => !filtering || x.acts.length));
  const saveGroups = (next) => db.settings.put({ key: GROUPS_KEY, value: JSON.parse(JSON.stringify(next)) });
  let groupSheet = $state(null); // { mode: 'new' | 'rename', group? }
  let groupDeleting = $state(null);
  async function groupSaved(nm) {
    const before = groups;
    if (groupSheet?.mode === 'rename') {
      await saveGroups(renameGroup(groups, groupSheet.group.id, nm));
      offerRename(nm, () => saveGroups(before));
    } else {
      await saveGroups(addGroup(groups, nm));
      offerDone(t('Group «{name}» added.', { name: nm }), () => saveGroups(before));
    }
  }
  async function setGroup(a, id) {
    const before = a.group ?? null;
    const put = (g) => saveAct(db, (({ group: _g, ...rest }) => (g ? { ...rest, group: g } : rest))($state.snapshot(a)));
    await put(id);
    offerDone(t('«{name}» moved to «{group}».', { name: actName(a), group: id ? groups.find((g) => g.id === id)?.name : t('No group') }), () => put(before));
  }
  /* a sport dragged onto the title of a group (or of «No group») goes there */
  function dropInto(a, gid) {
    const to = gid === 'none' ? null : gid;
    if (a && (a.group ?? null) !== to) setGroup(a, to);
  }
  async function deleteGroup(g, to) {
    const before = groups;
    const members = all.filter((a) => a.group === g.id);
    const put = (a, id) => saveAct(db, (({ group: _g, ...rest }) => (id ? { ...rest, group: id } : rest))($state.snapshot(a)));
    for (const a of members) await put(a, to);
    await saveGroups(removeGroup(groups, g.id));
    offerDone(t('Group «{name}» deleted.', { name: g.name }), async () => {
      await saveGroups(before);
      for (const a of members) await put(a, g.id);
    });
  }
  const groupMenu = (g, i) => [
    { key: 'rename', label: t('Rename'), icon: Pencil, onclick: () => (groupSheet = { mode: 'rename', group: g }) },
    { key: 'up', label: t('Move up'), icon: ChevronUp, disabled: i === 0, sep: true, onclick: () => saveGroups(moveGroup(groups, g.id, -1)) },
    { key: 'down', label: t('Move down'), icon: ChevronDown, disabled: i >= groups.length - 1, onclick: () => saveGroups(moveGroup(groups, g.id, 1)) },
    { key: 'delete', label: t('Delete …'), icon: Trash, danger: true, sep: true, onclick: () => (groupDeleting = g) },
  ];
  /* sports with the same name (Noah 02.11.2026 «4a»): a hint, nothing is changed by itself */
  const SIMILAR_KEY = 'flow.similarOk';
  const okQ = liveQuery(() => db.settings.get(SIMILAR_KEY));
  const similar = $derived(similarNames(all.map((a) => ({ id: a.id, name: actName(a) })), $okQ?.value ?? []));
  async function similarOk(key) {
    const now = (await db.settings.get(SIMILAR_KEY))?.value ?? [];
    await db.settings.put({ key: SIMILAR_KEY, value: [...new Set([...now, key])] });
  }
  let reorder = $state(false);

  /* the menu «⋯» of a row (Noah 02.11.2026 «2a»): rename, pause, move, delete with Undo, without opening the sport's page */
  let renaming = $state(null); // the act being renamed
  async function renameAct(a, nm) {
    const before = { name: a.name, nameDe: a.nameDe };
    const next = { ...$state.snapshot(a), name: nm };
    delete next.nameDe;
    await saveAct(db, next);
    offerRename(nm, async () => {
      const back = { ...next, name: before.name };
      if (before.nameDe) back.nameDe = before.nameDe;
      await saveAct(db, back);
    });
  }
  async function togglePause(a) {
    const was = !!a.paused;
    await saveAct(db, { ...$state.snapshot(a), paused: !was });
    offerDone(was ? t('«{name}» is active again.', { name: actName(a) }) : t('«{name}» paused.', { name: actName(a) }), () => saveAct(db, { ...$state.snapshot(a), paused: was }));
  }
  async function removeRow(a) {
    const nm = actName(a);
    const answer = await askDelete({
      title: t('Delete «{name}»?', { name: nm }),
      text: t('Keep the history: the tile goes, your ticks stay and it can come back under «Deleted». Delete with history: the ticks go too.'),
      archive: t('Keep the history'),
      label: t('Delete with history'),
    });
    if (!answer) return;
    await deleteWithUndo({ run: () => removeAct(db, a.id, { keep: answer === 'archive' }), undo: (saved) => undoAct(db, saved), text: t('«{name}» deleted.', { name: nm }), name: nm });
  }
  /* the sports of trips (Noah 02.11.2026 «2a»): rename, hide, delete and add own ones in the list, as under Ich › Listen */
  let renamingTrip = $state(null); // the trip sport being renamed
  let addingTrip = $state(false);
  const overrides = async () => (await db.settings.get(OVERRIDES_KEY))?.value ?? {};
  const entryOf = (all, s) => listFor('domains', all).find((e) => e.id === s.key);
  async function renameTrip(s, nm) {
    const all = await overrides();
    const e = entryOf(all, s);
    if (!e) return;
    await saveList(db, 'domains', edit(all.domains, e, { name: nm }));
    offerRename(nm, () => saveList(db, 'domains', all.domains ?? {}));
  }
  async function addTrip(nm) {
    const all = await overrides();
    const { value } = addOwn(all.domains, { name: nm });
    await saveList(db, 'domains', value);
    offerDone(t('«{name}» added.', { name: nm }), () => saveList(db, 'domains', all.domains ?? {}));
  }
  async function hideTrip(s) {
    const all = await overrides();
    const e = entryOf(all, s);
    if (!e) return;
    await saveList(db, 'domains', toggleHidden(all.domains, e.id));
    offerDone(t('«{name}» hidden.', { name: sportName(s) }), () => saveList(db, 'domains', all.domains ?? {}));
  }
  async function removeTrip(s) {
    const all = await overrides();
    const e = entryOf(all, s);
    if (!e) return;
    const nm = sportName(s);
    const answer = await askDelete({
      title: t('Delete sport «{name}»?', { name: nm }),
      text: e.own ? t('Its trips and items move to Bikepacking.') : t('Trips and items keep it; it is no longer offered for a new trip. «Back to Standard» brings it back.'),
    });
    if (answer !== 'delete') return;
    const savedTrips = e.own ? (await db.trips.toArray()).filter((x) => x.domain === e.id) : [];
    const savedItems = e.own ? (await db.items.toArray()).filter((i) => i.domains?.includes(e.id)) : [];
    await deleteWithUndo({
      run: async () => {
        if (e.own) {
          await db.trips.bulkPut(savedTrips.map((x) => ({ ...x, domain: 'bikepacking' })));
          await db.items.bulkPut(savedItems.map((i) => ({ ...i, domains: [...new Set(i.domains.map((d) => (d === e.id ? 'bikepacking' : d)))] })));
        }
        await saveList(db, 'domains', remove(all.domains, e));
      },
      undo: async () => {
        await saveList(db, 'domains', all.domains ?? {});
        if (savedTrips.length) await db.trips.bulkPut(savedTrips);
        if (savedItems.length) await db.items.bulkPut(savedItems);
      },
      text: t('«{name}» deleted.', { name: nm }),
      name: nm,
    });
  }
  function tripMenu(s, i) {
    return [
      { key: 'rename', label: t('Rename'), icon: Pencil, onclick: () => (renamingTrip = s) },
      { key: 'hide', label: t('Hide'), icon: EyeOff, onclick: () => hideTrip(s) },
      { key: 'up', label: t('Move up'), icon: ChevronUp, disabled: i === 0, sep: true, onclick: () => tripStep(s, -1) },
      { key: 'down', label: t('Move down'), icon: ChevronDown, disabled: i >= tripSports.length - 1, onclick: () => tripStep(s, 1) },
      { key: 'delete', label: t('Delete …'), icon: Trash, danger: true, sep: true, onclick: () => removeTrip(s) },
    ];
  }
  function menuOf(a, i, list) {
    if (isOff(a)) {
      return [
        { key: 'rename', label: t('Rename'), icon: Pencil, onclick: () => (renaming = a) },
        ...(a.paused ? [{ key: 'pause', label: t('Resume'), icon: Play, onclick: () => togglePause(a) }] : []),
        { key: 'delete', label: t('Delete …'), icon: Trash, danger: true, sep: true, onclick: () => removeRow(a) },
      ];
    }
    return [
      { key: 'rename', label: t('Rename'), icon: Pencil, onclick: () => (renaming = a) },
      { key: 'pause', label: a.paused ? t('Resume') : t('Pause'), icon: a.paused ? Play : Pause, onclick: () => togglePause(a) },
      { key: 'up', label: t('Move up'), icon: ChevronUp, disabled: i === 0, sep: true, onclick: () => moveIn(list, a, i - 1) },
      { key: 'down', label: t('Move down'), icon: ChevronDown, disabled: i >= list.length - 1, onclick: () => moveIn(list, a, i + 1) },
      { key: 'top', label: t('To the top'), icon: ArrowUpToLine, disabled: i === 0, onclick: () => moveIn(list, a, 0) },
      { key: 'bottom', label: t('To the bottom'), icon: ArrowDownToLine, disabled: i >= list.length - 1, onclick: () => moveIn(list, a, list.length - 1) },
      ...groupItems(a),
      { key: 'delete', label: t('Delete …'), icon: Trash, danger: true, sep: true, onclick: () => removeRow(a) },
    ];
  }
  // «In a group»: the groups as items of the menu (only when there are groups) and «New group …»
  function groupItems(a) {
    return [
      ...groups.map((g, k) => ({ key: `group-${g.id}`, label: `${a.group === g.id ? '✓ ' : ''}${g.name}`, sep: k === 0, onclick: () => setGroup(a, g.id) })),
      ...(groups.length && a.group ? [{ key: 'group-none', label: t('No group'), onclick: () => setGroup(a, null) }] : []),
      { key: 'group-new', label: t('New group …'), sep: !groups.length, onclick: () => (groupSheet = { mode: 'new' }) },
    ];
  }

  /* three calm states (Impeccable runde 2): «heute offen», «noch 1× in 10 Tagen», «bis morgen» or «im Soll» */
  function goalPill(s) {
    if (s.met || (s.daily && !s.open)) {
      const due = s.daily ? null : Math.min(...s.goals.filter((r) => r.goal.days > 1 && r.dueIn != null).map((r) => r.dueIn));
      if (due === 1) return { key: 'due', cls: 'warn', text: t('until tomorrow|goal') };
      if (due === 2) return { key: 'due', cls: 'warn', text: t('until the day after tomorrow|goal') };
      return { key: 'ok', cls: 'ok', text: t('on track') };
    }
    if (s.open) return { key: 'today', cls: 'warn', text: t('open today') };
    const r = s.goals.find((x) => !x.met);
    return r ? { key: 'left', cls: '', text: t('{n}× more in {d} days', { n: r.goal.count - r.done, d: r.goal.days }) } : { key: 'none', cls: '', text: t('no goal|sport') };
  }
  import PasstHier from '../../lib/ui/PasstHier.svelte'; // «Wegweiser statt Katalog» PR 7
</script>

{#snippet actRow(a, i, shown, list)}
  {@const s = stateOf.get(a.id)}
  <li data-id={a.id} data-row={a.id} data-sort-id={a.id}>
    <a class="ar" href={sportHref(a)} data-sport-row={a.id}>
      <span class="aico"><ActIcon icon={a.icon} ring={a.ring} dim={a.paused || s?.resting} /></span>
      <span class="m"><b>{actName(a)}</b><small>{a.paused ? t('paused') : s?.resting ? t('rests until {date}', { date: dayShort(s.restUntil) }) : actGoalText(a, today)}{#if isMedAct(a)}{' · '}{t('with timer')}{/if}</small></span>
      {#if s && !s.resting}
        <span class="d7" aria-hidden="true">{#each gridRow(s, data.log, week, today, data.tripDays) as c, k (k)}<i class={c}></i>{/each}</span>
        <span class="st num">{s.stand.n} / {s.stand.of}</span>
        {@const p = goalPill(s)}
        <span class="bdw"><span class="pill {p.cls}" data-pill={p.key}>{p.text}</span></span>
      {:else}
        <span class="d7 rest" aria-hidden="true">{#each week as d (d)}<i></i>{/each}</span>
        <span class="st num">–</span>
        <span class="bdw"><span class="pill">{a.paused ? t('paused') : t('rests')}</span></span>
      {/if}
    </a>
    {#if shown}<SortGrip name={actName(a)} onstep={(d) => stepIn(list, a, d)} />{/if}
    {#if shown && reorder}<SortArrows name={actName(a)} {i} n={list.length} onstep={(dir) => stepIn(list, a, dir)} />{/if}
    <RowMenu name={actName(a)} items={menuOf(a, i, list)} />
  </li>
{/snippet}

<div class="flow ms">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('My sports|tab')} />
    <h1 class="title">{t('My sports|tab')}</h1>
    <p class="sub">{t('Every sport with its goal, its last 7 days and its own page.')}{#if season}{' · '}{season.half === 'summer' ? t('Summer') : t('Winter')}{/if}</p>
  </header>
  <AreaIntro place="goals" />
  <!-- «Nächstes Ziel» (Noah 27.10.2026 «3a»): the milestone closest to its next star, one line -->
  {#if data}<NextGoalRow acts={data.acts} tripDays={data.tripDays} {today} />{/if}
  <!-- «332 Use Cases» (Noah 26.10.2026: «aktivitätsmosaik, bikepark tage, jahresziele, sterne» sichtbar) -->
  <QuickLinks label={t('On this page')} links={[{ key: 'mosaic', jump: '[data-mosaic]', label: t('Activity mosaic') }, { key: 'year', jump: '#yg-h', label: t('Year goals') }, { key: 'park', href: `#/flow/sport/${encodeURIComponent('trip:downhill')}`, label: t('Bike park days') }, { key: 'stars', href: '#/flow/milestones', label: t('Stars from your data') }]} />
  <div class="tools">
    <a class="btn hi" href="#/flow/new" data-new-sport><Plus size={18} aria-hidden="true" />{t('New sport')}</a>
    <!-- hobby pages 1 (suggestions, challenges, ideas and connections) stay one tap away -->
    <a class="btn" href="#/flow/activity" data-to-activity><Lightbulb size={18} aria-hidden="true" />{t('Suggestions and ideas')}</a>
  </div>

  {#if data && !all.length}
    <Empty icon={Plus} text={t('No sport yet. Add the first one: name, goal, done.')} action={{ label: t('New sport'), href: '#/flow/new' }} />
  {:else if data}
    <div class="lay">
      <div class="col">
        <Sec id="ms-h" title={t('Your sports, last 7 days')} sub={t('Dots = last 7 days · today on the right · a tap opens the sport')} more={{ label: reorder ? t('Done|order') : t('Sort|order'), onclick: () => (reorder = !reorder), expanded: reorder }}>
          {#if reorder}<p class="note ronote" data-reorder-note><Lightbulb size={16} aria-hidden="true" /><span>{t('The order here is the order of «Tick off today».')} {t('Drag the grip or use the arrows to move.')}</span></p>{/if}
          {#each similar as g (g.key)}
            <p class="note simnote" data-similar={g.key}><Lightbulb size={16} aria-hidden="true" /><span>{t('«{name}» appears {n} times. Rename one (for example «{name} winter») or pause it.', { name: g.name, n: g.ids.length })} <button type="button" class="btn btn-link" onclick={() => similarOk(g.key)}>{t('Keep as is|sport')}</button></span></p>
          {/each}
          <div class="flt" data-filter>
            <label class="srch"><Search size={16} aria-hidden="true" /><input type="search" bind:value={find} placeholder={t('Find a sport')} aria-label={t('Find a sport')} data-find-sport /></label>
            <button type="button" class="chip" class:on={openOnly} aria-pressed={openOnly} onclick={() => (openOnly = !openOnly)} data-filter-open>{t('Open today')}</button>
            <button type="button" class="chip" onclick={() => (groupSheet = { mode: 'new' })} data-new-group><Plus size={14} aria-hidden="true" />{t('Group')}</button>
          </div>
          {#if groups.length && !filtering}<p class="small ghint" data-group-hint>{t('Drag a sport by its grip onto a group title to move it there.')}</p>{/if}
          {#each secs as sec, si (sec.group?.id ?? 'none')}
            {#if groups.length}
              <div class="gh" data-group={sec.group?.id ?? 'none'} data-group-drop={sec.group?.id ?? 'none'}>
                {#if sec.group}
                  <button type="button" class="gt" aria-expanded={!sec.group.collapsed} onclick={() => saveGroups(toggleCollapsed(groups, sec.group.id))} data-group-toggle>{#if sec.group.collapsed}<ChevronRight size={16} aria-hidden="true" />{:else}<ChevronDown size={16} aria-hidden="true" />{/if}<b>{sec.group.name}</b><small>{sec.acts.length}</small></button>
                  <RowMenu name={sec.group.name} items={groupMenu(sec.group, groups.findIndex((g) => g.id === sec.group.id))} />
                {:else}
                  <span class="gt none"><b>{t('No group')}</b><small>{sec.acts.length}</small></span>
                {/if}
              </div>
            {/if}
            {#if !sec.group?.collapsed || filtering}
              {#if sec.acts.length}
                <ul class="acts card" class:sorting={reorder} use:sortable={{ onmove: (from, to) => moveIn(sec.acts, sec.acts[from], to), onto: (from, gid) => dropInto(sec.acts[from], gid), off: filtering }} data-my-sports>
                  {#each sec.acts as a, i (a.id)}
                    {@render actRow(a, i, true, sec.acts)}
                  {/each}
                </ul>
              {:else}
                <p class="note gempty"><Lightbulb size={16} aria-hidden="true" /><span>{t('This group is empty. Put a sport in it with «⋯» at the sport, or drag one onto the title.')} {#if sec.group}<a class="btn sm" href="#/flow/new?group={encodeURIComponent(sec.group.id)}" data-group-add>{t('New sport here')}</a>{/if}</span></p>
              {/if}
            {/if}
          {/each}
          {#if filtering && !secs.length}<p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('No sport found. Clear the search or the filter.')}</span></p>{/if}
          {#if off.length}
            <details class="card fold off" data-paused-block>
              <summary><span>{t('Paused and resting')}</span><small>{off.length}</small></summary>
              <ul class="acts offl">
                {#each off as a, i (a.id)}
                  {@render actRow(a, i, false, off)}
                {/each}
              </ul>
            </details>
          {/if}
          <p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('Rename, pause or delete a sport with «⋯». Symbol, goal and season are on its page under «Edit».')}</span></p>
        </Sec>

        {#if seasonal.length}
          <!-- was Aktiv › Mehr › Saison (spec: «Meine Sportarten (Sommer- und Wintersport)») -->
          <details class="card fold" data-season>
            <summary><span>{t('Season')}</span><small>{season ? (season.half === 'summer' ? t('Summer since {date}', { date: dayShort(season.since) }) : t('Winter since {date}', { date: dayShort(season.since) })) : ''}</small></summary>
            <ul class="rl">
              {#each seasonal as s (s.act.id)}
                {@const half = halfOf(s.act, today)}
                <li>
                  <ActIcon icon={s.act.icon} ring={s.act.ring} dim={s.resting} />
                  <span class="m"><b>{actName(s.act)}</b><small>{s.resting ? t('starts {date}', { date: dayShort(s.restUntil) }) : `${goalsText(s.act.goals)} · ${t('Winter')} ${goalsText(s.act.season.winter)}`}</small></span>
                  <span class="v">{#if s.resting}{t('rests')}{:else if half === 'summer'}{t('Summer until {date}', { date: dayShort(halfEnds(s.act, today)) })}{:else}{t('Winter since {date}', { date: dayShort(halfSince(s.act, today)) })}{/if}</span>
                </li>
              {/each}
            </ul>
          </details>
        {/if}
      </div>

      <aside class="col">
        {#if tripSports.length}
          <Sec id="ts-h" title={t('Sports of your trips')} sub={t('What you pack for. Each has its page with gear, packing list and care.')}>
            <ul class="card tsl" use:sortable={{ onmove: tripDragged }} data-trip-sports>
              {#each tripSports as s, i (s.id)}
                <li data-sort-id={s.id} data-sport={s.id}>
                  <SortGrip name={sportName(s)} onstep={(d) => tripStep(s, d)} />
                  <a href="#/flow/sport/{encodeURIComponent(s.id)}"><ActIcon icon={s.icon} ring={s.ring} /><span>{sportName(s)}</span><ChevronRight size={16} aria-hidden="true" /></a>
                  {#if reorder}<SortArrows name={sportName(s)} {i} n={tripSports.length} onstep={(d) => tripStep(s, d)} />{/if}
                  <RowMenu name={sportName(s)} items={tripMenu(s, i)} />
                </li>
              {/each}
            </ul>
            <p class="small edit"><button type="button" class="btn" data-add-trip-sport onclick={() => (addingTrip = true)}><Plus size={16} aria-hidden="true" />{t('Sport of trips')}</button> <a href="#/me/lists?domains">{t('Add, rename or hide sports of trips')}</a></p>
          </Sec>
        {/if}
        <!-- Noah 20.10.2026 «3a»: activities deleted with «Keep the history», to restore -->
        <GoneActs />
        <!-- «Werte überall» WU3: the year goals and the footprint -->
        <YearGoals {today} />
      </aside>
    </div>

    {#if sdata && rows.length}
      <details class="card fold hob sp" data-mosaic>
        <summary><span>{t('All sports at a glance')}</span><small>{t('one square per day')}</small></summary>
        <SportsMosaic list={sports} {rows} {cfg} {today} />
      </details>
    {/if}
  {/if}
  <PasstHier place="sports" />
</div>

{#if groupSheet}
  <RenameSheet kicker={t('Group')} title={groupSheet.mode === 'rename' ? t('Rename group') : t('New group')} value={groupSheet.mode === 'rename' ? groupSheet.group.name : ''} max={40} hint={t('For example «Strength» or «Recovery». A sport can stay without a group.')} onsave={groupSaved} onclose={() => (groupSheet = null)} />
{/if}
{#if groupDeleting}
  {@const g = groupDeleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: g.name })}
    count={all.filter((a) => a.group === g.id).length}
    what={(n) => tn(n, '{n} sport', '{n} sports')}
    none={t('No group')}
    noneHint={t('The sports stay, only without a group.')}
    targets={groups.filter((x) => x.id !== g.id).map((x) => ({ id: x.id, name: x.name }))}
    onconfirm={(to) => deleteGroup(g, to)}
    onclose={() => (groupDeleting = null)}
  />
{/if}
{#if renamingTrip}
  <RenameSheet kicker={t('Sport|kicker')} title={t('Rename sport')} value={sportName(renamingTrip)} max={40} onsave={(nm) => renameTrip(renamingTrip, nm)} onclose={() => (renamingTrip = null)} />
{/if}
{#if addingTrip}
  <RenameSheet kicker={t('Sport|kicker')} title={t('New sport of trips')} value="" empty="" max={40} hint={t('It appears when you plan a trip and here.')} onsave={addTrip} onclose={() => (addingTrip = false)} />
{/if}
{#if renaming}
  <RenameSheet kicker={t('In the flow')} title={t('Rename activity')} value={actName(renaming)} max={40} hint={t('Symbol, ring and goal stay as they are.')} onsave={(nm) => renameAct(renaming, nm)} onclose={() => (renaming = null)} />
{/if}

<style>
  .flow {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
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
  .acts {
    margin: 0;
    padding: 0 var(--sp-2) 0 var(--sp-4);
    list-style: none;
  }
  .acts li {
    display: flex;
    align-items: center;
    gap: 2px;
    border-top: 1px solid var(--line);
  }
  .acts li:first-child {
    border-top: 0;
  }
  .ar {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    min-height: 60px;
    padding: var(--sp-2) 0;
    color: var(--ink);
    text-decoration: none;
  }
  .aico {
    display: flex;
  }
  .ar .m {
    flex: 1 1 140px;
    display: flex;
    flex-direction: column;
  }
  .ar .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .d7 {
    display: flex;
    gap: 4px;
  }
  .d7 i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--paper-2);
    box-sizing: border-box;
  }
  .d7 :global(i.done) {
    background: var(--hi);
  }
  .d7 :global(i.open) {
    border: 2px dashed var(--warn);
    background: transparent;
  }
  .st {
    min-width: 56px;
    text-align: right;
    font-size: var(--fs-small);
  }
  .bdw {
    display: flex;
    justify-content: flex-end;
    min-width: 92px;
  }
  @media (max-width: 719px) {
    .d7 {
      order: 3;
      flex-basis: 100%;
      padding-left: 46px;
    }
  }
  .note {
    display: flex;
    gap: var(--sp-2);
    margin: var(--sp-2) var(--sp-3) 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .ronote {
    margin: 0 2px var(--sp-2);
  }
  .flt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    margin: 0 2px var(--sp-3);
  }
  .srch {
    flex: 1 1 180px;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink-3);
  }
  .srch input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    outline: none;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip.on {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--paper);
  }
  .gh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: var(--sp-3) 2px var(--sp-1);
  }
  .ghint {
    margin: 0 2px var(--sp-1);
    color: var(--ink-3);
  }
  .gh.drop-on {
    border-radius: 10px;
    outline: 2px dashed var(--hi);
    outline-offset: 2px;
    background: var(--paper-2);
  }
  .gt {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .gt.none {
    cursor: default;
    color: var(--ink-2);
  }
  .gt small {
    color: var(--ink-3);
  }
  .gempty {
    margin: 0 2px var(--sp-2);
  }
  .simnote {
    margin: 0 2px var(--sp-2);
  }
  .off {
    margin-top: var(--sp-3);
  }
  .offl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fold {
    padding: var(--sp-3) var(--sp-4);
  }
  .fold summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px var(--sp-3);
    min-height: 44px;
    align-content: center;
    font-weight: 600;
    cursor: pointer;
  }
  .fold summary small {
    color: var(--ink-3);
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .rl {
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  .rl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .rl .m {
    flex: 1 1 140px;
    display: flex;
    flex-direction: column;
  }
  .rl small,
  .rl .v {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tsl {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  .tsl li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .tsl li + li {
    border-top: 1px solid var(--line);
  }
  .tsl a {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    color: var(--ink);
    text-decoration: none;
  }
  .tsl a span {
    flex: 1;
  }
  .small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .edit {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: var(--sp-2) var(--sp-3) 0;
  }
</style>

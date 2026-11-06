<script>
  /**
   * Kalender › Merken (mockup PL3, Noah «PL1-PL3 freigeben» + «1a» 14.10.2026; decision 11.10 «2a+b,
   * wobei die to dos im vordergrund stehen»): the own to-dos first and big, in late · today · this week ·
   * later · without date; below, smaller, what the app already knows, each source deselectable.
   * Reminders (ER1–ER3) show here and only here (Noah 5b: not on Heute). A tick has «Rückgängig»; a
   * repeating to-do moves on to its next date. Done to-dos move to «Erledigt».
   * Geburtstage and Pflanzen (Noah 15.10.2026 «plus geburtstag, pflanzen»): own groups under the to-dos,
   * next ones first («in 3 Tagen»); a plant has «Gegossen» (one tap, with Undo). Deleting offers Undo
   * for 4 s (Noah's rule for deleting).
   * Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a»): every own list under «Listen», each opens its page.
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { Plus, Repeat2, Bell, ChevronDown, ChevronRight, Settings2, Cake, Sprout, Droplet, Gift, ListChecks, Pin, Users, Check, Sunrise, ArrowUpDown, Search, Link2, NotebookPen } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { switchTrip } from '../lib/nav.js';
  import { MERKEN_KEY, tickTodo, waterPlant, addTodo, updateTodo, changeTodo, reorderTodos } from '../lib/merkendb.js';
  import { groupTodos, doneTodos, GROUPS, addDays } from '../lib/merken.js';
  // 05.11.2026 (Noah «F1–F3, N1–N3 alle»): quick line (F1) with words for the date (N1), swipe and sort (F2),
  // steps (N2), «belongs to» (N3), one search for to-dos and notes (F3)
  import { parseWhen, nextWeekday } from '../lib/merken/parse.js';
  import { stepsOf, stepProgress, toggleStep } from '../lib/merken/steps.js';
  import { linksOf, linkName } from '../lib/merken/links.js';
  import { postponeChanges } from '../lib/merken/order.js';
  import { noteTitle } from '../lib/notebook.js';
  import SwipeRow from '../lib/ui/SwipeRow.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { appDates, SOURCES, SOURCES_KEY } from '../lib/merken/appdates.js';
  import { dayLabel } from '../lib/merken/when.js';
  import { birthdayRows, birthdaySections, plantRows, everyOn, SOON_DAYS } from '../lib/merken/kinds.js';
  
  import { putSetting } from '../lib/remind/ask.svelte.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import TodoSheet from '../lib/merken/TodoSheet.svelte';
  import KindSheet from '../lib/merken/KindSheet.svelte';
  import BdayPlan from '../lib/stand/BdayPlan.svelte'; // Paket A, UC-257-I2: steps for a birthday
  import ListSheet from '../lib/merken/ListSheet.svelte';
  import TrelloBox from '../lib/trello/TrelloBox.svelte';
  import { trello } from '../lib/trello/client.svelte.js';
  import { LISTS_KEY, PIN_PLACES, openCount } from '../lib/ownlists.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import WaitingGroup from '../lib/stand/WaitingGroup.svelte'; // Paket A part 1: to-dos that wait
  import ListEnds from '../lib/stand/ListEnds.svelte';
  import { notWaiting, isEnded, waitingRows } from '../lib/stand/stand.js';

  const today = localDay();
  const q = liveQuery(async () => {
    const [m, s, trips, bikes, visits, tasks, l, notes] = await Promise.all([db.settings.get(MERKEN_KEY), db.settings.get(SOURCES_KEY), db.trips.toArray(), db.bikes.toArray(), db.visits.toArray(), db.maintenance.toArray(), db.settings.get(LISTS_KEY), db.notes.toArray()]);
    return { todos: m?.value ?? [], off: s?.value ?? [], trips, bikes, visits, tasks, lists: l?.value ?? [], notes };
  });
  const d = $derived($q ?? { todos: [], off: [], trips: [], bikes: [], visits: [], tasks: [], lists: [], notes: [] });
  let newList = $state(false);
  function listMade(r) {
    if (!r?.list) return;
    location.hash = `#/calendar/list/${r.list.id}`;
    offerDone(t('List «{name}» created.', { name: r.list.name }), r.undo);
  }
  const pinOf = (l) => (!l.pin ? '' : l.pin.place === 'trips' ? d.trips.find((x) => x.id === l.pin.tripId)?.title || t('Trip') : t(PIN_PLACES.find((p) => p.key === l.pin.place)?.label ?? ''));
  const kmOf = (id) => d.bikes.find((b) => b.id === id)?.km ?? null;
  // «after rain»: a trip on that bike with rain in its weather, ended after the last tick
  const rainSince = (bikeId, since) => d.trips.some((tr) => tr.bikeId === bikeId && tr.wx?.rain && tr.startDate && tr.startDate <= today && tr.startDate >= String(since).slice(0, 10));
  const groupsAll = $derived(groupTodos(notWaiting(d.todos), today, kmOf, rainSince));
  // F3: one search over to-dos (with their steps) and notes
  let search = $state('');
  const needle = $derived(search.trim().toLowerCase());
  const hit = (x) => !needle || x.text.toLowerCase().includes(needle) || stepsOf(x).some((s) => s.text.toLowerCase().includes(needle)) || linksOf(x).some((l) => linkText(l).toLowerCase().includes(needle));
  const groups = $derived(Object.fromEntries(GROUPS.map((g) => [g, groupsAll[g].filter(hit)])));
  const noteHits = $derived(needle ? d.notes.filter((n) => n.status !== 'open' && `${noteTitle(n)} ${n.text ?? ''}`.toLowerCase().includes(needle)).slice(0, 6) : []);
  const linkText = (l) => linkName(l, { trips: d.trips, bikes: d.bikes, notes: d.notes }, noteTitle) || t('Note');
  const done = $derived(doneTodos(d.todos));
  const bdays = $derived(birthdayRows(d.todos, today));
  const bdaySecs = $derived(birthdaySections(bdays));
  function secName(key) {
    if (key === 'soon') return t('Next {n} days', { n: SOON_DAYS });
    const opts = { month: 'long', timeZone: 'UTC', ...(key.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) };
    return new Date(`${key}-15T12:00:00Z`).toLocaleDateString(locale(), opts);
  }
  const plants = $derived(plantRows(d.todos, today));
  const open = $derived(GROUPS.reduce((n, g) => n + groupsAll[g].length, 0) + bdays.length + plants.length + waitingRows(d.todos, today).length);
  const inDays = (n) => (n === 0 ? t('Today') : n === 1 ? t('Tomorrow') : tn(n, 'in {n} day', 'in {n} days'));
  const plantDue = (n) => (n < 0 ? tn(-n, 'due for {n} day', 'due for {n} days') : n === 0 ? t('due today') : inDays(n));
  const dateOf = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });
  function bdayMeta(r) {
    const on = !r.td.off && r.td.reminds?.length;
    return [r.age != null ? (r.in === 0 ? t('turns {n} today', { n: r.age }) : t('turns {n}', { n: r.age })) : '', dateOf(r.day), on ? r.td.reminds.map((x) => (x.before ? t('Day before {time}', { time: x.at }) : t('On the day {time}', { time: x.at }))).join(', ') : ''].filter(Boolean).join(' · ');
  }
  function plantMeta(r) {
    const p = r.td.plant;
    const n = everyOn(p, p.last);
    return [n !== p.every ? t('Every {n} days in winter', { n }) : tn(p.every, 'Water every day', 'Water every {n} days'), p.place, !r.td.off && r.td.remind?.at ? r.td.remind.at : ''].filter(Boolean).join(' · ');
  }
  async function water(r) {
    const undo = await waterPlant(db, r.td.id, today);
    say(t('{name} · watered', { name: r.td.text }), undo);
  }
  let kindSheet = $state(null); // { kind } or { todo }
  const fromApp = $derived(
    appDates({
      trips: d.trips,
      bikes: d.bikes,
      visits: d.visits,
      tasks: d.tasks,
      today,
      off: d.off,
      texts: { pack: (n) => t('{trip}: pack', { trip: n }), tripSub: t('Trip · 2 days before'), care: (b, n) => `${b}: ${t(n)}`, careSub: t('Bike care') },
    }),
  );
  const HEAD = { late: 'Overdue', today: 'Today', week: 'This week', later: 'Later', none: 'Without date' };

  let sheet = $state(null); // { todo } or {} for a new one
  let showDone = $state(false);
  let notice = $state(null);
  let noticeTimer;
  function say(text, undo, ms = 8000) {
    clearTimeout(noticeTimer);
    notice = { text, undo };
    noticeTimer = setTimeout(() => (notice = null), ms);
  }
  const done4 = (r) => r?.undo && (r.removed ? say(t('Deleted.'), r.undo, 4000) : say(t('Saved.'), r.undo));
  async function tickIt(x) {
    const undo = await tickTodo(db, x.id, { today, bikeKm: x.repeat?.bikeId ? kmOf(x.repeat.bikeId) : null });
    say(x.repeat ? t('{name} · done, comes again', { name: x.text }) : t('{name} · done', { name: x.text }), undo);
  }
  // F1 (Noah 05.11.2026): the quick line. Type, Enter, done; Today · Tomorrow · Weekend are one tap; words in the text
  // («morgen 18 Uhr, jeden Sonntag», N1) show as chips that can be switched off. «More …» opens the full window.
  let qtext = $state('');
  let qdue = $state(''); // '' | 'today' | 'tomorrow' | 'weekend'
  let qskip = $state({ due: false, time: false, repeat: false });
  const qparsed = $derived(qtext.trim() ? parseWhen(qtext, today) : null);
  const QDAYS = $derived({ today, tomorrow: addDays(today, 1), weekend: nextWeekday(addDays(today, -1), 6) });
  const QCHIPS = [
    ['today', 'Today'],
    ['tomorrow', 'Tomorrow'],
    ['weekend', 'Weekend'],
  ];
  const REPEAT_WORD = { day: 'Every day', week: 'Every week', month: 'Every month' };
  // what the quick line would save, with the parts the person switched off left out
  const qplan = $derived.by(() => {
    const p = qparsed;
    const found = p?.found ?? [];
    const skipped = found.some((f) => qskip[f.kind]);
    const due = (qskip.due ? null : p?.due) ?? (qdue ? QDAYS[qdue] : null);
    const time = qskip.time ? null : p?.remind;
    return {
      text: skipped ? qtext.trim() : (p?.text ?? qtext.trim()),
      due: due ?? (time && !qskip.due ? today : null),
      remind: time ?? null,
      repeat: qskip.repeat ? null : (p?.repeat ?? null),
    };
  });
  const qnote = (f) => (f.kind === 'due' ? dayLabel(f.value, today) : f.kind === 'time' ? f.value : t(REPEAT_WORD[f.value]));
  function qreset() {
    qtext = '';
    qdue = '';
    qskip = { due: false, time: false, repeat: false };
  }
  async function quickAdd(e) {
    e?.preventDefault();
    if (!qplan.text) return;
    const r = await addTodo(db, qplan);
    if (r) done4(r);
    qreset();
  }
  let moreFrom = $state(null); // the quick line handed over to the window
  function quickMore() {
    moreFrom = { text: qplan.text, preset: { due: qplan.due ?? '', remind: qplan.remind, repeat: qplan.repeat } };
    qreset();
  }

  // F2: swipe right = done, left = tomorrow; «Sort» shows arrows and the handle for dragging
  let sorting = $state(false);
  async function postpone(x) {
    const undo = await updateTodo(db, x.id, postponeChanges(x, today));
    say(t('{name} · moved to tomorrow', { name: x.text }), undo);
  }
  async function reorder(ids, from, to) {
    if (from === to) return;
    const undo = await reorderTodos(db, ids, from, to);
    say(t('Moved.'), undo);
  }
  // N2: a step is ticked right in the list
  async function tickStep(x, st) {
    const undo = await changeTodo(db, x.id, (td) => toggleStep(td, st.id));
    say(st.done ? t('Saved.') : t('{name} · done', { name: st.text }), undo);
  }
  async function runUndo() {
    const u = notice?.undo;
    notice = null;
    if (u) await u();
  }
  const flipSource = (k) => putSetting(SOURCES_KEY, d.off.includes(k) ? d.off.filter((x) => x !== k) : [...d.off, k]);
  function meta(x) {
    const r = x.repeat;
    return [
      r?.every === 'day' ? t('Every day') : r?.every === 'week' ? t('Every week') : r?.every === 'month' ? t('Every month') : r?.every === 'km' ? t('Every {km} km', { km: r.km }) : r?.every === 'rain' ? t('After a ride in the rain') : '',
      x.remind?.at ? `${x.remind.before ? t('1 day before') + ' ' : ''}${x.remind.at}` : '',
    ].filter(Boolean);
  }
  // «332 sichtbar»: the Trello box is the last part of the page
  function toTrello() {
    const h = document.getElementById('tb-h');
    if (!h) return;
    h.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }
</script>

{#snippet todoRow(x, g, i)}
  {@const pr = stepProgress(x)}
  <li class="tdw" data-sort-id={x.id} data-todo-id={x.id}>
    <SwipeRow id="todo-{x.id}" right={[{ key: 'done', label: t('Done'), icon: Check, run: () => tickIt(x) }]} left={[{ key: 'tomorrow', label: t('Tomorrow'), icon: Sunrise, tone: 'move', run: () => postpone(x) }]}>
      <div class="td in">
        {#if sorting}<SortGrip name={x.text} onstep={(dir) => reorder(groups[g].map((y) => y.id), i, i + dir)} />{/if}
        <button type="button" class="bx" onclick={() => tickIt(x)} aria-label={t('Done: {name}', { name: x.text })}></button>
        <button type="button" class="tx" onclick={() => (sheet = { todo: x })}>
          <b>{x.text}</b>
          {#if meta(x).length || pr.total || linksOf(x).length}
            <small>{#if x.repeat}<Repeat2 size={13} aria-hidden="true" />{:else if x.remind}<Bell size={13} aria-hidden="true" />{/if}{[...meta(x), pr.total ? t('{done} of {total} done', pr) : '', ...linksOf(x).map(linkText)].filter(Boolean).join(' · ')}</small>
          {/if}
          {#if pr.total}<span class="pbar" aria-hidden="true"><i style:width="{(100 * pr.done) / pr.total}%"></i></span>{/if}
        </button>
        {#if sorting}
          <SortArrows name={x.text} {i} n={groups[g].length} onstep={(dir) => reorder(groups[g].map((y) => y.id), i, i + dir)} />
        {:else if x.due}<span class="due" class:late={g === 'late'}>{g === 'today' && x.remind?.at ? x.remind.at : dayLabel(x.due, today)}</span>{/if}
      </div>
    </SwipeRow>
    {#if stepsOf(x).length}
      <ul class="steps" data-steps>
        {#each stepsOf(x) as st (st.id)}
          <li>
            <button type="button" class="sbx" class:done={st.done} onclick={() => tickStep(x, st)} aria-label={t('Step done: {name}', { name: st.text })} aria-pressed={!!st.done}>{#if st.done}<Check size={14} aria-hidden="true" />{/if}</button>
            <span class:struck={st.done}>{st.text}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </li>
{/snippet}

<div class="mk">
  <PageHead title={t('Remember')} text={t('Your to-dos first, the dates of the app smaller below.')} />
  <AreaIntro place="merken" />
  <p class="set"><a href="#/me/reminders"><Settings2 size={16} aria-hidden="true" />{t('Reminders')}</a>
    <!-- «332 sichtbar»: Trello stands at the end of the page; one tap brings you there -->
    <button type="button" class="tlk" onclick={toTrello} data-merken-trello><ListChecks size={16} aria-hidden="true" />{t('Trello')}</button>
    <!-- Wegweiser 8 (Noah 01.11.2026): people you want to see again remind you here -->
    <a href="#/me/alltag/menschen" data-merken-people><Users size={16} aria-hidden="true" />{t('Not seen for a while')}</a></p>

  <div class="card list">
    <!-- F1: the quick line; the full window stays behind «Add a to-do» and «More …» -->
    <form class="qline" onsubmit={quickAdd} data-quick-line>
      <div class="qrow">
        <input class="inp" bind:value={qtext} maxlength="160" enterkeyhint="done" placeholder={t('New to-do … e.g. «oil the chain tomorrow 6 pm»')} aria-label={t('New to-do')} data-quick-input />
        <button type="submit" class="btn hi sm" disabled={!qplan.text} data-quick-save>{t('Add')}</button>
      </div>
      <div class="chips qchips" role="group" aria-label={t('When?')}>
        {#each QCHIPS as [k, label] (k)}<button type="button" class="chip" aria-pressed={qdue === k} onclick={() => (qdue = qdue === k ? '' : k)}>{t(label)}</button>{/each}
        <button type="button" class="chip" onclick={quickMore} data-quick-more>{t('More …')}</button>
      </div>
      {#if qparsed?.found.length}
        <p class="qfound" data-quick-found>{t('Found in the words, tap to leave out:')}
          {#each qparsed.found as f (f.kind)}<button type="button" class="chip fnd" aria-pressed={!qskip[f.kind]} onclick={() => (qskip[f.kind] = !qskip[f.kind])}>{qnote(f)}</button>{/each}
        </p>
      {/if}
    </form>
    <button type="button" class="add" onclick={() => (sheet = {})}><Plus size={18} aria-hidden="true" />{t('Add a to-do')}</button>
    {#if d.todos.length || d.notes.length}
      <!-- F3: one search for to-dos and notes; F2: «Sort» shows arrows and the handle -->
      <div class="tools tl2">
        <label class="srch"><Search size={16} aria-hidden="true" /><span class="sr">{t('Search to-dos and notes')}</span>
          <input type="search" class="inp" bind:value={search} placeholder={t('Search to-dos and notes')} data-merken-search /></label>
        {#if open}<button type="button" class="chip" aria-pressed={sorting} onclick={() => (sorting = !sorting)} data-merken-sort><ArrowUpDown size={16} aria-hidden="true" />{t('Sort')}</button>{/if}
      </div>
    {/if}
    {#if trello.prefs?.on && trello.prefs?.todos?.sync}<p class="intr">{t('Also in Trello: list «To-dos»')}</p>{/if}
    <div class="kinds">
      <button type="button" class="chip" onclick={() => (kindSheet = { kind: 'birthday' })}><Cake size={16} aria-hidden="true" />{t('Birthday')}</button>
      <button type="button" class="chip" onclick={() => (kindSheet = { kind: 'plant' })}><Sprout size={16} aria-hidden="true" />{t('Plant')}</button>
    </div>

    {#if !open}<p class="empty">{t('Nothing to do. Add a to-do, or let the app remind you after an entry.')}</p>{/if}
    {#each GROUPS as g (g)}
      {#if groups[g].length}
        <h2 class="gh" class:late={g === 'late'}>{t(HEAD[g])}</h2>
        <ul use:sortable={{ onmove: (from, to) => reorder(groups[g].map((y) => y.id), from, to) }} data-todo-group={g}>
          {#each groups[g] as x, i (x.id)}
            {@render todoRow(x, g, i)}
          {/each}
        </ul>
      {/if}
    {/each}

    {#if needle && !noteHits.length && GROUPS.every((g) => !groups[g].length)}<p class="empty">{t('Nothing found for «{q}».', { q: search.trim() })}</p>{/if}
    {#if noteHits.length}
      <h2 class="gh">{t('Notes')}</h2>
      <ul data-note-hits>
        {#each noteHits as n (n.id)}
          <li class="tdw"><div class="td in"><span class="ki" aria-hidden="true"><NotebookPen size={16} /></span><a class="tx" href={`#/notes?open=${encodeURIComponent(n.id)}`}><b>{noteTitle(n) || t('Note')}</b><small>{t('Note')}</small></a></div></li>
        {/each}
      </ul>
    {/if}

    <WaitingGroup todos={d.todos} {today} ontick={tickIt} onopen={(x) => (sheet = { todo: x })} {say} />
    {#if bdays.length}
      <h2 class="gh">{t('Birthdays')}</h2>
      {#each bdaySecs as sec (sec.key)}
        <h3 class="sh">{secName(sec.key)}</h3>
        <ul class="bdays">
          {#each sec.rows as r (r.td.id)}
            <li class="td">
              <span class="ki" aria-hidden="true"><Cake size={16} /></span>
              <button type="button" class="tx" onclick={() => (kindSheet = { todo: r.td })}>
                <b>{r.td.text}</b>
                <small>{#if !r.td.off && r.td.reminds?.length}<Bell size={13} aria-hidden="true" />{/if}{bdayMeta(r)}</small>
                {#if r.td.gift}<small class="gift"><Gift size={13} aria-hidden="true" />{r.td.gift}</small>{/if}
              </button>
              <span class="due" class:soon={r.in <= 1}>{inDays(r.in)}</span>
            </li>
            {#if r.in <= 30}<li class="bpl"><BdayPlan td={r.td} year={Number(r.day.slice(0, 4))} /></li>{/if}
          {/each}
        </ul>
      {/each}
    {/if}
    {#if plants.length}
      <h2 class="gh">{t('Plants')}</h2>
      <!-- Pflanzenpass (996 Ideen 10): the spot of each plant, photos and observations, on its own page -->
      <p class="passl"><a href="#/calendar/pflanzen" data-plant-pass-open>{t('Plant passport')}</a> · {t('sun, wind, soil and every move')}</p>
      <ul class="plants">
        {#each plants as r (r.td.id)}
          <li class="td">
            <span class="ki" aria-hidden="true"><Sprout size={16} /></span>
            <button type="button" class="tx" onclick={() => (kindSheet = { todo: r.td })}>
              <b>{r.td.text}</b>
              <small>{#if !r.td.off && r.td.remind}<Bell size={13} aria-hidden="true" />{/if}{plantMeta(r)}</small>
            </button>
            <span class="side">
              <span class="due" class:late={r.in < 0} class:soon={r.in === 0}>{plantDue(r.in)}</span>
              <button type="button" class="water" onclick={() => water(r)} aria-label={t('Watered: {name}', { name: r.td.text })}><Droplet size={16} aria-hidden="true" /><span>{t('Watered')}</span></button>
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <!-- «Versteckte Funktionen» (Noah 03.11.2026 «4b»): the plant passport had no way in without a plant -->
      <p class="passl" data-plant-pass-empty><a href="#/calendar/pflanzen" data-plant-pass-open>{t('Plant passport')}</a> · {t('no plant yet: tap «Plant» above to add one')}</p>
    {/if}

    <h2 class="gh app">{t('Ideas from the app, for when you have time')}</h2>
    {#if fromApp.length}
      <ul>
        {#each fromApp as r (r.key)}
          <li class="td fromapp">
            <span class="bx dash" aria-hidden="true"></span>
            {#if r.tripId}
              <button type="button" class="tx" onclick={() => switchTrip(r.tripId, '#/pack')}><b>{r.text}</b><small>{r.sub}</small></button>
            {:else}
              <a class="tx" href={r.href}><b>{r.text}</b><small>{r.sub}</small></a>
            {/if}
            <span class="due">{dayLabel(r.day, today)}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty small">{t('Nothing from the app in the next 6 months.')}</p>
    {/if}
    <div class="src" role="group" aria-label={t('Sources')}>
      {#each SOURCES as s (s.key)}<button type="button" class="chip" aria-pressed={!d.off.includes(s.key)} onclick={() => flipSource(s.key)}>{t(s.label)}</button>{/each}
    </div>
  </div>

  <section class="lists" aria-labelledby="mk-lists-h">
    <div class="lh">
      <h2 id="mk-lists-h">{t('Lists')}</h2>
      <button type="button" class="btn sm" onclick={() => (newList = true)}><Plus size={16} aria-hidden="true" />{t('New list')}</button>
    </div>
    {#if d.lists.some((l) => !isEnded(l))}
      <ul class="card list lrows">
        {#each d.lists.filter((l) => !isEnded(l)) as l (l.id)}
          <li>
            <a class="mlrow" href={`#/calendar/list/${l.id}`}>
              <ListChecks size={18} aria-hidden="true" />
              <span class="tx"><b>{l.name}</b>{#if l.pin}<small><Pin size={13} aria-hidden="true" />{pinOf(l)}</small>{/if}{#if l.sync === 'trello'}<small class="intr">{t('Also in Trello')}</small>{/if}</span>
              <span class="due">{l.check ? t('{n} open', { n: openCount(l) }) : t('{n} notes', { n: l.items.length })}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">{t('No list yet. A list can hold anything: shopping before a trip, ideas, a workshop list.')}</p>
    {/if}
    <ListEnds lists={d.lists} />
  </section>

  <TrelloBox />

  {#if done.length}
    <button type="button" class="fold" aria-expanded={showDone} onclick={() => (showDone = !showDone)}>{#if showDone}<ChevronDown size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}{t('Done')} · {done.length}</button>
    {#if showDone}
      <ul class="card list donel">
        {#each done as x (x.id)}<li class="td"><span class="tx"><b>{x.text}</b><small>{dayLabel(x.doneAt.slice(0, 10), today)}</small></span></li>{/each}
      </ul>
    {/if}
  {/if}
</div>

{#if notice}
  <div class="mk-toast" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" class="undo" onclick={runUndo}>{t('Undo')}</button>{/if}</div>
{/if}
{#if newList}<ListSheet onclose={() => (newList = false)} ondone={listMade} />{/if}
{#if sheet}
  <TodoSheet todo={sheet.todo ?? null} onclose={() => (sheet = null)} ondone={done4} />
{/if}
{#if moreFrom}
  <TodoSheet text={moreFrom.text} preset={moreFrom.preset} onclose={() => (moreFrom = null)} ondone={done4} />
{/if}
{#if kindSheet}
  <KindSheet kind={kindSheet.kind ?? 'birthday'} todo={kindSheet.todo ?? null} onclose={() => (kindSheet = null)} ondone={done4} />
{/if}

<style>
  .passl {
    margin: -4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .passl a {
    display: inline-flex;
    align-items: center;
    min-height: 44px; /* a finger-sized target */
  }
  .bpl {
    list-style: none;
  }
  .intr {
    margin: 2px 0 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mk {
    max-width: 720px;
  }
  .set {
    margin: -6px 0 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
  }
  .set a,
  .set .tlk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--ink-2);
  }
  .set .tlk {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .list {
    padding: 16px 18px;
  }
  .list ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .add {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 0 14px;
    border: 1.5px dashed var(--line-strong, var(--line));
    border-radius: 12px;
    background: none;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .tools {
    display: flex;
    margin-top: 10px;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .srch {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1 1 200px;
    min-width: 0;
  }
  .srch :global(svg) {
    position: absolute;
    left: 12px;
    color: var(--ink-3);
    pointer-events: none;
  }
  .srch .inp {
    width: 100%;
    padding-left: 36px;
  }
  .tools .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .qline {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
  }
  .qrow {
    display: flex;
    gap: 8px;
  }
  .qrow .inp {
    flex: 1;
    min-width: 0;
  }
  .qchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .qfound {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .chip.fnd {
    background: var(--ok-soft, var(--paper-2));
    border-color: var(--ok, var(--line));
    color: var(--ink);
  }
  .chip.fnd[aria-pressed='false'] {
    background: var(--paper);
    border-color: var(--line);
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .tdw {
    border-top: 1px solid var(--line);
    list-style: none;
  }
  .td.in {
    border-top: 0;
    background: var(--paper);
  }
  .pbar {
    display: block;
    height: 6px;
    margin-top: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .pbar i {
    display: block;
    height: 100%;
    background: var(--accent, var(--ok));
  }
  .steps {
    list-style: none;
    margin: 0 0 8px 38px;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .steps li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    color: var(--ink-2);
  }
  .sbx {
    position: relative;
    display: grid;
    place-items: center;
    flex: none;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1.5px solid var(--line-strong, var(--ink-2));
    border-radius: 6px;
    background: var(--paper);
    color: var(--paper);
    cursor: pointer;
  }
  .sbx::before {
    content: '';
    position: absolute;
    inset: -11px;
  }
  .sbx.done {
    background: var(--accent, var(--ok));
    border-color: var(--accent, var(--ok));
  }
  .struck {
    text-decoration: line-through;
    color: var(--ink-3);
  }
  .gh {
    margin: 16px 0 2px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .sh {
    margin: 10px 0 2px;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.4 var(--font-body);
  }
  .kinds {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .kinds .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  .ki {
    display: grid;
    flex: none;
    place-items: center;
    width: 26px;
    height: 26px;
    margin: 9px 0 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .soon {
    color: var(--ink);
  }
  .side {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .side .due {
    margin-top: 2px;
  }
  .water {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 12px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .gh.app {
    margin-top: 24px;
  }
  .td {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .bx {
    flex: none;
    width: 26px;
    height: 26px;
    margin: 9px 0 0;
    border: 1.5px solid var(--line-strong, var(--ink-2));
    border-radius: 7px;
    background: var(--paper);
    cursor: pointer;
    position: relative;
  }
  .bx::before {
    content: '';
    position: absolute;
    inset: -9px;
  }
  .bx.dash {
    border-style: dashed;
    cursor: default;
  }
  .tx {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .tx b {
    display: block;
    font-weight: 500;
  }
  .tx small {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
  }
  .fromapp {
    opacity: 0.85;
  }
  .fromapp .tx b {
    font-size: var(--fs-small);
  }
  .due {
    flex: none;
    margin-top: 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    white-space: nowrap;
  }
  .late {
    color: var(--bad);
  }
  .empty {
    margin: 12px 0 0;
    color: var(--ink-2);
  }
  .src {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }
  .chip {
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .lists {
    margin-top: 22px;
  }
  .lh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .lh h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .lh .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lrows {
    list-style: none;
    margin: 0;
    padding: 4px 18px;
  }
  .lrows li + li {
    border-top: 1px solid var(--line);
  }
  .mlrow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    color: var(--ink);
    text-decoration: none;
  }
  .mlrow .due {
    margin-top: 0;
  }
  .fold {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-top: 14px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .donel .tx {
    cursor: default;
    color: var(--ink-2);
  }
  .mk-toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    z-index: 30;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(520px, calc(100vw - 32px));
    padding: 6px 8px 6px 16px;
    border-radius: 12px;
    background: var(--brand);
    color: var(--brand-ink);
    box-shadow: 0 8px 24px var(--shadow);
  }
  .mk-toast span {
    flex: 1;
  }
  .undo {
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .mk-toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>

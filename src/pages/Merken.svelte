<script>
  /**
   * Kalender › Merken (mockup PL3, Noah «PL1-PL3 freigeben» + «1a» 14.10.2026; decision 11.10 «2a+b,
   * wobei die to dos im vordergrund stehen»): the own to-dos first and big, in late · today · this week ·
   * later · without date; below, smaller, what the app already knows, each source deselectable.
   * Reminders (ER1–ER3) show here and only here (Noah 5b: not on Heute). A tick has «Rückgängig»; a
   * repeating to-do moves on to its next date. Done to-dos move to «Erledigt».
   * Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a»): every own list under «Listen», each opens its page.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Repeat2, Bell, ChevronDown, ChevronRight, Settings2, ListChecks, Pin } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { switchTrip } from '../lib/nav.js';
  import { MERKEN_KEY, tickTodo } from '../lib/merkendb.js';
  import { groupTodos, doneTodos, GROUPS } from '../lib/merken.js';
  import { appDates, SOURCES, SOURCES_KEY } from '../lib/merken/appdates.js';
  import { dayLabel } from '../lib/merken/when.js';
  import { putSetting } from '../lib/remind/ask.svelte.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import TodoSheet from '../lib/merken/TodoSheet.svelte';
  import ListSheet from '../lib/merken/ListSheet.svelte';
  import { LISTS_KEY, PIN_PLACES, openCount } from '../lib/ownlists.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => {
    const [m, s, trips, bikes, visits, tasks, l] = await Promise.all([db.settings.get(MERKEN_KEY), db.settings.get(SOURCES_KEY), db.trips.toArray(), db.bikes.toArray(), db.visits.toArray(), db.maintenance.toArray(), db.settings.get(LISTS_KEY)]);
    return { todos: m?.value ?? [], off: s?.value ?? [], trips, bikes, visits, tasks, lists: l?.value ?? [] };
  });
  const d = $derived($q ?? { todos: [], off: [], trips: [], bikes: [], visits: [], tasks: [], lists: [] });
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
  const groups = $derived(groupTodos(d.todos, today, kmOf, rainSince));
  const done = $derived(doneTodos(d.todos));
  const open = $derived(GROUPS.reduce((n, g) => n + groups[g].length, 0));
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
  function say(text, undo) {
    clearTimeout(noticeTimer);
    notice = { text, undo };
    noticeTimer = setTimeout(() => (notice = null), 8000);
  }
  async function tickIt(x) {
    const undo = await tickTodo(db, x.id, { today, bikeKm: x.repeat?.bikeId ? kmOf(x.repeat.bikeId) : null });
    say(x.repeat ? t('{name} · done, comes again', { name: x.text }) : t('{name} · done', { name: x.text }), undo);
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
</script>

<div class="mk">
  <PageHead title={t('Remember')} text={t('Your to-dos first, the dates of the app smaller below.')} />
  <p class="set"><a href="#/me/reminders"><Settings2 size={16} aria-hidden="true" />{t('Reminders')}</a></p>

  <div class="card list">
    <button type="button" class="add" onclick={() => (sheet = {})}><Plus size={18} aria-hidden="true" />{t('Add a to-do')}</button>

    {#if !open}<p class="empty">{t('Nothing to do. Add a to-do, or let the app remind you after an entry.')}</p>{/if}
    {#each GROUPS as g (g)}
      {#if groups[g].length}
        <h2 class="gh" class:late={g === 'late'}>{t(HEAD[g])}</h2>
        <ul>
          {#each groups[g] as x (x.id)}
            <li class="td">
              <button type="button" class="bx" onclick={() => tickIt(x)} aria-label={t('Done: {name}', { name: x.text })}></button>
              <button type="button" class="tx" onclick={() => (sheet = { todo: x })}>
                <b>{x.text}</b>
                {#if meta(x).length}<small>{#if x.repeat}<Repeat2 size={13} aria-hidden="true" />{:else if x.remind}<Bell size={13} aria-hidden="true" />{/if}{meta(x).join(' · ')}</small>{/if}
              </button>
              {#if x.due}<span class="due" class:late={g === 'late'}>{g === 'today' && x.remind?.at ? x.remind.at : dayLabel(x.due, today)}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/each}

    <h2 class="gh app">{t('From the app, smaller')}</h2>
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
    {#if d.lists.length}
      <ul class="card list lrows">
        {#each d.lists as l (l.id)}
          <li>
            <a class="mlrow" href={`#/calendar/list/${l.id}`}>
              <ListChecks size={18} aria-hidden="true" />
              <span class="tx"><b>{l.name}</b>{#if l.pin}<small><Pin size={13} aria-hidden="true" />{pinOf(l)}</small>{/if}</span>
              <span class="due">{l.check ? t('{n} open', { n: openCount(l) }) : t('{n} notes', { n: l.items.length })}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">{t('No list yet. A list can hold anything: shopping before a trip, ideas, a workshop list.')}</p>
    {/if}
  </section>

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
  <TodoSheet todo={sheet.todo ?? null} onclose={() => (sheet = null)} ondone={(r) => r?.undo && say(r.removed ? t('Deleted.') : t('Saved.'), r.undo)} />
{/if}

<style>
  .mk {
    max-width: 720px;
  }
  .set {
    margin: -6px 0 14px;
  }
  .set a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--ink-2);
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
  .gh {
    margin: 16px 0 2px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
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

<script>
  /**
   * «Mein Tag» (Noah 23.11.2026 «ja», «freigabe»; plan: docs/releases/mein-tag-lesen.md): one day as a timeline.
   * Step 1 only reads. The day is made from the entries of `buildWeek` (src/lib/woche.js), the same ones Woche,
   * Heute and Abhaken show, so nothing is counted or stored twice. Rules of the layout: src/lib/tag/timeline.js.
   * Address: #/day (today) and #/day/YYYY-MM-DD. A tap on an entry opens it where it lives.
   */
  import { Sun, CloudRain, CloudSun, ChevronLeft, ChevronRight, Palmtree, Plus, GripVertical, WandSparkles } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { weekQuery, putWeek } from '../lib/woche/load.js';
  import { buildWeek, KIND_NAMES, ITEMS_KEY, TIMES_KEY, timesOf, cleanItem, pruneItems } from '../lib/woche.js';
  import { deleteWithUndo } from '../lib/ui/ask.js';
  import EntrySheet from '../lib/tag/EntrySheet.svelte';
  import PlanSheet from '../lib/tag/PlanSheet.svelte';
  import Todos from '../lib/tag/Todos.svelte';
  import Abhaken from '../lib/tag/Abhaken.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { titleOf, subOf, dayName, wxWords, holidayName } from '../lib/woche/words.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { db } from '../lib/db.js';
  import { mondayOf, shiftDay } from '../lib/training.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { t } from '../lib/i18n.svelte.js';
  import { layoutDay, fmtMin, nowMin, weekOf } from '../lib/tag/timeline.js';

  let { sub = '' } = $props();
  const today = localDay();
  const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
  // step 3: the second tab «To-dos» has the address #/day/todos, step 3c the third «Tick off» #/day/abhaken
  // the page opens with the tab used last (Noah 23.11.2026 «5a»; this device only, localStorage); a day address always opens «Day»
  const TAB_KEY = 'pg.tag.tab';
  const lastTab = () => {
    try {
      const v = localStorage.getItem(TAB_KEY);
      return v === 'todos' || v === 'abhaken' ? v : 'day';
    } catch {
      return 'day';
    }
  };
  const remember = (k) => {
    try {
      localStorage.setItem(TAB_KEY, k);
    } catch {
      /* ignore: the page works without it */
    }
  };
  if (sub === '') {
    const k = lastTab();
    if (k !== 'day') location.replace(`#/day/${k}`);
  }
  const tab = $derived(sub === 'todos' ? 'todos' : sub === 'abhaken' ? 'abhaken' : 'day');
  const day = $derived(isDay(sub) ? sub : today);
  const monday = $derived(mondayOf(day));
  const days = $derived(weekOf(day, shiftDay));

  const q = $derived(weekQuery(today));
  const src = $derived($q);
  let forecast = $state(null);
  $effect(() => {
    homeForecast(db)
      .then((f) => (forecast = f))
      .catch(() => (forecast = null));
  });
  const actOf = $derived(new Map((src?.flowActs ?? []).map((a) => [a.id, a])));
  const week = $derived(src ? buildWeek({ ...src, forecast, monday, today, goalHours: src.goal?.hours ?? null, actName: (id) => actName(actOf.get(id)) || id }) : null);
  const d = $derived(week?.days.find((x) => x.day === day) ?? null);
  const lay = $derived(layoutDay(d?.entries ?? [], { now: nowMin(day, today) }));
  const sumOf = (x) => week?.days.find((w) => w.day === x)?.entries.filter((e) => e.kind !== 'away').length ?? 0;

  const HH = 72; // pixels per hour
  const hours = $derived(Array.from({ length: (lay.to - lay.from) / 60 + 1 }, (_, i) => lay.from + i * 60));
  const top = (m) => ((m - lay.from) / 60) * HH;
  const now = $derived(nowMin(day, today));

  const dayLong = (x) => dayName(x, true);
  const rel = $derived(day === today ? t('Today|day') : day === shiftDay(today, 1) ? t('Tomorrow|day') : day === shiftDay(today, -1) ? t('Yesterday|day') : '');
  const wetNow = $derived(d?.wx);
  const href = (e) => (e.href && !e.own ? e.href : '#/week');

  // step 2: own dates and to-dos (setting week.items, the same list Woche writes) can be added, changed and deleted here
  let editing = $state(null); // { item } to change or { item: null, day, time } for a new one
  const items = () => src?.rawItems ?? [];
  const isOwn = (e) => !!e.own && items().some((x) => x.id === e.id);
  const saveItems = (list) => putWeek(ITEMS_KEY, pruneItems(list, today));
  const openEntry = (e, ev) => {
    if (!isOwn(e)) return;
    ev.preventDefault();
    editing = { item: items().find((x) => x.id === e.id) };
  };

  // step 2, part 2: drag an own entry (grip) to a new time or onto another day chip; drag the lower edge for its length.
  // Whole quarter hours; nothing is saved while dragging, and the move offers Undo.
  const SNAP = 15;
  let drag = $state(null); // { id, mode: 'move' | 'size', y0, dy, over }
  const snap = (m) => Math.round(m / SNAP) * SNAP;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  /** Where a block stands (minutes) when it is moved or stretched by `dy` pixels (mode) or by `by` minutes. */
  function shape(b, mode, by) {
    if (mode === 'size') return { start: b.start, end: clamp(snap(b.end + by), b.start + SNAP, Math.min(b.start + 480, 24 * 60)) };
    const len = b.end - b.start;
    const start = clamp(snap(b.start + by), 0, 24 * 60 - Math.min(len, 24 * 60));
    return { start, end: start + len };
  }
  // over another day's chip the time stays as it is: only the day changes
  const byOf = (g) => (g.over ? 0 : (g.dy / HH) * 60);
  const shown = (b) => (drag?.id === b.e.id ? shape(b, drag.mode, byOf(drag)) : { start: b.start, end: b.end });
  // with pointer capture the click after a drag lands on the grip: it must not open the entry
  const stopClick = (ev) => (ev.preventDefault(), ev.stopPropagation());
  function dragStart(ev, b, mode) {
    if (!isOwn(b.e) || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drag = { id: b.e.id, mode, y0: ev.clientY, dy: 0, over: null };
  }
  function dragMove(ev) {
    if (!drag) return;
    drag.dy = ev.clientY - drag.y0;
    if (drag.mode === 'move') {
      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-day]')?.dataset.day ?? null;
      drag.over = over && over !== day ? over : null;
    }
  }
  async function dragEnd(b) {
    const g = drag;
    drag = null;
    if (!g || (Math.abs(g.dy) < 4 && !g.over)) return;
    const item = items().find((x) => x.id === g.id);
    if (!item) return;
    const to = shape(b, g.mode, byOf(g));
    await change(item, g.mode === 'size' ? { mins: to.end - to.start } : { time: fmtMin(to.start), ...(g.over ? { day: g.over } : {}) });
  }
  async function change(item, patch) {
    const before = items();
    await saveItems(before.map((x) => (x.id === item.id ? cleanItem({ ...x, ...patch }) : x)));
    const text = patch.mins ? t('«{name}» now takes {n} min.', { name: item.title, n: patch.mins }) : patch.day ? t('«{name}» moved to {day}.', { name: item.title, day: dayName(patch.day) }) : t('«{name}» moved to {time}.', { name: item.title, time: patch.time });
    offerDone(text, () => saveItems(before));
  }
  // the keyboard: arrow up and down move by a quarter hour, with Shift the length changes
  function dragKey(ev, b) {
    if (!isOwn(b.e) || !['ArrowUp', 'ArrowDown'].includes(ev.key)) return;
    ev.preventDefault();
    const step = ev.key === 'ArrowUp' ? -SNAP : SNAP;
    const to = shape(b, ev.shiftKey ? 'size' : 'move', step);
    const item = items().find((x) => x.id === b.e.id);
    if (item) change(item, ev.shiftKey ? { mins: to.end - to.start } : { time: fmtMin(to.start) });
  }
  const weekTodos = $derived(items().filter((x) => x.kind === 'todo').map((x) => ({ id: x.id, title: x.title, day: x.day, done: x.done })));
  async function tickItem(it) {
    const before = items();
    await saveItems(before.map((x) => (x.id === it.id ? { ...x, done: true } : x)));
    offerDone(t('«{name}» ticked off.', { name: it.title }), () => saveItems(before));
  }
  // step 4: «Plan my day»: times for the entries without one, by rules; nothing is saved before «Take over»
  let planning = $state(false);
  const nextDay = $derived(shiftDay(day, 1));
  const next = $derived(week?.days.find((x) => x.day === nextDay) ? { day: nextDay, entries: week.days.find((x) => x.day === nextDay).entries } : null);
  async function applyPlan(moves) {
    const beforeItems = items();
    const beforeTimes = src?.times ?? {};
    const own = new Map(moves.filter((m) => m.own).map((m) => [m.id, m]));
    const nextItems = beforeItems.map((x) => (own.has(x.id) ? cleanItem({ ...x, time: own.get(x.id).time, day: own.get(x.id).day }) : x));
    const nextTimes = { ...beforeTimes };
    for (const m of moves) if (!m.own) nextTimes[`${m.id}@${m.day}`] = m.time;
    await saveItems(nextItems);
    await putWeek(TIMES_KEY, timesOf(nextTimes, today));
    offerDone(t('{n} entries placed.', { n: moves.length }), async () => {
      await saveItems(beforeItems);
      await putWeek(TIMES_KEY, beforeTimes);
    });
  }
  const addEntry = (time = '') => (editing = { item: null, day, time });
  async function saveEntry(fields) {
    const old = editing.item;
    const next = cleanItem({ ...old, ...fields, mins: fields.mins ?? undefined });
    if (!next) return;
    if (fields.mins == null) delete next.mins;
    await saveItems(old ? items().map((x) => (x.id === old.id ? next : x)) : [...items(), next]);
  }
  function deleteEntry() {
    const gone = editing.item;
    return deleteWithUndo({
      run: () => saveItems(items().filter((x) => x.id !== gone.id)),
      undo: () => saveItems([...items().filter((x) => x.id !== gone.id), gone]),
      text: t('"{name}" deleted.', { name: gone.title }),
      name: gone.title,
    });
  }
</script>

<PageHead title={tab === 'todos' ? t('My to-dos') : tab === 'abhaken' ? t('Tick off today') : t('My day')} what={tab === 'todos' ? t('Everything still open in one list: yours from Remember and the ones you put on a day.') : tab === 'abhaken' ? t('One tap ticks a sport or habit. Duration and feeling are optional.') : t('Read the day, tap an entry to open it where it lives.')} />

<p class="tabs"><Seg label={t('Views of My day')} value={tab} options={[{ key: 'day', name: t('Day') }, { key: 'todos', name: t('To-dos') }, { key: 'abhaken', name: t('Tick off|tab') }]} onchange={(k) => (remember(k), (location.hash = k === 'todos' ? '#/day/todos' : k === 'abhaken' ? '#/day/abhaken' : `#/day/${today}`))} /></p>

{#if tab === 'todos'}
  <Todos {today} {weekTodos} ontick={tickItem} onmove={(it, to) => change(items().find((x) => x.id === it.id) ?? it, { day: to })} onedit={(it) => (editing = { item: items().find((x) => x.id === it.id) })} />
{:else if tab === 'abhaken'}
  <Abhaken {today} />
{:else}
<nav class="wk" aria-label={t('Choose a day')}>
  <a class="step" href="#/day/{shiftDay(day, -1)}" aria-label={t('Day before')}><ChevronLeft size={18} aria-hidden="true" /></a>
  <div class="chips">
    {#each days as x (x)}
      <a class="chip" data-day={x} class:dropon={drag?.over === x} class:on={x === day} class:today={x === today} href="#/day/{x}" aria-current={x === day ? 'date' : undefined}>
        <span class="wd">{dayName(x).split(' ')[0]}</span>
        <b class="num">{Number(x.slice(8))}</b>
        {#if sumOf(x)}<span class="dot" aria-label={t('{n} entries', { n: sumOf(x) })}></span>{/if}
      </a>
    {/each}
  </div>
  <a class="step" href="#/day/{shiftDay(day, 1)}" aria-label={t('Day after')}><ChevronRight size={18} aria-hidden="true" /></a>
</nav>

<p class="line">
  <span>{dayLong(day)}</span>
  {#if rel}<span class="tag">{rel}</span>{/if}
  {#if d?.holiday}<span class="tag">{holidayName(d.holiday)}</span>{/if}
  {#if wetNow}<span class="wx">{#if wetNow.wet}<CloudRain size={15} aria-hidden="true" />{:else if wetNow.dry}<Sun size={15} aria-hidden="true" />{:else}<CloudSun size={15} aria-hidden="true" />{/if}{wxWords(wetNow)}</span>{/if}
  {#if day !== today}<a class="today-link" href="#/day/{today}">{t('Back to today')}</a>{/if}
</p>
<p class="addrow">
  <button type="button" class="add" data-add-entry onclick={() => addEntry()}><Plus size={16} aria-hidden="true" /> {t('Add an entry')}</button>
  {#if day >= today}<button type="button" class="add" data-plan-open onclick={() => (planning = true)}><WandSparkles size={16} aria-hidden="true" /> {t('Plan my day')}</button>{/if}
</p>

{#if !week}
  <p class="load" aria-live="polite">{t('Loading the day …')}</p>
{:else}
  {#each lay.allDay as e (e.id)}
    <p class="away"><Palmtree size={16} aria-hidden="true" /> <span>{titleOf(e) || t('Holidays|away')}</span>{#if subOf(e)}<small>{subOf(e)}</small>{/if}</p>
  {/each}

  {#if lay.untimed.length}
    <section class="untimed" aria-label={t('Without a time')}>
      <h2>{t('Without a time')}</h2>
      <ul>
        {#each lay.untimed as e (e.id)}
          <li class="k-{e.kind}" class:done={e.done}>
            <a href={href(e)} data-entry={e.id} onclick={(ev) => openEntry(e, ev)}><b>{titleOf(e)}</b><small>{subOf(e) || t(KIND_NAMES[e.kind] ?? 'Other|kind')}</small></a>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#snippet timeline()}
  <section class="tl" aria-label={t('Timeline')} style="--hh: {HH}px; height: {top(lay.to)}px">
    {#each hours as h (h)}
      <div class="hr" style="top: {top(h)}px"><span class="num">{fmtMin(h)}</span></div>
    {/each}
    {#if now != null && now >= lay.from && now <= lay.to}
      <div class="now" style="top: {top(now)}px"><span>{t('now|clock')}</span></div>
    {/if}
    {#each lay.blocks as b (b.e.id)}
      <a
        class="blk k-{b.e.kind}"
        class:done={b.e.done}
        class:small={shown(b).end - shown(b).start <= 30}
        class:dragging={drag?.id === b.e.id}
        href={href(b.e)}
        data-entry={b.e.id}
        onclick={(ev) => openEntry(b.e, ev)}
        style="top: {top(shown(b).start)}px; height: {Math.max(22, ((shown(b).end - shown(b).start) / 60) * HH - 2)}px; left: calc(52px + (100% - 56px) * {b.col / b.cols}); width: calc((100% - 56px) / {b.cols} - 3px)"
      >
        <b>{titleOf(b.e)}</b>
        <small class="num">{fmtMin(shown(b).start)}{b.guessed && drag?.id !== b.e.id ? '' : `–${fmtMin(shown(b).end)}`}{subOf(b.e) ? ` · ${subOf(b.e)}` : ''}</small>
        {#if isOwn(b.e)}
          <span class="grip" role="button" tabindex="0" aria-label={t('Move «{name}»: drag, or use the arrow keys', { name: titleOf(b.e) })} data-grip={b.e.id} onpointerdown={(ev) => dragStart(ev, b, 'move')} onpointermove={dragMove} onpointerup={() => dragEnd(b)} onpointercancel={() => (drag = null)} onkeydown={(ev) => dragKey(ev, b)} onclick={stopClick}><GripVertical size={16} aria-hidden="true" /></span>
          <span class="size" role="presentation" data-size={b.e.id} onpointerdown={(ev) => dragStart(ev, b, 'size')} onpointermove={dragMove} onpointerup={() => dragEnd(b)} onpointercancel={() => (drag = null)} onclick={stopClick}></span>
        {/if}
      </a>
    {/each}
  </section>
  {/snippet}

  {#if !lay.blocks.length && !lay.untimed.length && !lay.allDay.length}
    <Empty title={t('Nothing planned on this day')} text={t('Plan sessions, dates and to-dos in Woche. They appear here with their time.')} action={{ label: t('Open Woche'), href: '#/week' }} />
    <details class="tlfold" data-tl-fold>
      <summary>{t('Show the timeline')}</summary>
      {@render timeline()}
    </details>
  {:else}
    {@render timeline()}
  {/if}

  <p class="foot">{t('What you plan in Woche stands here. Your own dates and to-dos you can add, change and drag here.')}</p>
{/if}
{/if}

{#if planning}
  <PlanSheet entries={d?.entries ?? []} {day} {today} now={now ?? 0} wet={!!wetNow?.wet} {next} onapply={applyPlan} onclose={() => (planning = false)} />
{/if}

{#if editing}
  <EntrySheet item={editing.item} day={editing.day} time={editing.time} onsave={saveEntry} ondelete={deleteEntry} onclose={() => (editing = null)} />
{/if}



<style>
  .tabs {
    margin: 0 0 10px;
  }
  .wk {
    display: flex;
    align-items: stretch;
    gap: 6px;
    margin: 0 0 8px;
  }
  .chips {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }
  .chip,
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-height: 56px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
  }
  .step {
    width: 32px;
    min-height: 44px;
    align-self: center;
    flex: none;
  }
  .chip .wd {
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .chip b {
    font-size: var(--fs-sub);
  }
  .chip.on {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .chip.on .wd {
    color: var(--hi-ink);
  }
  .chip.today:not(.on) {
    border-color: var(--brand);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--l1);
  }
  .chip.on .dot {
    background: var(--brand-ink);
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 4px 0 12px;
    color: var(--ink-2);
  }
  .tag {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--ok-soft);
    color: var(--ok);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .wx {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 8px;
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .today-link {
    margin-left: auto;
    color: var(--accent);
    font-weight: 600;
  }
  .load {
    color: var(--ink-2);
  }
  .away {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    padding: 8px 12px;
    border-radius: 12px;
    border-left: 3px solid var(--wk-away);
    background: color-mix(in srgb, var(--wk-away) 13%, var(--paper));
    font-weight: 600;
  }
  .away small {
    margin-left: auto;
    font-weight: 400;
    color: var(--ink-2);
  }
  .untimed {
    margin: 0 0 12px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .untimed h2 {
    margin: 0 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
    font-weight: 600;
  }
  .untimed ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .untimed li {
    --k: var(--wk-sport);
    border-left: 3px solid var(--k);
    border-radius: 8px;
    background: color-mix(in srgb, var(--k) 13%, var(--paper));
  }
  .untimed li a {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-height: 44px;
    padding: 8px 10px;
    color: var(--ink);
    text-decoration: none;
  }
  .blk b {
    display: block;
    font-weight: 600;
  }
  .blk small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .untimed li b {
    font-weight: 600;
  }
  .untimed li small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .k-date {
    --k: var(--wk-date);
  }
  .k-todo {
    --k: var(--wk-todo);
  }
  .k-bike {
    --k: var(--wk-bike);
  }
  .done b {
    text-decoration: line-through;
    color: var(--ink-2);
  }
  .tl {
    position: relative;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    margin: 0 0 12px;
    overflow: hidden;
  }
  .hr {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px solid var(--line);
  }
  .hr .num {
    position: absolute;
    left: 8px;
    top: 2px;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .now {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 2px solid var(--hi);
    z-index: 2;
    pointer-events: none;
  }
  .now span {
    position: absolute;
    right: 6px;
    top: -9px;
    padding: 0 6px;
    border-radius: 6px;
    background: var(--hi);
    color: var(--hi-ink);
    font-size: var(--fs-tiny);
    font-weight: 700;
  }
  .blk {
    --k: var(--wk-sport);
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    overflow: hidden;
    padding: 4px 8px;
    border-left: 3px solid var(--k);
    border-radius: 8px;
    background: color-mix(in srgb, var(--k) 16%, var(--paper));
    color: var(--ink);
    text-decoration: none;
    line-height: 1.25;
  }
  .blk.dragging {
    z-index: 3;
    box-shadow: 0 6px 18px var(--shadow);
    user-select: none;
  }
  .grip {
    position: absolute;
    top: 0;
    right: 0;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    color: var(--ink-2);
    cursor: grab;
    touch-action: none;
  }
  .size {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 12px;
    cursor: ns-resize;
    touch-action: none;
  }
  .chip.dropon {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .blk.small {
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding-top: 2px;
    padding-bottom: 2px;
  }
  .blk.small b,
  .blk.small small {
    display: inline;
  }
  .tlfold summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-2);
  }
  .foot {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  a:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  @media (min-width: 1000px) {
    .tl {
      max-width: 860px;
    }
  }
</style>

<script>
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  import { UNDO_MS } from '../lib/ui/undo.js';
  /**
   * Eingang (v0.48.0, Noah «Eingang, Notizen, Ablage, Pflege pro Teil» 1a-8a), was the Inbox:
   * - newest on top, grouped by day (Today, Yesterday, This week, Earlier); the open entries and the
   *   ones filed today in ONE list. A filed entry stays faint with a chip naming where it went (the
   *   chip opens it) and «Rückgängig» until midnight; after that it shows only under «Abgelegt».
   * - one button per row: «Ablegen» opens the sheet with the 7 targets, the app's suggestion on top
   *   (it shows under the text as «Vorschlag: …»).
   * - «Abgelegt»: everything ever filed, with its target, a search (text, shop, bike, amount) and
   *   filter chips.
   * Earlier (v0.19.3 … v0.47.1): one light button per note, the rest behind •••; a sorted note opens
   * what it became. Old filed notes (repair, learning, trip, done) keep showing with their target.
   * Design-Refresh P9 (I3, Noah 12.10.2026 «Runde 16 freigegeben»): the path back to Ich, «To file · n»
   * and «Filed» as two chips, «+ Quick note» right. Left the open notes (by day, the suggestion in the
   * line, «File» in the row); right «Recently filed» (the ones filed today, with the chip where they
   * went and «Undo» until midnight) and the tip about «+». The same functions as before.
   * SL «Scrollen und Listen» (Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): «Filed» by month, the
   * newest open, five rows and «Show n more»; the search and the chips stay on top; «Back to top».
   */
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { PAGE_NAMES } from '../lib/notes.js';
  import { TARGET, guessTarget, inboxGroups, filedRows, filedToday, FILED_FILTERS, targetHref } from '../lib/inbox.js';
  import { unfile } from '../lib/inboxdb.js';
  import { ICONS } from '../lib/inbox/icons.js';
  import { sortBikes } from '../lib/bikes.js';
  import { localDay } from '../lib/localday.js';
  import FileSheet from '../lib/inbox/FileSheet.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import '../lib/ich/ich.css';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { flip } from '../lib/ui/flip.js';
  import { Check, Undo2, ChevronRight, Sparkles, Search, Plus, Lightbulb, Trash2, Inbox } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import OwnSpark from '../lib/clear/OwnSpark.svelte';
  import ListBar from '../lib/list/ListBar.svelte';
  import ListGroup from '../lib/list/ListGroup.svelte';
  import TopButton from '../lib/list/TopButton.svelte';
  import { byMonthOf } from '../lib/list/listen.js';
  import Btn from '../lib/ui/Btn.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import { explain } from '../lib/ui/explain.js';

  let { onnew } = $props();

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());

  const today = localDay();
  const notes = $derived($notesQ ?? []);
  const groups = $derived(inboxGroups(notes, today).map((g) => ({ ...g, rows: g.rows.filter((n) => !n.filed) })).filter((g) => g.rows.length));
  const recent = $derived(notes.filter((n) => filedToday(n, today)).map((n) => ({ ...n, filed: true })).sort((a, b) => (b.sortedAt ?? '').localeCompare(a.sortedAt ?? '')));
  const openN = $derived(notes.filter((n) => n.status === 'open').length);
  const todayN = $derived(notes.filter((n) => filedToday(n, today)).length);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const names = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const trips = $derived($tripsQ ?? []);
  const ctx = $derived({ visits: $visitsQ ?? [], tasks: $tasksQ ?? [], items: $itemsQ ?? [], trips, bikes });

  let view = $state(location.hash.includes('view=filed') ? 'filed' : 'open');
  let query = $state('');
  let filter = $state('all');
  const filed = $derived(filedRows(notes, { query, filter, names }));
  const filedAll = $derived(filedRows(notes).length);
  // SL: the filed ones by month (the day they came in); a search or a chip opens every month it found
  const filedMonths = $derived(byMonthOf(filed, (n) => String(n.at ?? '').slice(0, 10)));
  let activeMonth = $state(null);
  let openMonths = $state({});
  const monthOpen = (m, i) => openMonths[m.key] ?? (!!query.trim() || filter !== 'all' || i === 0);
  const monthName = (key) => (key ? new Date(`${key}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : t('Without a date'));
  const curMonth = $derived(filedMonths.find((m) => m.key === activeMonth));

  let filing = $state(null); // the entry whose «Ablegen als …» sheet is open
  let shown = $state(null); // photo src
  let msg = $state('');

  // The toast after filing: «✓ Abgelegt: … · Rückgängig» (10 s).
  let last = $state.raw(null);
  let timer;
  $effect(() => () => clearTimeout(timer));
  function filedNow(stored) {
    clearTimeout(timer);
    last = { note: stored, text: t('Filed: {where}', { where: chipText(stored) }) };
    timer = setTimeout(() => (last = null), UNDO_MS);
  }
  async function undo(n) {
    msg = '';
    clearTimeout(timer);
    last = null;
    try {
      await unfile($state.snapshot(n));
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    }
  }
  async function remove(n) {
    const name = (n.text ?? '').slice(0, 40);
    if ((await askDelete({ title: t('Delete the note "{text}"?', { text: name }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const rec = $state.snapshot(n);
    await deleteWithUndo({ run: () => db.notes.delete(n.id), undo: () => db.notes.put(rec), text: t('"{name}" deleted.', { name }), name });
  }

  const OLD = { repair: 'Bike care', learning: 'Learning', trip: 'Debrief', done: 'Done|filed' };
  /** «Pflege · Spark», «Beleg · Scale», «Wunschliste»: the target chip of a filed entry. */
  function chipText(n) {
    const to = n.to ?? {};
    const base = to.kind === 'receipt' ? t('Receipt|chip') : to.kind === 'problem' ? t('Bike care') : TARGET[to.kind] ? t(TARGET[to.kind].name) : t(OLD[to.kind] ?? 'Filed');
    const bike = names[to.bikeId ?? (to.kind === 'repair' ? ctx.tasks.find((x) => x.id === to.ref)?.bikeId : null)];
    return bike ? `${base} · ${bike}` : base;
  }
  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const time = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const dayShort = (iso) => new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const chf = (n) => (typeof n === 'number' ? `CHF ${n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '');
  const where = (n) => (PAGE_NAMES[n.page] && n.page !== 'inbox' ? ` · ${t(PAGE_NAMES[n.page])}` : '');
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOVE = reduced ? 0 : 150;
</script>


<div class="inbox ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Inbox')} sub={$notesQ ? `${t('Notes from on the way, to file')} · ${t('newest on top')}` : ''} />
  <!-- Hinweistexte HT 3a (Noah 14.10.2026): the card «Was hier steht» -->
  <HintCard page="inbox" />
  <div class="bar">
    <div class="vchips" role="group" aria-label={t('Show')}>
      <button type="button" class="vchip" aria-pressed={view === 'open'} onclick={() => (view = 'open')}><span>{t('To file')}{#if openN}{' · '}<span class="num">{openN}</span>{/if}</span></button>
      <button type="button" class="vchip" aria-pressed={view === 'filed'} onclick={() => (view = 'filed')}><span>{t('Filed')}{#if filedAll}{' · '}<span class="num">{filedAll}</span>{/if}</span></button>
    </div>
    {#if view === 'filed' || !$notesQ || openN || !notes.length}<button type="button" class="btn hi" onclick={onnew}><Plus size={16} aria-hidden="true" />{t('Quick note')}</button>{/if}
  </div>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}

  {#if view === 'open'}
    <div class="ich-cols">
      <div class="ich-main">
        <section class="ich-sec" aria-labelledby="tofile-h">
          <div class="ich-h"><div><h2 id="tofile-h">{t('To file')}</h2><p class="ich-hs">{todayN ? `${tn(todayN, '{n} filed today', '{n} filed today')} · ` : ''}{t('A suggestion is with each · tap «File»')}</p></div></div>
          {#if $notesQ && !notes.length}
            <!-- v0.127.0 A-U2: the one empty building block -->
            <Empty icon={Inbox} title={t('Nothing to file')} text={t('No notes yet. Tap + on any page when something comes up.')} action={{ label: t('Quick note'), onclick: onnew }} />
          {:else if $notesQ && !openN}
            <p class="card alldone" id="inbox-done" tabindex="-1"><Check size={18} aria-hidden="true" /><span>{t('All notes are sorted.')}</span><button type="button" class="btn sm" onclick={onnew}>+ {t('Quick note')}</button></p>
          {/if}
          {#each groups as g (g.key)}
            <h3 class="day">{t(g.name)}</h3>
            <ul class="card ich-list list" aria-label={t(g.name)}>
              {#each g.rows as n (n.id)}
                {@const sug = guessTarget(n)}
                {@const Icon = ICONS[sug] ?? ICONS.keep}
                <li data-note-id={n.id} animate:flip={{ duration: MOVE }}>
                  <div class="ich-row ich-wrap nrow">
                    {#if n.photo}
                      <button type="button" class="th" onclick={() => (shown = n.photo)} aria-label={t('Open photo')}><img src={n.photo} alt="" /></button>
                    {:else}
                      <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                    {/if}
                    <span class="ich-m">
                      <b>{n.text}</b>
                      <small>{when(n.at)}{where(n)}</small>
                      <small class="sug"><Sparkles size={13} aria-hidden="true" />{t('Suggestion: {what}', { what: t(TARGET[sug].name) })}</small>
                    </span>
                    <!-- v0.117.0 «Knöpfe neu» (N3): «Ablegen» + «…» with its explanations; right-aligned, on a phone under the text -->
                    <span class="acts rowacts">
                      <Btn label={t('File')} explain={t('Put it where it belongs: a bike, a trip or your gear')} sub={t('Suggestion: {what}', { what: t(TARGET[sug].name) })} class="sm" onclick={() => (filing = n)} />
                      <MoreActions small title={n.text} label={t('More for this note')} actions={[
                        { name: t('File'), explain: t('Put it where it belongs: a bike, a trip or your gear'), icon: Check, run: () => (filing = n), current: true },
                        { name: t('Delete'), explain: explain('Delete'), icon: Trash2, run: () => remove(n) },
                      ]} />
                    </span>
                  </div>
                </li>
              {/each}
            </ul>
          {/each}
        </section>
      </div>

      <div class="ich-side">
        {#if recent.length}
          <section class="ich-sec" aria-labelledby="recent-h">
            <div class="ich-h"><div><h2 id="recent-h">{t('Recently filed')}</h2><p class="ich-hs">{t('goes to the archive tonight · «Undo» until then')}</p></div></div>
            <ul class="card ich-list">
              {#each recent as n (n.id)}
                {@const Icon = ICONS[n.to?.kind] ?? ICONS.keep}
                {@const href = targetHref(n.to, ctx)}
                <li class="filed" data-note-id={n.id}>
                  <div class="ich-row ich-wrap nrow">
                    <span class="ich-ib"><Check size={18} aria-hidden="true" /></span>
                    <span class="ich-m">
                      <b class="t">{n.text}</b>
                      {#if href}<a class="tchip" {href}><Icon size={14} aria-hidden="true" />{chipText(n)}<ChevronRight size={14} aria-hidden="true" /></a>{:else}<span class="tchip">{chipText(n)}</span>{/if}
                      <small>{t('filed {time} · goes to the archive tonight', { time: time(n.sortedAt) })}</small>
                    </span>
                    <button type="button" class="btn btn-link" aria-label={t('Undo: back to the inbox')} onclick={() => undo(n)}>{t('Undo')}</button>
                  </div>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
        <p class="ich-fine"><Lightbulb size={16} aria-hidden="true" /><span>{t('Tap + on any page when something comes up.')}</span></p>
      </div>
    </div>
  {:else}
    <div class="filedwrap">
    <ListBar bind:active={activeMonth} current={curMonth ? monthName(curMonth.key) : ''} count={curMonth ? tn(curMonth.entries.length, '{n} entry', '{n} entries') : ''}>
      <label class="search">
        <Search size={18} aria-hidden="true" />
        <span class="sr">{t('Search the filed entries')}</span>
        <input class="inp" type="search" bind:value={query} placeholder={t('Search: text, shop, bike, amount')} />
      </label>
      <div class="fchips" role="group" aria-label={t('Filter')}>
        {#each FILED_FILTERS as f (f.key)}<button type="button" class="vchip" aria-pressed={filter === f.key} onclick={() => (filter = f.key)}>{t(f.name)}</button>{/each}
      </div>
    </ListBar>
    {#if !filed.length}
      <!-- Paket Q #216: an empty Inbox says what lands here and offers the first note -->
      <Empty text={query || filter !== 'all' ? t('Nothing found.') : t('Nothing filed yet. Every note you file comes in here, by month.')} action={query || filter !== 'all' ? null : { label: t('Write a note'), href: '#/inbox/new' }}>{#if !query && filter === 'all'}<OwnSpark place="inbox" />{/if}</Empty>
    {:else}
      <div class="months" aria-label={t('Filed')}>
        {#each filedMonths as m, i (m.key)}
          <ListGroup id={m.key || 'none'} title={monthName(m.key)} count={tn(m.entries.length, '{n} entry', '{n} entries')} bind:open={() => monthOpen(m, i), (v) => (openMonths = { ...openMonths, [m.key]: v })} rows={m.entries} more={(k) => t('Show {n} more|list', { n: k })}>
            {#snippet row(n)}
              {@const Icon = ICONS[n.to.kind] ?? ICONS.keep}
              {@const href = targetHref(n.to, ctx)}
              <svelte:element this={href ? 'a' : 'div'} class="ich-row frow" {href}>
                <span class="d num">{dayShort(n.at)}</span>
                <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{n.text}</b><small>{chipText(n)}</small></span>
                {#if n.to.chf != null}<span class="v num">{chf(n.to.chf)}</span>{/if}
                {#if href}<ChevronRight class="ich-chev" size={18} aria-hidden="true" />{/if}
              </svelte:element>
            {/snippet}
          </ListGroup>
        {/each}
      </div>
      <TopButton />
    {/if}
    </div>
  {/if}
</div>

{#if filing}
  <FileSheet note={filing} {bikes} {trips} visits={ctx.visits} onclose={() => (filing = null)} onfiled={filedNow} />
{/if}

{#if last}
  <div class="toast" role="status">
    <Check size={18} aria-hidden="true" /><span>{last.text}</span>
    <button type="button" class="btn sm" onclick={() => undo(last.note)}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
  </div>
{/if}

{#if shown}
  <Lightbox list={[{ src: shown, name: t('Quick note'), sub: '' }]} start={0} onclose={() => (shown = null)} />
{/if}

<style>
  /* SL: the filed ones by month */
  .months {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .filedwrap .search,
  .filedwrap .fchips {
    margin: 0;
  }
  .months :global(.ls-r .frow) {
    padding-inline: 0;
  }
  .inbox {
    max-width: 1100px;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 12px;
    margin: -4px 0 20px;
  }
  .vchips,
  .fchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fchips {
    margin: 0 0 14px;
  }
  /* The chosen view or filter dark, the others light (style sheet G2 «Filter»). */
  .vchip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 4px 16px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .vchip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .err {
    color: var(--bad);
  }
  .alldone {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0;
    color: var(--ink-2);
  }
  .alldone :global(svg) {
    color: var(--accent);
  }
  .alldone span {
    flex: 1;
  }
  .day {
    margin: 14px 2px 6px;
    color: var(--ink-3);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .day:first-of-type {
    margin-top: 0;
  }
  .list {
    overflow: visible;
  }
  .nrow {
    align-items: flex-start;
  }
  .nrow > .ich-ib,
  .nrow > .th {
    margin-top: 2px;
  }
  .th {
    flex: none;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .th img {
    display: block;
    width: 34px;
    height: 44px;
    object-fit: cover;
    border-radius: var(--radius);
    border: 1px solid var(--line);
  }
  .sug {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .filed .t {
    color: var(--ink-2);
  }
  .tchip {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 32px;
    margin: 4px 0 2px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--ok);
    font-size: var(--fs-small);
    font-weight: 500;
    text-decoration: none;
  }
  @media (pointer: coarse) {
    .tchip {
      min-height: 44px;
    }
  }
  .search {
    position: relative;
    display: block;
    margin: 0 0 10px;
  }
  .search :global(svg) {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-3);
  }
  .search .inp {
    padding-left: 38px;
  }
  .frow .d {
    flex: none;
    width: 4.2em;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .frow .v {
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  @media (max-width: 480px) {
    .frow .d {
      display: none;
    }
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(16px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(520px, calc(100vw - 32px));
    padding: 6px 8px 6px 14px;
    border-radius: 12px;
    background: var(--ink);
    color: var(--paper);
    box-shadow: 0 8px 24px var(--shadow);
  }
  .toast span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .toast .btn {
    flex: none;
    background: none;
    border-color: transparent;
    color: var(--paper);
    text-decoration: underline;
  }
  @media (max-width: 719px) {
    .toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>

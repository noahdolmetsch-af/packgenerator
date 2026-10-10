<script>
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
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { PAGE_NAMES } from '../lib/notes.js';
  import { TARGET, guessTarget, inboxGroups, filedRows, filedToday, FILED_FILTERS, targetHref } from '../lib/inbox.js';
  import { unfile } from '../lib/inboxdb.js';
  import { ICONS } from '../lib/inbox/icons.js';
  import { sortBikes } from '../lib/bikes.js';
  import { localDay } from '../lib/localday.js';
  import FileSheet from '../lib/inbox/FileSheet.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { flip } from '../lib/ui/flip.js';
  import { Check, Undo2, ChevronRight, Sparkles, Search } from '@lucide/svelte';

  let { onnew } = $props();

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());

  const today = localDay();
  const notes = $derived($notesQ ?? []);
  const groups = $derived(inboxGroups(notes, today));
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
    timer = setTimeout(() => (last = null), 10000);
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
  const remove = (n) => confirm(t('Delete the note "{text}"?', { text: (n.text ?? '').slice(0, 40) })) && db.notes.delete(n.id);

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

<div class="inbox">
  <header class="head">
    <div>
      <h1 class="title">{t('Inbox')}</h1>
      {#if $notesQ}<p class="page-sub">{tn(openN, '{n} open', '{n} open')}{todayN ? ` · ${tn(todayN, '{n} filed today', '{n} filed today')}` : ''} · {t('newest on top')}</p>{/if}
    </div>
    <div class="hr">
      <Seg label={t('Show')} value={view} options={[{ key: 'open', name: t('Open|inbox'), n: openN }, { key: 'filed', name: t('Filed'), n: filedAll }]} onchange={(v) => (view = v)} />
    </div>
  </header>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}

  {#if view === 'open'}
    {#if $notesQ && !notes.length}
      <p class="card empty">{t('No notes yet. Tap + at the bottom right on any page when something comes up.')}</p>
    {:else if $notesQ && !openN}
      <p class="card alldone" id="inbox-done" tabindex="-1"><Check size={18} aria-hidden="true" /><span>{t('All notes are sorted.')}</span><button type="button" class="btn sm" onclick={onnew}>+ {t('Quick note')}</button></p>
    {/if}
    {#each groups as g (g.key)}
      <h2 class="zlabel">{t(g.name)}</h2>
      <ul class="rowlist list" aria-label={t(g.name)}>
        {#each g.rows as n (n.id)}
          {@const sug = n.filed ? n.to?.kind : guessTarget(n)}
          {@const Icon = ICONS[sug] ?? ICONS.keep}
          <li class:filed={n.filed} data-note-id={n.id} animate:flip={{ duration: MOVE }}>
            <div class="lrow">
              {#if n.photo && !n.filed}
                <button type="button" class="th" onclick={() => (shown = n.photo)} aria-label={t('Open photo')}><img src={n.photo} alt="" /></button>
              {:else}
                <span class="ic"><Icon size={18} aria-hidden="true" /></span>
              {/if}
              <div class="m">
                <span class="t">{n.text}</span>
                {#if n.filed}
                  {@const href = targetHref(n.to, ctx)}
                  {#if href}<a class="tchip" {href}><Icon size={14} aria-hidden="true" />{chipText(n)}<ChevronRight size={14} aria-hidden="true" /></a>{:else}<span class="tchip">{chipText(n)}</span>{/if}
                  <span class="s">{t('filed {time} · goes to the archive tonight', { time: time(n.sortedAt) })}</span>
                {:else}
                  <span class="s">{when(n.at)}{where(n)}</span>
                  <span class="sug"><Sparkles size={13} aria-hidden="true" />{t('Suggestion: {what}', { what: t(TARGET[sug].name) })}</span>
                {/if}
              </div>
              <span class="acts">
                {#if n.filed}
                  <button type="button" class="undo" aria-label={t('Undo: back to the inbox')} title={t('Undo')} onclick={() => undo(n)}><Undo2 size={18} aria-hidden="true" /></button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => (filing = n)}>{t('File')}</button>
                  <details class="more">
                    <summary aria-label={t('More for this note')}>•••</summary>
                    <div class="more-in"><button type="button" class="btn sm" onclick={() => remove(n)}>{t('Delete')}</button></div>
                  </details>
                {/if}
              </span>
            </div>
          </li>
        {/each}
      </ul>
    {/each}
  {:else}
    <label class="search">
      <Search size={18} aria-hidden="true" />
      <span class="sr">{t('Search the filed entries')}</span>
      <input class="inp" type="search" bind:value={query} placeholder={t('Search: text, shop, bike, amount')} />
    </label>
    <div class="fchips" role="group" aria-label={t('Filter')}>
      {#each FILED_FILTERS as f (f.key)}<button type="button" class="fchip" aria-pressed={filter === f.key} onclick={() => (filter = f.key)}>{t(f.name)}</button>{/each}
    </div>
    {#if !filed.length}
      <p class="card empty">{query || filter !== 'all' ? t('Nothing found.') : t('Nothing filed yet.')}</p>
    {:else}
      <ul class="rowlist" aria-label={t('Filed')}>
        {#each filed as n (n.id)}
          {@const Icon = ICONS[n.to.kind] ?? ICONS.keep}
          {@const href = targetHref(n.to, ctx)}
          <li>
            <svelte:element this={href ? 'a' : 'div'} class="lrow frow" {href}>
              <span class="d num">{dayShort(n.at)}</span>
              <span class="ic"><Icon size={18} aria-hidden="true" /></span>
              <span class="m"><span class="t">{n.text}</span><span class="s">{chipText(n)}</span></span>
              {#if n.to.chf != null}<span class="v">{chf(n.to.chf)}</span>{/if}
              {#if href}<ChevronRight class="chev" size={18} aria-hidden="true" />{/if}
            </svelte:element>
          </li>
        {/each}
      </ul>
    {/if}
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
  .inbox {
    max-width: 880px;
    margin: 0 auto;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 12px;
    flex-wrap: wrap;
  }
  .hr {
    margin-top: 6px;
  }
  .err {
    color: var(--bad);
  }
  .empty {
    color: var(--ink-3);
  }
  .alldone {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    color: var(--ink-2);
  }
  .alldone :global(svg) {
    color: var(--accent);
  }
  .alldone span {
    flex: 1;
  }
  .list {
    overflow: visible;
  }
  .list .lrow {
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .list .m {
    flex: 1 1 180px;
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
    width: 44px;
    height: 52px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--line);
  }
  .sug {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 2px;
    color: var(--accent);
    font-size: var(--fs-small);
  }
  .acts {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  /* A filed entry stays in its place until midnight, faint, with the chip where it went. */
  .filed .t {
    font-weight: 400;
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .filed .ic {
    opacity: 0.7;
  }
  .tchip {
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
  .undo {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .undo:hover {
    background: var(--paper-2);
  }
  .more {
    position: relative;
  }
  .more summary {
    list-style: none;
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border-radius: 8px;
    color: var(--ink-2);
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more-in {
    position: absolute;
    z-index: 3;
    top: calc(100% + 4px);
    right: 0;
    padding: 8px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 8px;
    width: max-content;
  }
  .search {
    position: relative;
    display: block;
    margin: 4px 0 10px;
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
  .fchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
  }
  .fchip {
    min-height: 44px;
    padding: 4px 14px;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .frow .d {
    flex: none;
    width: 4.2em;
    color: var(--ink-3);
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

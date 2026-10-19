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
   * Impeccable (Noah 18.10.2026 «alle a-d umsetzen»): the row's button names the suggestion («Als Problem am
   * Velo ablegen», «Auf die Wunschliste», «Einfach behalten» …) and opens that target's form straight away;
   * «Einfach behalten» files with one tap (toast with «Rückgängig»). The 7 targets: ••• › «Woanders ablegen …».
   * Impeccable Runde 2: «Today», «Yesterday» and «This week» open, «Earlier · n notes» folded («Older notes. Open
   * them when you have time.»); the head says calmly «Filed today: 3 of 25».
   */
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { PAGE_NAMES } from '../lib/notes.js';
  import { TARGET, LANDS, guessTarget, guessTopic, inboxGroups, filedRows, filedToday, FILED_FILTERS, targetHref } from '../lib/inbox.js';
  import { unfile, fileTo } from '../lib/inboxdb.js';
  import { ICONS } from '../lib/inbox/icons.js';
  import { sortBikes } from '../lib/bikes.js';
  import { localDay } from '../lib/localday.js';
  import FileSheet from '../lib/inbox/FileSheet.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import '../lib/ich/ich.css';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { flip } from '../lib/ui/flip.js';
  import { Check, Undo2, ChevronRight, ChevronDown, Search, Shuffle, Plus, Lightbulb, Trash2, Inbox } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import OwnSpark from '../lib/clear/OwnSpark.svelte';
  import ListBar from '../lib/list/ListBar.svelte';
  import ListGroup from '../lib/list/ListGroup.svelte';
  import TopButton from '../lib/list/TopButton.svelte';
  import { byMonthOf } from '../lib/list/listen.js';
  import Btn from '../lib/ui/Btn.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import { explain } from '../lib/ui/explain.js';
  // «Mail in die App» (Noah 19.10.2026): mails, Google tasks and #pack appointments come into the Eingang; the
  // attachments of a mail each get their own button (Dokumente, Termin, Tour, Rechnung, Kontakt)
  import { Mail, Paperclip, RefreshCw, ListTodo, CalendarDays, Bookmark, FileText, Copy } from '@lucide/svelte';
  import { fetchOutside, intake } from '../lib/mail/intake.svelte.js';
  import { fileAction, tipOf, SENDERS_KEY } from '../lib/mailin.js';
  import { onMount } from 'svelte';

  let { onnew } = $props();

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const rulesQ = liveQuery(async () => (await db.settings.get(SENDERS_KEY))?.value ?? {});
  const rules = $derived($rulesQ ?? {});
  onMount(() => {
    fetchOutside().catch(() => {});
  });
  async function fetchNow() {
    msg = '';
    const n = await fetchOutside({ force: true });
    msg = intake.error && !n ? t('Gmail could not be reached. Connect it under Me › Mail.') : n ? tn(n, '{n} new entry came in.', '{n} new entries came in.') : t('Nothing new.');
  }
  /** One attachment's button: what it becomes. */
  const FILE_BTN = { doc: 'Into Documents', event: 'As appointment', route: 'As trip or ride', bill: 'As bill to pay', contact: 'Into the note' };
  const FILE_DONE = { doc: 'In Documents', event: 'In the calendar', route: 'Opened', bill: 'In «To pay»', contact: 'In the note' };
  let fileBusy = $state('');
  async function fileFile(n, f) {
    const act = fileAction(f, n.text);
    if (act === 'bill') return ((start = 'bill'), fileSheet(n, true));
    msg = '';
    fileBusy = `${n.id}:${f.id}`;
    try {
      const m = await import('../lib/inbox/filemore.js');
      const note = $state.snapshot(n);
      if (act === 'doc') await m.fileToDoc(note, f.id);
      else if (act === 'event') await m.fileIcs(note, f.id);
      else if (act === 'contact') await m.fileContact(note, f.id);
      else if (act === 'route') location.hash = await m.routeOf(note, f.id);
    } catch (err) {
      msg = t(err.message) || t('This could not be saved.');
    } finally {
      fileBusy = '';
    }
  }
  const SOURCE = { mail: Mail, tasks: ListTodo, calendar: CalendarDays, web: Bookmark, docs: FileText };
  // round 4 «1a»: the Mac bookmark: one click sends the open web page (title and address) into the Eingang
  const appBase = `${location.origin}${location.pathname}`;
  const bookmarklet = `javascript:(()=>{window.open('${appBase}?to=inbox&title='+encodeURIComponent(document.title)+'&url='+encodeURIComponent(location.href),'_blank')})()`;
  let copied = $state(false);
  async function copyBookmark() {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      copied = true;
    } catch {
      msg = t('Copying did not work here. Drag the button into the bookmarks bar instead.');
    }
  }
  let start = $state(null);

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

  // Impeccable Runde 2: the older notes folded; a search for a note there is not needed (they stay one tap away)
  let olderOpen = $state(false);
  const progressLine = $derived(todayN + openN ? t('Filed today: {n} of {total}', { n: todayN, total: todayN + openN }) : '');

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
  let direct = $state(false); // true: the sheet opens on the suggested target's form, the 7 targets folded
  /** Impeccable: the row's button names the suggestion (German in de/impeccable-ich.js, pflege.js). */
  const BTN = { receipt: 'File as receipt', problem: 'File as bike problem', material: 'Into Gear', wish: 'Onto the wishlist', idea: 'Save as idea', tour: 'To the trip note', newtrip: 'Make a trip of it', bill: 'As bill to pay', event: 'As appointment', task: 'As task', doc: 'Into Documents', list: 'Onto a list', keep: 'Just keep' };
  /** 3a: the tip in the row («Sieht aus wie eine Rechnung»); never moves anything. */
  function tipLine(n) {
    const tip = tipOf(n, { trips, rules });
    if (!tip) return '';
    const d = (x) => (x ? x.split('-').reverse().join('.') : '');
    if (tip.kind === 'booking') return `${t('Looks like a booking')}${tip.booking.day ? ` · ${d(tip.booking.day)}` : ''}${tip.trip ? ` · ${t('for the trip «{name}»', { name: tip.trip.title })}` : ''}`;
    if (tip.kind === 'bill') return `${t('Looks like a bill')}${tip.deadline?.day ? ` · ${t('due {day}', { day: d(tip.deadline.day) })}` : ''}`;
    if (tip.kind === 'deadline') return t('Deadline: {day}', { day: d(tip.deadline.day) });
    if (tip.kind === 'sender') return t('You filed this sender like this twice.');
    return '';
  }
  const fileSheet = (n, straight) => ((direct = straight), (filing = n));
  const closeSheet = () => ((filing = null), (start = null));
  /** «Einfach behalten» needs no form: it becomes a note with the guessed topic, Undo in the toast. */
  async function keep(n) {
    msg = '';
    try {
      filedNow(await fileTo($state.snapshot(n), 'keep', { topic: guessTopic(n.text ?? '') }));
    } catch (err) {
      msg = t(err.message) || t('This note could not be sorted.');
    }
  }
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
    const base = to.kind === 'receipt' ? t('Receipt|chip') : to.kind === 'problem' ? t('Bike care') : to.kind === 'keep' ? t('Notes') : TARGET[to.kind] ? t(TARGET[to.kind].name) : t(OLD[to.kind] ?? 'Filed');
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
          <div class="ich-h"><div><h2 id="tofile-h">{t('To file')}</h2><p class="ich-hs">{progressLine ? `${progressLine} · ` : ''}{t('The button names the suggestion · ••• for other targets')}</p></div></div>
          {#if $notesQ && !notes.length}
            <!-- v0.127.0 A-U2: the one empty building block -->
            <Empty icon={Inbox} title={t('Nothing to file')} text={t('No notes yet. Tap + at the top › Note when something comes up on the way.')} action={{ label: t('Write a note'), onclick: onnew }} />
          {:else if $notesQ && !openN}
            <p class="card alldone" id="inbox-done" tabindex="-1"><Check size={18} aria-hidden="true" /><span>{t('All notes are sorted.')}</span><button type="button" class="btn sm" onclick={onnew}>+ {t('Quick note')}</button></p>
          {/if}
          {#snippet rows(g)}
            <ul class="card ich-list list" aria-label={t(g.name)}>
              {#each g.rows as n (n.id)}
                {@const sug = guessTarget(n, { trips, rules })}
                {@const Icon = SOURCE[n.page] ?? ICONS[sug] ?? ICONS.keep}
                {@const tip = n.mail || n.page === 'tasks' ? tipLine(n) : ''}
                <li data-note-id={n.id} animate:flip={{ duration: MOVE }}>
                  <div class="ich-row ich-wrap nrow">
                    {#if n.photo}
                      <button type="button" class="th" onclick={() => (shown = n.photo)} aria-label={t('Open photo')}><img src={n.photo} alt="" /></button>
                    {:else}
                      <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                    {/if}
                    <span class="ich-m">
                      {#if n.mail}
                        <b>{n.mail.subject || n.text}</b>
                        <small>{t('Mail from {name}', { name: n.mail.fromName || n.mail.from })} · {when(n.mail.date ?? n.at)}</small>
                      {:else}
                        <b>{n.text}</b>
                        <small>{when(n.at)}{where(n)}</small>
                      {/if}
                      {#if tip}<small class="tipl">{tip}</small>{/if}
                      {#if n.files?.length}
                        <span class="files" role="group" aria-label={t('Attachments')}>
                          {#each n.files as f (f.id)}
                            {@const act = fileAction(f, n.text)}
                            {#if f.done}
                              <span class="fchip done"><Check size={14} aria-hidden="true" />{f.name} · {t(FILE_DONE[f.done] ?? 'Done|filed')}</span>
                            {:else if act}
                              <button type="button" class="fchip" disabled={fileBusy === `${n.id}:${f.id}`} onclick={() => fileFile(n, f)}><Paperclip size={14} aria-hidden="true" /><span class="fn">{f.name}</span><b>{t(FILE_BTN[act])}</b></button>
                            {/if}
                          {/each}
                        </span>
                      {/if}
                      {#if n.mail?.skipped?.length}<small>{t('Still only in Gmail (too big): {names}', { names: n.mail.skipped.join(', ') })}</small>{/if}
                    </span>
                    <!-- Impeccable: the button names the suggestion and goes straight to its form; ••• › «File elsewhere …» -->
                    <span class="acts rowacts">
                      <Btn label={t(BTN[sug])} explain={sug === 'keep' ? t('Becomes a note in «Notes», with one tap') : t(LANDS[sug])} sub={t('Suggestion of the app')} class="sm go" data-target={sug} onclick={() => (sug === 'keep' ? keep(n) : fileSheet(n, true))} />
                      <MoreActions small title={n.text} label={t('More for this note')} actions={[
                        { name: t('File elsewhere …'), explain: t('Choose another target yourself'), icon: Shuffle, run: () => fileSheet(n, false) },
                        { name: t('Delete'), explain: explain('Delete'), icon: Trash2, run: () => remove(n) },
                      ]} />
                    </span>
                  </div>
                </li>
              {/each}
            </ul>
          {/snippet}
          {#each groups as g (g.key)}
            {#if g.key === 'older' && groups.length > 1}
              <!-- Impeccable Runde 2: the older notes folded; what is new stays in front -->
              <details class="older" bind:open={olderOpen}>
                <summary class="day osum"><span class="ich-m"><b>{t('Earlier')} · {tn(g.rows.length, '{n} note', '{n} notes')}</b><small>{t('Older notes. Open them when you have time.')}</small></span><ChevronDown class="ochev" size={18} aria-hidden="true" /></summary>
                {#if olderOpen}{@render rows(g)}{/if}
              </details>
            {:else}
              <h3 class="day">{t(g.name)}</h3>
              {@render rows(g)}
            {/if}
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
        <!-- «Mail in die App»: where else entries come from, and «Jetzt holen» -->
        <section class="ich-sec" aria-labelledby="outside-h">
          <div class="ich-h"><div><h2 id="outside-h">{t('From outside')}</h2><p class="ich-hs">{t('comes in by itself when this page opens')}</p></div>
            <button type="button" class="ib" aria-label={t('Fetch now')} disabled={!!intake.busy} onclick={fetchNow}><RefreshCw size={16} aria-hidden="true" /></button></div>
          <ul class="card ich-list">
            <li><a class="ich-row" href="#/me/mail"><span class="ich-ib"><Mail size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Gmail label «Packgenerator»')}</b><small>{t('Give a mail this label, or forward it to your +pack address')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
            <li><div class="ich-row"><span class="ich-ib"><ListTodo size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Google task list «Packgenerator»')}</b><small>{t('Open tasks there come in, e.g. said to the phone')}</small></span></div></li>
            <li><div class="ich-row"><span class="ich-ib"><CalendarDays size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Appointments with #pack')}</b><small>{t('An appointment with «#pack» in the title becomes a trip suggestion')}</small></span></div></li>
            <li><div class="ich-row ich-wrap"><span class="ich-ib"><Bookmark size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Bookmark «Into the Inbox» (computer)')}</b><small>{t('Drag the button into the bookmarks bar of Chrome. A click on it sends the open page here.')}</small>
              <span class="bm"><!-- svelte-ignore a11y_invalid_attribute --><a class="btn sm" href={bookmarklet} onclick={(e) => e.preventDefault()} draggable="true">{t('Into the Inbox')}</a><button type="button" class="btn sm" onclick={copyBookmark}><Copy size={14} aria-hidden="true" />{copied ? t('Copied') : t('Copy as address')}</button></span></span></div></li>
          </ul>
        </section>
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
  <FileSheet note={filing} {direct} {bikes} {trips} {rules} {start} visits={ctx.visits} onclose={closeSheet} onfiled={filedNow} />
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
  /* «Jetzt holen»: a full-size tap target (Wächter) */
  .ib {
    display: inline-grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: inherit;
    border-radius: var(--r-s, 8px);
    cursor: pointer;
  }
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
  /* Impeccable Runde 2: «Earlier · n notes», folded; the chevron turns when open */
  .older {
    margin-top: 14px;
  }
  .osum {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    margin: 0 0 6px;
    padding: 6px 2px;
    cursor: pointer;
    list-style: none;
  }
  .osum::-webkit-details-marker {
    display: none;
  }
  .osum b {
    color: var(--ink);
  }
  .osum :global(.ochev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.18s ease-out;
  }
  .older[open] .osum :global(.ochev) {
    transform: rotate(180deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .osum :global(.ochev) {
      transition: none;
    }
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
  /* Impeccable: the button that names the suggestion: about 200 px on a computer, text left on a phone */
  .list .nrow :global(.rowacts > .btn.go) {
    min-width: 200px;
  }
  @media (max-width: 719px) {
    .list .nrow :global(.rowacts > .btn.go) {
      min-width: 0;
      justify-content: flex-start;
    }
  }
  .bm {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .tipl {
    color: var(--ok);
  }
  .files {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0 2px;
  }
  .fchip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    min-height: 44px;
    padding: 4px 12px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 400 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .fchip .fn {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 14em;
    color: var(--ink-2);
  }
  .fchip.done {
    border-color: transparent;
    background: var(--accent-soft);
    color: var(--ok);
    cursor: default;
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

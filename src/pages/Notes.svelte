<script>
  import CameraButton from '../lib/ui/CameraButton.svelte'; // P3b Teil 3: the camera wherever a photo is added
  /**
   * Notizen (v0.48.0, Noah 12a-17a): the notes kept in the app; the Eingang is the other half
   * (the toggle top right). Quick capture with text, dictation (where the browser can), photo, link
   * and checklist; the topic follows the text (5 fixed topics, #tags on top); at most 3 pinned;
   * a side list of filters (topics, what a note holds), a search; the cards newest first.
   * A card opens the note (NoteSheet), with «Aus Notiz wird …». Notes are in the normal backup;
   * «Als Markdown exportieren» saves them as one text file.
   * Impeccable Runde 2: with no note yet the search and the chips stay away; the empty card says what lands here
   * and leads to the Inbox when notes wait there. A chip shows only when it finds at least one note (the chosen
   * one stays). On a phone «Save» sits right in the tool row, «Dictate» is the microphone alone (named for
   * screen readers).
   */
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import ListTable from '../lib/ui/ListTable.svelte';
  import { savedView, saveView } from '../lib/listtable.js';
  import { TOPICS } from '../lib/notebook.js';
  import { phone } from '../lib/media.svelte.js';
  import { guessTopic, noteTopic, topicText, FILTERS, noteList, filterCounts, newKeptNote, noteTitle, progress, notesMarkdown, linkFrom, tagsOf, MAX_PINNED, noteStats } from '../lib/notebook.js';
  import { sortBikes } from '../lib/bikes.js';
  import { shrinkImage } from '../lib/photo.js';
  import { localDay } from '../lib/localday.js';
  import NoteSheet from '../lib/notes/NoteSheet.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { Mic, Camera, Link2, ListChecks, Search, Inbox, ChevronRight, Download, Check, Star, Image as ImageIcon, NotebookPen, Pencil, ChartColumn } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { NOTE_TPL_KEY, templatesOf, tplName, tplText, renameTemplate, removeTemplate, qrToNote, isKeepNote, keepImport } from '../lib/noteformats.js';
  import { zipEntries } from '../lib/zipread.js';
  import { deleteWithUndo } from '../lib/ui/ask.js';
  import { QrCode, FileInput, LayoutTemplate, Trash2 } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const notes = $derived($notesQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const names = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const counts = $derived(filterCounts(notes));
  const stats = $derived(noteStats(notes, localDay())); // Paket N #10: the small evaluation
  const inboxN = $derived(notes.filter((n) => n.status === 'open').length);

  // Paket N N10 templates, N7 QR code, N13 Google Keep (Noah 19.10.2026 «4a», «5b und a»)
  const tplQ = liveQuery(() => db.settings.get(NOTE_TPL_KEY));
  const tpls = $derived(templatesOf($tplQ?.value));
  const saveTpls = (list) => db.settings.put({ key: NOTE_TPL_KEY, value: $state.snapshot(list) });
  function useTpl(x) {
    text = tplText(x, t);
    checkMode = /(^|\n)- /.test(text);
  }
  let renaming = $state(null);
  let renameTo = $state('');
  async function dropTpl(x) {
    const before = $state.snapshot(tpls);
    const name = tplName(x, t);
    await deleteWithUndo({ run: async () => (await saveTpls(removeTemplate(before, x.key)), before), undo: (snap) => saveTpls(snap), text: t('"{name}" deleted.', { name }), name });
  }
  async function scanQr(e) {
    const f = e.currentTarget.files[0];
    e.currentTarget.value = '';
    if (!f) return;
    msg = '';
    if (!('BarcodeDetector' in window)) return (msg = t('This browser cannot read QR codes. On the phone (Chrome) it works.'));
    try {
      const codes = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(await createImageBitmap(f));
      if (!codes.length) return (msg = t('No QR code found in this picture.'));
      const q = qrToNote(codes[0].rawValue);
      text = [q.title, q.text].filter(Boolean).join('\n');
      if (q.link) ((linkOpen = true), (linkUrl = q.link.url), (linkTitle = q.link.title));
      saved = t('QR code read. Check the note and save it.');
      setTimeout(() => (saved = ''), 4000);
    } catch {
      msg = t('The picture could not be read.');
    }
  }
  let keepMsg = $state('');
  let keepBusy = $state(false);
  async function keepFiles(e) {
    const files = [...e.currentTarget.files];
    e.currentTarget.value = '';
    if (!files.length) return;
    keepBusy = true;
    keepMsg = '';
    const jsons = [];
    try {
      for (const f of files) {
        if (/\.zip$/i.test(f.name)) {
          for (const en of await zipEntries(f, (n) => /keep\/[^/]+\.json$/i.test(n))) {
            try {
              jsons.push(JSON.parse(await en.text()));
            } catch {
              /* not a note */
            }
          }
        } else if (/\.json$/i.test(f.name)) {
          try {
            jsons.push(JSON.parse(await f.text()));
          } catch {
            /* not a note */
          }
        }
      }
      const notesNow = await db.notes.toArray();
      const r = keepImport(jsons.filter(isKeepNote), notesNow);
      if (r.add.length) await db.notes.bulkPut(r.add);
      keepMsg = r.add.length || r.already ? t('{n} notes taken over from Google Keep, {old} were already here.', { n: r.add.length, old: r.already }) : t('No Keep note found. Choose the .zip from Google Takeout or the .json files in its «Keep» folder.');
    } catch {
      keepMsg = t('This file could not be read. Choose the .zip from Google Takeout or the .json files in its «Keep» folder.');
    } finally {
      keepBusy = false;
    }
  }

  // Paket H «3a und b»: the shared table (ListTable), remembered on this device
  let tableOn = $state(savedView('notes') === 'table');
  const setTable = (on) => ((tableOn = on), saveView('notes', on ? 'table' : 'list'));
  const noteCols = $derived([
    { key: 'title', label: t('Title'), type: 'text', bulk: false, get: (n) => noteTitle(n) },
    { key: 'topic', label: t('Topic'), type: 'select', get: (n) => noteTopic(n), options: TOPICS.map((x) => ({ key: x.key, name: topicText(x.key, t) })) },
    { key: 'pinned', label: t('Pinned'), type: 'check', width: '6em', readOnly: true }, // at most 3: pinned in the note itself
    { key: 'created', label: t('Date'), type: 'text', readOnly: true, get: (n) => String(n.createdAt ?? '').slice(0, 10) },
  ]);
  async function delNotes(rows) {
    const ids = rows.map((r) => r.id);
    return db.transaction('rw', db.notes, async () => {
      const before = (await db.notes.bulkGet(ids)).filter(Boolean);
      await db.notes.bulkDelete(ids);
      return before;
    });
  }
  let filter = $state('all');
  let query = $state('');
  const list = $derived(noteList(notes, { filter, query }));
  // Impeccable Runde 2: only chips that find something (and the chosen one, so it can be switched back)
  const shows = (f) => f.key === 'all' || f.key === filter || counts[f.key] > 0;
  const pinned = $derived(filter === 'all' && !query ? list.filter((n) => n.pinned) : []);
  const rest = $derived(filter === 'all' && !query ? list.filter((n) => !n.pinned) : list);

  // Capture.
  let text = $state('');
  let photo = $state(null);
  let linkOpen = $state(false);
  let linkTitle = $state('');
  let linkUrl = $state('');
  let checkMode = $state(false);
  let dictated = $state(false);
  let msg = $state('');
  let saved = $state('');
  const topicNow = $derived(guessTopic(`${text} ${linkTitle}`));
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition ?? window.webkitSpeechRecognition : null;
  let rec = null;
  let listening = $state(false);
  function dictate() {
    if (!SR) return;
    if (listening) return rec?.stop();
    rec = new SR();
    rec.lang = locale() === 'de-CH' ? 'de-CH' : 'en-GB';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = [...e.results].map((r) => r[0].transcript).join(' ').trim();
      if (said) text = text ? `${text} ${said}` : said;
      dictated = true;
    };
    rec.onend = () => (listening = false);
    rec.onerror = () => ((listening = false), (msg = t('Dictation did not work. Type instead.')));
    listening = true;
    rec.start();
  }
  async function addPhoto(e) {
    const f = e.currentTarget.files[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      photo = await shrinkImage(f, 1200, 0.8);
    } catch (err) {
      msg = err.message || t('This photo could not be read.');
    }
  }
  function startList() {
    checkMode = true;
    if (!/(^|\n)- /.test(text)) text = `${text}${text ? '\n' : ''}- `;
  }
  async function save() {
    msg = '';
    let link = null;
    if (linkOpen && linkUrl.trim()) {
      link = linkFrom(linkUrl.trim());
      if (!link) return (msg = t('This is not a web address.'));
      link = { title: linkTitle.trim() || link.title, url: link.url };
    }
    if (!text.trim() && !photo && !link) return (msg = t('Write a few words, add a photo or a link.'));
    const n = newKeptNote({ text, photo, link, dictated }, { id: `note-${Date.now().toString(36)}` });
    await db.notes.put(n);
    text = '';
    photo = null;
    linkOpen = false;
    linkTitle = '';
    linkUrl = '';
    checkMode = false;
    dictated = false;
    saved = t('Saved under {topic}.', { topic: topicText(noteTopic(n), t) });
    setTimeout(() => (saved = ''), 4000);
  }

  let open = $state(null);
  let made = $state('');
  const openNote = $derived(open ? notes.find((n) => n.id === open) : null);

  function exportMd() {
    const md = notesMarkdown(notes, { topicName: (k) => (k === '__title' ? t('Notes') : k === '__pinned' ? t('pinned') : topicText(k, t)), bikeName: (id) => names[id] ?? '', today: localDay() });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    a.download = `notizen-${localDay()}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const dayShort = (iso) => (iso ? (iso.slice(0, 10) === localDay() ? t('today') : new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })) : '');
</script>

<!-- Design-Refresh P9 (I5, Noah 12.10.2026 «Runde 19 freigegeben»): the path back to Ich, on top the bar to
     write (photo, link, checklist, dictate, save); left «Pinned» and «All, newest first» as rows (what a
     note holds in one quiet line, one tap opens it with its checklist); right the search, the topics
     and what a note holds as chips with counts, and «More» (Inbox, export as Markdown). -->
<div class="notes ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Notes')} sub={`${t('Kept notes, topics and checklists')} · ${t('also in the normal backup')}`} />

  <!-- Hinweistexte HT 3a (Noah 14.10.2026): the card «Was hier steht» -->
  <HintCard page="notes" />
  <form class="cap card" onsubmit={(e) => (e.preventDefault(), save())}>
    <div class="caprow">
      <label class="capt"><span class="sr">{t('New note')}</span><textarea class="inp" rows={checkMode ? 4 : 1} bind:value={text} placeholder={t('Thought, link, photo …')}></textarea></label>
      <div class="tools">
        <CameraButton onchange={addPhoto} icon />
        <label class="tb" aria-label={t('Add a photo')}><ImageIcon size={18} aria-hidden="true" /><input type="file" accept="image/*" hidden onchange={addPhoto} /></label>
        <button type="button" class="tb" aria-pressed={linkOpen} aria-label={t('Add a link')} onclick={() => (linkOpen = !linkOpen)}><Link2 size={18} aria-hidden="true" /></button>
        <button type="button" class="tb" aria-pressed={checkMode} aria-label={t('Checklist')} onclick={startList}><ListChecks size={18} aria-hidden="true" /></button>
        <label class="tb" aria-label={t('Scan a QR code')} data-scan-qr><QrCode size={18} aria-hidden="true" /><input type="file" accept="image/*" capture="environment" hidden onchange={scanQr} /></label>
        {#if SR}<button type="button" class="tb" aria-pressed={listening} aria-label={listening ? t('Stop dictation') : t('Dictate')} title={listening ? t('Stop dictation') : t('Dictate')} onclick={dictate}><Mic size={18} aria-hidden="true" /></button>{/if}
        <button type="submit" class="btn hi save">{t('Save')}</button>
      </div>
    </div>
    {#if linkOpen}
      <div class="two">
        <input class="inp" type="url" bind:value={linkUrl} placeholder="https://…" aria-label={t('Web address')} />
        <input class="inp" type="text" bind:value={linkTitle} placeholder={t('Title (optional)')} aria-label={t('Title of the link')} />
      </div>
    {/if}
    {#if photo}<p class="phrow"><img src={photo} alt={t('Photo of the note')} /><button type="button" class="btn btn-link" onclick={() => (photo = null)}>{t('Remove photo')}</button></p>{/if}
    {#if !text.trim()}
      <p class="tpls" data-templates><span class="hint">{t('Start from')}</span>{#each tpls as x (x.key)}<button type="button" class="fchip" onclick={() => useTpl(x)}>{tplName(x, t)}</button>{/each}</p>
    {/if}
    <p class="tools hintrow"><span class="hint">{text.trim() ? t('Topic: {topic}', { topic: topicText(topicNow ?? '', t) }) : t('The topic follows the text')}</span></p>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    {#if saved}<p class="ok" role="status"><Check size={16} aria-hidden="true" />{saved}</p>{/if}
  </form>

  {#snippet row(n)}
    {@const p = progress(n)}
    {@const Kind = n.pinned ? Star : p.total && p.done === p.total ? Check : p.total ? ListChecks : n.link?.url ? Link2 : n.photo ? ImageIcon : NotebookPen}
    <li class="ncard" data-note-id={n.id}>
      <button type="button" class="ich-row open" onclick={() => (open = n.id)}>
        <span class="ich-ib"><Kind size={18} aria-hidden="true" /></span>
        <span class="ich-m">
          <b>{noteTitle(n) || t('Note')}</b>
          <small>{[dayShort(n.editedAt ?? n.at), p.total ? `${t('Checklist')} · ${t('{done} of {total} done', p)}` : n.link?.url ? t('Link') : n.photo ? t('Photo') : '', `${t('Topic')} ${topicText(noteTopic(n), t)}`, n.bikeId && names[n.bikeId] ? names[n.bikeId] : '', ...tagsOf(n.text).map((tg) => `#${tg}`)].filter(Boolean).join(' · ')}</small>
        </span>
        <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
      </button>
    </li>
  {/snippet}

  <div class="ich-cols">
    <div class="ich-main">
      {#if $notesQ && !counts.all}
        <!-- v0.127.0 A-U2: the one empty building block; Impeccable Runde 2: the way to the Inbox when notes wait there -->
        <div class="nonote">
          {#if inboxN}
            <Empty icon={NotebookPen} text={`${t('No notes yet. What you want to keep lands here.')} ${tn(inboxN, '{n} note is waiting in the Inbox.', '{n} notes are waiting in the Inbox.')}`} action={{ label: t('To the Inbox ({n})', { n: inboxN }), href: '#/inbox' }} />
          {:else}
            <Empty icon={NotebookPen} text={t('No notes yet. Write one above, or keep an entry from the Inbox with «Just keep».')} />
          {/if}
        </div>
      {/if}
      <!-- Paket H «3a und b»: the notes as an editable table; tick several to change the topic or delete them -->
      {#if counts.all}<p class="tblrow"><button type="button" class="btn btn-link" aria-pressed={tableOn} onclick={() => setTable(!tableOn)} data-note-table>{tableOn ? t('Done') : phone.matches ? t('Change several') : t('Edit as a table')}</button></p>{/if}
      {#if tableOn && counts.all}
        <ListTable rows={list} cols={noteCols} nameOf={(n) => noteTitle(n) || t('Note')} onsave={(pairs) => db.notes.bulkPut(pairs.map((p) => ({ ...p.after, updatedAt: new Date().toISOString() })))} ondelete={delNotes} onrestore={(before) => db.notes.bulkPut(before)} onopen={(n) => (open = n.id)} label={t('Notes')} search={false} />
      {:else}
      {#if pinned.length}
        <section class="ich-sec" aria-labelledby="pin-h">
          <div class="ich-h"><div><h2 id="pin-h">{t('Pinned')} <small class="n num">{pinned.length}/{MAX_PINNED}</small></h2></div></div>
          <ul class="card ich-list">{#each pinned as n (n.id)}{@render row(n)}{/each}</ul>
        </section>
      {/if}
      {#if rest.length}
        <section class="ich-sec" aria-labelledby="all-h">
          <div class="ich-h"><div><h2 id="all-h">{filter === 'all' && !query ? t('All, newest first') : t('{n} found', { n: rest.length })}</h2></div></div>
          <ul class="card ich-list">{#each rest as n (n.id)}{@render row(n)}{/each}</ul>
        </section>
      {:else if counts.all && !pinned.length}
        <div class="nonote"><Empty icon={Search} text={t('Nothing found.')} /></div>
      {/if}
      {/if}
    </div>

    {#if counts.all}
    <div class="ich-side">
      <div class="card ich-body srch">
        <label class="search">
          <Search size={18} aria-hidden="true" />
          <span class="sr">{t('Search the notes')}</span>
          <input class="inp" type="search" bind:value={query} placeholder={t('Search: text, link, checklist')} />
        </label>
      </div>

      <section class="ich-sec" aria-labelledby="topics-h">
        <div class="ich-h"><div><h2 id="topics-h">{t('Topics')}</h2><p class="ich-hs">{t('The topic follows the text')}</p></div><a class="ich-edit" href="#/me/lists?noteTopics"><Pencil size={14} aria-hidden="true" />{t('Edit topics')}</a></div>
        <div class="card ich-body fl" role="group" aria-label={t('Filter')}>
          {#each FILTERS.filter((f) => !f.has && (!f.none || counts[f.key]) && shows(f)) as f (f.key)}
            <button type="button" class="fchip" aria-pressed={filter === f.key} onclick={() => (filter = f.key)}>{#if f.topic}<i class="dot t-{f.topic}" aria-hidden="true"></i>{/if}{f.raw ? f.name : t(f.name)} · <span class="num">{counts[f.key]}</span></button>
          {/each}
          {#if FILTERS.some((f) => f.has && shows(f))}<p class="fh">{t('Holds')}</p>{/if}
          {#each FILTERS.filter((f) => f.has && shows(f)) as f (f.key)}
            <button type="button" class="fchip" aria-pressed={filter === f.key} onclick={() => (filter = f.key)}>{t(f.name)} · <span class="num">{counts[f.key]}</span></button>
          {/each}
        </div>
      </section>

      {#if counts.all}
        <!-- Paket N #10 (19.10.2026): what the notes hold, at a glance; a #tag searches for it -->
        <section class="ich-sec" aria-labelledby="nstat-h" data-note-stats>
          <div class="ich-h"><div><h2 id="nstat-h"><ChartColumn size={16} aria-hidden="true" /> {t('At a glance|notes')}</h2><p class="ich-hs">{t('A tap on a #tag searches for it')}</p></div></div>
          <div class="card ich-body nst">
            <p>{tn(stats.month, '{n} note this month', '{n} notes this month')} · {tn(stats.total, '{n} in total', '{n} in total')}</p>
            {#if stats.openLists}<p>{t('{points} open points in {lists} checklists', { points: stats.openPoints, lists: stats.openLists })}{#if stats.oldestOpen} · <button type="button" class="btn-link" onclick={() => (open = stats.oldestOpen.id)}>{t('oldest: {name}', { name: stats.oldestOpen.title || t('Note') })}</button>{/if}</p>{/if}
            {#if stats.linked}<p>{tn(stats.linked, '{n} note linked with others', '{n} notes linked with others')}</p>{/if}
            {#if stats.topTags.length}
              <div class="fl">{#each stats.topTags as x (x.tag)}<button type="button" class="fchip" aria-pressed={query === `#${x.tag}`} onclick={() => (query = query === `#${x.tag}` ? '' : `#${x.tag}`)}>#{x.tag} · <span class="num">{x.n}</span></button>{/each}</div>
            {:else}<p class="fh">{t('Write #word in a note to group notes by it.')}</p>{/if}
          </div>
        </section>
      {/if}

      <details class="ich-sec tplman" data-template-list>
        <summary><LayoutTemplate size={16} aria-hidden="true" /> {t('Templates')} <small class="n num">{tpls.length}</small></summary>
        <ul class="card ich-list">
          {#each tpls as x (x.key)}
            <li class="tplrow">
              {#if renaming === x.key}
                <form class="tplrn" onsubmit={(e) => (e.preventDefault(), saveTpls(renameTemplate(tpls, x.key, renameTo, t)), (renaming = null))}>
                  <input class="inp" type="text" maxlength="40" bind:value={renameTo} aria-label={t('New name of the template')} />
                  <button type="submit" class="btn sm hi">{t('Save')}</button>
                </form>
              {:else}
                <span class="tpln">{tplName(x, t)}</span>
                <button type="button" class="tb" aria-label={t('Rename {name}', { name: tplName(x, t) })} onclick={() => ((renaming = x.key), (renameTo = tplName(x, t)))}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" class="tb" aria-label={t('Remove {name}', { name: tplName(x, t) })} onclick={() => dropTpl(x)}><Trash2 size={16} aria-hidden="true" /></button>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="ich-help">{t('Your own: open a note and tap «Save as a template».')}</p>
      </details>

      <section class="ich-sec" aria-labelledby="nmore-h">
        <div class="ich-h"><div><h2 id="nmore-h">{t('More')}</h2></div></div>
        <ul class="card ich-list">
          <li><a class="ich-row" href="#/inbox"><span class="ich-ib"><Inbox size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Inbox')}</b><small>{tn(inboxN, '{n} to file', '{n} to file')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
          <li>
            <label class="ich-row keepin" data-keep-import>
              <span class="ich-ib"><FileInput size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{keepBusy ? t('Reading …') : t('Take over from Google Keep')}</b><small>{t('takeout.google.com › only «Keep» › download, then choose the .zip here')}</small></span>
              <input type="file" accept=".zip,.json,application/zip,application/json" multiple hidden onchange={keepFiles} />
            </label>
            {#if keepMsg}<p class="ich-help" role="status">{keepMsg}</p>{/if}
          </li>
          {#if counts.all}<li><button type="button" class="ich-row" onclick={exportMd}><span class="ich-ib"><Download size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Export as Markdown')}</b><small>{t('The notes are also in the normal backup.')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>{/if}
        </ul>
      </section>
    </div>
    {/if}
  </div>
</div>

{#if openNote}
  {#key open}<NoteSheet note={openNote} {bikes} {notes} pinnedCount={counts.pinned} onopen={(id) => (open = id)} onclose={() => (open = null)} onmade={() => ((made = t('Made from the note; the note links to it.')), setTimeout(() => (made = ''), 5000))} />{/key}
{/if}
{#if made}<div class="toast" role="status"><Check size={18} aria-hidden="true" /><span>{made}</span></div>{/if}


<style>
  .notes {
    max-width: 1100px;
  }
  .cap {
    margin: 0 0 24px;
    padding: 10px 12px;
    border: 2px solid var(--accent);
  }
  .caprow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }
  .capt {
    flex: 1 1 16em;
    min-width: 0;
  }
  .capt textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    border: 0;
    background: transparent;
    resize: vertical;
    font: 400 var(--fs-body) / 1.5 var(--font-body);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .tb {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .tb[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--paper-2);
  }
  /* Impeccable Runde 2: on a phone the tools are one row under the text, «Save» on its right end */
  @media (max-width: 719px) {
    .caprow > .tools {
      flex: 1 1 100%;
    }
    .caprow > .tools > .save {
      margin-left: auto;
    }
  }
  .hintrow {
    margin: 4px 2px 0;
  }
  .hint {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .phrow {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0 0;
  }
  .phrow img {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: var(--radius);
  }
  .n {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .srch {
    margin: 0 0 24px;
  }
  .search {
    position: relative;
    display: block;
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
  .tpls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
  }
  .tplman summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    cursor: pointer;
    font-weight: 600;
  }
  .tplrow {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
  }
  .tpln {
    flex: 1 1 auto;
    min-width: 0;
  }
  .tplrn {
    display: flex;
    gap: 6px;
    flex: 1 1 auto;
    padding: 6px 0;
  }
  .tplrn .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
  .keepin {
    cursor: pointer;
  }
  .nst {
    display: grid;
    gap: 6px;
  }
  .nst p {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .fl {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fh {
    flex-basis: 100%;
    margin: 8px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fchip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .t-bike {
    background: var(--ink-2);
  }
  .t-trips {
    background: var(--accent);
  }
  .t-gear {
    background: var(--hi);
  }
  .t-training {
    background: var(--warn);
  }
  .err {
    margin: 6px 0 0;
    color: var(--bad);
  }
  .ok {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
    color: var(--accent);
  }
  .nonote {
    margin: 0 0 24px;
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
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--ink);
    color: var(--paper);
  }
  @media (max-width: 719px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
    .toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>

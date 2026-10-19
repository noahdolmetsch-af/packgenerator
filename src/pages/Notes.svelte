<script>
  import CameraButton from '../lib/ui/CameraButton.svelte'; // P3b Teil 3: the camera wherever a photo is added
  /**
   * Notizen (v0.48.0, Noah 12a-17a): the notes kept in the app; the Eingang is the other half
   * (the toggle top right). Quick capture with text, dictation (where the browser can), photo, link
   * and checklist; the topic follows the text (5 fixed topics, #tags on top); at most 3 pinned;
   * a side list of filters (topics, what a note holds), a search; the cards newest first.
   * A card opens the note (NoteSheet), with «Aus Notiz wird …». Notes are in the normal backup;
   * «Als Markdown exportieren» saves them as one text file.
   */
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { guessTopic, noteTopic, topicText, FILTERS, noteList, filterCounts, newKeptNote, noteTitle, progress, notesMarkdown, linkFrom, tagsOf, MAX_PINNED, noteStats } from '../lib/notebook.js';
  import { sortBikes } from '../lib/bikes.js';
  import { shrinkImage } from '../lib/photo.js';
  import { localDay } from '../lib/localday.js';
  import NoteSheet from '../lib/notes/NoteSheet.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { Mic, Camera, Link2, ListChecks, Search, Inbox, ChevronRight, Download, Check, Star, Image as ImageIcon, NotebookPen, Pencil, ChartColumn } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import '../lib/ich/ich.css';

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const notes = $derived($notesQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const names = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const counts = $derived(filterCounts(notes));
  const stats = $derived(noteStats(notes, localDay())); // Paket N #10: the small evaluation
  const inboxN = $derived(notes.filter((n) => n.status === 'open').length);

  let filter = $state('all');
  let query = $state('');
  const list = $derived(noteList(notes, { filter, query }));
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
        {#if SR}<button type="button" class="btn" aria-pressed={listening} onclick={dictate}><Mic size={16} aria-hidden="true" />{listening ? t('Stop dictation') : t('Dictate')}</button>{/if}
        <button type="submit" class="btn hi">{t('Save')}</button>
      </div>
    </div>
    {#if linkOpen}
      <div class="two">
        <input class="inp" type="url" bind:value={linkUrl} placeholder="https://…" aria-label={t('Web address')} />
        <input class="inp" type="text" bind:value={linkTitle} placeholder={t('Title (optional)')} aria-label={t('Title of the link')} />
      </div>
    {/if}
    {#if photo}<p class="phrow"><img src={photo} alt={t('Photo of the note')} /><button type="button" class="btn btn-link" onclick={() => (photo = null)}>{t('Remove photo')}</button></p>{/if}
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
        <!-- v0.127.0 A-U2: the one empty building block -->
        <div class="nonote"><Empty icon={NotebookPen} text={t('No notes yet. Write one above, or keep an entry from the Inbox with «Just keep».')} /></div>
      {/if}
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
    </div>

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
          {#each FILTERS.filter((f) => !f.has && (!f.none || counts[f.key])) as f (f.key)}
            <button type="button" class="fchip" aria-pressed={filter === f.key} onclick={() => (filter = f.key)}>{#if f.topic}<i class="dot t-{f.topic}" aria-hidden="true"></i>{/if}{f.raw ? f.name : t(f.name)} · <span class="num">{counts[f.key]}</span></button>
          {/each}
          <p class="fh">{t('Holds')}</p>
          {#each FILTERS.filter((f) => f.has) as f (f.key)}
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

      <section class="ich-sec" aria-labelledby="nmore-h">
        <div class="ich-h"><div><h2 id="nmore-h">{t('More')}</h2></div></div>
        <ul class="card ich-list">
          <li><a class="ich-row" href="#/inbox"><span class="ich-ib"><Inbox size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Inbox')}</b><small>{tn(inboxN, '{n} to file', '{n} to file')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
          {#if counts.all}<li><button type="button" class="ich-row" onclick={exportMd}><span class="ich-ib"><Download size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Export as Markdown')}</b><small>{t('The notes are also in the normal backup.')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>{/if}
        </ul>
      </section>
    </div>
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

<script>
  /**
   * Notizen (v0.48.0, Noah 12a-17a): the notes kept in the app; the Eingang is the other half
   * (the toggle top right). Quick capture with text, dictation (where the browser can), photo, link
   * and checklist; the topic follows the text (5 fixed topics, #tags on top); at most 3 pinned;
   * a side list of filters (topics, what a note holds), a search; the cards newest first.
   * A card opens the note (NoteSheet), with «Aus Notiz wird …». Notes are in the normal backup;
   * «Als Markdown exportieren» saves them as one text file.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { TOPICS, guessTopic, FILTERS, noteList, filterCounts, newKeptNote, noteTitle, progress, notesMarkdown, linkFrom, tagsOf, MAX_PINNED } from '../lib/notebook.js';
  import { sortBikes } from '../lib/bikes.js';
  import { shrinkImage } from '../lib/photo.js';
  import { localDay } from '../lib/localday.js';
  import NoteSheet from '../lib/notes/NoteSheet.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { Mic, Camera, Link2, ListChecks, Search, Pin, Inbox, ChevronRight, Download, Check } from '@lucide/svelte';

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const notes = $derived($notesQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const names = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const counts = $derived(filterCounts(notes));
  const inboxN = $derived(notes.filter((n) => n.status === 'open').length);
  const lastEdit = $derived(notes.filter((n) => n.status === 'kept').map((n) => n.editedAt ?? n.at).sort().at(-1) ?? null);

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
    saved = t('Saved under {topic}.', { topic: t(TOPICS.find((x) => x.key === n.topic).name) });
    setTimeout(() => (saved = ''), 4000);
  }

  async function tick(n, i) {
    const checklist = n.checklist.map((c, j) => (j === i ? { ...c, done: !c.done } : c));
    await db.notes.update(n.id, { checklist, editedAt: new Date().toISOString() });
  }

  let open = $state(null);
  let made = $state('');
  const openNote = $derived(open ? notes.find((n) => n.id === open) : null);

  function exportMd() {
    const md = notesMarkdown(notes, { topicName: (k) => (k === '__title' ? t('Notes') : k === '__pinned' ? t('pinned') : t(TOPICS.find((x) => x.key === k)?.name ?? k)), bikeName: (id) => names[id] ?? '', today: localDay() });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    a.download = `notizen-${localDay()}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const TOPIC = Object.fromEntries(TOPICS.map((x) => [x.key, x]));
  const dayShort = (iso) => (iso ? (iso.slice(0, 10) === localDay() ? t('today') : new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })) : '');
  const time = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const SHOWN = 4;
</script>

<div class="notes">
  <header class="head">
    <div>
      <h1 class="title">{t('Notes')}</h1>
      {#if $notesQ}<p class="page-sub">{tn(counts.all, '{n} note', '{n} notes')} · {tn(counts.pinned, '{n} pinned', '{n} pinned')}{lastEdit ? ` · ${t('last {when}', { when: `${dayShort(lastEdit)} ${time(lastEdit)}` })}` : ''}</p>{/if}
    </div>
    <Seg label={t('Show')} value="notes" options={[{ key: 'notes', name: t('Notes'), n: counts.all }, { key: 'inbox', name: t('Inbox'), n: inboxN }]} onchange={(v) => v === 'inbox' && (location.hash = '#/inbox')} />
  </header>

  <div class="grid">
    <aside class="side" aria-label={t('Filter')}>
      <ul class="flist">
        {#each FILTERS as f, i (f.key)}
          {#if f.topic && !FILTERS[i - 1]?.topic}<li class="fh">{t('Topics')}</li>{/if}
          {#if f.has && !FILTERS[i - 1]?.has}<li class="fh">{t('Holds')}</li>{/if}
          <li><button type="button" class="fbtn" aria-pressed={filter === f.key} onclick={() => (filter = f.key)}>{#if f.topic}<i class="dot t-{f.topic}" aria-hidden="true"></i>{/if}<span>{t(f.name)}</span><small class="num">{counts[f.key]}</small></button></li>
        {/each}
      </ul>
      <a class="inlink" href="#/inbox"><Inbox size={18} aria-hidden="true" /><span><b>{t('Inbox')}</b><small>{tn(inboxN, '{n} to file', '{n} to file')}</small></span><ChevronRight size={16} aria-hidden="true" /></a>
    </aside>

    <div class="main">
      <div class="top2">
        <form class="cap surf" onsubmit={(e) => (e.preventDefault(), save())}>
          <label><span class="sr">{t('New note')}</span><textarea class="inp" rows={checkMode ? 4 : 2} bind:value={text} placeholder={t('Thought, link, photo …')}></textarea></label>
          {#if linkOpen}
            <div class="two">
              <input class="inp" type="url" bind:value={linkUrl} placeholder="https://…" aria-label={t('Web address')} />
              <input class="inp" type="text" bind:value={linkTitle} placeholder={t('Title (optional)')} aria-label={t('Title of the link')} />
            </div>
          {/if}
          {#if photo}<p class="phrow"><img src={photo} alt={t('Photo of the note')} /><button type="button" class="lnk" onclick={() => (photo = null)}>{t('Remove photo')}</button></p>{/if}
          <div class="tools">
            {#if SR}<button type="button" class="tb" aria-pressed={listening} aria-label={listening ? t('Stop dictation') : t('Dictate')} onclick={dictate}><Mic size={18} aria-hidden="true" /></button>{/if}
            <label class="tb" aria-label={t('Add a photo')}><Camera size={18} aria-hidden="true" /><input type="file" accept="image/*" hidden onchange={addPhoto} /></label>
            <button type="button" class="tb" aria-pressed={linkOpen} aria-label={t('Add a link')} onclick={() => (linkOpen = !linkOpen)}><Link2 size={18} aria-hidden="true" /></button>
            <button type="button" class="tb" aria-pressed={checkMode} aria-label={t('Checklist')} onclick={startList}><ListChecks size={18} aria-hidden="true" /></button>
            <span class="hint">{text.trim() ? t('Topic: {topic}', { topic: t(TOPIC[topicNow].name) }) : t('The topic follows the text')}</span>
            <button type="submit" class="btn hi">{t('Save')}</button>
          </div>
          {#if msg}<p class="err" role="alert">{msg}</p>{/if}
          {#if saved}<p class="ok" role="status"><Check size={16} aria-hidden="true" />{saved}</p>{/if}
        </form>
        <label class="search">
          <Search size={18} aria-hidden="true" />
          <span class="sr">{t('Search the notes')}</span>
          <input class="inp" type="search" bind:value={query} placeholder={t('Search: text, link, checklist')} />
        </label>
      </div>

      {#snippet card(n)}
        {@const p = progress(n)}
        {@const tags = tagsOf(n.text)}
        <article class="ncard surf" data-note-id={n.id}>
          <p class="meta"><i class="dot t-{n.topic ?? 'general'}" aria-hidden="true"></i>{t(TOPIC[n.topic ?? 'general']?.name ?? 'General')}<span class="r">{#if n.pinned}<Pin size={13} aria-hidden="true" />{/if}{dayShort(n.editedAt ?? n.at)}</span></p>
          <h3><button type="button" class="open" onclick={() => (open = n.id)}>{noteTitle(n) || t('Note')}</button></h3>
          {#if n.text && n.text !== noteTitle(n)}<p class="txt">{n.text}</p>{/if}
          {#if n.link?.url}<p class="lk"><Link2 size={14} aria-hidden="true" /><span><b>{n.link.title}</b><small>{n.link.url.replace(/^https?:\/\//, '').split('/')[0]}</small></span></p>{/if}
          {#if n.photo}<img class="ph" src={n.photo} alt="" loading="lazy" />{/if}
          {#if p.total}
            <ul class="cl">
              {#each n.checklist.slice(0, SHOWN) as c, i (i)}
                <li><label><input type="checkbox" checked={c.done} onchange={() => tick(n, i)} /><span class:done={c.done}>{c.text}</span></label></li>
              {/each}
            </ul>
            <p class="more">{p.total > SHOWN ? `${t('+ {n} more', { n: p.total - SHOWN })} · ` : ''}{t('{done}/{total} done', p)}</p>
          {/if}
          {#if n.bikeId || tags.length || (n.links ?? []).length}
            <p class="tags">
              {#if n.bikeId && names[n.bikeId]}<span class="nbadge">{names[n.bikeId]}</span>{/if}
              {#each n.links ?? [] as l, i (i)}<span class="nbadge">→ {l.label}</span>{/each}
              {#each tags as tg (tg)}<span class="nbadge">#{tg}</span>{/each}
            </p>
          {/if}
        </article>
      {/snippet}

      {#if $notesQ && !counts.all}
        <p class="card empty">{t('No notes yet. Write one above, or keep an entry from the Inbox with «Just keep».')}</p>
      {/if}
      {#if pinned.length}
        <h2 class="zlabel">{t('Pinned')} <small>{pinned.length}/{MAX_PINNED}</small></h2>
        <div class="cards">{#each pinned as n (n.id)}{@render card(n)}{/each}</div>
      {/if}
      {#if rest.length}
        <h2 class="zlabel">{filter === 'all' && !query ? t('All, newest first') : t('{n} found', { n: rest.length })}</h2>
        <div class="cards">{#each rest as n (n.id)}{@render card(n)}{/each}</div>
      {:else if counts.all && !pinned.length}
        <p class="card empty">{t('Nothing found.')}</p>
      {/if}
      {#if counts.all}
        <p class="exp"><button type="button" class="lnk" onclick={exportMd}><Download size={16} aria-hidden="true" />{t('Export as Markdown')}</button><span>{t('The notes are also in the normal backup.')}</span></p>
      {/if}
    </div>
  </div>
</div>

{#if openNote}
  <NoteSheet note={openNote} {bikes} pinnedCount={counts.pinned} onclose={() => (open = null)} onmade={() => ((made = t('Made from the note; the note links to it.')), setTimeout(() => (made = ''), 5000))} />
{/if}
{#if made}<div class="toast" role="status"><Check size={18} aria-hidden="true" /><span>{made}</span></div>{/if}

<style>
  .notes {
    max-width: 1180px;
    margin: 0 auto;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 12px;
  }
  .grid {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .flist {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fh {
    margin: 14px 10px 4px;
    color: var(--ink-3);
    font: 600 var(--fs-small) var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .fbtn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 6px 10px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .fbtn span {
    flex: 1;
    min-width: 0;
  }
  .fbtn small {
    color: var(--ink-3);
  }
  .fbtn[aria-pressed='true'] {
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .inlink {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding: 10px;
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
  }
  .inlink span {
    flex: 1;
    display: grid;
  }
  .inlink small {
    color: var(--ink-3);
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
  .top2 {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }
  .cap {
    padding: 10px 12px;
  }
  .cap textarea {
    border: 0;
    background: none;
    resize: vertical;
    padding: 6px 4px;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    border-top: 1px solid var(--line);
    padding-top: 8px;
  }
  .tb {
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
  .tb[aria-pressed='true'] {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .tools .hint {
    flex: 1;
    min-width: 8em;
    text-align: right;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 6px 0;
  }
  .phrow {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .phrow img {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
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
  .zlabel small {
    font-weight: 500;
    letter-spacing: 0;
  }
  .cards {
    columns: 3 260px;
    column-gap: 14px;
  }
  .ncard {
    break-inside: avoid;
    margin: 0 0 14px;
    padding: 12px 14px;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .meta .r {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
  }
  .meta .r :global(svg) {
    color: var(--hi);
  }
  .ncard h3 {
    margin: 0 0 6px;
    font-size: var(--fs-sub);
  }
  .open {
    display: block;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .txt {
    margin: 0 0 8px;
    color: var(--ink-2);
    white-space: pre-line;
    overflow-wrap: break-word;
  }
  .lk {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 0 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .lk span {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .lk small {
    color: var(--accent);
  }
  .ph {
    display: block;
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: 8px;
    margin: 0 0 8px;
  }
  .cl {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .cl label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    cursor: pointer;
  }
  .cl input {
    flex: none;
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
  }
  .cl span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .done {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .more {
    margin: 2px 0 0 30px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 0;
  }
  .exp {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .err {
    color: var(--bad);
  }
  .ok {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--accent);
  }
  .empty {
    color: var(--ink-3);
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
  @media (max-width: 899px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 10px;
    }
    .side {
      order: 0;
    }
    .flist {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .fh,
    .inlink {
      display: none;
    }
    .fbtn {
      width: auto;
      white-space: nowrap;
      border: 1.5px solid var(--line);
      border-radius: 999px;
    }
    .top2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 719px) {
    .toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>

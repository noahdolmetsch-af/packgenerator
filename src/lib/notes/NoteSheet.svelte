<script>
  import { askDelete, deleteWithUndo } from '../ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * v0.48.0 one note, open (Noah 12a-16a): topic, pin (at most 3), title, text, link, photo,
   * checklist (tick, add, remove), what it is linked to, and «Aus Notiz wird …»: a trip idea, a wish
   * or a bike problem. The note stays and links to what it became. Changes are saved when the sheet
   * closes; «Fertig» is the one main button.
   */
  import DateInput from '../ui/DateInput.svelte';
  import Form from '../ui/Form.svelte';
  import Field from '../ui/Field.svelte';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { checkAll } from '../ui/formchecks.js';
  import { db } from '../db.js';
  import { TOPICS, MAX_PINNED, addLink, noteTitle, noteTopic, topicText, linkedNotes, linkNote, unlinkNote, maybeRelated, pickNotes } from '../notebook.js';
  import { fileNote } from '../inbox.js';
  import { newTrip } from '../trips.js';
  import { nextNumber } from '../notes.js';
  import { nextId } from '../gear.js';
  import { switchTrip } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import SpeakButton from '../ui/SpeakButton.svelte';
  import { appendSpoken } from '../speak.js';
  import { Pin, PinOff, X, Route, Heart, Wrench, Link2, Plus, Trash2, ChevronLeft, NotebookPen, Unlink } from '@lucide/svelte';
  import { photosOf, linksOf, addPhoto, removePhoto, setPhotos, addLinkTo, removeLinkAt, placeFrom, placeLinks, placeText, mdToHtml, hasFormat, wrapSel, shareText, NOTE_TPL_KEY, templatesOf, addTemplate } from '../noteformats.js';
  import { linkFrom } from '../notebook.js';
  import { shrinkImage } from '../photo.js';
  import CameraButton from '../ui/CameraButton.svelte';
  import DrawOn from '../draw/DrawOn.svelte';
  import RichText from './RichText.svelte';
  import NoteFiles from './NoteFiles.svelte';
  import { editMode, setEditMode } from './richtext.js';
  import NoteReader from './NoteReader.svelte';
  import { MapPin, Image as ImageIcon, Share2, Bold, Heading, Table, BookOpen, Pencil, Copy, FilePlus2 } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { note, bikes = [], pinnedCount = 0, notes = [], onclose, onmade, onopen } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let draft = $state(structuredClone($state.snapshot(note)));
  let point = $state('');
  let make = $state(null); // 'trip' | 'wish' | 'problem'
  // svelte-ignore state_referenced_locally
  let name = $state(noteTitle(note));
  let start = $state('');
  let days = $state('2');
  // svelte-ignore state_referenced_locally
  let bike = $state(note.bikeId ?? bikes[0]?.id ?? null);
  let msg = $state('');

  $effect(() => {
    dialog.showModal();
  });

  function togglePin() {
    if (!draft.pinned && pinnedCount >= MAX_PINNED) return (msg = t('At most {n} notes can be pinned. Unpin one first.', { n: MAX_PINNED }));
    msg = '';
    draft.pinned = !draft.pinned;
  }
  function addPoint() {
    if (!point.trim()) return;
    draft.checklist = [...(draft.checklist ?? []), { text: point.trim(), done: false }];
    point = '';
  }
  async function saveAndClose() {
    const now = new Date().toISOString();
    const before = JSON.stringify(note);
    const after = $state.snapshot(draft);
    if (JSON.stringify({ ...after }) !== before) await db.notes.put({ ...after, editedAt: now });
  }
  async function closeIt() {
    await saveAndClose();
    dialog.close();
  }
  async function remove() {
    const name = noteTitle(draft).slice(0, 40);
    if ((await askDelete({ title: t('Delete the note "{text}"?', { text: name }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const ok = await deleteWithUndo({
      run: async () => {
        const rec = await db.notes.get(note.id);
        // Paket NE: the note's files (rows of db.docs) go with it
        const files = (await db.docs.toArray()).filter((d) => d.noteId === note.id);
        await db.transaction('rw', db.notes, db.docs, async () => {
          await db.notes.delete(note.id);
          if (files.length) await db.docs.bulkDelete(files.map((d) => d.id));
        });
        return { rec, files };
      },
      undo: async ({ rec, files }) => {
        if (rec) await db.notes.put(rec);
        if (files.length) await db.docs.bulkPut(files);
      },
      text: t('"{name}" deleted.', { name }),
      name,
    });
    if (ok) dialog.close();
  }

  const MAKES = [
    { key: 'trip', name: 'Trip idea', icon: Route },
    { key: 'wish', name: 'Wish', icon: Heart },
    { key: 'problem', name: 'Problem', icon: Wrench },
  ];
  const SAVE = { trip: 'Create trip idea', wish: 'Onto the wishlist', problem: 'Into bike care' };

  // Einheitliche Formulare: what «Create trip idea» / «Onto the wishlist» / «Into bike care» needs
  let errors = $state({});
  const checkMake = () =>
    checkAll(
      {
        ...(make !== 'problem' ? { name: [name, { field: t('a name|field'), example: make === 'trip' ? t('Jura weekend') : t('Down jacket'), required: true, maxLen: 80 }] } : {}),
        ...(make === 'trip' ? { start: [start, { field: t('When'), kind: 'date' }], days: [days, { field: t('Days'), example: '2', kind: 'int', min: 1, max: 60, required: true }] } : {}),
        ...(make === 'trip' || make === 'problem' ? { bike: [bikes.some((x) => x.id === bike) ? bike : null, { field: t('a bike|field'), example: bikes[0]?.name ?? '', kind: 'choice', required: true }] } : {}),
      },
      t,
    );

  async function makeIt() {
    const b = bikes.find((x) => x.id === bike) ?? null;
    const now = new Date().toISOString();
    const src = { ...$state.snapshot(draft), text: [noteTitle(draft), draft.text !== noteTitle(draft) ? draft.text : ''].filter(Boolean).join(' – ') };
    let link = null;
    try {
      await db.transaction('rw', db.notes, db.trips, db.items, db.maintenance, async () => {
        if (make === 'trip') {
          const trip = { ...newTrip({ title: name, startDate: start || null, days, bike: b }, await db.trips.toArray(), await db.items.toArray()), idea: true, fromNote: note.id, note: draft.link?.url ? `${draft.link.title} ${draft.link.url}` : '' };
          await db.trips.put(trip);
          link = { kind: 'trip', ref: trip.id, label: name.trim() };
        } else if (make === 'wish') {
          const out = fileNote(src, 'wish', { name, ids: { item: nextId(await db.items.toArray(), 'lux') }, now });
          await db.items.put(out.item);
          link = { kind: 'wish', ref: out.item.id, label: out.item.name };
        } else {
          const out = fileNote(src, 'problem', { bike: b, ids: { task: nextNumber(await db.maintenance.toArray()) }, now });
          await db.maintenance.put({ ...out.repair, source: 'Note' });
          link = { kind: 'problem', ref: out.repair.id, label: b.name, bikeId: b.id };
        }
        draft = addLink($state.snapshot(draft), link, now);
        await db.notes.put($state.snapshot(draft));
      });
      onmade?.({ kind: make, link });
      make = null;
    } finally {
      errors = {};
    }
  }
  // Paket N #10: links between notes (kept once, shown on both notes), a picker with a search, and up
  // to 3 notes that may belong here (shared #tag or the same bike).
  const others = $derived(notes.map((n) => (n.id === draft.id ? { ...n, ...draft } : n)));
  const linked = $derived(linkedNotes(draft, others));
  const related = $derived(maybeRelated(draft, others));
  let picking = $state(false);
  let pickQ = $state('');
  const picks = $derived(picking ? pickNotes(draft, others, pickQ).filter((x) => !linked.some((l) => l.id === x.id)) : []);
  function linkTo(id) {
    const other = notes.find((n) => n.id === id);
    if (other) draft = linkNote($state.snapshot(draft), other);
    picking = false;
    pickQ = '';
  }
  async function unlink(l) {
    if (l.own) return (draft = unlinkNote($state.snapshot(draft), l.id));
    const other = await db.notes.get(l.id);
    if (other) await db.notes.put(unlinkNote(other, draft.id));
  }
  // Paket NE 1148: «Scan» goes to the scanner; it keeps the pages on this note and comes back to it
  async function scan() {
    await db.notes.put({ ...$state.snapshot(draft), editedAt: new Date().toISOString() });
    dialog.close();
    location.hash = `#/me/docs/scan?note=${encodeURIComponent(draft.id)}`;
  }
  async function openOther(id) {
    await saveAndClose();
    onopen?.(id);
  }
  // Paket N neue Notiz-Formate (Noah 19.10.2026 «4a», «5b und a»): several photos and links (N1), a place
  // (N2), a sketch (N5), Markdown light with a reading view (N11), share (N14), save as a template (N10).
  // svelte-ignore state_referenced_locally
  let reading = $state(hasFormat(note.text ?? ''));
  let textEl = $state(null);
  // Paket NE 1147: formatted writing (the default) or the text with marks, chosen per device
  let mode = $state(editMode());
  function switchMode() {
    mode = mode === 'rich' ? 'marks' : 'rich';
    reading = false;
    setEditMode(mode);
  }
  // Paket NE 1146: a drawing saved on a photo or on the pad gives the note its new photo list and inks
  const drawn = ({ list, inks }) => (draft = setPhotos($state.snapshot(draft), list, inks));
  let linkForm = $state(false);
  let readingAll = $state(false); // idea 4 / N15: the note as an article
  let newUrl = $state('');
  let newTitle = $state('');
  let locating = $state(false);
  let info = $state('');
  async function morePhoto(e) {
    const f = e.currentTarget.files[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      draft = addPhoto($state.snapshot(draft), await shrinkImage(f, 1200, 0.8));
    } catch (err) {
      msg = err.message || t('This photo could not be read.');
    }
  }
  function moreLink(e) {
    e.preventDefault();
    const l = linkFrom(newUrl.trim());
    if (!l) return (msg = t('This is not a web address.'));
    msg = '';
    draft = addLinkTo($state.snapshot(draft), { title: newTitle.trim() || l.title, url: l.url });
    newUrl = '';
    newTitle = '';
    linkForm = false;
  }
  function locate() {
    if (!navigator.geolocation) return (msg = t('This device cannot tell its location.'));
    locating = true;
    navigator.geolocation.getCurrentPosition(
      (p) => ((locating = false), (msg = ''), (draft.place = placeFrom(p.coords, draft.place?.label ?? ''))),
      () => ((locating = false), (msg = t('The location could not be found. Allow it in the browser, or try outside.'))),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  function mark(kind) {
    const el = textEl;
    const r = wrapSel(draft.text ?? '', el?.selectionStart ?? (draft.text ?? '').length, el?.selectionEnd ?? (draft.text ?? '').length, kind);
    draft.text = r.text;
    requestAnimationFrame(() => (el?.focus(), el?.setSelectionRange(r.start, r.end)));
  }
  async function share() {
    const text = shareText($state.snapshot(draft), t);
    try {
      if (navigator.share) return void (await navigator.share({ title: noteTitle(draft) || t('Note'), text }));
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      info = t('Copied. Paste it into Keep, a chat or a mail.');
    } catch {
      msg = t('Sharing does not work here.');
    }
  }
  async function asTemplate() {
    const rec = await db.settings.get(NOTE_TPL_KEY);
    const list = templatesOf(rec?.value);
    const body = [draft.title, draft.text, ...(draft.checklist ?? []).map((c) => `- [ ] ${c.text}`)].filter(Boolean).join('\n');
    const next = addTemplate(list, noteTitle(draft) || t('Note'), body);
    if (next === list) return (msg = t('Write a few words first.'));
    await db.settings.put({ key: NOTE_TPL_KEY, value: next });
    info = t('Saved as a template. New notes can start from it.');
  }
  const LINK_ICON = { trip: Route, wish: Heart, problem: Wrench };
  const linkHref = (l) => (l.kind === 'trip' ? '#/pack' : l.kind === 'wish' ? `#/gear?item=${encodeURIComponent(l.ref)}` : `#/bikes?tab=care&bike=${encodeURIComponent(l.bikeId ?? '')}&open=1`);
  const LINK_NAME = { trip: 'Trip idea', wish: 'Wish', problem: 'Problem' };
</script>

<!-- Design-Refresh P9 (I6, Noah 12.10.2026 «Runde 19 freigegeben»): the window look of the new style: the
     note's title with a quiet line (what it holds, topic, pinned) and ✕; title and text, the checklist on a
     soft panel with «+ Point», the topic as chips, «Turn the note into …» folded; at the bottom Delete,
     Pin / Unpin and «Done». The same functions as before. -->
<dialog use:backClose class="sheet nsheet vdlg" bind:this={dialog} onclose={onclose} oncancel={(e) => (e.preventDefault(), closeIt())} aria-labelledby="note-h">
  {#if !make}
    {@const cl = draft.checklist ?? []}
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="note-h" class="title">{noteTitle(draft) || t('Note')}</h2>
        <p class="vd-sub">{[cl.length ? `${t('Checklist')} · ${cl.filter((c) => c.done).length}/${cl.length}` : '', `${t('Topic')} ${topicText(noteTopic(draft), t)}`, draft.pinned ? t('pinned') : ''].filter(Boolean).join(' · ')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={closeIt}><X size={20} aria-hidden="true" /></button>
    </div>
    <label class="fld"><span class="lbl">{t('Title')}</span><input class="inp ttl" type="text" bind:value={draft.title} placeholder={t('Title')} /></label>
    <div class="fld">
      <div class="txh">
        <span class="lbl" id="ntx-l">{t('Text')}</span>
        <span class="fmt" role="group" aria-label={t('Format')}>
          <button type="button" class="btn btn-link sm" onclick={switchMode} data-edit-mode={mode}>{mode === 'rich' ? t('Write with marks') : t('Write formatted')}</button>
          {#if mode === 'rich'}
            <!-- the formatted editor has its own buttons -->
          {:else if !reading}
            <button type="button" class="tb" aria-label={t('Bold')} onclick={() => mark('bold')}><Bold size={16} aria-hidden="true" /></button>
            <button type="button" class="tb" aria-label={t('Heading')} onclick={() => mark('heading')}><Heading size={16} aria-hidden="true" /></button>
            <button type="button" class="tb" aria-label={t('Table')} onclick={() => mark('table')}><Table size={16} aria-hidden="true" /></button>
          {/if}
          {#if mode === 'marks'}<button type="button" class="tb" aria-pressed={reading} aria-label={reading ? t('Edit the text') : t('Reading view')} onclick={() => (reading = !reading)} data-reading>{#if reading}<Pencil size={16} aria-hidden="true" />{:else}<BookOpen size={16} aria-hidden="true" />{/if}</button>{/if}
        </span>
      </div>
      {#if mode === 'rich'}
        <RichText bind:value={draft.text} labelledby="ntx-l" placeholder={t('Text')} />
      {:else if reading}
        <!-- mdToHtml escapes everything first; only headings, bold, italic, lists and tables come back -->
        <div class="md" data-md>{@html mdToHtml(draft.text ?? '')}</div>
      {:else}
        <textarea class="inp" rows="4" bind:this={textEl} bind:value={draft.text} placeholder={t('Text')} aria-labelledby="ntx-l"></textarea>
        <small class="q">{t('**bold**, # heading, - list, | table |')}</small>
      {/if}
    </div>
    <!-- FE10 (Noah 13.10.2026): speak instead of type, where the browser can -->
    <div class="spk"><SpeakButton answer onsaid={(w) => (draft.text = appendSpoken(draft.text ?? '', w))} /></div>
    {#each linksOf(draft) as l, i (i)}
      <p class="lk" data-note-link><Link2 size={16} aria-hidden="true" /><span><b>{l.title}</b><a href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a></span><button type="button" class="rm" aria-label={t('Remove {name}', { name: l.title })} onclick={() => (draft = removeLinkAt($state.snapshot(draft), i))}><Trash2 size={16} aria-hidden="true" /></button></p>
    {/each}
    {#each photosOf(draft) as ph, i (i)}
      <div class="phw" data-note-photo><img class="ph" src={ph} alt={t('Photo of the note')} /><span class="pha"><DrawOn src={ph} list={photosOf(draft)} inks={draft.inks} icon cls="drawrm" onsave={drawn} data-note-draw /><button type="button" class="rm" aria-label={t('Remove photo')} onclick={() => (draft = removePhoto($state.snapshot(draft), i))}><Trash2 size={16} aria-hidden="true" /></button></span></div>
    {/each}
    <NoteFiles note={draft} onchange={(n) => (draft = n)} onphoto={(src) => (draft = addPhoto($state.snapshot(draft), src))} onscan={scan} />
    {#if draft.place}
      {@const pl = placeLinks(draft.place)}
      <p class="lk" data-note-place><MapPin size={16} aria-hidden="true" /><span><b>{placeText(draft.place)}</b>{#if pl}<span class="pls"><a href={pl.maps} target="_blank" rel="noopener noreferrer">Google Maps</a> · <a href={pl.swisstopo} target="_blank" rel="noopener noreferrer">swisstopo</a></span>{/if}</span><button type="button" class="rm" aria-label={t('Remove the place')} onclick={() => (draft.place = null)}><Trash2 size={16} aria-hidden="true" /></button></p>
    {/if}
    {#if linkForm}
      <form class="lform" onsubmit={moreLink}>
        <input class="inp" type="url" bind:value={newUrl} placeholder="https://…" aria-label={t('Web address')} />
        <input class="inp" type="text" bind:value={newTitle} placeholder={t('Title (optional)')} aria-label={t('Title of the link')} />
        <button type="submit" class="btn">{t('Add')}</button>
      </form>
    {/if}
    <div class="adds" role="group" aria-label={t('Add to the note')} data-note-adds>
      <CameraButton onchange={morePhoto} icon />
      <label class="btn sm"><ImageIcon size={16} aria-hidden="true" />{t('Photo')}<input type="file" accept="image/*" hidden onchange={morePhoto} /></label>
      <button type="button" class="btn sm" aria-pressed={linkForm} onclick={() => (linkForm = !linkForm)}><Link2 size={16} aria-hidden="true" />{t('Link')}</button>
      <button type="button" class="btn sm" disabled={locating} onclick={locate} data-add-place><MapPin size={16} aria-hidden="true" />{locating ? t('Finding the place …') : draft.place ? t('Place again') : t('Place|location')}</button>
      <DrawOn list={photosOf(draft)} inks={draft.inks} label={t('Sketch')} onsave={drawn} data-add-sketch />
    </div>
    {#if draft.place}<label class="fld"><span class="lbl">{t('Name of the place')} <small class="q">· {t('optional')}</small></span><input class="inp" type="text" maxlength="60" value={draft.place.label} oninput={(e) => (draft.place = { ...draft.place, label: e.currentTarget.value })} placeholder={t('e.g. Nice rest stop')} /></label>{/if}

    <p class="lbl">{t('Checklist')}{#if cl.length}<span class="q"> · {cl.filter((c) => c.done).length}/{cl.length}</span>{/if}</p>
    <div class="clp">
      {#if cl.length}
        <ul class="cl">
          {#each draft.checklist ?? [] as c, i (i)}
            <li>
              <label class="ck"><input type="checkbox" bind:checked={c.done} /><span class:done={c.done}>{c.text}</span></label>
              <button type="button" class="rm" aria-label={t('Remove {name}', { name: c.text })} onclick={() => (draft.checklist = draft.checklist.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
      <form class="addp" onsubmit={(e) => (e.preventDefault(), addPoint())}>
        <input class="inp" type="text" bind:value={point} placeholder={t('Add a point')} aria-label={t('Add a point')} />
        <button type="submit" class="btn" aria-label={t('Add')}><Plus size={16} aria-hidden="true" /></button>
      </form>
    </div>

    <p class="lbl">{t('Topic')}</p>
    <div class="vd-chips topics" role="group" aria-label={t('Topic')}>
      {#each TOPICS as x (x.key)}<button type="button" class="vd-chip" aria-pressed={noteTopic(draft) === x.key} onclick={() => (draft.topic = x.key)}>{x.raw ? x.name : t(x.name)}</button>{/each}
    </div>

    <p class="lbl">{t('Linked notes')}</p>
    <div class="nlinks" data-note-links>
      {#if linked.length}
        <ul class="nl">
          {#each linked as l (l.id)}
            <li>
              <button type="button" class="lchip" onclick={() => openOther(l.id)}><NotebookPen size={14} aria-hidden="true" />{l.title || t('Note')}{#if !l.own}<small> · {t('links here')}</small>{/if}</button>
              <button type="button" class="rm" aria-label={t('Remove the link to {name}', { name: l.title })} onclick={() => unlink(l)}><Unlink size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
      {#if picking}
        <input class="inp" type="search" bind:value={pickQ} placeholder={t('Search a note to link')} aria-label={t('Search a note to link')} />
        {#if picks.length}
          <ul class="nl">{#each picks as x (x.id)}<li><button type="button" class="lchip" onclick={() => linkTo(x.id)}><Plus size={14} aria-hidden="true" />{x.title || t('Note')}</button></li>{/each}</ul>
        {:else}<p class="q">{t('No other note found.')}</p>{/if}
      {:else}
        <button type="button" class="btn" onclick={() => (picking = true)}><Link2 size={16} aria-hidden="true" />{t('Link a note')}</button>
      {/if}
      {#if related.length && !picking}
        <p class="q">{t('Maybe related')}</p>
        <ul class="nl">{#each related as x (x.id)}<li><button type="button" class="lchip" onclick={() => linkTo(x.id)}><Plus size={14} aria-hidden="true" />{x.title || t('Note')}<small> · {x.why === 'tag' ? `#${x.tag}` : t('same bike')}</small></button></li>{/each}</ul>
      {/if}
    </div>

    {#if (draft.links ?? []).some((l) => l.kind !== 'note')}
      <p class="lbl">{t('Linked')}</p>
      <div class="vd-chips">
        {#each (draft.links ?? []).filter((l) => l.kind !== 'note') as l, i (i)}{@const I = LINK_ICON[l.kind] ?? Link2}<a class="lchip" href={linkHref(l)} onclick={(e) => { if (l.kind === 'trip') { e.preventDefault(); switchTrip(l.ref, '#/pack'); } }}><I size={14} aria-hidden="true" />{l.label} · {t(LINK_NAME[l.kind] ?? 'Linked')}</a>{/each}
      </div>
    {/if}

    <details class="turn">
      <summary><b>{t('Turn the note into …')}</b><small>{t('a trip idea, a wish or a bike problem · the note links to it')}</small></summary>
      <div class="tiles">
        {#each MAKES as m (m.key)}{@const I = m.icon}<button type="button" class="tile" data-make={m.key} onclick={() => ((make = m.key), (msg = ''), (errors = {}))}><I size={18} aria-hidden="true" />{t(m.name)}</button>{/each}
      </div>
    </details>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    {#if info}<p class="ok" role="status">{info}</p>{/if}
    <div class="more2">
      <button type="button" class="btn btn-link" onclick={() => (readingAll = true)} data-note-read><BookOpen size={16} aria-hidden="true" />{t('Read as an article')}</button>
      <button type="button" class="btn btn-link" onclick={share} data-note-share><Share2 size={16} aria-hidden="true" />{t('Share|note')}</button>
      <button type="button" class="btn btn-link" onclick={asTemplate} data-note-astpl><FilePlus2 size={16} aria-hidden="true" />{t('Save as a template')}</button>
    </div>
    <div class="vd-foot">
      <button type="button" class="btn" onclick={remove}>{t('Delete')}</button>
      <button type="button" class="btn" aria-pressed={!!draft.pinned} onclick={togglePin}>{#if draft.pinned}<PinOff size={16} aria-hidden="true" />{t('Unpin')}{:else}<Pin size={16} aria-hidden="true" />{t('Pin')}{/if}</button>
      <button type="button" class="btn hi" onclick={closeIt}>{t('Done')}</button>
    </div>
  {:else}
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="note-h" class="title">{t(MAKES.find((m) => m.key === make).name)}</h2>
        <p class="vd-sub">{t('From the note «{name}»', { name: noteTitle(draft) })}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={closeIt}><X size={20} aria-hidden="true" /></button>
    </div>
    <!-- Einheitliche Formulare (Noah 19.10.2026 «1b»): the first form built from Form, Field and ChipChoice -->
    <Form check={checkMake} bind:errors onsave={makeIt} oncancel={() => ((make = null), (errors = {}))} cancelLabel={t('Back|note')} cancelIcon={ChevronLeft} saveLabel={t(SAVE[make])}>
      {#if make !== 'problem'}
        <Field id="nm-name" label={t('Name')} example={make === 'trip' ? t('e.g. Jura weekend') : t('e.g. Down jacket')} error={errors.name}>
          {#snippet children(f)}<input class="inp" type="text" {...f.attrs} bind:value={name} autocomplete="off" maxlength="80" />{/snippet}
        </Field>
      {/if}
      {#if make === 'trip'}
        <div class="two">
          <Field id="nm-when" label={t('When')} optional example={t('Leave it empty if you do not know yet.')} error={errors.start}>
            {#snippet children(f)}<DateInput {...f.attrs} bind:value={start} />{/snippet}
          </Field>
          <Field id="nm-days" label={t('Days')} example={t('1 to 60')} error={errors.days}>
            {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={days} />{/snippet}
          </Field>
        </div>
      {/if}
      {#if make === 'trip' || make === 'problem'}
        <Field id="nm-bike" group label={t('Bike')} error={errors.bike}>
          {#snippet children(f)}<ChipChoice {...f.attrs} options={bikes.map((b) => ({ value: b.id, label: b.name }))} bind:value={bike} />{/snippet}
        </Field>
      {/if}
    </Form>
  {/if}
</dialog>
{#if readingAll}<NoteReader note={$state.snapshot(draft)} onclose={() => (readingAll = false)} />{/if}

<style>
  .txh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .fmt {
    display: flex;
    gap: 2px;
  }
  .tb {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tb[aria-pressed='true'] {
    background: var(--paper-2);
  }
  .md {
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    min-height: 44px;
    overflow-x: auto;
  }
  .md :global(table) {
    border-collapse: collapse;
  }
  .md :global(th),
  .md :global(td) {
    padding: 4px 8px;
    border: 1px solid var(--line);
    text-align: left;
  }
  .md :global(h3),
  .md :global(h4),
  .md :global(h5) {
    margin: 4px 0;
    font-size: var(--fs-sub);
  }
  .md :global(p) {
    margin: 4px 0;
  }
  .phw {
    position: relative;
    width: fit-content;
    max-width: 100%;
    min-width: 104px;
    min-height: 52px;
  }
  .pha {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 4px;
  }
  .pha .rm,
  .pha :global(.drawrm) {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .pls {
    display: block;
    font-size: var(--fs-small);
  }
  .adds,
  .more2 {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
  }
  .lform {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10em, 1fr));
    gap: 6px;
    margin: 0 0 12px;
  }
  .nlinks {
    display: grid;
    gap: 8px;
    justify-items: start;
  }
  .nl {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .nl li {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .nlinks .inp {
    width: 100%;
    box-sizing: border-box;
  }
  .spk {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: -4px 0 10px;
  }
  .spk:not(:has(button)) {
    display: none;
  }
  .fld {
    display: block;
    margin: 0 0 10px;
    min-width: 0;
  }
  .ttl {
    font-weight: 500;
  }
  textarea.inp {
    resize: vertical;
  }
  .lk {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 0 10px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .lk > span {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .lk a {
    color: var(--accent);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ph {
    display: block;
    max-width: 100%;
    max-height: 220px;
    border-radius: var(--radius);
    margin: 0 0 10px;
  }
  .q {
    color: var(--ink-3);
    font-weight: 400;
  }
  .clp {
    margin: 0 0 12px;
    padding: 4px 16px 10px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .cl {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .cl li {
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid var(--line);
  }
  .ck {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    min-width: 0;
    cursor: pointer;
  }
  .ck input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
    flex: none;
  }
  .ck span {
    overflow-wrap: break-word;
    min-width: 0;
  }
  .done {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .rm {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .addp {
    display: flex;
    gap: 6px;
    margin: 8px 0 0;
  }
  .topics {
    margin: 0 0 12px;
  }
  .lchip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 44px;
    padding: 2px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-decoration: none;
  }
  button.lchip {
    background: none;
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .turn {
    margin: 12px 0 0;
    border-top: 1px solid var(--line);
  }
  .turn summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    min-height: 44px;
    padding: 10px 0;
    box-sizing: border-box;
    cursor: pointer;
  }
  .turn summary b {
    font-weight: 600;
  }
  .turn summary small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 0 0 4px;
  }
  .tile {
    display: grid;
    justify-items: center;
    gap: 6px;
    min-height: 72px;
    padding: 10px 6px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .tile:hover {
    background: var(--paper-2);
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 10px;
  }
  @media (max-width: 419px) {
    .two {
      grid-template-columns: 1fr;
    }
  }
  .err {
    margin: 8px 0 0;
    color: var(--bad);
  }
</style>

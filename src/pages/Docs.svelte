<script>
  import { askDelete } from '../lib/ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  /**
   * Ich › Dokumente (P3b «Daten sicher», Noah 15.10.2026 «1a»; mockups D3 and D4 approved 12.10.2026
   * «d1-d5 freigeben», round 2 answers «4a» reminder 6 months before, «5a» «ID und Cash dabei?» as a
   * tick in the packing list with a link to the document).
   *
   * #/me/docs (D3): the groups with their documents, beside them «Reminders» (from «valid until» by
   * themselves) and «For the next trip» (the papers marked for the packing list, ticked per trip).
   * #/me/docs/<id> (D4): one document: preview, open, share; details (group, valid until, reminder,
   * note) save as you type; «In the packing list»; replace the file, delete (asks, then 4 s Undo).
   * Dokumente-PDF (Paket B, Noah «1b 2a mit möglichkeiten zum sortieren … 5a», «1a 2a»): «Photograph document»
   * (#/me/docs/scan, DocScan.svelte) first, search in the name and the recognised text, four ways to sort,
   * and Google Drive (a subfolder per group) beside «Reminders» and «For the next trip».
   * Paket A (Noah 18.10.2026 «1a»): each group heading has «…» with «Rename» and «Delete». A rename changes
   * the group on every document in it (a default group only gets its own name, its key stays); a delete
   * asks once, moves the documents to the default group and never deletes one; both have 4 s «Undo».
   */
  import { liveQuery } from 'dexie';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { db } from '../lib/db.js';
  import Seg from '../lib/ui/Seg.svelte';
  import ListTable from '../lib/ui/ListTable.svelte'; // Paket H «3a und b»
  import { savedView, saveView } from '../lib/listtable.js';
  import { phone } from '../lib/media.svelte.js';
  import GroupActions from '../lib/ui/GroupActions.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import { UNDO_MS } from '../lib/ui/undo.js';
  import { docs, DOCS_HASH, SCAN_HASH, MAX_MB, addDoc, updateDoc, renameDoc, moveDoc, deleteDoc, restoreDoc, addGroup, renameGroup, deleteGroup, undoGroup, readData, smallPhoto, pdfPages, blobOf, connectDrive, checkDrive, uploadMissing, savePrefs } from '../lib/docs/client.svelte.js';
  import { groupDocs, ownGroups, groupOf, dataBytes, fileName, reminderRows, packRows, expiry, untilOf, defaultName, searchDocs, sortDocs, SORTS, REMIND_MONTHS, DEFAULT_REMIND, DEFAULT_GROUP, GROUP_IDEAS } from '../lib/docs.js';
  import { readKey, STRAVA_HASH } from '../lib/strava/client.svelte.js';
  import { nextTrip } from '../lib/debrief.js';
  import { localDay } from '../lib/localday.js';
  import { FileText, Upload, Bell, Lock, ExternalLink, Share2, FileUp, Trash2, Backpack, Check, ChevronRight, TriangleAlert, Camera, Search, Cloud, Database, Mail, Lightbulb, Image as ImageIcon } from '@lucide/svelte';
  import { tipOf } from '../lib/mailin.js';
  import '../lib/ich/ich.css';
  import '../lib/maintenance/maint.css';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  const today = localDay();
  const id = decodeURIComponent(location.hash.split('?')[0].slice(DOCS_HASH.length + 1));
  const hasKey = readKey();
  // DP: search and sort; with a search the hits stand in one list
  let sort = $state('new');
  let q = $state('');
  const SORT_NAMES = { new: 'Newest', name: 'Name|sort', date: 'Date in the document', source: 'Camera / gallery' };
  const inDrive = $derived(docs.list.filter((d) => d.drive?.id).length);
  const total = $derived(docs.list.reduce((s, d) => s + (d.bytes || dataBytes(d.data)), 0));
  const doc = $derived(id ? docs.list.find((d) => d.id === id) ?? null : null);
  const tripsQ = liveQuery(() => db.trips.toArray());
  const next = $derived(nextTrip($tripsQ ?? [], today));
  const groups = $derived(q.trim() ? [{ key: 'hits', kind: 'hits', name: null, rows: sortDocs(searchDocs(docs.list, q), sort) }] : groupDocs(docs.list, sort, docs.prefs.groups).filter((g) => g.rows.length || g.kind === 'own'));
  const allGroups = $derived(ownGroups([...GROUP_IDEAS.map((g) => ({ group: g })), ...docs.list], docs.prefs.groups));
  const reminders = $derived(reminderRows(docs.list, today));
  // Paket H «3a und b»: the shared table; name and group go through the same calls as the document page (Drive follows)
  let tableOn = $state(savedView('docs') === 'table');
  const setTable = (on) => ((tableOn = on), saveView('docs', on ? 'table' : 'list'));
  const docCols = $derived([
    { key: 'name', label: t('Name'), type: 'text', required: true, bulk: false },
    { key: 'group', label: t('Group'), type: 'select', get: (d) => groupOf(d), options: allGroups.map((g) => ({ key: g, name: ownLabel(g) })) },
    { key: 'until', label: t('Valid until (month)'), type: 'text', width: '9em', set: (d, v) => ({ ...d, until: /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : null }) },
    { key: 'note', label: t('Note'), type: 'text' },
    { key: 'kind', label: t('Kind'), type: 'text', readOnly: true, get: (d) => kindLine(d) },
  ]);
  async function saveDocRows(pairs) {
    for (const { before, after } of pairs) {
      if (after.name !== before.name) await renameDoc(after.id, after.name);
      if (groupOf(after) !== groupOf(before)) await moveDoc(after.id, groupOf(after));
      const patch = {};
      for (const k of ['until', 'note']) if ((after[k] ?? null) !== (before[k] ?? null)) patch[k] = after[k] ?? null;
      if (Object.keys(patch).length) await updateDoc(after.id, patch);
    }
  }
  async function delDocs(rows) {
    const out = [];
    for (const r of rows) out.push(await deleteDoc(r.id));
    return out.filter(Boolean);
  }
  const pack = $derived(packRows(docs.list));
  const ticks = $derived(next?.docChecks ?? {});

  let msg = $state('');
  let undo = $state(null); // { row, timer }
  let busy = $state(false);
  let newGroup = $state(null);
  let fileEl = $state();

  const mb = (b) => `${(b / 1024 / 1024).toLocaleString(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`;
  const day = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const monthName = (ym) => new Date(`${ym}-15T12:00:00`).toLocaleDateString(locale(), { month: 'short', year: 'numeric' });
  /** A default group's name: its own name when it was renamed (Paket A), else «Importierte PDF/Fotos». */
  const defName = (kind) => defaultName(kind, docs.prefs.names) ?? t(DEFAULT_GROUP[kind === 'photo' ? 'photo' : 'pdf']);
  /**
   * An own group's shown name: the six ideas in German, an own name as typed (Paket A: never through t(), so
   * «Travel» is «Reisen» and not the «Federweg» of the bike pages, and a typed name stays as it is).
   */
  const ownLabel = (name) => (GROUP_IDEAS.includes(name) ? t(name === 'Travel' ? 'Travel|docs' : name) : name);
  const groupName = (g) => (g.kind === 'hits' ? t('Found') : g.kind === 'own' ? ownLabel(g.name) : defName(g.kind));
  /** A heading id without spaces (an own group's key is its folded name). */
  const gid = (g) => `g-${g.key.replace(/[^a-z0-9]+/gi, '-')}`;
  const kindLine = (d) => (d.kind === 'photo' ? t('Photo') : `PDF · ${tn(d.pages || 1, '{n} page', '{n} pages')}`);
  /** The quiet line of a document in the list: valid until, or the note. */
  function lineOf(d) {
    const ex = expiry(d, today);
    if (ex?.over) return t('expired {month}', { month: monthName(ex.until) });
    if (ex?.soon) return tn(ex.left, 'expires in {n} month', 'expires in {n} months');
    if (ex) return t('valid until {month}', { month: monthName(ex.until) });
    return d.note || day(d.docDate ?? d.createdAt);
  }
  // Once per visit: every answer saves the prefs, and new prefs would run this again and again.
  let driveChecked = false;
  $effect(() => {
    if (driveChecked || !hasKey || !docs.loaded || !docs.prefs.drive) return;
    driveChecked = true;
    checkDrive().catch(() => {});
  });
  async function upNow() {
    const n = await uploadMissing();
    msg = tn(n, '{n} document is now in Google Drive.', '{n} documents are now in Google Drive.');
  }
  const errorText = (code) =>
    ({
      denied: t('The Google login was cancelled. Nothing changed.'),
      expired: t('The login took too long. Try again.'),
      unauthorized: t('This device has no key yet: connect Strava on this device first.'),
      not_set_up: t('Google is not set up on the server yet.'),
      network: t('No connection. The documents go to Drive later.'),
      too_big: t('A document is bigger than 4 MB and stays only in the app.'),
      google_login_needed: t('Google needs a new login.'),
    })[code] ?? t('Google Drive answered with an error. Try again later.');

  /** «Add PDF» (D3): a PDF or a photo of a paper; the details open next. */
  async function addFile(event, replace = null) {
    const f = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!f) return;
    msg = '';
    const pdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (!pdf && !f.type.startsWith('image/')) return void (msg = t('Please choose a PDF or a photo.'));
    if (f.size > MAX_MB * 1024 * 1024) return void (msg = t('This file is bigger than {mb} MB.', { mb: MAX_MB }));
    busy = true;
    try {
      const data = pdf ? (await readData(f)).replace(/^data:[^;]*;/, 'data:application/pdf;') : await smallPhoto(f);
      const file = { kind: pdf ? 'pdf' : 'photo', data, bytes: dataBytes(data), pages: pdf ? pdfPages(data) : 1 };
      if (replace) {
        await updateDoc(replace.id, file);
        msg = t('File replaced.');
      } else {
        const d = await addDoc({ ...file, source: 'file', mode: 'color', name: f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 120) || t('Document') });
        location.hash = `${DOCS_HASH}/${encodeURIComponent(d.id)}`;
      }
    } catch {
      msg = t('This file could not be read.');
    } finally {
      busy = false;
    }
  }

  const fileOf = (d) => new File([blobOf(d)], fileName(d.name, '', d.kind === 'photo' ? 'jpg' : 'pdf'), { type: d.kind === 'photo' ? 'image/jpeg' : 'application/pdf' });
  function openDoc(d) {
    const url = URL.createObjectURL(blobOf(d));
    const w = window.open(url, '_blank', 'noopener');
    if (!w) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileOf(d).name;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  /** Round 4 «2a»: the document's text as an Eingang entry (the document itself stays here). */
  async function toInbox(d) {
    await db.notes.put({ id: `doc-${Date.now().toString(36)}`, at: new Date().toISOString(), text: `${d.name}\n\n${d.note ? `${d.note}\n\n` : ''}${String(d.text ?? '').slice(0, 4000)}`, photo: null, page: 'docs', tripId: null, bikeId: null, status: 'open', to: null, sortedAt: null, docRef: d.id });
    location.hash = '#/inbox';
  }
  async function shareDoc(d) {
    const file = fileOf(d);
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: d.name });
      } catch {
        /* closed */
      }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
  }
  /** Delete: asks first, then 4 s «Undo» (rule «Löschen» 14.10.2026, Ü4a 15.10.2026). */
  async function remove(d) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: d.name }), text: d.drive?.id ? t('A copy in Google Drive stays. You can bring it back for 4 seconds afterwards.') : t('It is gone from this device; older backup files still have it. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const row = await deleteDoc(d.id);
    clearTimeout(undo?.timer);
    undo = { row, timer: setTimeout(() => (undo = null), 4000) };
    location.hash = DOCS_HASH;
  }
  async function undoDelete() {
    clearTimeout(undo?.timer);
    const row = undo?.row;
    undo = null;
    await restoreDoc(row);
  }
  /* ---------- Paket A: rename and delete a group ---------- */
  let groupUndo = $state.raw(null); // { text, u, timer }; raw: u goes back into IndexedDB as it is
  async function saveRename(g, value) {
    const own = t(DEFAULT_GROUP[g.kind === 'photo' ? 'photo' : 'pdf']);
    const back = g.kind !== 'own' && (!value || value === own);
    const u = await renameGroup(g, back ? '' : value);
    if (u) offerGroupUndo(t('Renamed to «{name}».', { name: back ? own : value }), u);
  }
  // Paket B «Gruppen überall»: «Löschen» opens the one delete window of the app (GroupDeleteSheet); the first
  // choice sends the documents back to the default group, or the person picks another own group
  let deleting = $state.raw(null); // the group row of groupDocs being deleted
  async function removeGroup(g, to) {
    const name = groupName(g);
    const u = await deleteGroup(g, { to: to ?? '' });
    if (u) offerGroupUndo(t('Group «{name}» deleted.', { name }), u);
  }
  const renameHelp = (g) =>
    g.kind === 'own'
      ? tn(g.rows.length, 'The {n} document in it gets the new name.', 'The {n} documents in it get the new name.')
      : t(g.kind === 'photo' ? 'Only the name changes; new photos still come here. Empty: back to «{name}».' : 'Only the name changes; new PDFs still come here. Empty: back to «{name}».', { name: t(DEFAULT_GROUP[g.kind === 'photo' ? 'photo' : 'pdf']) });
  function offerGroupUndo(text, u) {
    clearTimeout(groupUndo?.timer);
    groupUndo = { text, u, timer: setTimeout(() => (groupUndo = null), UNDO_MS) };
  }
  async function undoGroupChange() {
    clearTimeout(groupUndo?.timer);
    const u = groupUndo?.u;
    groupUndo = null;
    await undoGroup(u);
  }

  async function makeGroup() {
    const g = await addGroup(newGroup);
    newGroup = null;
    if (g && doc) await moveDoc(doc.id, g);
  }
  /** A tick of «For the next trip»: kept on the trip (trip.docChecks), the same tick as in its packing list. */
  async function tick(key, on) {
    if (!next) return;
    await db.trips.update(next.id, { docChecks: { ...(next.docChecks ?? {}), [key]: on } });
  }
  // the PDF preview: a link to the stored file, made once per document
  let preview = $state('');
  $effect(() => {
    const d = doc;
    if (!d?.data) return;
    const url = URL.createObjectURL(blobOf(d));
    preview = url;
    return () => URL.revokeObjectURL(url);
  });
  import Ablage from '../lib/tools/Ablage.svelte';
</script>

{#snippet packCard(rows)}
  {#if rows.length}
    <ul class="card ich-list" data-doc-pack>
      {#each rows as r (r.key)}
        <li class="ich-row ich-wrap">
          {#if next}
            <label class="tick"><input type="checkbox" checked={!!ticks[r.key]} onchange={(e) => tick(r.key, e.currentTarget.checked)} /><span>{t(r.label, { name: r.name })}</span></label>
          {:else}<span class="ich-m"><b>{t(r.label, { name: r.name })}</b></span>{/if}
          <a class="see" href={`${DOCS_HASH}/${encodeURIComponent(r.doc.id)}`}>{r.key === 'ids' ? t('See {name}', { name: r.doc.name }) : t('See document')} <ChevronRight size={14} aria-hidden="true" /></a>
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<div class="docspage">
  {#if id}
    <!-- D4: one document -->
    {#if doc}
      {@const ex = expiry(doc, today)}
      <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Documents'), href: DOCS_HASH }]} here={doc.name} title={doc.name} sub={`${groupOf(doc) ? ownLabel(groupOf(doc)) : defName(doc.kind)} · ${t('added on {date}', { date: day(doc.createdAt) })}`} />
      {#if msg}<p class="msg" role="status">{msg}</p>{/if}
      <div class="ich-cols">
        <div class="ich-main">
          <section class="card prev" aria-label={t('Preview')}>
            {#if doc.kind === 'photo'}<img src={doc.data} alt={doc.name} />
            {:else if preview}<object data={preview} type="application/pdf" title={doc.name}><p class="ich-help">{t('The preview does not show here. «Open» shows the PDF.')}</p></object>{/if}
            <div class="pfoot">
              <small>{fileOf(doc).name} · {kindLine(doc)} · {mb(doc.bytes || dataBytes(doc.data))}</small>
              <span class="ich-acts">
                <button type="button" class="btn sm" onclick={() => openDoc(doc)}><ExternalLink size={15} aria-hidden="true" />{t('Open')}</button>
                <button type="button" class="btn sm" onclick={() => shareDoc(doc)}><Share2 size={15} aria-hidden="true" />{t('Share')}</button>
                <!-- «Aus der App mailen» (Noah 19.10.2026 «5a»): a new mail under Ich › Mail with this document attached -->
                <a class="btn sm" href={`#/me/mail?attach=doc:${encodeURIComponent(doc.id)}`}><Mail size={15} aria-hidden="true" />{t('By mail')}</a>
                {#if doc.drive?.link}<a class="btn sm" href={doc.drive.link} target="_blank" rel="noopener"><Cloud size={15} aria-hidden="true" />{t('Open in Drive')}</a>{/if}
              </span>
            </div>
            <!-- «Mail in die App» round 4 «2a»: the same tips as for mails, from the recognised text; one tap puts
                 it into the Eingang, where it is sorted like a mail (bill, appointment, deadline) -->
            {#if doc.text}
            {@const tip = tipOf({ text: `${doc.name}\n${doc.note ?? ''}\n${doc.text}` })}
            {#if tip && tip.kind !== 'sender'}
              <p class="dtip"><Lightbulb size={15} aria-hidden="true" /><span>{tip.kind === 'booking' ? t('Looks like a booking') : tip.kind === 'bill' ? t('Looks like a bill') : t('Deadline: {day}', { day: tip.deadline.day.split('-').reverse().join('.') })}</span><button type="button" class="btn sm" onclick={() => toInbox(doc)}>{t('Sort in the Inbox')}</button></p>
            {/if}
            {/if}
            {#if doc.text}<details class="txt"><summary>{t('Recognised text')}</summary><p>{doc.text.slice(0, 1200)}{doc.text.length > 1200 ? '…' : ''}</p></details>{/if}
          </section>
        </div>
        <div class="ich-side">
          <section class="ich-sec" aria-labelledby="dd-h">
            <div class="ich-h"><div><h2 id="dd-h">{t('Details')}</h2><p class="ich-hs">{t('Saved as you type.')}</p></div></div>
            <div class="card ich-body form">
              <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" type="text" maxlength="120" value={doc.name} onchange={(e) => e.currentTarget.value.trim() && renameDoc(doc.id, e.currentTarget.value)} /></label>
              <label class="fld"><span class="lbl">{t('Group')}</span>
                <select class="inp" value={groupOf(doc)} onchange={(e) => (e.currentTarget.value === '+' ? (newGroup = '') : moveDoc(doc.id, e.currentTarget.value))}>
                  <option value="">{defName(doc.kind)}</option>
                  {#each allGroups as g (g)}<option value={g}>{ownLabel(g)}</option>{/each}
                  <option value="+">{t('New group …')}</option>
                </select>
              </label>
              {#if newGroup !== null}
                <form class="inline" onsubmit={(e) => (e.preventDefault(), makeGroup())}>
                  <input class="inp" type="text" bind:value={newGroup} maxlength="60" aria-label={t('Name of the new group')} />
                  <button type="submit" class="btn sm hi">{t('Add')}</button>
                </form>
              {/if}
              <div class="two">
                <label class="fld"><span class="lbl">{t('Valid until')}</span><input class="inp" type="month" value={untilOf(doc) ?? ''} onchange={(e) => updateDoc(doc.id, { until: e.currentTarget.value || null })} /></label>
                <label class="fld"><span class="lbl">{t('Remind')}</span>
                  <select class="inp" value={Number.isFinite(doc.remind) ? doc.remind : DEFAULT_REMIND} onchange={(e) => updateDoc(doc.id, { remind: Number(e.currentTarget.value) })}>
                    {#each REMIND_MONTHS as m (m)}<option value={m}>{m ? tn(m, '{n} month before', '{n} months before') : t('No reminder')}</option>{/each}
                  </select>
                </label>
              </div>
              {#if ex}<p class="ich-help" class:warn={ex.soon || ex.over}>{ex.over ? t('Expired. Renew it, then set the new date.') : ex.remindFrom ? t('Reminder from {month} on, here and under «Reminders».', { month: monthName(ex.remindFrom) }) : t('No reminder for this document.')}</p>{/if}
              <label class="fld"><span class="lbl">{t('Note')}</span><input class="inp" type="text" maxlength="200" value={doc.note ?? ''} placeholder={t('e.g. a copy in the backpack pocket')} onchange={(e) => updateDoc(doc.id, { note: e.currentTarget.value })} /></label>
            </div>
          </section>
          <section class="ich-sec" aria-labelledby="dt-h">
            <div class="ich-h"><div><h2 id="dt-h">{t('On trips')}</h2></div></div>
            <ul class="card ich-list">
              <li>
                <label class="ich-row">
                  <span class="ich-ib"><Backpack size={18} aria-hidden="true" /></span>
                  <span class="ich-m"><b>{t('In the packing list')}</b><small>{groupOf(doc) === 'IDs' ? t('on trips: «ID and cash with you?» with a link to this document') : t('on trips: «{name} with you?» with a link to this document', { name: doc.name })}</small></span>
                  <input type="checkbox" role="switch" class="mt-sw" checked={!!doc.inPack} onchange={(e) => updateDoc(doc.id, { inPack: e.currentTarget.checked })} />
                </label>
              </li>
            </ul>
          </section>
          <section class="ich-sec" aria-labelledby="dm-h">
            <div class="ich-h"><div><h2 id="dm-h">{t('More')}</h2></div></div>
            <ul class="card ich-list">
              <li><label class="ich-row"><span class="ich-ib"><FileUp size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Replace file')}</b><small>{t('The details stay')}</small></span><input type="file" accept="application/pdf,.pdf,image/*" onchange={(e) => addFile(e, doc)} hidden /></label></li>
              <li><button type="button" class="ich-row" onclick={() => remove(doc)}><span class="ich-ib"><Trash2 size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Delete')}</b></span></button></li>
            </ul>
          </section>
        </div>
      </div>
    {:else if docs.loaded}
      <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Documents'), href: DOCS_HASH }]} title={t('Documents')} />
      <Empty icon={FileText} text={t('This document is not here (any more).')} action={{ label: t('All documents'), href: DOCS_HASH }} />
    {/if}
  {:else}
    <!-- D3: the documents -->
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Documents')} title={t('Documents')} sub={docs.prefs.drive ? t('Passport, insurance, emergency and travel in one place. Also in your Google Drive.') : t('Passport, insurance, emergency and travel in one place. Only on your device.')} />
    <AreaIntro place="docs" />
    {#if msg}<p class="msg" role="status">{msg}</p>{/if}
    {#if undo}<p class="msg undo" role="status">{t('Deleted «{name}».', { name: undo.row?.name ?? '' })} <button type="button" class="link" onclick={undoDelete}>{t('Undo')}</button></p>{/if}
    {#if groupUndo}<p class="msg undo" role="status" data-group-undo>{groupUndo.text} <button type="button" class="link" onclick={undoGroupChange}>{t('Undo')}</button></p>{/if}
    <div class="ich-cols">
      <div class="ich-main">
        {#if docs.loaded && !docs.list.length}
          <Empty icon={FileText} title={t('No documents yet')} text={t('Add your passport, insurance or emergency sheet as a PDF or a photo. The app reminds you before it expires and puts «ID and cash with you?» in your packing list.')} /><!-- one main button on the page: «Add PDF» below -->
        {:else}
          <div class="tools">
            <label class="find"><Search size={16} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Search, also in the text of the pages')} aria-label={t('Search documents')} /></label>
            <Seg chips full={false} label={t('Sort')} value={sort} onchange={(v) => (sort = v)} options={SORTS.map((k) => ({ key: k, name: t(SORT_NAMES[k]) }))} />
          </div>
          <!-- Paket H «3a und b»: the documents as an editable table; tick several to move or delete them -->
          <p class="tblrow"><button type="button" class="btn btn-link" aria-pressed={tableOn} onclick={() => setTable(!tableOn)} data-doc-table>{tableOn ? t('Done') : phone.matches ? t('Change several') : t('Edit as a table')}</button></p>
          {#if tableOn}
            <ListTable rows={docs.list} cols={docCols} nameOf={(d) => d.name || t('Document')} onsave={saveDocRows} ondelete={delDocs} onrestore={(rows) => Promise.all(rows.map((r) => restoreDoc(r)))} onopen={(d) => (location.hash = `${DOCS_HASH}/${encodeURIComponent(d.id)}`)} label={t('Documents')} />
          {:else}
          {#each groups as g (g.key)}
            <section class="ich-sec" aria-labelledby={gid(g)}>
              {#if g.kind === 'hits'}
                <div class="ich-h"><div><h2 id={gid(g)}>{groupName(g)}</h2><p class="ich-hs">{tn(g.rows.length, '{n} document', '{n} documents')}</p></div></div>
              {:else}
              <GroupActions name={groupName(g)} count={g.rows.length} canDelete={g.kind === 'own'} allowEmpty={g.kind !== 'own'}
                renameExplain={g.kind === 'own' ? t('every document in it gets the new name') : t('only the name changes; new files still come here')}
                deleteExplain={t('the documents stay, in «{pdf}» or «{photo}»', { pdf: defName('pdf'), photo: defName('photo') })}
                renameHelp={renameHelp(g)} deleteAsk="" onrename={(v) => saveRename(g, v)} ondelete={() => (deleting = g)}>
                <h2 id={gid(g)}>{groupName(g)}</h2><p class="ich-hs">{tn(g.rows.length, '{n} document', '{n} documents')}</p>
              </GroupActions>
              {/if}
              {#if g.rows.length}
                <ul class="tiles">
                  {#each g.rows as d (d.id)}
                    {@const ex = expiry(d, today)}
                    <li><a class="card tile" href={`${DOCS_HASH}/${encodeURIComponent(d.id)}`} data-doc={d.id}>
                      <span class="thumb" aria-hidden="true">{#if d.kind === 'photo'}<img src={d.data} alt="" />{:else}PDF{/if}</span>
                      <span class="ich-m"><b>{d.name}</b><small>{lineOf(d)}{#if d.drive?.id}{' · '}{t('in Drive')}{/if}{#if q.trim() && groupOf(d)}{' · '}{ownLabel(groupOf(d))}{/if}</small></span>
                      {#if ex?.soon || ex?.over}<span class="pill warn">{ex.over ? t('expired') : t('soon|expiry')}</span>{:else}<span class="pill">{d.kind === 'photo' ? t('Photo') : d.pages > 1 ? `PDF · ${tn(d.pages, '{n} page', '{n} pages')}` : 'PDF'}</span>{/if}
                    </a></li>
                  {/each}
                </ul>
              {/if}
            </section>
          {/each}
          {/if}
        {/if}
        <div class="ich-acts">
          <a class="btn hi" href={SCAN_HASH}><Camera size={16} aria-hidden="true" />{t('Photograph document')}</a>
          <label class="btn" class:busy><Upload size={16} aria-hidden="true" />{t('Add PDF')}<input bind:this={fileEl} type="file" accept="application/pdf,.pdf,image/*" onchange={(e) => addFile(e)} hidden disabled={busy} /></label>
        </div>
        <p class="ich-help">{t('Photograph the pages: the app makes a PDF and reads the text. Or add a PDF or a photo of the paper. Then choose the group, «valid until» and whether it goes into the packing list.')}</p>
        {#if docs.list.length}<p class="ich-help" data-group-help>{t('Change a group: «…» beside its name › «Rename» or «Delete». Deleting a group keeps its documents.')}</p>{/if}
        <!-- Paket L «Werkzeugkasten» (Noah «4 a und b»): links and small files, the same as Werkzeugkasten › Ablage -->
        <div class="doc-ablage"><Ablage head="h2" /></div>
      </div>
      <div class="ich-side">
        <section class="ich-sec" aria-labelledby="rem-h">
          <div class="ich-h"><div><h2 id="rem-h">{t('Reminders')}</h2><p class="ich-hs">{t('by themselves from «valid until»')}</p></div></div>
          {#if reminders.length}
            <ul class="card ich-list" data-doc-reminders>
              {#each reminders as r (r.doc.id)}
                <li><a class="ich-row ich-wrap" href={`${DOCS_HASH}/${encodeURIComponent(r.doc.id)}`}>
                  <span class="ich-ib" class:warn={r.ex.soon || r.ex.over}>{#if r.ex.soon || r.ex.over}<TriangleAlert size={18} aria-hidden="true" />{:else}<Bell size={18} aria-hidden="true" />{/if}</span>
                  <span class="ich-m"><b>{r.ex.soon || r.ex.over ? t('Renew {name}', { name: r.doc.name }) : r.doc.name}</b><small>{r.ex.over ? t('expired {month}', { month: monthName(r.ex.until) }) : r.ex.soon ? t('expires {month} · many countries want 6 months', { month: monthName(r.ex.until) }) : r.ex.remindFrom ? tn(Number.isFinite(r.doc.remind) ? r.doc.remind : DEFAULT_REMIND, 'reminder {n} month before', 'reminder {n} months before') : t('no reminder')}</small></span>
                  <span class="when num">{r.ex.over ? '' : r.ex.soon ? tn(r.ex.left, 'in {n} mo', 'in {n} mo') : r.ex.remindFrom ? monthName(r.ex.remindFrom) : monthName(r.ex.until)}</span>
                </a></li>
              {/each}
            </ul>
          {:else}<p class="ich-help">{t('Give a document «valid until»: the app reminds you here in time.')}</p>{/if}
        </section>
        <!-- Paket V «Alltag» (Noah «4a»): contracts and subscriptions under Dokumente, with the deadline and a reminder -->
        <section class="ich-sec" aria-labelledby="abo-h">
          <div class="ich-h"><div><h2 id="abo-h">{t('Contracts and subscriptions')}</h2><p class="ich-hs">{t('cost, last day to cancel, reminder')}</p></div></div>
          <ul class="card ich-list"><li><a class="ich-row" href="#/me/alltag/abos" data-docs-abos><span class="ich-ib"><Bell size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Contracts and subscriptions')}</b><small>{t('Phone, insurance, streaming: the app reminds you before the notice period ends.')}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li></ul>
        </section>
        <section class="ich-sec" aria-labelledby="nt-h">
          <div class="ich-h"><div><h2 id="nt-h">{t('For the next trip')}</h2><p class="ich-hs">{next ? next.title || t('Next trip') : t('No trip planned')}</p></div></div>
          {#if pack.length}
            {@render packCard(pack)}
            <p class="ich-help">{t('Also in the packing list of the trip.')}</p>
          {:else}<p class="ich-help">{t('In a document: «In the packing list». Then it stands here and in every packing list.')}</p>{/if}
        </section>
        <section class="ich-sec" aria-labelledby="where-h">
          <div class="ich-h"><div><h2 id="where-h">{t('Where your documents are')}</h2></div></div>
          <ul class="card ich-list">
            <li class="ich-row"><span class="ich-ib"><Lock size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('On this device')}</b><small>{tn(docs.list.length, '{n} document', '{n} documents')} · {mb(total)}</small></span><Check size={16} aria-hidden="true" /></li>
            <li><a class="ich-row" href="#/me/data"><span class="ich-ib"><Database size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('In your backup file')}</b><small>{t('with «Make a backup» under Me')}</small></span><Check size={16} aria-hidden="true" /></a></li>
            <li class="ich-row"><span class="ich-ib"><Cloud size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('In your Google Drive')}</b><small>{docs.prefs.drive ? `${t('Folder «Imported PDFs», a subfolder per group')} · ${t('{n} of {m} there', { n: inDrive, m: docs.list.length })}` : t('not connected yet')}</small></span>{#if docs.prefs.drive}<Check size={16} aria-hidden="true" />{/if}</li>
          </ul>
          <div class="card ich-body drive">
            {#if docs.prefs.drive}
              <label class="tg"><input type="checkbox" checked={docs.prefs.auto} onchange={(e) => savePrefs({ auto: e.currentTarget.checked })} /> {t('Upload new documents by themselves')}</label>
              {#if inDrive < docs.list.length}<button type="button" class="btn sm" onclick={upNow} disabled={Object.keys(docs.uploading).length > 0}><Upload size={15} aria-hidden="true" />{Object.keys(docs.uploading).length ? t('Uploading…') : t('Upload now')}</button>{/if}
            {:else if hasKey}
              <button type="button" class="btn wide" onclick={() => connectDrive()}><Cloud size={16} aria-hidden="true" />{t('Connect Google Drive')}</button>
              <p class="ich-help">{t('A suggestion, never a must. The same Google login as Fitbit; the app sees only the folders and files it makes itself.')}</p>
            {:else}
              <p class="ich-help">{t('For Google Drive, first connect Strava on this device: it gives this device the key the Google connection uses too.')}</p>
              <a class="btn wide" href={STRAVA_HASH}>{t('Connect Strava first')}</a>
            {/if}
            {#if docs.error}<p class="err" role="status">{errorText(docs.error)}</p>{/if}
          </div>
        </section>
        <section class="ich-sec" aria-labelledby="gal-h">
          <div class="ich-h"><div><h2 id="gal-h">{t('Photos from the gallery')}</h2></div></div>
          <ul class="card ich-list">
            <li class="ich-row"><span class="ich-ib"><ImageIcon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Gallery › Share › Pack Generator')}</b><small>{t('when the app is on the home screen of your phone; or here «Photograph document» › «Gallery»')}</small></span></li>
          </ul>
        </section>
        {#if !docs.prefs.drive}<p class="ich-fine"><Lock size={16} aria-hidden="true" /><span>{t('Your files stay on this device and in your backup file. They never go to the internet.')}</span></p>{/if}
      </div>
    </div>
  {/if}
</div>

{#if deleting}
  {@const g = deleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: groupName(g) })}
    count={g.rows.length}
    what={(n) => tn(n, '{n} document', '{n} documents')}
    none={t('Back to «{pdf}» or «{photo}»', { pdf: defName('pdf'), photo: defName('photo') })}
    noneHint={t('PDFs to «{pdf}», photos to «{photo}». No document is deleted.', { pdf: defName('pdf'), photo: defName('photo') })}
    targets={groups.filter((x) => x.kind === 'own' && x.key !== g.key).map((x) => ({ id: x.name, name: groupName(x) }))}
    onconfirm={(to) => removeGroup(g, to)}
    onclose={() => (deleting = null)}
  />
{/if}


<style>
  .dtip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 10px 0 0;
    padding: 8px 12px;
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
    color: var(--ok);
    font-size: var(--fs-small);
  }
  .dtip span {
    flex: 1;
    min-width: 10em;
  }
  .doc-ablage {
    display: grid;
    gap: var(--sp-4);
    margin-top: var(--sp-5);
  }
  .msg {
    margin: 0 0 12px;
    font-weight: 600;
  }
  .undo .link {
    margin-left: 8px;
  }
  .tiles {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: 12px;
  }
  .tile {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 72px;
    padding: 10px 12px;
    color: var(--ink);
    text-decoration: none;
  }
  .thumb {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 56px;
    border-radius: 6px;
    background: var(--paper-2);
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 600;
    overflow: hidden;
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tile .ich-m {
    flex: 1;
    min-width: 0;
  }
  .tile .pill {
    flex: none;
  }
  .ich-ib.warn {
    color: var(--warn-ink, var(--ink));
    background: var(--warn-bg, var(--paper-2));
  }
  .when {
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tick {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-height: 44px;
  }
  .tick input {
    width: 20px;
    height: 20px;
    flex: none;
  }
  .see {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .prev {
    padding: 12px;
  }
  .prev img,
  .prev object {
    display: block;
    width: 100%;
    min-height: 420px;
    border: 1px solid var(--line);
    border-radius: 8px;
    object-fit: contain;
    background: var(--paper);
  }
  .prev img {
    min-height: 0;
    max-height: 70vh;
  }
  .pfoot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 10px;
  }
  .pfoot small {
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .form {
    display: grid;
    gap: 12px;
  }
  .fld {
    display: grid;
    gap: 4px;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .inline {
    display: flex;
    gap: 8px;
  }
  .inline .inp {
    flex: 1;
    min-width: 0;
  }
  .ich-help.warn {
    color: var(--ink);
    font-weight: 600;
  }
  .busy {
    opacity: 0.6;
  }
  .tools {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 18px;
  }
  .find {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-3);
  }
  .find input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    font: inherit;
    color: var(--ink);
    outline: none;
  }
  .txt {
    margin-top: 10px;
  }
  .txt summary {
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .txt p {
    margin: 8px 0 0;
    white-space: pre-wrap;
    font-size: var(--fs-small);
    color: var(--ink-2);
    max-height: 220px;
    overflow: auto;
  }
  .drive {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }
  .tg {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: var(--fs-small);
  }
  .wide {
    width: 100%;
    justify-content: center;
  }
  .err {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .prev img,
    .prev object {
      min-height: 280px;
    }
  }
</style>

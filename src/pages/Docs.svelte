<script>
  /**
   * Ich › Dokumente (P3b «Daten sicher», Noah 15.10.2026 «1a»; mockups D3 and D4 approved 12.10.2026
   * «d1-d5 freigeben», round 2 answers «4a» reminder 6 months before, «5a» «ID und Cash dabei?» as a
   * tick in the packing list with a link to the document).
   *
   * #/me/docs (D3): the groups with their documents, beside them «Reminders» (from «valid until» by
   * themselves) and «For the next trip» (the papers marked for the packing list, ticked per trip).
   * #/me/docs/<id> (D4): one document: preview, open, share; details (group, valid until, reminder,
   * note) save as you type; «In the packing list»; replace the file, delete (asks, then 4 s Undo).
   * Only on this device and in the backup file. Camera and Google Drive come later with «Dokumente-PDF».
   */
  import { liveQuery } from 'dexie';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { db } from '../lib/db.js';
  import { docs, DOCS_HASH, MAX_MB, addDoc, updateDoc, deleteDoc, restoreDoc, addGroup, readData, smallPhoto, pdfPages, blobOf } from '../lib/docs/client.svelte.js';
  import { groupDocs, ownGroups, groupOf, dataBytes, fileName, reminderRows, packRows, expiry, untilOf, REMIND_MONTHS, DEFAULT_REMIND, DEFAULT_GROUP, GROUP_IDEAS } from '../lib/docs.js';
  import { nextTrip } from '../lib/debrief.js';
  import { localDay } from '../lib/localday.js';
  import { FileText, Upload, Bell, Lock, ExternalLink, Share2, FileUp, Trash2, Backpack, Check, ChevronRight, TriangleAlert } from '@lucide/svelte';
  import '../lib/ich/ich.css';
  import '../lib/maintenance/maint.css';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  const today = localDay();
  const id = decodeURIComponent(location.hash.split('?')[0].slice(DOCS_HASH.length + 1));
  const doc = $derived(id ? docs.list.find((d) => d.id === id) ?? null : null);
  const tripsQ = liveQuery(() => db.trips.toArray());
  const next = $derived(nextTrip($tripsQ ?? [], today));
  const groups = $derived(groupDocs(docs.list, 'name', docs.prefs.groups).filter((g) => g.rows.length || g.kind === 'own'));
  const allGroups = $derived(ownGroups([...GROUP_IDEAS.map((g) => ({ group: g })), ...docs.list], docs.prefs.groups));
  const reminders = $derived(reminderRows(docs.list, today));
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
  const groupName = (g) => (g.kind === 'own' ? t(g.name) : t(DEFAULT_GROUP[g.kind === 'photo' ? 'photo' : 'pdf']));
  const kindLine = (d) => (d.kind === 'photo' ? t('Photo') : `PDF · ${tn(d.pages || 1, '{n} page', '{n} pages')}`);
  /** The quiet line of a document in the list: valid until, or the note. */
  function lineOf(d) {
    const ex = expiry(d, today);
    if (ex?.over) return t('expired {month}', { month: monthName(ex.until) });
    if (ex?.soon) return tn(ex.left, 'expires in {n} month', 'expires in {n} months');
    if (ex) return t('valid until {month}', { month: monthName(ex.until) });
    return d.note || day(d.createdAt);
  }

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
        const d = await addDoc({ ...file, name: f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 120) || t('Document') });
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
    if (!confirm(t('Delete «{name}»? It is gone from this device; older backup files still have it.', { name: d.name }))) return;
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
  async function makeGroup() {
    const g = await addGroup(newGroup);
    newGroup = null;
    if (g && doc) await updateDoc(doc.id, { group: g });
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
      <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Documents'), href: DOCS_HASH }]} here={doc.name} title={doc.name} sub={`${groupOf(doc) ? t(groupOf(doc)) : t(DEFAULT_GROUP[doc.kind === 'photo' ? 'photo' : 'pdf'])} · ${t('added on {date}', { date: day(doc.createdAt) })}`} />
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
              </span>
            </div>
          </section>
        </div>
        <div class="ich-side">
          <section class="ich-sec" aria-labelledby="dd-h">
            <div class="ich-h"><div><h2 id="dd-h">{t('Details')}</h2><p class="ich-hs">{t('Saved as you type.')}</p></div></div>
            <div class="card ich-body form">
              <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" type="text" maxlength="120" value={doc.name} onchange={(e) => e.currentTarget.value.trim() && updateDoc(doc.id, { name: e.currentTarget.value.trim() })} /></label>
              <label class="fld"><span class="lbl">{t('Group')}</span>
                <select class="inp" value={groupOf(doc)} onchange={(e) => (e.currentTarget.value === '+' ? (newGroup = '') : updateDoc(doc.id, { group: e.currentTarget.value }))}>
                  <option value="">{t(DEFAULT_GROUP[doc.kind === 'photo' ? 'photo' : 'pdf'])}</option>
                  {#each allGroups as g (g)}<option value={g}>{t(g)}</option>{/each}
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
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Documents')} title={t('Documents')} sub={t('Passport, insurance, emergency and travel in one place. Only on your device.')} />
    {#if msg}<p class="msg" role="status">{msg}</p>{/if}
    {#if undo}<p class="msg undo" role="status">{t('Deleted «{name}».', { name: undo.row?.name ?? '' })} <button type="button" class="link" onclick={undoDelete}>{t('Undo')}</button></p>{/if}
    <div class="ich-cols">
      <div class="ich-main">
        {#if docs.loaded && !docs.list.length}
          <Empty icon={FileText} title={t('No documents yet')} text={t('Add your passport, insurance or emergency sheet as a PDF or a photo. The app reminds you before it expires and puts «ID and cash with you?» in your packing list.')} /><!-- one main button on the page: «Add PDF» below -->
        {:else}
          {#each groups as g (g.key)}
            <section class="ich-sec" aria-labelledby={`g-${g.key}`}>
              <div class="ich-h"><div><h2 id={`g-${g.key}`}>{groupName(g)}</h2><p class="ich-hs">{tn(g.rows.length, '{n} document', '{n} documents')}</p></div></div>
              {#if g.rows.length}
                <ul class="tiles">
                  {#each g.rows as d (d.id)}
                    {@const ex = expiry(d, today)}
                    <li><a class="card tile" href={`${DOCS_HASH}/${encodeURIComponent(d.id)}`} data-doc={d.id}>
                      <span class="thumb" aria-hidden="true">{#if d.kind === 'photo'}<img src={d.data} alt="" />{:else}PDF{/if}</span>
                      <span class="ich-m"><b>{d.name}</b><small>{lineOf(d)}</small></span>
                      {#if ex?.soon || ex?.over}<span class="pill warn">{ex.over ? t('expired') : t('soon|expiry')}</span>{:else}<span class="pill">{d.kind === 'photo' ? t('Photo') : d.pages > 1 ? `PDF · ${tn(d.pages, '{n} page', '{n} pages')}` : 'PDF'}</span>{/if}
                    </a></li>
                  {/each}
                </ul>
              {/if}
            </section>
          {/each}
        {/if}
        <div class="ich-acts">
          <label class="btn hi" class:busy><Upload size={16} aria-hidden="true" />{t('Add PDF')}<input bind:this={fileEl} type="file" accept="application/pdf,.pdf,image/*" onchange={(e) => addFile(e)} hidden disabled={busy} /></label>
        </div>
        <p class="ich-help">{t('A PDF or a photo of the paper. Then choose the group, «valid until» and whether it goes into the packing list.')}</p>
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
        <section class="ich-sec" aria-labelledby="nt-h">
          <div class="ich-h"><div><h2 id="nt-h">{t('For the next trip')}</h2><p class="ich-hs">{next ? next.title || t('Next trip') : t('No trip planned')}</p></div></div>
          {#if pack.length}
            {@render packCard(pack)}
            <p class="ich-help">{t('Also in the packing list of the trip.')}</p>
          {:else}<p class="ich-help">{t('In a document: «In the packing list». Then it stands here and in every packing list.')}</p>{/if}
        </section>
        <p class="ich-fine"><Lock size={16} aria-hidden="true" /><span>{t('Your files stay on this device and in your backup file. They never go to the internet.')}</span></p>
      </div>
    </div>
  {/if}
</div>

<style>
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
  @media (max-width: 719px) {
    .prev img,
    .prev object {
      min-height: 280px;
    }
  }
</style>

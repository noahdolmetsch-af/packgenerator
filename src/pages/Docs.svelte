<script>
  /**
   * Dokumente-PDF (Noah 15.10.2026, his idea «ich fotografiere ein Dokument, daraus wird ein PDF … unter
   * "Importierte PDF" gesammelt»; answers «1b 2a mit möglichkeiten zum sortieren 3 beides möglich 4a im
   * normalfall und b möglich 5a» and «1a 2a»; built without mockups, «vorerst ohne mockup»).
   * Ich › Dokumente (#/me/docs): «Dokument fotografieren» and «PDF wählen», search in the name and the
   * recognised text, four ways to sort, the groups («Importierte PDF» first, own groups, «Importierte
   * Fotos»), per document open, share, rename, move to a group, delete. Beside: where the documents are
   * (this device, the backup file, Google Drive with a subfolder per group).
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { docs, SCAN_HASH, addDoc, renameDoc, moveDoc, deleteDoc, addGroup, connectDrive, checkDrive, uploadMissing, uploadDoc, savePrefs } from '../lib/docs/client.svelte.js';
  import { pageCount } from '../lib/docs/pdf.js';
  import { groupDocs, ownGroups, searchDocs, sortDocs, dataBytes, fileName, groupOf, SORTS, DEFAULT_GROUP } from '../lib/docs.js';
  import { readKey, STRAVA_HASH } from '../lib/strava/client.svelte.js';
  import { Camera, FileText, Image as ImageIcon, Search, Lock, Database, Cloud, Check, ChevronDown, ExternalLink, Share2, Pencil, FolderInput, Trash2, FolderPlus, Upload } from '@lucide/svelte';
  import '../lib/ich/ich.css';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  const hasKey = readKey();
  let sort = $state('new');
  let q = $state('');
  let open = $state(null); // id of the document whose actions are shown
  let renaming = $state('');
  let moving = $state(false);
  let newGroup = $state(null); // null = closed, '' = the field is open
  let msg = $state('');
  let fresh = $state(new URLSearchParams(location.hash.split('?')[1] ?? '').get('new'));

  const SORT_NAMES = { new: 'Newest', name: 'Name|sort', date: 'Date in the document', source: 'Camera / gallery' };
  const shown = $derived(searchDocs(docs.list, q));
  const groups = $derived(q.trim() ? [{ key: 'hits', kind: 'hits', name: null, rows: sortDocs(shown, sort) }] : groupDocs(docs.list, sort, docs.prefs.groups));
  const own = $derived(ownGroups(docs.list, docs.prefs.groups));
  const total = $derived(docs.list.reduce((s, d) => s + (d.bytes || dataBytes(d.data)), 0));
  const inDrive = $derived(docs.list.filter((d) => d.drive?.id).length);

  const mb = (b) => `${(b / 1024 / 1024).toLocaleString(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`;
  const day = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const groupName = (g) => (g.kind === 'hits' ? t('Found') : g.name ?? t(DEFAULT_GROUP[g.kind === 'photo' ? 'photo' : 'pdf']));
  const SOURCE = { camera: 'camera', gallery: 'gallery', share: 'shared', file: 'file' };

  $effect(() => {
    if (hasKey && docs.loaded && docs.prefs.drive) checkDrive().catch(() => {});
  });
  $effect(() => {
    if (!fresh) return;
    open = fresh;
    const id = fresh;
    setTimeout(() => document.getElementById(`doc-${id}`)?.scrollIntoView({ block: 'center' }), 50);
    history.replaceState(null, '', `${location.pathname}#/me/docs`);
    fresh = null;
  });

  async function choosePdf(event) {
    const files = [...event.currentTarget.files];
    event.currentTarget.value = '';
    msg = '';
    for (const f of files) {
      if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
        msg = t('Please choose a PDF.');
        continue;
      }
      if (f.size > 15 * 1024 * 1024) {
        msg = t('This PDF is bigger than 15 MB.');
        continue;
      }
      const data = await new Promise((ok, no) => {
        const r = new FileReader();
        r.onload = () => ok(String(r.result).replace(/^data:[^;]*;/, 'data:application/pdf;'));
        r.onerror = no;
        r.readAsDataURL(f);
      });
      const d = await addDoc({ kind: 'pdf', name: f.name.replace(/\.pdf$/i, '').slice(0, 120) || t('Document'), source: 'file', pages: await pageCount(data), bytes: f.size, mode: 'color', data });
      open = d.id;
      msg = t('«{name}» is in «Imported PDFs».', { name: d.name });
    }
  }

  function blobOf(d) {
    const s = d.data;
    const bin = atob(s.slice(s.indexOf(',') + 1));
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: d.kind === 'photo' ? 'image/jpeg' : 'application/pdf' });
  }
  const fileOf = (d) => new File([blobOf(d)], fileName(d.name, (d.docDate ?? d.createdAt ?? '').slice(0, 10), d.kind === 'photo' ? 'jpg' : 'pdf'), { type: d.kind === 'photo' ? 'image/jpeg' : 'application/pdf' });

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
        /* cancelled */
      }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
  }
  async function saveName(d) {
    if (renaming.trim() && renaming.trim() !== d.name) await renameDoc(d.id, renaming);
    renaming = '';
  }
  async function moveTo(d, g) {
    await moveDoc(d.id, g);
    moving = false;
    msg = t('Moved to «{group}».', { group: g || t(DEFAULT_GROUP[d.kind === 'photo' ? 'photo' : 'pdf']) });
  }
  async function remove(d) {
    if (!confirm(t('Delete «{name}» from the app? A copy in Google Drive stays.', { name: d.name }))) return;
    await deleteDoc(d.id);
    open = null;
  }
  async function makeGroup() {
    const g = await addGroup(newGroup);
    newGroup = null;
    if (g) msg = t('Group «{group}» made. Move documents there with «Move to group».', { group: g });
  }
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
</script>

<div class="docspage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Documents')} title={t('Documents')} sub={t('Photograph a document, it becomes a PDF. Or choose a PDF. Sorted into groups, searchable, also in your Google Drive.')} />
  <div class="acts">
    <a class="btn hi" href={SCAN_HASH}><Camera size={16} aria-hidden="true" />{t('Photograph document')}</a>
    <label class="btn"><FileText size={16} aria-hidden="true" />{t('Choose PDF')}<input type="file" accept="application/pdf,.pdf" multiple onchange={choosePdf} hidden /></label>
  </div>
  {#if msg}<p class="msg" role="status">{msg}</p>{/if}
  <div class="ich-cols">
    <div class="ich-main">
      {#if docs.loaded && !docs.list.length}
        <Empty icon={FileText} title={t('No documents yet')} text={t('Photograph a receipt, a letter or a warranty: the app makes a PDF of it and keeps it here.')} action={{ label: t('Photograph document'), href: SCAN_HASH }} />
      {:else}
        <div class="tools">
          <label class="find"><Search size={16} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Search, also in the text of the pages')} aria-label={t('Search documents')} /></label>
          <Seg chips full={false} label={t('Sort')} value={sort} onchange={(v) => (sort = v)} options={SORTS.map((k) => ({ key: k, name: t(SORT_NAMES[k]) }))} />
        </div>
        {#each groups as g (g.key)}
          <section class="ich-sec" aria-labelledby={`g-${g.key}`}>
            <div class="ich-h"><div><h2 id={`g-${g.key}`}>{groupName(g)}</h2><p class="ich-hs">{tn(g.rows.length, '{n} document', '{n} documents')}</p></div></div>
            {#if g.rows.length}
              <ul class="card ich-list">
                {#each g.rows as d (d.id)}
                  <li id={`doc-${d.id}`} class:on={open === d.id}>
                    <button type="button" class="ich-row row" aria-expanded={open === d.id} onclick={() => ((open = open === d.id ? null : d.id), (renaming = ''), (moving = false))}>
                      <span class="thumb" aria-hidden="true">{#if d.kind === 'photo'}<img src={d.data} alt="" />{:else}PDF{/if}</span>
                      <span class="ich-m"><b>{d.name}{#if Date.now() - Date.parse(d.createdAt) < 10 * 60_000} <span class="pill ok">{t('new|doc')}</span>{/if}</b><small>{day(d.docDate ?? d.createdAt)} · {d.kind === 'photo' ? t('Photo') : tn(d.pages || 1, '{n} page', '{n} pages')} · {mb(d.bytes || dataBytes(d.data))} · {t(SOURCE[d.source] ?? 'file')}{#if d.drive?.id}{' · '}{t('in Drive')}{/if}{#if q.trim() && groupOf(d)}{' · '}{groupOf(d)}{/if}</small></span>
                      <ChevronDown class="ich-chev" size={18} aria-hidden="true" />
                    </button>
                    {#if open === d.id}
                      <div class="more">
                        <div class="btns">
                          <button type="button" class="btn sm" onclick={() => openDoc(d)}><ExternalLink size={15} aria-hidden="true" />{t('Open')}</button>
                          <button type="button" class="btn sm" onclick={() => shareDoc(d)}><Share2 size={15} aria-hidden="true" />{t('Share')}</button>
                          <button type="button" class="btn sm" onclick={() => ((renaming = d.name), (moving = false))}><Pencil size={15} aria-hidden="true" />{t('Rename')}</button>
                          <button type="button" class="btn sm" onclick={() => ((moving = !moving), (renaming = ''))}><FolderInput size={15} aria-hidden="true" />{t('Move to group')}</button>
                          {#if d.drive?.link}<a class="btn sm" href={d.drive.link} target="_blank" rel="noopener"><Cloud size={15} aria-hidden="true" />{t('Open in Drive')}</a>{/if}
                          <button type="button" class="btn sm danger" onclick={() => remove(d)}><Trash2 size={15} aria-hidden="true" />{t('Delete')}</button>
                        </div>
                        {#if renaming}
                          <form class="inline" onsubmit={(e) => (e.preventDefault(), saveName(d))}>
                            <input type="text" bind:value={renaming} maxlength="120" aria-label={t('New name')} />
                            <button type="submit" class="btn sm hi">{t('Save')}</button>
                          </form>
                        {/if}
                        {#if moving}
                          <div class="chips" role="group" aria-label={t('Move to group')}>
                            <button type="button" class="chip" aria-pressed={!groupOf(d)} onclick={() => moveTo(d, '')}>{t(DEFAULT_GROUP[d.kind === 'photo' ? 'photo' : 'pdf'])}</button>
                            {#each own as g2 (g2)}<button type="button" class="chip" aria-pressed={groupOf(d) === g2} onclick={() => moveTo(d, g2)}>{g2}</button>{/each}
                            <button type="button" class="chip" onclick={() => ((newGroup = ''), (moving = false))}><FolderPlus size={14} aria-hidden="true" />{t('New group')}</button>
                          </div>
                        {/if}
                        {#if d.text}<details class="txt"><summary>{t('Recognised text')}</summary><p>{d.text.slice(0, 1200)}{d.text.length > 1200 ? '…' : ''}</p></details>{/if}
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="ich-help">{g.kind === 'pdf' ? t('Photographed documents come here.') : t('Empty. Move documents here with «Move to group».')}</p>
            {/if}
          </section>
        {/each}
        {#if !q.trim()}
          {#if newGroup !== null}
            <form class="inline" onsubmit={(e) => (e.preventDefault(), makeGroup())}>
              <input type="text" bind:value={newGroup} maxlength="60" placeholder={t('e.g. Warranties')} aria-label={t('Name of the new group')} />
              <button type="submit" class="btn sm hi">{t('Make group')}</button>
              <button type="button" class="btn sm" onclick={() => (newGroup = null)}>{t('Cancel')}</button>
            </form>
          {:else}
            <button type="button" class="btn sm" onclick={() => (newGroup = '')}><FolderPlus size={15} aria-hidden="true" />{t('New group')}</button>
          {/if}
        {/if}
      {/if}
    </div>
    <div class="ich-side">
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
            <button type="button" class="btn hi wide" onclick={() => connectDrive()}><Cloud size={16} aria-hidden="true" />{t('Connect Google Drive')}</button>
            <p class="ich-help">{t('The same Google login as Fitbit. The app sees only the folders and files it makes itself.')}</p>
          {:else}
            <p class="ich-help">{t('First connect Strava on this device: it gives this device the key the Google connection uses too.')}</p>
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
    </div>
  </div>
</div>

<style>
  .docspage {
    max-width: 1100px;
    min-width: 0;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 16px;
  }
  .acts :global(svg),
  .btns :global(svg) {
    flex: none;
  }
  .msg {
    margin: 0 0 12px;
    color: var(--ink-2);
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
  .row {
    width: 100%;
    border: 0;
    background: transparent;
    font: inherit;
    text-align: left;
    color: inherit;
    cursor: pointer;
  }
  .thumb {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 44px;
    border-radius: 5px;
    overflow: hidden;
    background: var(--paper-2);
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 700;
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 16px 14px 62px;
  }
  .btns,
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 99px;
    border: 1px solid var(--line);
    background: var(--paper);
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .danger {
    color: var(--bad);
  }
  .inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin: 4px 0 0;
  }
  .inline input {
    flex: 1 1 200px;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    font: inherit;
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
  @media (max-width: 640px) {
    .more {
      padding-left: 16px;
    }
  }
</style>

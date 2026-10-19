<script>
  /**
   * Dokumente-PDF, «Dokument fotografieren» (#/me/docs/scan; Noah 15.10.2026, built without mockups).
   * 1 Photograph page by page (phone: the camera opens at once, as the Kamera-Knopf) or choose photos
   *   from the gallery (several at once), or they come shared from the gallery («Teilen › Pack Generator»).
   * 2 Check: the app finds the edge of the paper by itself, the corners can be moved by hand (Noah «3
   *   beides möglich»); turn, order, delete, «Weitere Seite»; black and white by default, gray or colour
   *   possible (Noah «4a … b möglich»). Several photos: one PDF of all (Noah «1a»), each its own PDF, or
   *   kept as photos.
   * 3 Save: the text is read on the device for the search and the name (Noah «5a»), then the PDF goes to
   *   «Importierte PDF» (or the chosen group) and, when Drive is on, into Google Drive.
   */
  import DateInput from '../lib/ui/DateInput.svelte';
  import { onMount } from 'svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { readPhoto, findPaper, renderPage, keepPhoto } from '../lib/docs/scan.js';
  import { makePdf } from '../lib/docs/pdf.js';
  import { readText } from '../lib/docs/ocr.js';
  import { docs, addDoc, DOCS_HASH } from '../lib/docs/client.svelte.js';
  import { ownGroups, suggestName, findDate, dataBytes, MODES, MAKES, DEFAULT_GROUP, FULL_QUAD } from '../lib/docs.js';
  import { SHARE_DOCS_CACHE } from '../lib/docs/share.js';
  import { Camera, Image as ImageIcon, RotateCw, Crop, X, ArrowLeft, ArrowRight, Check, Plus } from '@lucide/svelte';
  import { localDay } from '../lib/localday.js';
  import '../lib/ich/ich.css';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  const phone = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const canvases = new Map(); // page id → the photo (kept out of $state: big)
  let pages = $state([]); // { id, quad, found, turn, thumb, source }
  let mode = $state('bw');
  let make = $state('one');
  let name = $state('');
  let date = $state('');
  let group = $state('');
  let busy = $state('');
  let err = $state('');
  let edit = $state(null); // { id, quad, img } while the corners are moved
  let fromGallery = $state(false);
  let dropping = $state(false);
  let seq = 0;

  const MODE_NAMES = { bw: 'Black and white', gray: 'Grayscale', color: 'Colour' };
  const MAKE_NAMES = {
    one: ['One PDF of all {n}', 'e.g. a letter with several pages'],
    each: ['Each photo its own PDF', '{n} PDFs in «Imported PDFs»'],
    photos: ['Keep as photos', 'Folder «Imported photos», in the app and in Drive'],
  };
  const own = $derived(ownGroups(docs.list, docs.prefs.groups));
  const today = localDay();

  async function addFiles(files, source) {
    err = '';
    const list = [...files].filter((f) => f && f.size > 0);
    if (!list.length) return;
    if (list.length > 1 || source === 'gallery' || source === 'share') fromGallery = fromGallery || list.length > 1 || pages.length > 0;
    busy = tn(list.length, 'Reading {n} photo…', 'Reading {n} photos…');
    for (const f of list) {
      try {
        const c = await readPhoto(f);
        const id = `p${++seq}`;
        canvases.set(id, c);
        const { quad, found } = findPaper(c);
        pages.push({ id, quad, found, turn: 0, thumb: renderPage(c, quad, { mode, max: 420 }).src, source });
      } catch (e) {
        err = e?.message ?? t('This photo could not be read. Please choose a JPG or PNG.');
      }
    }
    busy = '';
  }

  function pick(source) {
    return (event) => {
      const input = event.currentTarget;
      const files = [...(input.files ?? [])];
      input.value = '';
      addFiles(files, source);
    };
  }

  function redraw(p) {
    p.thumb = renderPage(canvases.get(p.id), p.quad, { turn: p.turn, mode, max: 420 }).src;
  }
  $effect(() => {
    // the look changed: draw the small pictures again
    mode;
    for (const p of pages) redraw(p);
  });

  const turn = (p) => ((p.turn = (p.turn + 1) % 4), redraw(p));
  const drop = (i) => (canvases.delete(pages[i].id), pages.splice(i, 1));
  function move(i, by) {
    const j = i + by;
    if (j < 0 || j >= pages.length) return;
    [pages[i], pages[j]] = [pages[j], pages[i]];
  }

  /* corners by hand */
  function openEdit(p) {
    const c = canvases.get(p.id);
    const k = Math.min(1, 900 / Math.max(c.width, c.height));
    const s = document.createElement('canvas');
    s.width = Math.round(c.width * k);
    s.height = Math.round(c.height * k);
    s.getContext('2d').drawImage(c, 0, 0, s.width, s.height);
    edit = { id: p.id, quad: p.quad.map((q) => ({ ...q })), auto: findPaper(c), img: s.toDataURL('image/jpeg', 0.8), ratio: c.width / c.height };
  }
  let dragging = -1;
  let box = $state(null);
  function at(e) {
    const r = box.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  }
  function down(i, e) {
    dragging = i;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function moveCorner(e) {
    if (dragging < 0 || !edit) return;
    edit.quad[dragging] = at(e);
  }
  function nudge(i, e) {
    const step = e.shiftKey ? 0.05 : 0.01;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    const q = edit.quad[i];
    edit.quad[i] = { x: Math.min(1, Math.max(0, q.x + d[0])), y: Math.min(1, Math.max(0, q.y + d[1])) };
  }
  function doneEdit() {
    const p = pages.find((x) => x.id === edit.id);
    if (p) {
      p.quad = edit.quad.map((q) => ({ ...q }));
      redraw(p);
    }
    edit = null;
  }
  const CORNER = ['top left', 'top right', 'bottom right', 'bottom left'];

  async function save() {
    if (!pages.length || busy) return;
    err = '';
    const when = new Date();
    const src = pages.map((p) => p.source).includes('camera') ? 'camera' : pages[0].source;
    try {
      if (make === 'photos' && pages.length) {
        busy = t('Saving…');
        let last = null;
        for (const [i, p] of pages.entries()) {
          const img = keepPhoto(canvases.get(p.id), { turn: p.turn });
          last = await addDoc({ kind: 'photo', name: pages.length > 1 ? `${name.trim() || t('Photo')} ${i + 1}` : name.trim() || t('Photo'), group, source: p.source, pages: 1, bytes: dataBytes(img.src), mode: 'color', docDate: date || null, data: img.src, ...(sharedNote ? { note: sharedNote } : {}) });
        }
        return finish(last);
      }
      busy = t('Making the pages…');
      await new Promise((r) => setTimeout(r, 30));
      const full = pages.map((p) => renderPage(canvases.get(p.id), p.quad, { turn: p.turn, mode }));
      const sets = make === 'each' ? full.map((f) => [f]) : [full];
      let last = null;
      for (const [i, set] of sets.entries()) {
        busy = t('Reading the text…');
        const text = await readText(
          set.map((f) => f.src),
          { onstep: (n, m) => (busy = m > 1 ? t('Reading the text: page {n} of {m}…', { n, m }) : t('Reading the text…')) },
        );
        busy = t('Making the PDF…');
        const fallback = t('Scan {date}', { date: when.toLocaleDateString(locale()) });
        const base = name.trim() || suggestName(text) || fallback;
        const title = sets.length > 1 ? `${base} ${i + 1}` : base;
        const data = await makePdf(set, { title, when });
        last = await addDoc({ kind: 'pdf', name: title, group, source: src, pages: set.length, bytes: dataBytes(data), mode, text, docDate: date || findDate(text), data, ...(sharedNote ? { note: sharedNote } : {}) });
      }
      finish(last);
    } catch (e) {
      busy = '';
      err = t('The PDF could not be made: {why}', { why: e?.message ?? '' });
    }
  }
  function finish(last) {
    busy = '';
    canvases.clear();
    // Paket B: the new document opens (like «Add PDF»), so group, «valid until» and the packing list come next
    location.hash = last ? `${DOCS_HASH}/${encodeURIComponent(last.id)}` : DOCS_HASH;
  }

  /* photos shared from the gallery («Teilen › Pack Generator», public/share-target.js) */
  let sharedNote = '';
  onMount(async () => {
    if (!/[?&]shared=1/.test(location.hash) || typeof caches === 'undefined') return;
    history.replaceState(null, '', `${location.pathname}${location.hash.split('?')[0]}`);
    try {
      const cache = await caches.open(SHARE_DOCS_CACHE);
      const files = [];
      // «Mail in die App» 5a: the text shared with the files becomes the document's note
      for (const req of await cache.keys()) {
        const res = await cache.match(req);
        const blob = await res.blob();
        files.push(new File([blob], decodeURIComponent(res.headers.get('X-File-Name') ?? 'shared'), { type: blob.type || res.headers.get('Content-Type') || '' }));
        sharedNote ||= decodeURIComponent(res.headers.get('X-Share-Text') ?? '').trim();
        await cache.delete(req);
      }
      const pdfs = files.filter((f) => f.type === 'application/pdf');
      for (const f of pdfs) {
        const data = await new Promise((ok) => {
          const r = new FileReader();
          r.onload = () => ok(String(r.result));
          r.readAsDataURL(f);
        });
        await addDoc({ kind: 'pdf', name: f.name.replace(/\.pdf$/i, '') || t('Document'), source: 'share', pages: 0, bytes: f.size, mode: 'color', data, ...(sharedNote ? { note: sharedNote } : {}) });
      }
      const imgs = files.filter((f) => f.type.startsWith('image/'));
      if (imgs.length) {
        fromGallery = imgs.length > 1;
        await addFiles(imgs, 'share');
      } else if (pdfs.length) location.hash = DOCS_HASH;
    } catch {
      err = t('The shared files could not be read.');
    }
  });

  function ondrop(e) {
    e.preventDefault();
    dropping = false;
    addFiles(e.dataTransfer?.files ?? [], 'gallery');
  }
</script>

<div class="scanpage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Documents'), href: DOCS_HASH }]} here={t('Photograph document')} title={pages.length ? t('Check and keep as PDF') : t('Photograph document')} sub={pages.length ? tn(pages.length, '{n} page · the edge is found by itself; «Corners» moves it by hand.', '{n} pages · the edge is found by itself; «Corners» moves it by hand.') : t('Page by page: the app cuts the paper out, straightens it and makes a PDF. Or choose photos from the gallery.')} />

  {#if !pages.length}
    <div class="start card ich-body" class:drop={dropping} role="region" aria-label={t('Add photos')} ondragover={(e) => (e.preventDefault(), (dropping = true))} ondragleave={() => (dropping = false)} {ondrop}>
      {#if phone}
        <label class="btn hi big"><Camera size={20} aria-hidden="true" />{t('Take photo')}<input type="file" accept="image/*" capture="environment" onchange={pick('camera')} hidden /></label>
        <label class="btn big"><ImageIcon size={20} aria-hidden="true" />{t('Gallery')}<input type="file" accept="image/*" multiple onchange={pick('gallery')} hidden /></label>
      {:else}
        <span class="ring" aria-hidden="true"><ImageIcon size={26} /></span>
        <b>{t('Drag photos here')}</b>
        <span class="ich-help">{t('JPG or PNG · every photo becomes a page · everything stays on this device')}</span>
        <label class="btn hi"><ImageIcon size={16} aria-hidden="true" />{t('Choose photos')}<input type="file" accept="image/*" multiple onchange={pick('gallery')} hidden /></label>
      {/if}
      {#if busy}<p class="busy" role="status">{busy}</p>{/if}
      {#if err}<p class="err" role="alert">{err}</p>{/if}
    </div>
  {:else}
    <div class="ich-cols">
      <div class="ich-main">
        <section class="ich-sec" aria-labelledby="pages-h">
          <div class="ich-h"><div><h2 id="pages-h">{t('Pages')}</h2><p class="ich-hs">{t('arrows change the order')}</p></div></div>
          <ol class="pages">
            {#each pages as p, i (p.id)}
              <li class="pg card">
                <img src={p.thumb} alt={t('Page {n}', { n: i + 1 })} />
                <div class="pa">
                  <b>{i + 1}</b>
                  {#if !p.found}<small class="hint">{t('edge not found')}</small>{/if}
                  <span class="pb">
                    <button type="button" class="ib" aria-label={t('Earlier')} disabled={i === 0} onclick={() => move(i, -1)}><ArrowLeft size={16} /></button>
                    <button type="button" class="ib" aria-label={t('Later')} disabled={i === pages.length - 1} onclick={() => move(i, 1)}><ArrowRight size={16} /></button>
                    <button type="button" class="ib" aria-label={t('Turn')} onclick={() => turn(p)}><RotateCw size={16} /></button>
                    <button type="button" class="ib" aria-label={t('Corners')} onclick={() => openEdit(p)}><Crop size={16} /></button>
                    <button type="button" class="ib" aria-label={t('Remove page')} onclick={() => drop(i)}><X size={16} /></button>
                  </span>
                </div>
              </li>
            {/each}
            <li class="pg add">
              {#if phone}
                <label class="addb"><Camera size={22} aria-hidden="true" />{t('Another page')}<input type="file" accept="image/*" capture="environment" onchange={pick('camera')} hidden /></label>
                <label class="addb small"><ImageIcon size={18} aria-hidden="true" />{t('Gallery')}<input type="file" accept="image/*" multiple onchange={pick('gallery')} hidden /></label>
              {:else}
                <label class="addb"><Plus size={22} aria-hidden="true" />{t('Another page')}<input type="file" accept="image/*" multiple onchange={pick('gallery')} hidden /></label>
              {/if}
            </li>
          </ol>
        </section>
        {#if make !== 'photos'}
          <section class="ich-sec" aria-labelledby="look-h">
            <div class="ich-h"><div><h2 id="look-h">{t('Look')}</h2><p class="ich-hs">{t('black and white by default, colour possible')}</p></div></div>
            <div class="card ich-body">
              <Seg chips full={false} labelledby="look-h" value={mode} onchange={(v) => (mode = v)} options={MODES.map((k) => ({ key: k, name: t(MODE_NAMES[k]) }))} />
              <p class="ich-help">{mode === 'bw' ? t('Black and white reads well and stays small (about 0.2 MB a page).') : mode === 'gray' ? t('Grayscale keeps pencil and stamps.') : t('Colour for photos, stamps and maps; bigger.')}</p>
            </div>
          </section>
        {/if}
      </div>
      <div class="ich-side">
        {#if fromGallery && pages.length > 1}
          <section class="ich-sec" aria-labelledby="make-h">
            <div class="ich-h"><div><h2 id="make-h">{tn(pages.length, '{n} photo', '{n} photos')}</h2><p class="ich-hs">{t('what should they become?')}</p></div></div>
            <div class="card ich-list" role="radiogroup" aria-labelledby="make-h">
              {#each MAKES as k (k)}
                <label class="opt ich-row"><input type="radio" name="make" value={k} bind:group={make} /><span class="ich-m"><b>{t(MAKE_NAMES[k][0], { n: pages.length })}</b><small>{t(MAKE_NAMES[k][1], { n: pages.length })}</small></span></label>
              {/each}
            </div>
          </section>
        {/if}
        <section class="ich-sec" aria-labelledby="facts-h">
          <div class="ich-h"><div><h2 id="facts-h">{t('Details')}</h2><p class="ich-hs">{t('everything can be changed later')}</p></div></div>
          <div class="card ich-body facts">
            <label>{t('Name|doc')}<input type="text" bind:value={name} maxlength="120" placeholder={make === 'photos' ? t('Photo') : t('suggested from the text')} /></label>
            <label>{t('Date')}<DateInput bind:value={date} max={today} /></label>
            <label>{t('Keep in')}
              <select bind:value={group}>
                <option value="">{t(DEFAULT_GROUP[make === 'photos' ? 'photo' : 'pdf'])}</option>
                {#each own as g (g)}<option value={g}>{g}</option>{/each}
              </select>
            </label>
            {#if docs.prefs.drive}<p class="ich-help">{t('Goes into your Google Drive by itself afterwards.')}</p>{/if}
          </div>
        </section>
        {#if busy}<p class="busy" role="status">{busy}</p>{/if}
        {#if err}<p class="err" role="alert">{err}</p>{/if}
        <div class="go">
          <a class="btn" href={DOCS_HASH}>{t('Cancel')}</a>
          <button type="button" class="btn hi" disabled={!!busy} onclick={save}><Check size={16} aria-hidden="true" />{make === 'photos' ? t('Keep photos') : make === 'each' ? tn(pages.length, 'Save as {n} PDF', 'Save as {n} PDFs') : t('Save as PDF')}</button>
        </div>
      </div>
    </div>
  {/if}
</div>

{#if edit}
  <div class="editor" role="dialog" aria-modal="true" aria-labelledby="ed-h">
    <div class="ed card">
      <h2 id="ed-h">{t('Move the corners')}</h2>
      <p class="ich-help">{t('Drag the four points onto the corners of the paper.')}</p>
      <div class="pic" bind:this={box} style={`aspect-ratio:${edit.ratio}`} onpointermove={moveCorner} onpointerup={() => (dragging = -1)} onpointercancel={() => (dragging = -1)}>
        <img src={edit.img} alt="" draggable="false" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points={edit.quad.map((q) => `${q.x * 100},${q.y * 100}`).join(' ')} /></svg>
        {#each edit.quad as q, i (i)}
          <button type="button" class="hd" style={`left:${q.x * 100}%;top:${q.y * 100}%`} aria-label={t('Corner {which}', { which: t(CORNER[i]) })} onpointerdown={(e) => down(i, e)} onkeydown={(e) => nudge(i, e)}></button>
        {/each}
      </div>
      <div class="edb">
        <button type="button" class="btn sm" onclick={() => (edit.quad = edit.auto.quad.map((q) => ({ ...q })))}>{t('Edge by itself')}</button>
        <button type="button" class="btn sm" onclick={() => (edit.quad = FULL_QUAD.map((q) => ({ ...q })))}>{t('Whole photo')}</button>
        <span class="sp"></span>
        <button type="button" class="btn sm" onclick={() => (edit = null)}>{t('Cancel')}</button>
        <button type="button" class="btn sm hi" onclick={doneEdit}>{t('Done')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .scanpage {
    max-width: 1100px;
    min-width: 0;
  }
  .start {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 36px 20px;
    border: 2px dashed var(--line-strong);
    text-align: center;
  }
  .start.drop {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .start .big {
    width: 100%;
    max-width: 360px;
    justify-content: center;
    min-height: 56px;
    font-size: var(--fs-sub);
  }
  .ring {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .pages {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pg {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .pg img {
    width: 100%;
    aspect-ratio: 1 / 1.41;
    object-fit: contain;
    background: var(--paper-2);
    border-radius: 4px;
    border: 1px solid var(--line);
  }
  .pa {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .pb {
    display: flex;
    margin-left: auto;
  }
  .hint {
    color: var(--warn);
    font-size: var(--fs-tiny);
  }
  .ib {
    display: grid;
    place-items: center;
    width: 30px;
    height: 32px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib:disabled {
    opacity: 0.35;
  }
  .ib:hover:not(:disabled) {
    background: var(--paper-2);
  }
  .pg.add {
    align-items: center;
    justify-content: center;
    min-height: 200px;
    border: 2px dashed var(--line);
    border-radius: var(--r-card);
    background: transparent;
  }
  .addb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px;
    color: var(--ink-2);
    cursor: pointer;
    font-weight: 500;
  }
  .addb.small {
    flex-direction: row;
    font-size: var(--fs-small);
  }
  .opt {
    cursor: pointer;
  }
  .opt input {
    flex: none;
    width: 20px;
    height: 20px;
    accent-color: var(--hi);
  }
  .facts {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .facts label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .facts input,
  .facts select {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    font: inherit;
    color: var(--ink);
  }
  .go {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
  .busy {
    color: var(--ink-2);
    margin: 10px 0 0;
  }
  .err {
    color: var(--bad);
    margin: 10px 0 0;
  }
  .editor {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 16px;
    background: var(--scrim);
  }
  .ed {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(720px, 100%);
    max-height: 100%;
    padding: 16px;
    overflow: auto;
  }
  .ed h2 {
    margin: 0;
    font-size: var(--fs-block);
  }
  .pic {
    position: relative;
    width: 100%;
    max-height: 62vh;
    margin: 0 auto;
    touch-action: none;
    user-select: none;
  }
  .pic img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: fill;
    border-radius: 6px;
  }
  .pic svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .pic polygon {
    fill: var(--ok-soft);
    fill-opacity: 0.35;
    stroke: var(--ok);
    stroke-width: 0.6;
    vector-effect: non-scaling-stroke;
  }
  .hd {
    position: absolute;
    width: 30px;
    height: 30px;
    margin: -15px 0 0 -15px;
    border-radius: 50%;
    border: 3px solid var(--hi-ink);
    background: var(--hi);
    box-shadow: 0 1px 6px var(--shadow);
    cursor: grab;
    touch-action: none;
  }
  .edb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sp {
    flex: 1;
  }
</style>

<script>
  /**
   * Paket NE 1146 (Noah 20.10.2026): draw on a photo, or on a pad of one or more pages (blank, squared,
   * lined). Pen, highlighter, line, arrow, rectangle, circle, text, eraser and «Move»; colours and sizes;
   * undo and redo; pen pressure makes lines thicker and can be turned off (kept on this device).
   * The strokes stay editable (the ink), and a flat picture of each page is saved as well.
   *
   * src: the photo to draw on (or null for a pad); ink: the drawing to go on with (inkFor()); start: its page.
   * onsave({ flats: [dataURL], ink }), onclose().
   */
  import { onMount } from 'svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { TOOLS, COLORS, COLOR_NAMES, SIZES, PAPERS, BASE_MAX, MAX_PAGES, newInk, history, commit, undo, redo, current, itemAt, moveItem, paint, pressureOf, thinPoints, emptyInk } from './ink.js';
  import { Pen, Highlighter, Minus, MoveUpRight, Square, Circle, Type, Eraser, Move, Undo2, Redo2, Trash2, Plus, ChevronLeft, ChevronRight, Check, X } from '@lucide/svelte';

  let { src = null, ink = null, start = 0, title = '', onsave, onclose } = $props();

  const ICON = { pen: Pen, hi: Highlighter, line: Minus, arrow: MoveUpRight, rect: Square, ellipse: Circle, text: Type, erase: Eraser, select: Move };
  const LS = 'draw.prefs';
  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  }
  const prefs = loadPrefs();
  let tool = $state(TOOLS.some((x) => x.key === prefs.tool && x.key !== 'erase' && x.key !== 'select') ? prefs.tool : 'pen');
  let color = $state(COLORS.includes(prefs.color) ? prefs.color : COLORS[2]);
  let size = $state(SIZES.includes(prefs.size) ? prefs.size : SIZES[1]);
  let pressure = $state(prefs.pressure !== false);
  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ tool, color, size, pressure }));
    } catch {
      /* private window: only this time */
    }
  });

  let dialog;
  let canvas = $state(null);
  let work = $state(null); // the ink (without pages, they live in the history)
  let hist = $state(null);
  let page = $state(0);
  let img = null;
  let ready = $state(false);
  let failed = $state('');
  let sel = $state(-1);
  let textBox = $state(null); // { x, y, value, edit: index | -1 }
  let textEl = $state(null);
  let saving = $state(false);

  const pages = $derived(hist ? current(hist) : [[]]);
  const items = $derived(pages[page] ?? []);
  const isPad = $derived(!!work && !work.base);

  async function loadImg(s) {
    const im = new Image();
    im.src = s;
    await im.decode();
    return im;
  }
  onMount(() => {
    dialog.showModal();
    (async () => {
      try {
        if (ink?.pages) {
          work = { ...structuredClone($state.snapshot(ink)) };
          if (work.base) img = await loadImg(work.base);
        } else if (src) {
          img = await loadImg(src);
          const long = Math.max(img.naturalWidth, img.naturalHeight);
          // big photos get smaller; a very small one is drawn on at 800 px, so lines stay fine
          const k = Math.min(BASE_MAX / long, Math.max(1, 800 / long));
          work = newInk({ base: src, w: img.naturalWidth * k, h: img.naturalHeight * k });
        } else work = newInk({ paper: prefs.paper ?? 'plain' });
        hist = history(work.pages);
        page = Math.max(0, Math.min(start, work.pages.length - 1));
        ready = true;
      } catch {
        failed = t('This photo could not be opened for drawing.');
      }
    })();
  });

  let cur = null; // the item being drawn
  let drag = null; // { start: [x, y], base: items } for the eraser and «Move»
  let penSeen = false;
  let activeId = null;
  let raf = 0;
  function redraw() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!canvas || !work) return;
      const shown = drag?.items ?? items;
      paint(canvas.getContext('2d'), { ...work, pages: pages.map((pg, i) => (i === page ? shown : pg)) }, page, { img, pressure, extra: cur, selected: tool === 'select' ? sel : -1 });
    });
  }
  $effect(() => {
    // redraw when the page, the items, the selection or the pressure change
    page;
    items;
    sel;
    pressure;
    tool;
    if (ready && canvas) redraw();
  });

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * work.w, ((e.clientY - r.top) / r.height) * work.h];
  }
  const tol = () => (canvas ? Math.max(10, (14 * work.w) / canvas.getBoundingClientRect().width) : 12);
  function setItems(next) {
    hist = commit(hist, pages.map((pg, i) => (i === page ? next : pg)));
  }

  function down(e) {
    if (!ready || textBox) return;
    if (e.pointerType === 'pen') penSeen = true;
    // a hand resting on the screen while a pen draws does not draw (palm)
    if (penSeen && e.pointerType === 'touch') return;
    if (activeId != null) return;
    activeId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    const [x, y] = pos(e);
    if (tool === 'pen' || tool === 'hi') cur = { t: tool, c: color, s: size, p: [[x, y, pressureOf(e)]] };
    else if (tool === 'erase') {
      const hit = itemAt(items, x, y, tol());
      drag = { items: hit >= 0 ? items.filter((_, i) => i !== hit) : items };
    } else if (tool === 'select') {
      sel = itemAt(items, x, y, tol());
      drag = sel >= 0 ? { start: [x, y], items, moved: false } : null;
    } else if (tool === 'text') {
      const hit = itemAt(items, x, y, tol());
      if (hit >= 0 && items[hit].t === 'text') openText(items[hit].a[0], items[hit].a[1], items[hit].text, hit);
      else openText(x, y, '', -1);
      activeId = null;
      return;
    } else cur = { t: tool, c: color, s: size, a: [x, y], b: [x, y] };
    redraw();
  }
  function move(e) {
    if (e.pointerId !== activeId) return;
    const evs = e.getCoalescedEvents?.() ?? [e];
    if (cur?.p) for (const ev of evs.length ? evs : [e]) cur.p.push([...pos(ev), pressureOf(ev)]);
    else if (cur) cur.b = pos(e);
    else if (drag && tool === 'erase') {
      const [x, y] = pos(e);
      const i = itemAt(drag.items, x, y, tol());
      if (i >= 0) drag = { items: drag.items.filter((_, j) => j !== i) };
    } else if (drag && tool === 'select' && sel >= 0) {
      const [x, y] = pos(e);
      const dx = x - drag.start[0];
      const dy = y - drag.start[1];
      drag = { ...drag, moved: true, items: items.map((it, i) => (i === sel ? moveItem(it, dx, dy) : it)) };
    }
    redraw();
  }
  function up(e) {
    if (e.pointerId !== activeId) return;
    activeId = null;
    if (cur) {
      const it = cur.p ? { ...cur, p: thinPoints(cur.p) } : cur;
      cur = null;
      const tiny = !it.p && Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) < 4;
      if (!tiny) setItems([...items, it]);
    } else if (drag) {
      const changed = drag.items !== items && (tool === 'erase' ? drag.items.length !== items.length : drag.moved);
      if (changed) setItems(drag.items);
      drag = null;
    }
    redraw();
  }
  function cancelPointer(e) {
    if (e.pointerId !== activeId) return;
    activeId = null;
    cur = null;
    drag = null;
    redraw();
  }

  function openText(x, y, value, edit) {
    textBox = { x, y, value, edit };
    requestAnimationFrame(() => textEl?.focus());
  }
  function placeText(e) {
    e?.preventDefault();
    const v = textBox.value.trim();
    if (textBox.edit >= 0) {
      setItems(v ? items.map((it, i) => (i === textBox.edit ? { ...it, text: v, c: color } : it)) : items.filter((_, i) => i !== textBox.edit));
    } else if (v) setItems([...items, { t: 'text', c: color, s: size, a: [textBox.x, textBox.y], text: v }]);
    textBox = null;
  }

  function pickColor(c) {
    color = c;
    if (tool === 'select' && sel >= 0) setItems(items.map((it, i) => (i === sel ? { ...it, c } : it)));
  }
  function pickSize(s) {
    size = s;
    if (tool === 'select' && sel >= 0) setItems(items.map((it, i) => (i === sel ? { ...it, s } : it)));
  }
  function pickTool(k) {
    tool = k;
    sel = -1;
  }
  function removeSel() {
    if (sel < 0) return;
    setItems(items.filter((_, i) => i !== sel));
    sel = -1;
  }
  function editSel() {
    const it = items[sel];
    if (it?.t === 'text') openText(it.a[0], it.a[1], it.text, sel);
  }
  function doUndo() {
    hist = undo(hist);
    sel = -1;
    page = Math.min(page, current(hist).length - 1);
  }
  function doRedo() {
    hist = redo(hist);
    sel = -1;
    page = Math.min(page, current(hist).length - 1);
  }
  function addPage() {
    if (pages.length >= MAX_PAGES) return;
    hist = commit(hist, [...pages.slice(0, page + 1), [], ...pages.slice(page + 1)]);
    page += 1;
    sel = -1;
  }
  function removePage() {
    if (pages.length < 2) return setItems([]);
    hist = commit(hist, pages.filter((_, i) => i !== page));
    page = Math.max(0, page - 1);
    sel = -1;
  }
  function setPaper(k) {
    work = { ...work, paper: k };
    try {
      localStorage.setItem(LS, JSON.stringify({ ...loadPrefs(), tool, color, size, pressure, paper: k }));
    } catch {
      /* only this time */
    }
    redraw();
  }
  function key(e) {
    if (textBox) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') (e.preventDefault(), e.shiftKey ? doRedo() : doUndo());
    else if (mod && e.key.toLowerCase() === 'y') (e.preventDefault(), doRedo());
    else if ((e.key === 'Delete' || e.key === 'Backspace') && tool === 'select' && sel >= 0) (e.preventDefault(), removeSel());
  }

  async function save() {
    if (!work || saving) return;
    const out = { ...$state.snapshot(work), pages: $state.snapshot(pages) };
    if (!out.base && emptyInk(out)) return dialog.close();
    saving = true;
    // a pad keeps only the pages with something on them; a photo keeps its one page
    const keep = out.pages.map((_, i) => i).filter((i) => out.base || out.pages[i].length);
    const flats = [];
    const c = document.createElement('canvas');
    c.width = out.w;
    c.height = out.h;
    const g = c.getContext('2d');
    for (const i of keep) {
      paint(g, out, i, { img, pressure });
      flats.push(c.toDataURL('image/jpeg', 0.85));
    }
    out.pages = keep.map((i) => out.pages[i]);
    out.pressure = pressure;
    saving = false;
    await onsave?.({ flats, ink: out });
    dialog.close();
  }
</script>

<svelte:window onkeydown={key} />

<dialog use:backClose class="drw" bind:this={dialog} onclose={() => onclose?.()} aria-labelledby="drw-h" data-draw>
  <header class="top">
    <h2 id="drw-h" class="h">{title || (src || work?.base ? t('Draw on the photo') : t('Drawing pad'))}</h2>
    <button type="button" class="btn" onclick={() => dialog.close()}><X size={16} aria-hidden="true" />{t('Cancel')}</button>
    <button type="button" class="btn hi" disabled={!ready || saving} onclick={save} data-draw-save><Check size={16} aria-hidden="true" />{t('Done')}</button>
  </header>
  <div class="bar tools" role="toolbar" aria-label={t('Drawing tools')}>
    {#each TOOLS as x (x.key)}{@const I = ICON[x.key]}<button type="button" class="tb" aria-pressed={tool === x.key} aria-label={t(x.name)} title={t(x.name)} onclick={() => pickTool(x.key)} data-tool={x.key}><I size={20} aria-hidden="true" /></button>{/each}
    <span class="sep" aria-hidden="true"></span>
    <button type="button" class="tb" aria-label={t('Undo|sketch')} title={t('Undo|sketch')} disabled={!hist || hist.at === 0} onclick={doUndo} data-draw-undo><Undo2 size={20} aria-hidden="true" /></button>
    <button type="button" class="tb" aria-label={t('Redo')} title={t('Redo')} disabled={!hist || hist.at >= hist.list.length - 1} onclick={doRedo} data-draw-redo><Redo2 size={20} aria-hidden="true" /></button>
  </div>
  <div class="bar" role="group" aria-label={t('Colour and size')}>
    {#each COLORS as c, i (c)}<button type="button" class="csw" style:--c={c} aria-pressed={color === c} aria-label={t(COLOR_NAMES[i])} title={t(COLOR_NAMES[i])} onclick={() => pickColor(c)}></button>{/each}
    <span class="sep" aria-hidden="true"></span>
    {#each SIZES as s, i (s)}<button type="button" class="tb" aria-pressed={size === s} aria-label={t('Size {n}', { n: i + 1 })} title={t('Size {n}', { n: i + 1 })} onclick={() => pickSize(s)}><span class="dot" style:width="{Math.min(22, s + 2)}px" style:height="{Math.min(22, s + 2)}px"></span></button>{/each}
    <label class="chk"><input type="checkbox" bind:checked={pressure} data-draw-pressure />{t('Pen pressure')}</label>
  </div>
  {#if isPad}
    <div class="bar" role="group" aria-label={t('Pages')}>
      <button type="button" class="tb" aria-label={t('Previous page')} disabled={page === 0} onclick={() => ((page -= 1), (sel = -1))}><ChevronLeft size={20} aria-hidden="true" /></button>
      <span class="pg num" data-draw-page>{t('Page {n} of {m}', { n: page + 1, m: pages.length })}</span>
      <button type="button" class="tb" aria-label={t('Next page')} disabled={page >= pages.length - 1} onclick={() => ((page += 1), (sel = -1))}><ChevronRight size={20} aria-hidden="true" /></button>
      <button type="button" class="btn sm" disabled={pages.length >= MAX_PAGES} onclick={addPage} data-draw-addpage><Plus size={16} aria-hidden="true" />{t('Page|pad')}</button>
      <button type="button" class="btn sm" onclick={removePage}><Trash2 size={16} aria-hidden="true" />{pages.length > 1 ? t('Remove page') : t('Clear')}</button>
      <span class="sep" aria-hidden="true"></span>
      {#each PAPERS as p (p.key)}<button type="button" class="chip" aria-pressed={work.paper === p.key} onclick={() => setPaper(p.key)} data-paper={p.key}>{t(p.name)}</button>{/each}
    </div>
  {/if}
  {#if tool === 'select' && sel >= 0}
    <div class="bar selbar" role="group" aria-label={t('Selected')}>
      <span class="q">{t('Drag to move it. Colour and size change it.')}</span>
      {#if items[sel]?.t === 'text'}<button type="button" class="btn sm" onclick={editSel}>{t('Edit text')}</button>{/if}
      <button type="button" class="btn sm" onclick={removeSel} data-draw-remove><Trash2 size={16} aria-hidden="true" />{t('Remove')}</button>
    </div>
  {:else}
    <p class="hint">{tool === 'text' ? t('Tap where the text should go.') : tool === 'erase' ? t('Wipe over a line to take it away.') : tool === 'select' ? t('Tap a line, a shape or a text to move or change it.') : t('Draw with a finger, the mouse or a pen. Every line stays changeable.')}</p>
  {/if}
  <div class="stage">
    {#if failed}
      <p class="err" role="alert">{failed}</p>
    {:else if work}
      <canvas bind:this={canvas} width={work.w} height={work.h} aria-label={t('Drawing area')} class:txt={tool === 'text'} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={cancelPointer} data-draw-canvas></canvas>
    {/if}
  </div>
  {#if textBox}
    <form class="tbox" onsubmit={placeText}>
      <input class="inp" type="text" bind:this={textEl} bind:value={textBox.value} maxlength="200" placeholder={t('Your text')} aria-label={t('Your text')} data-draw-text />
      <button type="button" class="btn" onclick={() => (textBox = null)}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Place|text')}</button>
    </form>
  {/if}
</dialog>

<style>
  .drw {
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--paper-2);
    color: var(--ink);
  }
  .drw[open] {
    display: flex;
    flex-direction: column;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }
  .h {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-sub);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 4px;
    padding: 2px 8px;
    overflow-x: auto;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
    scrollbar-width: thin;
  }
  .tb {
    flex: none;
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
    background: var(--accent-soft, var(--paper-2));
    color: var(--accent);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .tb:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .dot {
    display: block;
    border-radius: 50%;
    background: currentColor;
  }
  .csw {
    flex: none;
    width: 32px;
    height: 32px;
    margin: 6px 4px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--c);
    cursor: pointer;
  }
  .csw[aria-pressed='true'] {
    box-shadow: 0 0 0 3px var(--paper), 0 0 0 5px var(--accent);
  }
  .sep {
    flex: none;
    width: 1px;
    height: 28px;
    margin: 0 4px;
    background: var(--line);
  }
  .chk {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 8px;
    white-space: nowrap;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chk input {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
  }
  .chip {
    flex: none;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 600;
  }
  .pg {
    flex: none;
    padding: 0 4px;
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .hint,
  .selbar .q {
    margin: 0;
    padding: 6px 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .selbar {
    flex-wrap: wrap;
  }
  .stage {
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    padding: 8px;
    overflow: hidden;
  }
  canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    background: var(--input);
    box-shadow: 0 1px 6px var(--shadow);
    touch-action: none;
    cursor: crosshair;
  }
  canvas.txt {
    cursor: text;
  }
  .tbox {
    display: flex;
    gap: 6px;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
    background: var(--paper);
    border-top: 1px solid var(--line);
  }
  .tbox .inp {
    flex: 1;
    min-width: 0;
  }
  .err {
    color: var(--bad);
  }
</style>

<script>
  /**
   * «Verbesserungs-Logbuch» step 2 (Noah 21.11.2026 «freigabe», «5a»): the button «Verbessern» on every page. A tap switches a mode
   * on: a banner says «tippe auf den Block, den du meinst», the block under the finger or the mouse gets an orange frame with its
   * name, a tap on it opens the window (kind, urgency, one sentence or dictation). Page, block, time, device and width are written
   * with it. The page itself is not prepared: the block is the smallest card with a title (block.js). A layer over the page catches
   * the tap, so nothing underneath is pressed. Nothing leaves the device. Switch: Ich › Darstellung › Bedienung («Improve button»).
   * Step 3: with the tap on the block the photo of the page is made (photo.js), the block framed in orange; step 4 «Auftrag kopieren».
   */
  import { NotebookPen, X } from '@lucide/svelte';
  import LogEntrySheet from './LogEntrySheet.svelte';
  import { blockAt, frameOf, pageTitleOf } from './block.js';
  import { addEntry, removeEntry, loadKinds } from './logbuchdb.js';
  import { takePhoto } from './photo.js';
  import { db } from '../db.js';
  import { takeIntoLog } from './fehler.js';
  import { deviceOf } from './logbuch.js';
  import { DEFAULT_KINDS } from './kinds.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { saveFailed } from '../ui/ask.js';
  import { t } from '../i18n.svelte.js';

  let { hash = '' } = $props();

  let cfg = $state(DEFAULT_KINDS); // the kinds and groups the user set (L5), read when the window opens

  let on = $state(false); // the mode: a tap picks a block
  let frame = $state(null); // { x, y, w, h, title } the orange frame
  let ctx = $state(null); // { page, pageTitle, block, at, device, width } while the window is open
  let hint = $state('');
  let busy = $state(false); // the photo is being made
  let catcher = $state(null);

  const width = () => globalThis.innerWidth ?? 390;

  /** The block under a point of the screen, seen through the layer. */
  function under(x, y) {
    const els = document.elementsFromPoint(x, y).filter((e) => e !== catcher);
    for (const el of els) {
      const b = blockAt(el);
      if (b) return b;
    }
    return null;
  }
  const shape = (b) => (b ? { ...frameOf(b.el), title: b.title } : null);

  function start() {
    on = true;
    hint = '';
    frame = null;
  }
  function stop() {
    on = false;
    frame = null;
    hint = '';
    ctx = null;
  }
  function pointer(e) {
    if (e.pointerType === 'mouse') frame = shape(under(e.clientX, e.clientY));
  }
  function pick(e) {
    const b = under(e.clientX, e.clientY);
    if (!b) {
      frame = null;
      hint = t('No block here. Tap a box with a title, or take the whole page.');
      return;
    }
    frame = shape(b);
    open(b.title, b.el);
  }
  /** Photo first (the layer, the band and this window stay out of it), then the window opens. */
  async function open(block = '', el = null) {
    if (busy) return;
    busy = true;
    const at = new Date().toISOString();
    let shot = { photo: null, note: 'failed' };
    try {
      shot = await takePhoto(el, { existing: await db.logbuch.toArray() });
    } catch {
      /* the entry is kept without it */
    }
    busy = false;
    cfg = await loadKinds().catch(() => DEFAULT_KINDS);
    ctx = { page: hash || location.hash || '#/', pageTitle: pageTitleOf(), block, at, device: deviceOf(width()), width: width(), photo: shot.photo, photoNote: shot.note };
  }
  async function save(v) {
    try {
      const entry = await addEntry({ ...v, device: ctx.device, width: ctx.width, now: new Date(ctx.at) });
      if (entry) offerDone(t('Noted in the log.'), async () => void (await removeEntry(entry.id)));
    } catch (err) {
      offerDone(saveFailed(err));
    }
    stop();
  }
  function keys(e) {
    if (on && e.key === 'Escape' && !ctx) stop();
  }
  // the errors the app noted quietly become entries of the log (once, when this loads; the log page does it too)
  $effect(() => {
    takeIntoLog();
  });
  // a page change ends the mode
  $effect(() => {
    void hash;
    stop();
  });
</script>

<svelte:window onkeydown={keys} />

{#if !on}
  <button type="button" class="imp-btn" data-no-improve data-improve onclick={start} aria-label={t('Improve|logbuch')}>
    <NotebookPen size={20} aria-hidden="true" /><span>{t('Improve|logbuch')}</span>
  </button>
{:else}
  <div class="imp-bar" data-no-improve data-improve-bar role="status">
    <p>{busy ? t('Taking the photo of the page …') : hint || t('Improve: tap the block you mean.')}</p>
    <div class="imp-acts">
      <button type="button" class="imp-whole" onclick={() => open('')} data-improve-whole disabled={busy}>{t('Whole page')}</button>
      <button type="button" class="imp-cancel" onclick={stop} data-improve-cancel><X size={16} aria-hidden="true" />{t('Cancel|logbuch')}</button>
    </div>
  </div>
  <div class="imp-catch" data-no-improve data-improve-catch bind:this={catcher} onpointermove={pointer} onclick={pick} role="presentation"></div>
  {#if frame}
    <div class="imp-frame" data-no-improve data-improve-frame style:left="{frame.x - 4}px" style:top="{frame.y - 4}px" style:width="{frame.w + 8}px" style:height="{frame.h + 8}px">
      <span class="imp-name">{t('Block: {name}', { name: frame.title })}</span>
    </div>
  {/if}
{/if}
{#if ctx}
  <LogEntrySheet {cfg} context={ctx} onsave={save} onclose={stop} />
{/if}

<style>
  .imp-btn {
    position: fixed;
    z-index: 6;
    left: max(12px, env(safe-area-inset-left));
    bottom: calc(86px + env(safe-area-inset-bottom));
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 600 var(--fs-small) var(--font-body);
    box-shadow: 0 4px 14px color-mix(in srgb, var(--ink) 16%, transparent);
    cursor: pointer;
  }
  @media (min-width: 720px) {
    .imp-btn {
      left: auto;
      right: 16px;
      bottom: 16px;
    }
  }
  .imp-bar {
    position: fixed;
    z-index: 60;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    padding: 10px max(16px, env(safe-area-inset-right)) 10px max(16px, env(safe-area-inset-left));
    background: var(--improve);
    color: var(--improve-ink);
  }
  .imp-bar p {
    margin: 0;
    max-width: 60ch;
    color: inherit;
    font-weight: 600;
  }
  .imp-acts {
    display: flex;
    gap: 8px;
  }
  .imp-acts button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--improve-ink);
    border-radius: 999px;
    background: transparent;
    color: var(--improve-ink);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .imp-catch {
    position: fixed;
    z-index: 55;
    inset: 0;
    cursor: crosshair;
    touch-action: pan-y;
  }
  .imp-frame {
    position: fixed;
    z-index: 56;
    box-sizing: border-box;
    border: 3px solid var(--improve);
    border-radius: 14px;
    pointer-events: none;
  }
  .imp-name {
    position: absolute;
    left: 12px;
    top: -14px;
    max-width: calc(100% - 24px);
    padding: 1px 10px;
    border-radius: 999px;
    background: var(--improve);
    color: var(--improve-ink);
    font: 700 var(--fs-small) var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

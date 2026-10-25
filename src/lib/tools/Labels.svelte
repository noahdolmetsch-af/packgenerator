<script>
  /**
   * Paket B «QR an der Kiste» (Noah 24.10.2026 «2a»): Werkzeugkasten › Kisten-Etiketten. Boxes, shelves
   * and bags at home with what is inside; each gets a QR label to print. Scanning it opens the box here.
   * Boxes can be added, renamed, deleted (with Undo) and sorted with arrows and drag. Logic: labels.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { sortable } from '../ui/sortable.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import QrCode from '../ich/QrCode.svelte';
  import { Plus, Printer, Pencil, Trash2, X, Package, ChevronLeft } from '@lucide/svelte';
  import { LABELS_KEY, LABELS_HASH, boxesOf, newBox, changeBox, addItem, dropItem, addLine, dropLine, moveBox, boxUrl, boxFromHash, findBoxes, printHtml } from './labels.js';
  import './tools.css';

  const boxesQ = liveQuery(() => db.settings.get(LABELS_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const boxes = $derived(boxesOf($boxesQ?.value));
  const items = $derived(($itemsQ ?? []).filter((i) => !i.archived));
  const itemById = $derived(new Map(items.map((i) => [i.id, i])));
  const nameOfId = (id) => nameOf(itemById.get(id)) || t('(deleted item)');

  let openId = $state(boxFromHash(location.hash));
  const open = $derived(boxes.find((b) => b.id === openId) ?? null);
  const base = typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`;

  const save = (list) => db.settings.put({ key: LABELS_KEY, value: $state.snapshot(list) });
  const change = (id, fn) => save(changeBox(boxes, id, fn));

  /* the list */
  let q = $state('');
  let newName = $state('');
  let newPlace = $state('');
  const shown = $derived(findBoxes(boxes, q, nameOfId));
  async function add(e) {
    e.preventDefault();
    const b = newBox({ name: newName, place: newPlace });
    if (!b) return;
    await save([...boxes, b]);
    newName = '';
    newPlace = '';
  }
  const move = (from, to) => save(moveBox(boxes, from, to));
  function show(id) {
    openId = id;
    history.replaceState(history.state, '', id ? `${LABELS_HASH}?box=${encodeURIComponent(id)}` : LABELS_HASH);
  }

  /* one box */
  let editing = $state(false);
  let editName = $state('');
  let editPlace = $state('');
  let what = $state('');
  async function rename(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    await change(open.id, (b) => ({ ...b, name: editName.trim(), place: editPlace.trim() }));
    editing = false;
  }
  async function remove(b) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: b.name }), text: t('Only the label and its list go. The gear itself stays.') });
    if (ok !== 'delete') return;
    const before = boxes;
    await deleteWithUndo({ run: () => save(boxes.filter((x) => x.id !== b.id)).then(() => before), undo: (saved) => save(saved), text: t('«{name}» deleted.', { name: b.name }), name: b.name });
    if (openId === b.id) show('');
  }
  async function put(e) {
    e.preventDefault();
    const w = what.trim();
    if (!w) return;
    const hit = items.find((i) => nameOf(i).toLowerCase() === w.toLowerCase() || i.name?.toLowerCase() === w.toLowerCase());
    await change(open.id, (b) => (hit ? addItem(b, hit.id) : addLine(b, w)));
    what = '';
  }

  /* print: the labels in a window of their own (big name, place, QR), then the browser's print dialog */
  let qrBox = $state();
  function print(list) {
    const svgs = new Map([...(qrBox?.querySelectorAll('[data-qr-of]') ?? [])].map((n) => [n.dataset.qrOf, n.innerHTML]));
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(printHtml(list, (id) => svgs.get(id), { title: t('Box labels'), scan: t('Scan: what is inside') }));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }
</script>

<!-- the QR codes of all boxes, hidden: the cards and the print window take them from here -->
<div class="lbl-qrs" bind:this={qrBox} aria-hidden="true">
  {#each boxes as b (b.id)}<div data-qr-of={b.id}><QrCode text={boxUrl(base, b.id)} /></div>{/each}
</div>

{#if open}
  <section class="tool-card lbl-one" data-box={open.id}>
    <button type="button" class="tp-link back" onclick={() => show('')}><ChevronLeft size={16} aria-hidden="true" />{t('All boxes')}</button>
    {#if editing}
      <form class="lbl-edit" onsubmit={rename}>
        <label class="tool-field"><span>{t('Name')}</span><input class="tool-input" bind:value={editName} data-box-name /></label>
        <label class="tool-field"><span>{t('Where it stands')}</span><input class="tool-input" bind:value={editPlace} placeholder={t('e.g. cellar, shelf left')} /></label>
        <div class="tool-row"><button type="submit" class="btn">{t('Save')}</button><button type="button" class="btn btn-link" onclick={() => (editing = false)}>{t('Cancel')}</button></div>
      </form>
    {:else}
      <div class="lbl-head">
        <div class="lbl-qr">{#key open.id}<QrCode text={boxUrl(base, open.id)} label={t('QR code of {name}', { name: open.name })} />{/key}</div>
        <div class="lbl-ti">
          <h2>{open.name}</h2>
          {#if open.place}<p class="tool-muted">{open.place}</p>{/if}
          <div class="tool-row">
            <button type="button" class="btn sm" onclick={() => ((editing = true), (editName = open.name), (editPlace = open.place))}><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
            <button type="button" class="btn sm" onclick={() => print([open])}><Printer size={16} aria-hidden="true" />{t('Print label')}</button>
            <button type="button" class="btn sm" onclick={() => remove(open)}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
          </div>
        </div>
      </div>
    {/if}
    <h3 class="lbl-h">{t('Inside')}</h3>
    {#if open.itemIds.length || open.lines.length}
      <ul class="tool-list lbl-in" data-box-inside>
        {#each open.itemIds as id (id)}<li><span>{nameOfId(id)}</span><button type="button" class="lbl-x" aria-label={t('Take «{name}» out', { name: nameOfId(id) })} onclick={() => change(open.id, (b) => dropItem(b, id))}><X size={16} /></button></li>{/each}
        {#each open.lines as l, i (`${i}-${l}`)}<li><span>{l}</span><button type="button" class="lbl-x" aria-label={t('Take «{name}» out', { name: l })} onclick={() => change(open.id, (b) => dropLine(b, i))}><X size={16} /></button></li>{/each}
      </ul>
    {:else}<p class="tool-muted">{t('Nothing listed yet. Type what goes in, from your gear or anything else.')}</p>{/if}
    <form class="lbl-add" onsubmit={put}>
      <input class="tool-input" list="lbl-items" bind:value={what} placeholder={t('e.g. tent, Christmas lights')} aria-label={t('What goes in')} data-box-put />
      <datalist id="lbl-items">{#each items as i (i.id)}<option value={nameOf(i)}></option>{/each}</datalist>
      <button type="submit" class="btn" disabled={!what.trim()}><Plus size={16} aria-hidden="true" />{t('Put in')}</button>
    </form>
  </section>
{:else}
  <section class="tool-card">
    <p class="tool-help">{t('A label for each box, shelf or bag at home. The QR code on it shows what is inside, without opening it.')}</p>
    {#if boxes.length > 3}<input class="tool-input" type="search" bind:value={q} placeholder={t('Where is …? e.g. headlamp')} aria-label={t('Search the boxes')} />{/if}
    {#if boxes.length}
      <ul class="lbl-list" use:sortable={{ onmove: (from, to) => !q.trim() && move(from, to) }} data-boxes>
        {#each shown as b, i (b.id)}
          <li data-sort-id={b.id}>
            {#if !q.trim()}<SortGrip name={b.name} onstep={(dir) => move(i, i + dir)} />{/if}
            <button type="button" class="lbl-main" onclick={() => show(b.id)}><Package size={18} aria-hidden="true" /><span><b>{b.name}</b><small>{[b.place, tn(b.itemIds.length + b.lines.length, '{n} thing', '{n} things')].filter(Boolean).join(' · ')}</small></span></button>
            {#if !q.trim()}<SortArrows name={b.name} {i} n={boxes.length} onstep={(dir) => move(i, i + dir)} />{/if}
          </li>
        {/each}
      </ul>
      <button type="button" class="btn" onclick={() => print(shown)}><Printer size={16} aria-hidden="true" />{tn(shown.length, 'Print {n} label', 'Print {n} labels')}</button>
    {:else}<p class="tool-muted">{t('No boxes yet. Start with the one you search most often.')}</p>{/if}
    <form class="lbl-new" onsubmit={add}>
      <input class="tool-input" bind:value={newName} placeholder={t('Name, e.g. Winter box')} aria-label={t('Name of the box')} data-box-new />
      <input class="tool-input" bind:value={newPlace} placeholder={t('Where it stands')} aria-label={t('Where it stands')} />
      <button type="submit" class="btn" disabled={!newName.trim()}><Plus size={16} aria-hidden="true" />{t('Add box|labels')}</button>
    </form>
  </section>
{/if}

<style>
  .lbl-qrs {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
  .lbl-head {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }
  .lbl-qr {
    width: 140px;
    flex: none;
  }
  .lbl-qr :global(svg) {
    width: 100%;
    height: auto;
  }
  .lbl-ti {
    flex: 1;
    min-width: 180px;
  }
  .lbl-ti h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .lbl-ti .btn,
  .lbl-add .btn,
  .lbl-new .btn,
  .tool-card > .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lbl-h {
    margin: 16px 0 4px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .lbl-in li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .lbl-x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .lbl-add,
  .lbl-new {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .lbl-add .tool-input,
  .lbl-new .tool-input {
    flex: 1 1 160px;
    min-width: 0;
  }
  .lbl-list {
    list-style: none;
    margin: 8px 0 12px;
    padding: 0;
  }
  .lbl-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    border-top: 1px solid var(--line);
  }
  .lbl-main {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .lbl-main span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .lbl-main b {
    display: block;
    font-weight: 500;
  }
  .lbl-main small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lbl-main > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
</style>

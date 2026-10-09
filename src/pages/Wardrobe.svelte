<script>
  /**
   * v0.42.0 (Noah, picture draft A, answer 1): the wardrobe (#/wardrobe), reached by More → Gear →
   * Wardrobe and by "Wardrobe →" on the Gear page. Every piece of clothing by LAYER (base, mid, outer,
   * accessories), then by body zone; °C small on the right (no range: the class). A segmented filter
   * Cycling | Everyday | All. Clothes without a layer or zone wait in "To sort" at the top: one tap
   * sets the layer, one the zone; the guess from the name is outlined, not filled. Rules: wardrobe.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { wardrobe, USES, LAYERS, ZONES, tempRange, CLOTHING_OFFSET } from '../lib/wardrobe.js';
  import { formatWeight, itemWeight } from '../lib/gear.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';
  import Seg from '../lib/ui/Seg.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import { wearItems, undoBulk } from '../lib/gear/bulk.js';
  import { SvelteSet } from 'svelte/reactivity';
  import { ChevronDown, MoreHorizontal, Undo2 } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const offsetQ = liveQuery(() => db.settings.get(CLOTHING_OFFSET));

  const KEY = 'wardrobe.use';
  const read = () => {
    try {
      const v = localStorage.getItem(KEY);
      return USES.some((u) => u.key === v) ? v : 'velo';
    } catch {
      return 'velo';
    }
  };
  let use = $state(read());
  function setUse(v) {
    use = v;
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* private mode: only this visit */
    }
  }

  const items = $derived($itemsQ ?? []);
  const w = $derived(wardrobe(items, use));
  const offset = $derived(Number($offsetQ?.value) || 0);
  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { maximumFractionDigits: 1 })} kg`;
  const tr = (s, v) => t(s, v);
  // The class of the import is stored in German (warm, mittel, kalt).
  const CLASS = { warm: 'warm|temp', mittel: 'medium|temp', kalt: 'cold|temp' };
  const temp = (i) => tempRange(i.tempMin, i.tempMax, tr) || (i.tempClass ? t(CLASS[i.tempClass] ?? i.tempClass) : '');
  const weight = (i) => (i.weightG == null ? '–' : formatWeight(itemWeight(i)));
  const layerOpts = $derived(LAYERS.map((l) => ({ key: l.key, name: t(l.name), hint: t('Suggested from the name') })));
  const zoneOpts = $derived(ZONES.map((z) => ({ key: z.key, name: t(z.name), hint: t('Suggested from the name') })));
  const layerName = (key) => t(LAYERS.find((l) => l.key === key)?.name ?? key);
  const layerSub = (key) => t(LAYERS.find((l) => l.key === key)?.sub ?? '');
  const zoneName = (key) => t(ZONES.find((z) => z.key === key)?.name ?? key);

  /* ---------- To sort ---------- */
  let sortOpen = $state(true);
  let showAll = $state(false);
  const SHOWN = 3;
  const shown = $derived(showAll ? w.unsorted : w.unsorted.slice(0, SHOWN));

  // The last change, for "Undo" (a classification is never lost). v0.43.0: one snapshot (bulk.js),
  // the same for one piece and for many.
  let last = $state.raw(null); // { text, snap }
  let timer;
  function offer(text, snap) {
    clearTimeout(timer);
    last = { text, snap };
    timer = setTimeout(() => (last = null), 10000);
  }
  async function setField(item, patch) {
    const res = await wearItems(db, [item.id], patch);
    if (res.n) offer(t('{name} sorted', { name: nameOf(item) }), res.snap);
  }
  const setLayer = (item, key) => setField(item, { layer: key });
  const setZone = (item, key) => setField(item, { zone: ZONES.find((z) => z.key === key).set });
  async function undo() {
    if (!last) return;
    const { snap } = last;
    clearTimeout(timer);
    last = null;
    if (snap) await undoBulk(db, snap);
  }
  $effect(() => () => clearTimeout(timer));

  /* ---------- v0.43.0 (Mehrfachauswahl): layer and zone for many pieces at once ---------- */
  let selecting = $state(false);
  const picked = new SvelteSet();
  const chosen = $derived(w.all.filter((i) => picked.has(i.id)));
  let menu = $state(null); // 'layer' | 'zone' while its list is open
  function setSelecting(on) {
    selecting = on;
    picked.clear();
    menu = null;
    openRow = null;
  }
  const flipPick = (id) => (picked.has(id) ? picked.delete(id) : picked.add(id));
  async function bulkSet(kind, key) {
    menu = null;
    const ids = chosen.map((i) => i.id);
    const patch = kind === 'layer' ? { layer: key } : { zone: ZONES.find((z) => z.key === key).set };
    const res = await wearItems(db, ids, patch);
    const name = kind === 'layer' ? layerName(key) : zoneName(key);
    offer(res.n ? tn(res.n, '{n} piece → {name}', '{n} pieces → {name}', { name }) : t('Nothing to change: already like that ({target}).', { target: name }), res.snap);
    picked.clear();
  }

  /* ---------- a row's own menu ---------- */
  let openRow = $state(null);
  let editing = $state(null);
  const flip = (id) => (openRow = openRow === id ? null : id);
  const zoneOf = (item) => ZONES.find((z) => z.of.includes(String(item.zone ?? '').toLowerCase()))?.key ?? null;
</script>

<div class="ward">
  <p class="back"><a href="#/gear">← {t('Gear|place')}</a></p>
  <h1 class="title">{t('Wardrobe')}</h1>
  <p class="page-sub">{tn(w.n, '{n} piece of clothing', '{n} pieces of clothing')} · <span class="num">{kg(w.g)}</span> · {t('the onion from the inside out')}</p>

  <div class="bar">
    <Seg label={t('Use|wardrobe')} full={false} value={use} options={USES.map((u) => ({ key: u.key, name: t(u.name) }))} onchange={setUse} />
    <span class="n num">{use === 'all' ? tn(w.n, '{n} piece', '{n} pieces') : t('{n} for {use}', { n: w.n, use: t(USES.find((u) => u.key === use).name) })}</span>
    {#if w.n}
      {#if selecting}<button type="button" class="btn sm" disabled={chosen.length === w.all.length} onclick={() => w.all.forEach((i) => picked.add(i.id))}>{t('Select all')}</button>{/if}
      <button type="button" class="btn sm" aria-pressed={selecting} onclick={() => setSelecting(!selecting)}>{selecting ? t('Done') : t('Select')}</button>
    {/if}
  </div>

  {#if $itemsQ && !w.n}
    <p class="card empty">{t('No clothing here yet. Clothing is every item of the categories On-bike clothing, Rain & cold, Off-bike clothing and Shoes, and every item with a layer or a body zone.')}</p>
  {/if}

  {#if w.unsorted.length}
    <section class="sort" aria-labelledby="sort-h">
      <button type="button" class="sort-h" aria-expanded={sortOpen} aria-controls="sort-list" onclick={() => (sortOpen = !sortOpen)}>
        <span id="sort-h">{t('To sort')}</span><span class="r num">{w.unsorted.length}<ChevronDown class={sortOpen ? 'chev up' : 'chev'} size={18} aria-hidden="true" /></span>
      </button>
      {#if sortOpen}
        <div id="sort-list">
          <p class="hint">{t('The guess from the name is outlined. One tap sets the layer or the zone; a row with both moves down into its group.')}</p>
          <ul class="srows">
            {#each shown as u (u.item.id)}
              <li>
                {#if selecting}
                  {@render pickRow(u.item)}
                {:else}
                <p class="sname"><span>{nameOf(u.item)}</span><span class="w num">{weight(u.item)}</span></p>
                <div class="segs">
                  <Seg small full={false} label={t('Layer of {name}', { name: nameOf(u.item) })} value={u.layer} suggest={u.guessLayer} options={layerOpts} onchange={(k) => setLayer(u.item, k)} />
                  <Seg small full={false} label={t('Body zone of {name}', { name: nameOf(u.item) })} value={u.zone} suggest={u.guessZone} options={zoneOpts} onchange={(k) => setZone(u.item, k)} />
                </div>
                {/if}
              </li>
            {/each}
          </ul>
          {#if w.unsorted.length > SHOWN && !showAll}<p class="more"><button type="button" class="linkbtn" onclick={() => (showAll = true)}>{tn(w.unsorted.length - SHOWN, '{n} more to sort', '{n} more to sort')}</button></p>{/if}
        </div>
      {/if}
    </section>
  {/if}

  {#each w.layers as l (l.key)}
    <section class="layer" aria-labelledby="l-{l.key}">
      <h2 class="lh" id="l-{l.key}"><span><b>{layerName(l.key)}</b> <small>{layerSub(l.key)}</small></span><span class="r num">{l.n} · {formatWeight(l.g)}</span></h2>
      {#each l.zones as z (z.key)}
        <h3 class="zh">{zoneName(z.key)}</h3>
        <ul class="rows">
          {#each z.items as i (i.id)}
            {@const open = openRow === i.id}
            <li class:open>
              {#if selecting}
                {@render pickRow(i, temp(i))}
              {:else}
              <div class="row">
                <span class="nm">{nameOf(i)}{#if i.ownership === 'wishlist' || i.ownership === 'to-buy'}<i class="badge">{t('Wishlist')}</i>{/if}</span>
                <span class="tc num">{temp(i)}</span>
                <span class="w num">{weight(i)}</span>
                <button type="button" class="dots" aria-expanded={open} aria-label={t('Layer, zone or edit: {name}', { name: nameOf(i) })} onclick={() => flip(i.id)}><MoreHorizontal size={20} aria-hidden="true" /></button>
              </div>
              {#if open}
                <div class="segs inrow">
                  <Seg small full={false} label={t('Layer of {name}', { name: nameOf(i) })} value={l.key} options={layerOpts} onchange={(k) => setLayer(i, k)} />
                  <Seg small full={false} label={t('Body zone of {name}', { name: nameOf(i) })} value={zoneOf(i)} options={zoneOpts} onchange={(k) => setZone(i, k)} />
                  <button type="button" class="btn sm" onclick={() => ((editing = i), (openRow = null))}>{t('Edit item')}</button>
                </div>
              {/if}
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
    </section>
  {/each}

  {#if w.n}
    <p class="foot">{t('°C: what the item is made for. Without a range the class shows (warm, medium, cold).')}{#if offset}{' '}{t('Your kit borders are shifted by {n} °C from your debriefs.', { n: offset > 0 ? `+${offset}` : `${offset}` })}{/if}</p>
  {/if}
</div>

{#snippet pickRow(item, tc = '')}
  <!-- v0.43.0: in "Select" a tap anywhere on the row ticks its box. -->
  <label class="row pick" class:on={picked.has(item.id)}>
    <input type="checkbox" checked={picked.has(item.id)} onchange={() => flipPick(item.id)} aria-label={nameOf(item)} />
    <span class="nm">{nameOf(item)}</span>
    {#if tc}<span class="tc num">{tc}</span>{/if}
    <span class="w num">{weight(item)}</span>
  </label>
{/snippet}

<svelte:window onclick={(e) => menu && !e.target.closest?.('.mwrap') && (menu = null)} onkeydown={(e) => e.key === 'Escape' && menu && (menu = null)} />

{#if selecting}
  <div class="selpad" aria-hidden="true"></div>
  <div class="selbar" role="region" aria-label={t('Selected clothing')}>
    {#if last}
      <p class="undo" role="status"><span>{last.text}</span>{#if last.snap}<button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}</p>
    {/if}
    <div class="bacts">
      <b class="num" aria-live="polite">{tn(chosen.length, '{n} selected', '{n} selected')}</b>
      {#each [['layer', t('Layer …'), layerOpts], ['zone', t('Zone …'), zoneOpts]] as [k, name, opts] (k)}
        <span class="mwrap">
          <button type="button" class="btn" aria-expanded={menu === k} disabled={!chosen.length} onclick={() => (menu = menu === k ? null : k)}>{name}</button>
          {#if menu === k && chosen.length}
            <span class="menu" role="group" aria-label={name}>
              {#each opts as o (o.key)}<button type="button" onclick={() => bulkSet(k, o.key)}>{o.name}</button>{/each}
            </span>
          {/if}
        </span>
      {/each}
    </div>
  </div>
{:else if last}
  <div class="toast" role="status">
    <span>{last.text}</span>
    {#if last.snap}<button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
  </div>
{/if}

{#if editing}<ItemDialog item={editing} {items} onclose={() => (editing = null)} />{/if}

<style>
  .ward {
    max-width: 800px;
    margin: 0 auto;
    min-width: 0;
  }
  .back {
    margin: 0 0 4px;
    font-size: var(--fs-small);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin: 0 0 16px;
  }
  .bar .n {
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .empty {
    color: var(--ink-2);
  }
  /* To sort: a dashed card, open work but no alarm. */
  .sort {
    border: 1.5px dashed var(--line-strong);
    border-radius: var(--radius);
    background: var(--paper);
    padding: 4px 12px 8px;
    margin: 0 0 16px;
  }
  .sort-h {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 16px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .sort-h .r,
  .lh .r {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: var(--ink-2);
  }
  .sort-h :global(.chev) {
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .sort-h :global(.chev.up) {
    transform: rotate(180deg);
  }
  .hint {
    margin: 0 0 6px;
    color: var(--ink-3);
    font-size: 13px;
  }
  .srows,
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .srows li {
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .sname {
    display: flex;
    gap: 12px;
    margin: 0 0 6px;
    overflow-wrap: anywhere;
  }
  .sname .w {
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .segs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
  }
  .segs.inrow {
    padding: 0 0 10px;
  }
  .more {
    margin: 0;
    border-top: 1px solid var(--line);
  }
  .linkbtn {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 400 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  /* A layer: a light header, the zones as small labels, rows with tabular numbers on the right. */
  .layer {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    margin: 0 0 16px;
    overflow: hidden;
  }
  .lh {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    background: var(--paper-2);
    border-bottom: 1px solid var(--line);
    font-size: 15px;
    font-weight: 400;
  }
  .lh small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .zh {
    margin: 0;
    padding: 10px 12px 4px;
    color: var(--ink-3);
    font-size: 12px;
    font-weight: 600;
    border-bottom: 1px solid var(--line);
  }
  .rows li {
    padding: 0 12px;
    border-bottom: 1px solid var(--line);
  }
  .rows li:last-child {
    border-bottom: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
  }
  .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .badge {
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    border: 1px solid var(--line);
  }
  .tc {
    color: var(--ink-3);
    font-size: 13px;
    text-align: right;
    white-space: nowrap;
  }
  .w {
    min-width: 4.2em;
    text-align: right;
    white-space: nowrap;
    color: var(--ink-2);
  }
  .dots {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-right: -8px;
    flex: none;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .dots:hover,
  .open .dots {
    background: var(--paper-2);
    color: var(--ink);
  }
  .foot {
    margin: 0 0 24px;
    color: var(--ink-3);
    font-size: 13px;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(16px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: calc(100vw - 32px);
    padding: 6px 8px 6px 16px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    box-shadow: 0 8px 24px rgba(15, 46, 39, 0.3);
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .toast .btn {
    flex: none;
    min-height: 44px;
    background: none;
    border-color: transparent;
    color: var(--paper);
    text-decoration: underline;
  }
  /* v0.43.0 (Mehrfachauswahl): the rows with a box and the bar at the bottom. */
  .row.pick {
    cursor: pointer;
    margin: 0 -12px;
    padding: 0 12px;
  }
  .srows .row.pick {
    margin: -8px -12px;
  }
  .row.pick.on {
    background: var(--paper-2);
  }
  .row.pick input {
    width: 22px;
    height: 22px;
    margin: 0;
    flex: none;
    accent-color: var(--ink);
  }
  .bar .btn[aria-pressed='true'] {
    background: var(--paper-2);
  }
  .selpad {
    height: 140px;
  }
  .selbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    background: var(--paper);
    border-top: 1.5px solid var(--line-strong);
    box-shadow: 0 -4px 14px rgb(0 0 0 / 0.08);
    padding: 8px max(16px, calc((100vw - 800px) / 2)) calc(8px + env(safe-area-inset-bottom));
  }
  .selbar .undo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }
  .selbar .undo span {
    flex: 1 1 160px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .bacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .bacts b {
    margin-right: auto;
  }
  .mwrap {
    position: relative;
  }
  .mwrap .menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    display: grid;
    min-width: 170px;
    padding: 4px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 46, 39, 0.16);
  }
  .mwrap .menu button {
    min-height: 44px;
    padding: 8px 12px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .mwrap .menu button:hover {
    background: var(--paper-2);
  }
  @media (max-width: 719px) {
    .selbar {
      bottom: calc(76px + env(safe-area-inset-bottom));
      padding-bottom: 8px;
    }
    .toast {
      bottom: calc(76px + env(safe-area-inset-bottom));
    }
    .tc {
      font-size: 12px;
    }
  }
</style>

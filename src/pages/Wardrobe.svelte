<script>
  /**
   * v0.42.0 (Noah, picture draft A, answer 1): the wardrobe (#/wardrobe), reached by More → Gear →
   * Wardrobe and by "Wardrobe →" on the Gear page. Every piece of clothing by LAYER (base, mid, outer,
   * accessories), then by body zone; °C small on the right (no range: the class). A segmented filter
   * Cycling | Everyday | All. Clothes without a layer or zone wait in "To sort" at the top: one tap
   * sets the layer, one the zone; the guess from the name is outlined, not filled. Rules: wardrobe.js.
   * v0.45.0 "Kleiderschrank 2" (Noah, decisions 1-10): warm to cold within a zone, quiet gap rows
   * with "Add to wishlist", the learned offset in the header with "Reset", a photo per piece,
   * "Save as kit …" (selected pieces or today's suggestion) and Alltag-only clothes only under Alltag.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { wardrobe, USES, LAYERS, ZONES, tempRange, CLOTHING_OFFSET, wardrobeGaps, gapWish, offsetLine, resetOffset, kitFromOutfit, rangeAround } from '../lib/wardrobe.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { HOME_PLACE, HOME_FORECAST } from '../lib/know.js';
  import { todayOutfit } from '../lib/home/outfit.js';
  import { formatWeight, itemWeight } from '../lib/gear.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';
  import Seg from '../lib/ui/Seg.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import { wearItems, undoBulk } from '../lib/gear/bulk.js';
  import { SvelteSet } from 'svelte/reactivity';
  import { ChevronDown, MoreHorizontal, Undo2 } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const offsetQ = liveQuery(() => db.settings.get(CLOTHING_OFFSET));
  // v0.45.0: the kits (settings "sets"), and the home forecast for "today's suggestion" (decision 5).
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const placeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const fcQ = liveQuery(async () => (await db.meta.get(HOME_FORECAST)) ?? null);
  const tripsQ = liveQuery(() => db.trips.toArray());

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
  const offset = $derived(Number($offsetQ?.value) || 0);
  // v0.45.0 (decision 2): the gaps are about riding, so not under Alltag.
  const gaps = $derived(use === 'everyday' ? [] : wardrobeGaps(items, { offset }));
  const w = $derived(wardrobe(items, use, { gaps }));
  // v0.45.0 (decision 8): the learned offset in words, with "Reset".
  const offLine = $derived(offsetLine(offset));
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
  // v0.45.0: or an own way back (fn) for a wish, the offset reset and a kit.
  let last = $state.raw(null); // { text, snap, fn }
  let timer;
  function offer(text, snap, fn = null) {
    clearTimeout(timer);
    last = { text, snap, fn };
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
    const { snap, fn } = last;
    clearTimeout(timer);
    last = null;
    if (snap) await undoBulk(db, snap);
    if (fn) await fn();
  }
  $effect(() => () => clearTimeout(timer));

  /* ---------- v0.45.0 "Kleiderschrank 2" ---------- */
  // Decision 8: back to 0 °C; only debriefs saved after this count (wardrobe.js offsetRecord).
  async function resetOff() {
    const prev = await db.settings.get(CLOTHING_OFFSET);
    await db.settings.put(resetOffset());
    offer(t('Back to 0 °C. Your next debriefs teach it again.'), null, () => (prev ? db.settings.put(prev) : db.settings.delete(CLOTHING_OFFSET)));
  }
  // Decision 2: a gap goes on the wishlist with its place and the reason.
  const gapText = (g) => t(g.text, { n: g.below });
  async function addWish(gap) {
    const rec = gapWish(gap, items, { name: t(gap.wish), reason: gapText(gap) });
    if (!rec) return;
    await db.items.put(rec);
    offer(t('{name} is on the wishlist', { name: rec.name }), null, () => db.items.delete(rec.id));
  }
  // Decision 5: the selected pieces (or today's suggestion) as a temperature kit.
  const suggestion = $derived(todayOutfit({ place: $placeQ ?? null, forecast: $fcQ ?? null, items, trips: $tripsQ ?? [], offset }));
  const suggestIds = $derived(suggestion.outfit ? suggestion.outfit.rows.map((r) => r.item?.id).filter(Boolean) : []);
  let kit = $state(null); // { name, minC, maxC, err } while the form is open
  function openKit() {
    if (!selecting) setSelecting(true);
    kit = { name: '', minC: '', maxC: '', err: '' };
  }
  function useSuggestion() {
    picked.clear();
    for (const id of suggestIds) picked.add(id);
    Object.assign(kit, rangeAround(suggestion.outfit.c), { err: '' });
  }
  const KIT_ERR = { empty: 'Give the kit a name.', taken: 'A building block has this name already.', range: 'Give at least one border in °C; the lower one below the upper one.', none: 'Select at least one piece.' };
  async function saveKit(event) {
    event.preventDefault();
    const prev = (await db.settings.get(SETS_KEY)) ?? null;
    const r = kitFromOutfit(prev?.value ?? [], items, { name: kit.name, minC: kit.minC, maxC: kit.maxC, ids: chosen.map((i) => i.id) });
    if (r.error) return (kit.err = t(KIT_ERR[r.error]));
    const before = await db.transaction('rw', db.items, db.settings, async () => {
      const old = (await db.items.bulkGet(r.items.map((i) => i.id))).filter(Boolean);
      await db.settings.put({ ...(prev ?? { key: SETS_KEY }), value: r.value });
      if (r.items.length) await db.items.bulkPut(r.items);
      return old;
    });
    const made = r.value.find((s) => s.key === r.key);
    kit = null;
    setSelecting(false);
    offer(t('Kit {name} ({range}) saved. Pack suggests it.', { name: made.name, range: tempRange(made.minC, made.maxC, tr) }), { items: before, sets: prev });
  }

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
    if (!on) kit = null;
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
  <!-- v0.45.0 (Noah, decision 8): what the debriefs taught, in words; hidden at 0. -->
  {#if offLine}
    <p class="offset"><span class="num">{t(offLine.text, { n: offLine.n })}</span><button type="button" class="btn sm" onclick={resetOff}>{t('Reset|offset')}</button></p>
  {/if}

  <div class="bar">
    <Seg label={t('Use|wardrobe')} full={false} value={use} options={USES.map((u) => ({ key: u.key, name: t(u.name) }))} onchange={setUse} />
    <span class="n num">{use === 'all' ? tn(w.n, '{n} piece', '{n} pieces') : t('{n} for {use}', { n: w.n, use: t(USES.find((u) => u.key === use).name) })}</span>
    {#if w.n}
      {#if selecting}<button type="button" class="btn sm" disabled={chosen.length === w.all.length} onclick={() => w.all.forEach((i) => picked.add(i.id))}>{t('Select all')}</button>{/if}
      <button type="button" class="btn sm" aria-pressed={selecting} onclick={() => setSelecting(!selecting)}>{selecting ? t('Done') : t('Select')}</button>
      <!-- v0.45.0 (decision 5): an outfit as a temperature kit (select pieces or take today's suggestion). -->
      {#if !kit}<button type="button" class="btn sm" onclick={openKit}>{t('Save as kit …')}</button>{/if}
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
        {#if z.items.length}
        <ul class="rows">
          {#each z.items as i (i.id)}
            {@const open = openRow === i.id}
            <li class:open>
              {#if selecting}
                {@render pickRow(i, temp(i))}
              {:else}
              <div class="row">
                {#if i.photo}<img class="thumb" src={i.photo} alt="" />{/if}
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
        {/if}
        <!-- v0.45.0 (Noah, decision 2): a quiet gap row; the rule is in wardrobe.js (wardrobeGaps). -->
        {#if z.gap}
          <p class="gaprow" data-gap={z.gap.key}>
            <span class="gt num">{gapText(z.gap)}</span>
            {#if z.gap.wished}<span class="gw">{t('On the wishlist: {name}', { name: nameOf(z.gap.wished) })}</span>
            {:else}<button type="button" class="btn sm" onclick={() => addWish(z.gap)}>{t('Add to wishlist')}</button>{/if}
          </p>
        {/if}
      {/each}
    </section>
  {/each}

  {#if w.n}
    <p class="foot">{t('°C: what the item is made for. Without a range the class shows (warm, medium, cold).')} {t('Within a zone from warm to cold.')}</p>
  {/if}
</div>

{#snippet pickRow(item, tc = '')}
  <!-- v0.43.0: in "Select" a tap anywhere on the row ticks its box. -->
  <label class="row pick" class:on={picked.has(item.id)}>
    <input type="checkbox" checked={picked.has(item.id)} onchange={() => flipPick(item.id)} aria-label={nameOf(item)} />
    {#if item.photo}<img class="thumb" src={item.photo} alt="" />{/if}
    <span class="nm">{nameOf(item)}</span>
    {#if tc}<span class="tc num">{tc}</span>{/if}
    <span class="w num">{weight(item)}</span>
  </label>
{/snippet}

<svelte:window onclick={(e) => menu && !e.target.closest?.('.mwrap') && (menu = null)} onkeydown={(e) => e.key === 'Escape' && menu && (menu = null)} />

{#if selecting}
  <div class="selpad" class:tall={!!kit} aria-hidden="true"></div>
  <div class="selbar" role="region" aria-label={t('Selected clothing')}>
    {#if kit}
      <!-- v0.45.0 (Noah, decision 5): the selected pieces as a temperature kit, like the kits of the import. -->
      <form class="kitf" onsubmit={saveKit} aria-label={t('Save as kit')}>
        <p class="kh">
          <b>{t('Save as kit')}</b>
          {#if suggestIds.length}<button type="button" class="btn sm" onclick={useSuggestion}>{t("Today's suggestion ({c} °C)", { c: suggestion.outfit.c })}</button>{/if}
        </p>
        <div class="kfields">
          <label class="kname"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={kit.name} placeholder={t('e.g. {x}', { x: t('Cool morning') })} /></label>
          <label class="kc"><span class="lbl">{t('from °C')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={kit.minC} placeholder="–" /></label>
          <label class="kc"><span class="lbl">{t('to °C')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={kit.maxC} placeholder="–" /></label>
        </div>
        {#if kit.err}<p class="kerr" role="alert">{kit.err}</p>{/if}
        <p class="kacts">
          <button type="submit" class="btn hi">{t('Save kit')}</button>
          <button type="button" class="btn" onclick={() => (kit = null)}>{t('Cancel')}</button>
        </p>
      </form>
    {/if}
    {#if last}
      <p class="undo" role="status"><span>{last.text}</span>{#if last.snap || last.fn}<button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}</p>
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
    {#if last.snap || last.fn}<button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
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
    box-shadow: 0 8px 24px var(--shadow);
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
    box-shadow: 0 -4px 14px var(--shadow);
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
    box-shadow: 0 8px 24px var(--shadow);
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
  /* v0.45.0 "Kleiderschrank 2": the offset line, the gap rows, the photos and the kit form. */
  .offset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: -4px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .gaprow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 0;
    padding: 6px 12px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
    font-size: 14px;
  }
  .gaprow:last-child {
    border-bottom: 0;
  }
  .gaprow .gt {
    flex: 1 1 12em;
    min-width: 0;
  }
  .gaprow .gw {
    font-size: 13px;
  }
  .gaprow .btn {
    min-height: 44px;
  }
  .thumb {
    width: 36px;
    height: 36px;
    flex: none;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--line);
  }
  .selpad.tall {
    height: 360px;
  }
  .kitf {
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .kh,
  .kacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 6px;
  }
  .kh b {
    margin-right: auto;
  }
  .kfields {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 5.5em 5.5em;
    gap: 8px;
  }
  .kfields label {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .kfields .inp {
    width: 100%;
    min-width: 0;
    min-height: 44px;
  }
  .kerr {
    margin: 6px 0 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .kacts {
    margin: 8px 0 0;
  }
  @media (max-width: 479px) {
    .kfields {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .kfields .kname {
      grid-column: 1 / -1;
    }
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

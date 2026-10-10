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
  import { wardrobe, USES, LAYERS, ZONES, tempRange, tempKey, tempKits, CLOTHING_OFFSET, wardrobeGaps, gapWish, offsetLine, resetOffset, kitFromOutfit, rangeAround, barStyle } from '../lib/wardrobe.js';
  import { SETS_KEY, allSets } from '../lib/sets.js';
  import { tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import { flip as flipMove } from '../lib/ui/flip.js';
  import { HOME_PLACE, HOME_FORECAST } from '../lib/know.js';
  import { todayOutfit } from '../lib/home/outfit.js';
  import { formatWeight, itemWeight, isInventory } from '../lib/gear.js';
  import { t, tn, nameOf, locale, dateOf, num } from '../lib/i18n.svelte.js';
  import Seg from '../lib/ui/Seg.svelte';
  import TempBar from '../lib/ui/TempBar.svelte';
  import { tripRange, tripRain, unfitDuplicates } from '../lib/swap.js';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import { wearItems, undoBulk } from '../lib/gear/bulk.js';
  import { SvelteSet } from 'svelte/reactivity';
  import { ChevronDown, ChevronLeft, MoreHorizontal, Undo2, Check, Thermometer, Sparkles, Heart, Layers, X } from '@lucide/svelte';

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

  /* ---------- v0.59.0 «Tauschen» (OP2a, Noah a): the wardrobe for a trip (#/wardrobe/trip/<id>) ---------- */
  // From the packing list («Open in the wardrobe»): a band with the trip's range and dry / rain / any;
  // «Fits the trip» hides a piece that does not fit when its place has one that does (a hint says how
  // many, «All» shows them). Only a view: the trip's weather stays as it is.
  const tripOfHash = () => {
    const m = /^#\/wardrobe\/trip\/([^?]+)/.exec(location.hash);
    return m ? decodeURIComponent(m[1]) : null;
  };
  let tripId = $state(tripOfHash());
  $effect(() => {
    const on = () => (tripId = tripOfHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });
  const trip = $derived(tripId ? ($tripsQ ?? []).find((x) => x.id === tripId) ?? null : null);
  const tripR = $derived(trip ? tripRange(trip) : null);
  let fitMode = $state('fits');
  let rainPick = $state(null); // null: as the trip says
  const rainSel = $derived(rainPick ?? (trip ? tripRain(trip) : 'dry'));
  const onTripIds = $derived(new Set((trip?.entries ?? []).map((e) => e.itemId)));
  const RAIN_OPTS = [
    { key: 'dry', name: 'Dry|weather' },
    { key: 'wet', name: 'Rain' },
    { key: 'any', name: 'Any|rain' },
  ];
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
  const SHOWN = 5; // v0.47.0 (Noah 3b): a compact list, five rows before "more"
  // v0.47.0 (Noah 3b): one row's own layer and zone buttons ("Other …"), else only the suggestion chip.
  let otherOpen = $state(null);
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
  // v0.47.0 (Noah: "a to-do list empties itself"): a piece that has its layer and zone leaves "To sort"
  // at once (a short calm exit), the next one moves up and gets the focus; the toast says where it
  // went, with Undo (the piece comes back at its place: the list is by name).
  let sortedHere = $state(0);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOVE = reduced ? 0 : 150;
  async function setField(item, patch, where) {
    const list = shown.map((u) => u.item.id);
    const at = list.indexOf(item.id);
    const next = at < 0 ? null : (list[at + 1] ?? list[at - 1] ?? null);
    const res = await wearItems(db, [item.id], patch);
    if (!res.n) return;
    offer(t('{name} → {where}', { name: nameOf(item), where }), res.snap);
    if (at < 0) return;
    setTimeout(() => {
      if (w.unsorted.some((u) => u.item.id === item.id)) return; // still to sort (only one of the two set)
      sortedHere++;
      if (otherOpen === item.id) otherOpen = null;
      const el = next ? document.querySelector(`[data-sort-id="${next}"] :is(.chip, .other)`) : document.getElementById('sort-done');
      el?.focus();
    }, MOVE + 120);
  }
  const setLayer = (item, key) => setField(item, { layer: key }, layerName(key));
  const setZone = (item, key) => setField(item, { zone: ZONES.find((z) => z.key === key).set }, zoneName(key));
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

  /* ---------- v0.47.0 «Aufpimpen» (design release D1, Noah 1a, 2b, 3b, 5b, 6a) ---------- */
  // 1a: the onion figure filters: a tap on a layer or a zone pin shows only that; a second tap shows all.
  let fLayer = $state(null);
  let fZone = $state(null);
  const flipLayer = (k) => (fLayer = fLayer === k ? null : k);
  const flipZone = (k) => (fZone = fZone === k ? null : k);
  const useN = $derived(Object.fromEntries(USES.map((u) => [u.key, u.key === use ? w.n : wardrobe(items, u.key).n])));
  const zoneN = $derived(Object.fromEntries(ZONES.map((z) => [z.key, w.layers.reduce((s, l) => s + (l.zones.find((x) => x.key === z.key)?.items.length ?? 0), 0)])));
  const gapZones = $derived(new Set(gaps.filter((g) => !g.wished).map((g) => g.zone)));
  const layerOf = (key) => w.layers.find((l) => l.key === key) ?? { key, n: 0, g: 0, zones: [] };
  const hidden = $derived(trip && fitMode === 'fits' ? unfitDuplicates(w.all, tripR, rainSel === 'any' ? null : rainSel) : new Set());
  const shownLayers = $derived(
    w.layers
      .filter((l) => !fLayer || l.key === fLayer)
      .map((l) => ({ ...l, zones: l.zones.filter((z) => !fZone || z.key === fZone).map((z) => (hidden.size ? { ...z, items: z.items.filter((i) => !hidden.has(i.id)) } : z)).filter((z) => z.items.length || z.gap) }))
      .filter((l) => !fZone || l.zones.length),
  );
  const LN = { base: 1, mid: 2, outer: 3, accessory: 4 };
  // 2b: the temperature bar on the scale −10 … 35 °C, plus the short text «4–35°».
  const tbar = (i) => barStyle(tempKey(i)) || null;
  const tshort = (i) => (typeof i.tempMin === 'number' && typeof i.tempMax === 'number' ? `${i.tempMin}–${i.tempMax}°` : temp(i));
  // 3b: the suggestion of a row in words ("Basis · Oberkörper"); a tap sets what it knows.
  const chipText = (u) => [u.guessLayer ? layerName(u.guessLayer) : null, u.guessZone ? zoneName(u.guessZone) : null].filter(Boolean).join(' · ');
  async function takeGuess(u) {
    const patch = {};
    if (u.guessLayer && !u.layer) patch.layer = u.guessLayer;
    if (u.guessZone && !u.zone) patch.zone = ZONES.find((z) => z.key === u.guessZone).set;
    if (Object.keys(patch).length) await setField(u.item, patch, chipText(u));
  }
  // Today's suggestion: always in the side column on a computer; on a phone it opens under the header.
  let todayOpen = $state(false);
  async function showToday() {
    todayOpen = true;
    await tick();
    const el = document.getElementById('w-today');
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el?.focus({ preventScroll: true });
  }
  const kits = $derived(
    tempKits(allSets($setsQ?.value)).map((k) => {
      const mine = items.filter((i) => isInventory(i) && (i.sets ?? []).includes(k.key));
      return { ...k, n: mine.length, g: mine.reduce((s, i) => s + (itemWeight(i) ?? 0), 0), style: tbar({ tempMin: k.minC, tempMax: k.maxC }) };
    }),
  );
  function saveSuggestion() {
    openKit();
    useSuggestion();
  }
</script>

<div class="ward">
  <header class="whead">
    <div class="ht">
      <p class="back"><a href="#/gear"><ChevronLeft size={16} aria-hidden="true" />{t('Gear|place')}</a></p>
      <h1 class="title">{t('Wardrobe')}</h1>
      <p class="page-sub">{tn(w.n, '{n} piece of clothing', '{n} pieces of clothing')} · <span class="num">{kg(w.g)}</span> · {t('the onion from the inside out')}</p>
      <!-- v0.45.0 (Noah, decision 8): what the debriefs taught, in words; hidden at 0. v0.47.0: a quiet chip. -->
      {#if offLine}
        <p class="offset"><Thermometer size={15} aria-hidden="true" /><span class="num">{t(offLine.text, { n: offLine.n })}</span><button type="button" class="linkbtn" onclick={resetOff}>{t('Reset|offset')}</button></p>
      {/if}
    </div>
    {#if suggestion.state !== 'none'}
      <!-- v0.47.0: the one main action of the page -->
      <button type="button" class="btn hi wear-btn" aria-controls="w-today" onclick={showToday}><Sparkles size={18} aria-hidden="true" />{suggestion.win?.tomorrow ? t('What do I wear tomorrow?') : t('What do I wear today?')}{#if suggestion.state === 'ok'}<span class="num"> · {suggestion.outfit.c}°</span>{/if}</button>
    {/if}
  </header>

  {#if trip}
    <!-- v0.59.0 (OP2a, Noah a): the trip this wardrobe is open for, its range and dry / rain / any -->
    <section class="tband" aria-labelledby="tband-h">
      <p class="tk">{t('For your trip')}</p>
      <h2 class="tt" id="tband-h">{trip.title}</h2>
      <p class="tf num">{[trip.startDate ? dateOf(trip.startDate) : null, tripR ? `${tripR.min}–${tripR.max} °C` : t('No weather set'), trip.hours ? t('{n} h', { n: num(trip.hours) }) : null].filter(Boolean).join(' · ')}</p>
      <div class="tsegs">
        <Seg small full={false} label={t('Rain|wardrobe trip')} value={rainSel} options={RAIN_OPTS.map((o) => ({ key: o.key, name: t(o.name) }))} onchange={(k) => (rainPick = k)} />
        <Seg small full={false} label={t('Show|wardrobe trip')} value={fitMode} options={[{ key: 'fits', name: tripR ? t('Fits {range}', { range: `${tripR.min}–${tripR.max}°` }) : t('Fits the trip'), n: w.n - hidden.size }, { key: 'all', name: t('All|wardrobe'), n: w.n }]} onchange={(k) => (fitMode = k)} />
      </div>
      <p class="tb-back"><a class="btn sm" href="#/pack"><ChevronLeft size={16} aria-hidden="true" />{t('Back to the packing list')}</a></p>
    </section>
  {/if}

  <div class="wgrid">
    <aside class="wside">
      {#if w.n}
        <!-- v0.47.0 (Noah 1a, 6a): the onion figure with zone pins; a tap on a pin or a layer filters. -->
        <section class="surf onion" aria-labelledby="onion-h">
          <p class="zlabel cap" id="onion-h"><span>{t('Your onion')}</span><span class="tip">{t('Tap to filter')}</span></p>
          <div class="fig-wrap">
            <svg class="fig" viewBox="0 0 160 210" aria-hidden="true">
              <circle cx="80" cy="102" r="78" class="halo" />
              <g class="ly" class:dim={fLayer && fLayer !== 'outer'} stroke="var(--l3)" stroke-width="30">{@render body()}</g>
              <g class="ly" class:dim={fLayer && fLayer !== 'mid'} stroke="var(--l2)" stroke-width="21">{@render body()}</g>
              <g class="ly" class:dim={fLayer && fLayer !== 'base'} stroke="var(--l1)" stroke-width="12">{@render body()}</g>
              <g stroke="var(--paper)" stroke-width="3">{@render body()}</g>
              <g class="ly acc" class:dim={fLayer && fLayer !== 'accessory'} fill="var(--l4)">
                <circle cx="80" cy="26" r="17" fill="var(--l4-soft)" stroke="var(--l4)" stroke-width="3" />
                <path d="M63 24a17 17 0 0 1 34 0z" />
                <circle cx="44" cy="112" r="8" /><circle cx="116" cy="112" r="8" />
                <ellipse cx="62" cy="192" rx="13" ry="7" /><ellipse cx="98" cy="192" rx="13" ry="7" />
              </g>
            </svg>
            <div class="pins" role="group" aria-label={t('Body zone|filter')}>
              {#each ZONES as z (z.key)}
                {@const gap = gapZones.has(z.key)}
                <button type="button" class="pin p-{z.key}" class:gap aria-pressed={fZone === z.key} onclick={() => flipZone(z.key)}>{zoneName(z.key)} <span class="num n">{zoneN[z.key]}</span>{#if gap}<span class="gp"> · {t('gap')}</span>{/if}</button>
              {/each}
            </div>
          </div>
          <div class="ltiles" role="group" aria-label={t('Layer|filter')}>
            {#each LAYERS as l (l.key)}
              {@const L = layerOf(l.key)}
              <button type="button" class="ltile" style="--lc: var(--l{LN[l.key]}); --ls: var(--l{LN[l.key]}-soft)" aria-pressed={fLayer === l.key} onclick={() => flipLayer(l.key)}>
                <span class="ring" aria-hidden="true"></span>
                <span class="lt"><b>{layerName(l.key)}</b><small>{layerSub(l.key)}</small></span>
                <span class="lv num"><b>{L.n}</b><small>{formatWeight(L.g)}</small></span>
              </button>
            {/each}
          </div>
        </section>
      {/if}

      {#if suggestion.state !== 'none'}
        <!-- v0.47.0: today's suggestion as the one dark card (phone: opens with the main button) -->
        <section class="today" class:open={todayOpen} id="w-today" tabindex="-1" aria-labelledby="w-today-h">
          {#if suggestion.state === 'ok'}
            <p class="th" id="w-today-h"><Sparkles size={16} aria-hidden="true" />{suggestion.win?.tomorrow ? t('Tomorrow in {place}', { place: suggestion.place.name.split(',')[0] }) : t('Today in {place}', { place: suggestion.place.name.split(',')[0] })}</p>
            <p class="tc2"><span class="big num">{suggestion.outfit.c}°</span>{#if suggestion.outfit.c !== suggestion.outfit.real}<span class="feel num">{t('real {c} °C', { c: suggestion.outfit.real })}</span>{/if}</p>
            <ul class="tchips">
              {#each suggestion.outfit.rows as r (r.key)}
                <li>{#if r.item}<span class="d" style="background: var(--l{LN[r.item.layer] ?? 4})" aria-hidden="true"></span>{nameOf(r.item)}{:else}<span class="miss">{t(r.name)}: {r.rain ? t('nothing waterproof') : t('nothing warm enough')}</span>{/if}</li>
              {/each}
            </ul>
            {#if suggestIds.length}<button type="button" class="btn sm ghost" onclick={saveSuggestion}>{t('Save as kit …')}</button>{/if}
          {:else}
            <p class="th" id="w-today-h"><Sparkles size={16} aria-hidden="true" />{t('What do I wear today?')}</p>
            <p class="tmsg">{suggestion.state === 'noplace' ? t('Set your home place: then Today says what to wear for a ride.') : t('No forecast for {place} right now. It loads when you are online.', { place: suggestion.place.name.split(',')[0] })}</p>
            <a class="btn sm ghost" href="#/">{t('To Today')}</a>
          {/if}
        </section>
      {/if}

      {#if kits.length}
        <section class="surf kits" aria-labelledby="kits-h">
          <p class="zlabel cap" id="kits-h"><span>{t('Your kits')}</span><a href="#/blocks">{t('Building blocks')}</a></p>
          <ul>
            {#each kits as k (k.key)}
              <li><span class="kt"><b>{k.name}</b><small class="num">{tn(k.n, '{n} piece', '{n} pieces')} · {kg(k.g)}</small></span>{#if k.style}<span class="tbar" title={tempRange(k.minC, k.maxC, tr)}><i style={k.style}></i></span>{/if}</li>
            {/each}
          </ul>
        </section>
      {/if}
    </aside>

    <div class="wmain">
      {#if w.unsorted.length}
        <section class="surf sort" aria-labelledby="sort-h">
          <button type="button" class="sort-h" aria-expanded={sortOpen} aria-controls="sort-list" onclick={() => (sortOpen = !sortOpen)}>
            <span id="sort-h">{t('To sort')}</span><span class="pill act"><span class="r num">{w.unsorted.length}</span></span><span class="sp"></span><ChevronDown class={sortOpen ? 'chev up' : 'chev'} size={18} aria-hidden="true" />
          </button>
          {#if sortOpen}
            <div id="sort-list">
              <p class="hint">{t('A tap on the suggestion sorts the piece; "Other …" sets layer and zone yourself.')}</p>
              <ul class="srows">
                {#each shown as u (u.item.id)}
                  {@const chip = chipText(u)}
                  <li class:open={otherOpen === u.item.id} data-sort-id={u.item.id} out:slide={{ duration: MOVE }} animate:flipMove={{ duration: MOVE }}>
                    {#if selecting}
                      {@render pickRow(u.item)}
                    {:else}
                      <p class="srow">
                        <span class="zi" style="--lc: var(--l{LN[u.guessLayer] ?? 4}); --ls: var(--l{LN[u.guessLayer] ?? 4}-soft)" aria-hidden="true">{@render zoneIcon(u.guessZone)}</span>
                        <span class="sname"><span class="snm">{nameOf(u.item)}</span><small class="num">{weight(u.item)}{#if chip} · {t('Suggested from the name')}{/if}</small></span>
                        {#if chip}<button type="button" class="chip" aria-label={t('Sort {name} as {where}', { name: nameOf(u.item), where: chip })} onclick={() => takeGuess(u)}><Check size={16} aria-hidden="true" />{chip}</button>{/if}
                        <button type="button" class="other" aria-expanded={otherOpen === u.item.id} aria-label={t('Other layer or zone: {name}', { name: nameOf(u.item) })} onclick={() => (otherOpen = otherOpen === u.item.id ? null : u.item.id)}>{chip ? t('Other …|sort') : t('Sort …')}</button>
                      </p>
                      {#if otherOpen === u.item.id}
                        <div class="segs">
                          <Seg small full={false} label={t('Layer of {name}', { name: nameOf(u.item) })} value={u.layer} suggest={u.guessLayer} options={layerOpts} onchange={(k) => setLayer(u.item, k)} />
                          <Seg small full={false} label={t('Body zone of {name}', { name: nameOf(u.item) })} value={u.zone} suggest={u.guessZone} options={zoneOpts} onchange={(k) => setZone(u.item, k)} />
                        </div>
                      {/if}
                    {/if}
                  </li>
                {/each}
              </ul>
              {#if w.unsorted.length > SHOWN && !showAll}<p class="more"><button type="button" class="linkbtn" onclick={() => (showAll = true)}>{tn(w.unsorted.length - SHOWN, '{n} more to sort', '{n} more to sort')}</button></p>{/if}
            </div>
          {/if}
        </section>
      {/if}

      {#if !w.unsorted.length && sortedHere}
        <!-- v0.47.0: the emptied to-do list says so once, calmly, with the next step -->
        <p class="surf sortdone" id="sort-done" tabindex="-1" role="status"><Check size={18} aria-hidden="true" /><span>{t('Everything sorted.')}</span><button type="button" class="linkbtn" onclick={() => document.querySelector('.cols')?.scrollIntoView({ behavior: 'smooth' })}>{t('To the layers')}</button></p>
      {/if}

      <div class="bar">
        <Seg label={t('Use|wardrobe')} full={false} value={use} options={USES.map((u) => ({ key: u.key, name: t(u.name), n: useN[u.key] }))} onchange={setUse} />
        <span class="n num">{use === 'all' ? tn(w.n, '{n} piece', '{n} pieces') : t('{n} for {use}', { n: w.n, use: t(USES.find((u) => u.key === use).name) })}</span>
        {#if w.n}
          {#if selecting}<button type="button" class="btn sm" disabled={chosen.length === w.all.length} onclick={() => w.all.forEach((i) => picked.add(i.id))}>{t('Select all')}</button>{/if}
          <button type="button" class="btn sm" aria-pressed={selecting} onclick={() => setSelecting(!selecting)}>{selecting ? t('Done') : t('Select')}</button>
          <!-- v0.45.0 (decision 5): an outfit as a temperature kit (select pieces or take today's suggestion). -->
          {#if !kit}<button type="button" class="btn sm" onclick={openKit}><Layers size={16} aria-hidden="true" />{t('Save as kit …')}</button>{/if}
        {/if}
      </div>

      {#if fLayer || fZone}
        <p class="filt" role="status">
          <span>{t('Only {what}', { what: [fLayer ? layerName(fLayer) : null, fZone ? zoneName(fZone) : null].filter(Boolean).join(' · ') })}</span>
          <button type="button" class="linkbtn" onclick={() => ((fLayer = null), (fZone = null))}><X size={15} aria-hidden="true" />{t('Show all|filter')}</button>
        </p>
      {/if}

      {#if hidden.size}
        <p class="filt hid" role="status">
          <span>{tn(hidden.size, '{n} piece hidden: it does not fit this trip, another one in its place does.', '{n} pieces hidden: they do not fit this trip, others in their place do.')}</span>
          <button type="button" class="linkbtn" onclick={() => (fitMode = 'all')}>{t('Show all|filter')}</button>
        </p>
      {/if}

      {#if $itemsQ && !w.n}
        <p class="surf empty">{t('No clothing here yet. Clothing is every item of the categories On-bike clothing, Rain & cold, Off-bike clothing and Shoes, and every item with a layer or a body zone.')}</p>
      {/if}

      <!-- v0.47.0 (Noah 5b): the four layers side by side like a wardrobe on a computer, one below the other on a phone -->
      <div class="cols">
        {#each shownLayers as l (l.key)}
          <section class="surf layer" style="--lc: var(--l{LN[l.key]}); --ls: var(--l{LN[l.key]}-soft)" aria-labelledby="l-{l.key}">
            <div class="lhead">
              <h2 class="lh" id="l-{l.key}"><b>{layerName(l.key)}</b> <small>{layerSub(l.key)}</small></h2>
              <p class="lnum num"><span class="bignum">{l.n}</span><small>{formatWeight(l.g)}</small></p>
            </div>
            {#each l.zones as z (z.key)}
              <h3 class="zh zlabel">{zoneName(z.key)}</h3>
              {#if z.items.length}
                <ul class="rows">
                  {#each z.items as i (i.id)}
                    {@const open = openRow === i.id}
                    {@const bar = tbar(i)}
                    <li class:open>
                      {#if selecting}
                        {@render pickRow(i, temp(i))}
                      {:else}
                        <div class="row">
                          {#if i.photo}<img class="thumb" src={i.photo} alt="" />{:else}<span class="zi" aria-hidden="true">{@render zoneIcon(z.key)}</span>{/if}
                          <span class="mid">
                            <span class="nm">{nameOf(i)}{#if i.ownership === 'wishlist' || i.ownership === 'to-buy'}<i class="badge">{t('Wishlist')}</i>{/if}{#if onTripIds.has(i.id)}<i class="badge on">{t('on the trip')}</i>{/if}</span>
                            <span class="tl">{#if trip}<TempBar item={i} mark={tripR} width={64} />{:else if bar}<span class="tbar"><i style={bar}></i></span>{/if}<span class="tc num">{tshort(i)}</span><span class="w num">{weight(i)}</span></span>
                          </span>
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
              <!-- v0.45.0 (Noah, decision 2), v0.47.0 (Noah 6a): a quiet hint in the zone, plus the pin on the figure. -->
              {#if z.gap}
                <p class="gaprow" data-gap={z.gap.key}>
                  <Thermometer size={16} aria-hidden="true" />
                  <span class="gt num">{gapText(z.gap)}</span>
                  {#if z.gap.wished}<span class="gw"><Check size={14} aria-hidden="true" />{t('On the wishlist: {name}', { name: nameOf(z.gap.wished) })}</span>
                  {:else}<button type="button" class="btn sm" onclick={() => addWish(z.gap)}><Heart size={15} aria-hidden="true" />{t('Add to wishlist')}</button>{/if}
                </p>
              {/if}
            {/each}
          </section>
        {/each}
      </div>

      {#if w.n}
        <p class="foot"><span class="tbar legend"><i style="left:0;width:100%"></i></span>{t('°C from −10 to 35: what the item is made for. Without a range the class shows (warm, medium, cold).')} {t('Within a zone from warm to cold.')}</p>
      {/if}
    </div>
  </div>
</div>

{#snippet body()}
  <path d="M80 48v62M80 58 46 108M80 58l34 50M80 110 64 182M80 110l16 72" fill="none" stroke-linecap="round" stroke-linejoin="round" />
{/snippet}

{#snippet zoneIcon(z)}
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    {#if z === 'legs'}<path d="M7 3h10l1 18h-4l-2-11-2 11H6z" />
    {:else if z === 'hands'}<path d="M8 21v-6L5 11l1.5-1.5L9 12V4.5a1.5 1.5 0 0 1 3 0V11V3.5a1.5 1.5 0 0 1 3 0V11V5.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6z" />
    {:else if z === 'head'}<path d="M4 15a8 8 0 0 1 16 0zM2 15h20" />
    {:else if z === 'feet'}<path d="M3 17h18v-2c0-1.5-1.2-2.5-3-3l-5-1-2-4H4z" /><path d="M3 17v2h18v-2" />
    {:else}<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0z" />{/if}
  </svg>
{/snippet}

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
  /* v0.47.0 «Aufpimpen» (design release D1, style sheet «Gletscher»): a header with one main action,
     the onion figure as a filter on the left, the four layers side by side like a wardrobe. */
  .ward {
    min-width: 0;
  }
  .whead {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px 24px;
    margin: 0 0 20px;
  }
  .ht {
    min-width: 0;
  }
  .back {
    margin: 0 0 2px;
    font-size: var(--fs-small);
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--ink-2);
    text-decoration: none;
  }
  .back a:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  .page-sub {
    margin: 6px 0 8px;
  }
  .offset {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0;
    padding: 2px 6px 2px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .offset :global(svg) {
    color: var(--l3);
  }
  .wear-btn {
    min-height: 48px;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 16px;
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .linkbtn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 400 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  /* The grid: on a computer the side column (figure, today, kits) left of the main column. */
  .wgrid {
    display: grid;
    gap: 20px;
  }
  @media (min-width: 1100px) {
    .wgrid {
      grid-template-columns: 300px minmax(0, 1fr);
      align-items: start;
    }
    .wside {
      display: grid;
      gap: 16px;
      position: sticky;
      top: 84px;
    }
    .wmain {
      display: grid;
      gap: 16px;
      align-content: start;
      min-width: 0;
    }
  }
  /* On a phone and tablet the parts follow one another: use filter, figure, to sort, layers, kits. */
  @media (max-width: 1099px) {
    .wgrid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .wside,
    .wmain {
      display: contents;
    }
    .onion {
      order: 2;
    }
    .sort,
    .sortdone {
      order: 3;
    }
    .bar {
      order: 1;
    }
    .filt {
      order: 4;
    }
    .empty,
    .cols {
      order: 5;
    }
    .foot {
      order: 7;
    }
    .kits {
      order: 6;
    }
    .today {
      order: 0;
    }
    .today:not(.open) {
      display: none;
    }
  }
  .surf {
    padding: 16px;
  }
  .empty {
    margin: 0;
    color: var(--ink-2);
  }
  .cap {
    margin-top: 0;
    justify-content: space-between;
  }
  .cap::after {
    display: none;
  }
  .cap .tip,
  .cap a {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    font-size: 13px;
    color: var(--ink-3);
  }
  /* The onion figure and its zone pins (Noah 1a). */
  .fig-wrap {
    position: relative;
    height: 290px;
    margin: 4px 0 8px;
  }
  .fig {
    position: absolute;
    left: 50%;
    top: 0;
    height: 100%;
    transform: translateX(-50%);
    overflow: visible;
  }
  .fig .halo {
    fill: var(--paper-2);
  }
  .fig .ly {
    transition: opacity 0.2s;
  }
  .fig .dim {
    opacity: 0.18;
  }
  .pins {
    position: absolute;
    inset: 0;
  }
  .pin {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 2px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 13px/1.2 var(--font-body);
    box-shadow: 0 1px 3px var(--shadow);
    cursor: pointer;
    white-space: nowrap;
  }
  .pin .n {
    color: var(--ink-3);
  }
  .pin .gp {
    color: var(--warn);
    font-weight: 600;
  }
  .pin.gap {
    border-color: var(--warn);
  }
  .pin[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .pin[aria-pressed='true'] .n,
  .pin[aria-pressed='true'] .gp {
    color: inherit;
  }
  .p-head {
    left: 0;
    top: 6px;
  }
  .p-upper {
    left: 0;
    top: 96px;
  }
  .p-hands {
    right: 0;
    top: 118px;
  }
  .p-legs {
    left: 0;
    top: 190px;
  }
  .p-feet {
    right: 0;
    top: 238px;
  }
  /* The four layers as filter rows (computer) or 2 × 2 tiles (phone). */
  .ltiles {
    display: grid;
    gap: 0;
  }
  .ltile {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 6px 8px;
    border: 0;
    border-top: 1px solid var(--line);
    border-radius: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ltile:hover {
    background: var(--paper-2);
  }
  .ltile[aria-pressed='true'] {
    background: var(--ls);
    border-radius: 10px;
  }
  .ring {
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 5px solid var(--lc);
    background: var(--ls);
  }
  .lt,
  .lv {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
  }
  .lt {
    flex: 1;
    min-width: 0;
  }
  .lt b,
  .lv b {
    font-weight: 500;
  }
  .lt small,
  .lv small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .lv {
    align-items: flex-end;
  }
  @media (max-width: 1099px) {
    .onion {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      min-width: 0;
      gap: 4px 10px;
      align-items: center;
    }
    .onion .cap {
      grid-column: 1 / -1;
    }
    .fig-wrap {
      display: contents;
    }
    .fig {
      position: static;
      transform: none;
      width: 96px;
      height: 140px;
    }
    .pins {
      position: static;
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      order: 3;
    }
    .pin {
      position: static;
      min-height: 44px;
      box-shadow: none;
      background: var(--paper-2);
      border-color: transparent;
    }
    .ltiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .ltile {
      flex-wrap: wrap;
      gap: 2px 6px;
      padding: 8px;
      border: 1.5px solid var(--line);
      border-radius: 12px;
    }
    .ltile[aria-pressed='true'] {
      border-color: var(--lc);
      border-radius: 12px;
    }
    .ltile .ring {
      width: 12px;
      height: 12px;
      border-width: 3px;
    }
    .ltile .lt small {
      display: none;
    }
    .ltile .lv {
      flex-direction: row;
      gap: 6px;
      width: 100%;
      align-items: baseline;
      color: var(--ink-2);
    }
    .ltile .lv b {
      font-size: 14px;
    }
  }
  /* A small phone: the zone pins go next to the figure and the four layer tiles take the full width
     below it, so a long layer name ("Accessories") never widens the page. */
  @media (max-width: 399px) {
    .pins {
      grid-column: 2;
      order: 0;
      align-content: center;
    }
    .ltiles {
      grid-column: 1 / -1;
      order: 3;
    }
  }
  /* Today's suggestion: the one dark card. */
  .today {
    padding: 18px 18px 16px;
    border-radius: var(--radius-card);
    background: var(--brand);
    color: var(--brand-ink);
  }
  .today:focus-visible {
    outline: var(--focus-ring);
    outline-color: var(--focus-on-dark);
  }
  .th {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--brand-ink-2);
    font-size: 14px;
  }
  .th :global(svg) {
    color: var(--hi-bright);
  }
  .tc2 {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 4px 0 10px;
  }
  .big {
    font: 800 52px/1 var(--font-brand);
  }
  .feel {
    color: var(--brand-ink-2);
    font-size: 14px;
  }
  .tchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  .tchips li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-ink) 12%, transparent);
    font-size: 14px;
  }
  .tchips .d {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .tchips .miss {
    color: var(--brand-ink-2);
  }
  .tmsg {
    margin: 8px 0 12px;
    color: var(--brand-ink-2);
    font-size: 14px;
  }
  .btn.ghost {
    background: var(--paper);
    border-color: var(--paper);
    color: var(--ink);
  }
  .today a.btn.ghost,
  .today a.btn.ghost:visited {
    color: var(--ink);
  }
  /* The kits. */
  .kits ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .kits li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .kt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }
  .kt b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .kt small {
    color: var(--ink-3);
    font-size: 13px;
  }
  /* To sort (Noah 3b): a compact list, one suggestion chip per row. */
  .sort {
    padding: 4px 16px 10px;
  }
  .sort-h {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 19px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .sort-h .sp {
    flex: 1;
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
    border-top: 1px solid var(--line);
  }
  .srow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 0;
    padding: 8px 0;
  }
  .sname {
    flex: 1 1 12em;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }
  .snm {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .sname small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px 4px 10px;
    border: 1.5px solid var(--accent);
    border-radius: 12px;
    background: var(--accent-soft);
    color: var(--ink);
    font: 500 15px/1.2 var(--font-body);
    cursor: pointer;
  }
  .chip :global(svg) {
    color: var(--accent);
  }
  .chip:hover {
    filter: brightness(0.97);
  }
  .other {
    min-height: 44px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 14px var(--font-body);
    cursor: pointer;
  }
  .other[aria-expanded='true'] {
    background: var(--paper-2);
    color: var(--ink);
  }
  @media (max-width: 719px) {
    .wear-btn {
      width: 100%;
    }
  }
  @media (max-width: 559px) {
    .chip {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
  .segs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
    padding: 0 0 10px;
  }
  .more {
    margin: 0;
    border-top: 1px solid var(--line);
  }
  .sortdone {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0;
    color: var(--ink-2);
  }
  .sortdone :global(svg) {
    color: var(--accent);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0;
  }
  .bar .n {
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bar .btn[aria-pressed='true'] {
    background: var(--paper-2);
  }
  .filt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* The layers (Noah 5b): four narrow columns on a wide screen, a coloured edge on top. */
  .cols {
    display: grid;
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 760px) {
    .cols {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1360px) {
    .cols {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    /* four narrow columns: the zone label says the zone, so no icon per row (P2) */
    .cols .row > .zi {
      display: none;
    }
  }
  .layer {
    padding: 14px 14px 8px;
    border-top: 4px solid var(--lc);
    min-width: 0;
  }
  .lhead {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .lh {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    margin: 0;
    font-size: 19px;
    font-weight: 400;
    line-height: 1.25;
  }
  .lh b {
    font-weight: 500;
  }
  .lh small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .lnum {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin: 0;
    line-height: 1.1;
  }
  .lnum small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .zh {
    margin: 14px 0 2px;
  }
  .rows li {
    border-bottom: 1px solid var(--line);
  }
  .rows li:last-child {
    border-bottom: 0;
  }
  .row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 4px 0;
  }
  .zi {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--ls, var(--paper-2));
    color: var(--lc, var(--ink-2));
  }
  .thumb {
    width: 30px;
    height: 30px;
    flex: none;
    object-fit: cover;
    border-radius: 8px;
  }
  .mid {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nm {
    min-width: 0;
    line-height: 1.3;
    hyphens: auto;
    overflow-wrap: break-word;
  }
  .tl {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tl .tbar {
    width: 64px;
  }
  .badge {
    font-style: normal;
    font-size: 12px;
    font-weight: 500;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    white-space: nowrap;
  }
  .tc {
    color: var(--ink-3);
    font-size: 12.5px;
    white-space: nowrap;
  }
  .tl .w {
    margin-left: auto;
  }
  .w {
    min-width: 3.6em;
    text-align: right;
    white-space: nowrap;
    color: var(--ink-2);
  }
  .dots {
    display: inline-grid;
    place-items: center;
    width: 36px;
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
  /* Noah's rule 5: the row button quiet on a computer, full on hover and focus. */
  @media (hover: hover) and (pointer: fine) {
    .dots {
      opacity: 0.35;
    }
    li:hover .dots,
    .dots:focus-visible,
    .open .dots {
      opacity: 1;
    }
  }
  .segs.inrow {
    padding: 0 0 10px;
  }
  /* A gap (Noah 6a): a quiet warm hint in its zone. */
  .gaprow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 6px 0 8px;
    padding: 8px 10px;
    border-radius: 12px;
    background: var(--warn-soft);
    color: var(--ink);
    font-size: 14px;
  }
  .gaprow > :global(svg) {
    color: var(--warn);
    flex: none;
  }
  .gaprow .gt {
    flex: 1 1 10em;
    min-width: 0;
  }
  .gaprow .gw {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ok);
    font-size: 13px;
  }
  .gaprow .btn {
    min-height: 44px;
    border-color: transparent;
    background: var(--paper);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 24px;
    color: var(--ink-3);
    font-size: 13px;
  }
  /* v0.59.0 (OP2a): the trip band, the one dark card of the page in trip mode (like today's suggestion) */
  .tband {
    margin: 0 0 14px;
    padding: 16px 18px;
    border-radius: var(--radius-card);
    background: var(--ink);
    color: var(--paper);
    min-width: 0;
  }
  .tband .tk {
    margin: 0;
    color: var(--hi);
    font: 600 var(--fs-label)/1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .tband .tt {
    margin: 2px 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .tband .tf {
    margin: 0 0 10px;
    opacity: 0.85;
    font-size: var(--fs-small);
  }
  .tsegs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tb-back {
    margin: 10px 0 0;
  }
  .badge.on {
    background: var(--accent-soft);
    color: var(--ok);
  }
  .hid span {
    flex: 1 1 14em;
  }
  .tbar.legend {
    width: 90px;
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
    overflow-wrap: break-word;
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
    overflow-wrap: break-word;
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

<script>
  /**
   * «Kleiderschrank einrichten» (Noah 21.11.2026 «1-5a 4b», Weg C): #/wardrobe/setup. One piece after the
   * other: how cold it is made for (five steps with words, a run of one or two), its layer and body zone.
   * The guess from the name is preselected and outlined «Suggestion», so «Save and next» is one tap; every
   * chip can be changed, «Skip» leaves the piece, «I don't have it any more» puts it to Gone (with Undo).
   * Why: only 15 of 144 pieces had a temperature in the real wardrobe, so the onion could not think along.
   * Rules: src/lib/wardrobe-setup.js. Saves through wearItems (one snapshot, one Undo), like the wardrobe.
   */
  import { liveQuery } from 'dexie';
  import { tick } from 'svelte';
  import { Undo2, Check, Shirt } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { UNDO_MS } from '../lib/ui/undo.js';
  import { LAYERS, ZONES, tempRange, zoneGroup } from '../lib/wardrobe.js';
  import { wearItems, archiveItems, undoBulk } from '../lib/gear/bulk.js';
  import { formatWeight, itemWeight } from '../lib/gear.js';
  import { LEVELS, suggestLevels, placeOf, setupQueue, setupCount, setupPatch, rangeOfLevels, levelsOfRange } from '../lib/wardrobe-setup.js';

  const itemsQ = liveQuery(() => db.items.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const items = $derived($itemsQ ?? []);
  const loaded = $derived($itemsQ !== undefined);

  let skipped = $state([]); // left out for now (only this visit)
  let done = $state(0); // saved or put away in this visit
  const queue = $derived(setupQueue(items, $tripsQ ?? [], skipped));
  const cur = $derived(queue[0] ?? null);
  const counts = $derived(setupCount(items));
  const total = $derived(done + skipped.length + queue.length);

  // the choices for the piece on show; they restart with every new piece
  let levels = $state([]);
  let layer = $state(null);
  let zone = $state(null);
  let guessed = $state(false); // the steps come from the name or the import, not from you
  let placeOpen = $state(false);
  let shownId = null;
  $effect(() => {
    const it = cur?.item;
    if (!it || it.id === shownId) return;
    shownId = it.id;
    const p = placeOf(it);
    levels = suggestLevels(it);
    guessed = levels.length > 0 && typeof it.tempMin !== 'number' && typeof it.tempMax !== 'number';
    layer = p.layer;
    zone = p.zone;
    placeOpen = !p.layer || !p.zone;
  });

  const tr = (s, v) => t(s, v);
  const rangeText = $derived(levels.length ? tempRange(rangeOfLevels(levels).tempMin, rangeOfLevels(levels).tempMax, tr) : '');
  const placeName = $derived([layer ? t(LAYERS.find((l) => l.key === layer)?.name) : t('Layer?'), zone ? t(ZONES.find((z) => z.set === zone || z.key === zoneGroup(zone))?.name) : t('Body zone?')].join(' · '));
  const patch = $derived(cur ? setupPatch(cur.item, { levels, layer, zone }) : {});
  // a piece without a temperature needs its steps; a piece that only lacks its place can be saved with that alone
  const numbered = $derived(!!cur && (typeof cur.item.tempMin === 'number' || typeof cur.item.tempMax === 'number'));
  const canSave = $derived(!!cur && Object.keys(patch).length > 0 && !!layer && !!zone && (levels.length > 0 || numbered));

  // a tap on a step: a run of one or two; a tap on the next one joins it, a tap on the end of the run takes it away
  function flip(key) {
    const keys = LEVELS.map((l) => l.key);
    const at = keys.indexOf(key);
    const on = levels.map((k) => keys.indexOf(k));
    guessed = false;
    if (!on.length) return (levels = [key]);
    const a = Math.min(...on);
    const b = Math.max(...on);
    if (at >= a && at <= b) {
      if (a === b) return (levels = []);
      // inside or at the end: shorten the run to the other end
      return (levels = at === a ? keys.slice(a + 1, b + 1) : at === b ? keys.slice(a, b) : [key]);
    }
    levels = keys.slice(Math.min(a, at), Math.max(b, at) + 1);
  }

  let last = $state.raw(null); // { text, snap }
  let timer;
  function offer(text, snap) {
    clearTimeout(timer);
    last = { text, snap };
    timer = setTimeout(() => (last = null), UNDO_MS);
  }
  async function undo() {
    if (!last?.snap) return;
    const snap = last.snap;
    clearTimeout(timer);
    last = null;
    await undoBulk(db, snap);
    done = Math.max(0, done - 1);
    shownId = null; // the piece comes back first: show it again
  }

  let head;
  async function next() {
    await tick();
    head?.focus();
  }
  async function save() {
    if (!canSave) return;
    const it = cur.item;
    const res = await wearItems(db, [it.id], patch);
    done += 1;
    if (res.n) offer(t('{name} saved', { name: nameOf(it) }), res.snap);
    next();
  }
  function skip() {
    skipped = [...skipped, cur.item.id];
    next();
  }
  async function gone() {
    const it = cur.item;
    const res = await archiveItems(db, [it.id]);
    done += 1;
    if (res.n) offer(t('{name} is gone from your wardrobe', { name: nameOf(it) }), res.snap);
    next();
  }

  const layerOpts = $derived(LAYERS.map((l) => ({ key: l.key, name: t(l.name) })));
  const zoneOpts = $derived(ZONES.map((z) => ({ key: z.set, name: t(z.name) })));
  const weight = (i) => (i.weightG == null ? '' : formatWeight(itemWeight(i)));
</script>

<div class="wsetup">
  <header>
    <Crumbs crumbs={[{ label: t('Gear|place'), href: '#/gear' }, { label: t('Wardrobe'), href: '#/wardrobe' }]} here={t('Set up wardrobe')} />
    <h1 class="title" bind:this={head} tabindex="-1">{t('Set up wardrobe')}</h1>
    <p class="page-sub">{t('One piece after the other, one tap each. Afterwards Today suggests what to wear and the packing list shows only the real gaps.')}</p>
  </header>

  {#if !loaded}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if cur}
    <section class="prog" aria-label={t('Progress')}>
      <p class="pl"><b class="num">{tn(done, '{n} of {total} done', '{n} of {total} done', { total })}</b><span class="note">{counts.noTemp ? tn(counts.noTemp, '{n} piece without a temperature', '{n} pieces without a temperature') : ''}</span></p>
      <div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={done}><i style="width:{total ? Math.round((done / total) * 100) : 0}%"></i></div>
    </section>

    <section class="wcard" aria-labelledby="piece-h" data-setup-card>
      <p class="cap">{t('Piece {n}', { n: done + 1 })}</p>
      <div class="top">
        {#if cur.item.photo}<img class="ph" src={cur.item.photo} alt="" />{:else}<span class="ph blank" aria-hidden="true"><Shirt size={26} /></span>{/if}
        <div>
          <h2 id="piece-h">{nameOf(cur.item)}</h2>
          <p class="note num">{[weight(cur.item), cur.used ? tn(cur.used, 'taken on {n} trip', 'taken on {n} trips') : t('not on a trip yet')].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      <h3 id="lv-h">{t('From which temperature do you wear it?')}</h3>
      <div class="lvs" role="group" aria-labelledby="lv-h">
        {#each LEVELS as l (l.key)}
          <button type="button" class="lv" class:on={levels.includes(l.key)} class:guess={guessed && levels.includes(l.key)} aria-pressed={levels.includes(l.key)} onclick={() => flip(l.key)} data-level={l.key}>
            <b>{t(l.name)}</b><small>{t(l.sub)}</small>
          </button>
        {/each}
      </div>
      <p class="note" aria-live="polite" data-range>{#if levels.length}{guessed ? t('Suggestion from the name: {range}. Tap to change.', { range: rangeText }) : t('Made for {range}.', { range: rangeText })}{:else}{t('Pick one or two steps. A piece for 5–18 °C is «Cool» and «Mild».')}{/if}</p>

      <h3 id="pl-h">{t('Layer and body zone')}</h3>
      <div class="place" role="group" aria-labelledby="pl-h">
        <span class="chip on" data-place>{placeName}</span>
        <button type="button" class="chip" aria-expanded={placeOpen} onclick={() => (placeOpen = !placeOpen)}>{t('other layer or zone …')}</button>
      </div>
      {#if placeOpen}
        <div class="pick">
          <Seg small full={false} label={t('Layer of {name}', { name: nameOf(cur.item) })} value={layer} options={layerOpts} onchange={(k) => (layer = k)} />
          <Seg small full={false} label={t('Body zone of {name}', { name: nameOf(cur.item) })} value={zone} options={zoneOpts} onchange={(k) => (zone = k)} />
        </div>
      {/if}

      <div class="acts">
        <button type="button" class="btn hi" disabled={!canSave} onclick={save} data-setup-save>{t('Save and next')}</button>
        <button type="button" class="btn" onclick={skip} data-setup-skip>{t('Skip')}</button>
        <button type="button" class="btn" onclick={gone} data-setup-gone>{t('I do not have it any more')}</button>
      </div>
      {#if !canSave}<p class="note">{t('Pick the temperature and check layer and zone, then save. Or skip: nothing changes.')}</p>{/if}
    </section>
  {:else if total === 0 && counts.all === 0}
    <Empty icon={Shirt} title={t('No clothing yet')} text={t('Add your clothes first, then come back here to give each one its temperature.')} action={{ label: t('Open the wardrobe'), href: '#/wardrobe' }} />
  {:else}
    <section data-setup-done>
      <Empty
        icon={Check}
        title={t('Wardrobe set up')}
        text={skipped.length ? tn(skipped.length, '{n} piece is skipped. The rest has its temperature, layer and body zone.', '{n} pieces are skipped. The rest has its temperature, layer and body zone.') : t('Every piece has its temperature, layer and body zone. The onion can think along now.')}
        action={{ label: t('Open the wardrobe'), href: '#/wardrobe' }}
        action2={skipped.length ? { label: t('Show the skipped ones'), onclick: () => (skipped = []) } : null}
      >
        <p class="next">{t('Next: Today now suggests what to wear.')} <a href="#/">{t('To Today')}</a></p>
      </Empty>
    </section>
  {/if}

  {#if last}
    <p class="undo" role="status"><span>{last.text}</span><button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button></p>
  {/if}
</div>

<style>
  .wsetup { max-width: 760px; display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
  header :global(.title):focus { outline: none; }
  .note { color: var(--ink-3); font-size: var(--fs-small); margin: 0; overflow-wrap: break-word; }
  .hint { color: var(--ink-3); }
  .prog { display: grid; gap: var(--sp-2); }
  .pl { display: flex; justify-content: space-between; gap: var(--sp-3); margin: 0; flex-wrap: wrap; }
  .pbar { height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }
  .pbar i { display: block; height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.25s var(--ease-out, ease-out); }
  .wcard { background: var(--paper); border: 1px solid var(--card-line, var(--line)); border-radius: var(--radius-card, 12px); padding: var(--sp-5); display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-3); }
  .cap { margin: 0; font-size: var(--fs-tiny); color: var(--ink-3); font-weight: 600; }
  .top { display: flex; gap: var(--sp-4); align-items: center; }
  .top > div { min-width: 0; }
  h2 { margin: 0; font-size: var(--fs-sub); overflow-wrap: break-word; }
  h3 { margin: var(--sp-2) 0 0; font-size: var(--fs-label); }
  .ph { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; flex: none; }
  .ph.blank { display: grid; place-items: center; background: var(--l2-soft); color: var(--l2); border: 1px dashed var(--l2); }
  .lvs { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .lv { display: grid; text-align: left; gap: 0; min-height: 44px; padding: 8px 14px; border: 1px solid var(--line-strong); border-radius: var(--r-ctl, 10px); background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .lv small { color: var(--ink-3); font-size: var(--fs-tiny); }
  .lv.on { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .lv.on small { color: var(--paper); opacity: 0.85; }
  .lv.guess { background: var(--paper); color: var(--ink); border: 2px solid var(--ink); }
  .lv.guess small { color: var(--ink-3); opacity: 1; }
  .place { display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center; }
  .chip { display: inline-flex; align-items: center; min-height: 44px; padding: 6px 14px; border: 1px solid var(--line-strong); border-radius: var(--r-btn, 999px); background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .chip.on { border: 2px solid var(--l2); background: var(--l2-soft); cursor: default; }
  .pick { display: grid; gap: var(--sp-2); }
  .acts { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-3); }
  .acts .btn { flex: 1 1 auto; justify-content: center; }
  .undo { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin: 0; padding: 10px 14px; border-radius: var(--radius-card, 12px); background: var(--ink); color: var(--paper); }
  .undo :global(.btn) { background: transparent; color: var(--paper); border-color: var(--paper); }
  .next { margin: var(--sp-2) 0 0; color: var(--ink-3); }
  @media (min-width: 761px) {
    .acts .btn { flex: 0 0 auto; }
  }
</style>

<script>
  import { UNDO_MS } from '../ui/undo.js';
  /**
   * v0.43.0 "Wiege-Modus" (Noah): one thing per screen, like standing at the scale. A big grams
   * field (numeric keyboard), "Save & next", "Skip" and "Done"; a line "5 of 23"; Undo for the last
   * save. The order (weigh.js): with `extras` (Gear) the bikes and bags first, then bags, sleep,
   * outer and mid layers, then the rest, the most used first. Only grams: no "bag minus empty".
   * items: the items to weigh from (live; Gear: all, Pack: the trip's). onclose: "Done".
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { CATEGORY, formatWeight } from '../gear.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { weighQueue, orderQueue, readGrams, maxGrams, saveWeight, WEIGH_GROUPS } from '../weigh.js';
  import { undoBulk } from './bulk.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { Undo2, Scale, Bike, Backpack } from '@lucide/svelte';

  let { items, extras = false, onclose = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));

  const base = $derived(weighQueue({ items, bikes: $bikesQ ?? [], containers: $bagsQ ?? [], trips: $tripsQ ?? [], templates: $tplQ?.value ?? [], extras }));
  let skipped = $state([]); // keys skipped in this round; they come back at the end
  let front = $state(null); // the key an Undo brought back
  let saved = $state(0);
  const queue = $derived(orderQueue(base, skipped, front));
  const current = $derived(queue[0] ?? null);
  // "5 of 23": what was done this round plus what is still open.
  const total = $derived(saved + queue.length);
  const pos = $derived(Math.min(total, saved + skipped.filter((k) => queue.some((q) => q.key === k)).length + 1));

  let grams = $state('');
  let error = $state('');
  let busy = $state(false);
  let input = $state(null);
  let last = $state.raw(null); // { text, snap, key }
  let timer;

  const groupName = (g) => t(WEIGH_GROUPS.find((x) => x.key === g)?.name ?? '');
  const kindLine = (c) => (c.kind === 'bike' ? t('Bike|weigh') : c.kind === 'bag' ? t('Bag|weigh') : [t(CATEGORY[c.rec.category]?.name ?? ''), c.group !== 'rest' && c.group !== 'bags' && c.group !== 'sleep' ? groupName(c.group) : ''].filter(Boolean).join(' · '));
  // v0.102.0 Design-Refresh P3 (M6): one quiet icon per kind in a small square
  const KIcon = (c) => (c.kind === 'bike' ? Bike : c.kind === 'bag' ? Backpack : Scale);
  const label = (c) => (c.kind === 'item' ? nameOf(c.rec) : c.name);
  // A weight that is there but not weighed (a bag from the logbook, a bike estimate).
  const before = (c) => (c.rec.weightG != null ? t('Now: {w} (not weighed)', { w: formatWeight(c.rec.weightG) }) : '');

  // The cursor waits in the field for every new target.
  let lastKey = null;
  $effect(() => {
    const k = current?.key ?? null;
    if (k === lastKey) return;
    lastKey = k;
    queueMicrotask(() => input?.focus());
  });

  async function save(event) {
    event.preventDefault();
    if (!current || busy) return;
    const g = readGrams(grams, maxGrams(current));
    if (g == null) {
      error = t('Type the weight in whole grams, from 1 to {max}.', { max: maxGrams(current).toLocaleString('de-CH') });
      return;
    }
    busy = true;
    try {
      const target = current;
      const snap = await saveWeight(db, target, g);
      skipped = skipped.filter((k) => k !== target.key);
      if (front === target.key) front = null;
      saved++;
      grams = '';
      error = '';
      offer(t('{name}: {w} saved', { name: label(target), w: formatWeight(g) }), snap, target.key);
    } finally {
      busy = false;
    }
  }

  function skip() {
    if (!current) return;
    const k = current.key;
    if (front === k) front = null;
    skipped = [...skipped.filter((x) => x !== k), k];
    grams = '';
    error = '';
    input?.focus();
  }

  function offer(text, snap, key) {
    clearTimeout(timer);
    last = { text, snap, key };
    timer = setTimeout(() => (last = null), UNDO_MS);
  }
  async function undo() {
    if (!last) return;
    const { snap, key } = last;
    clearTimeout(timer);
    last = null;
    if (!snap) return;
    await undoBulk(db, snap);
    saved = Math.max(0, saved - 1);
    front = key; // the same thing again, right away
    input?.focus();
  }
  $effect(() => () => clearTimeout(timer));
</script>

<!-- v0.102.0 Design-Refresh P3 (M6): «one after the other» as a white card with the progress inside,
     «Up next» as a list card beside it (computer) -->
<section class="weigh" aria-labelledby="weigh-h">
  <div class="head">
    <h2 id="weigh-h" class="title">{t('Record weights')}</h2>
    {#if total}<span class="pos num" aria-live="polite">{t('{a} of {b}|weigh', { a: pos, b: total })}</span>{/if}
  </div>

  {#if current}
    {@const CI = KIcon(current)}
    <div class="wrap">
      <form class="card wcard" onsubmit={save} novalidate>
        <div class="who">
          <span class="ic" aria-hidden="true"><CI size={18} /></span>
          <div class="whot">
            <p class="name">{label(current)}</p>
            <p class="kind">{#if current.kind === 'item'}<span class="sw" style:background={CATEGORY[current.rec.category]?.color}></span>{/if}{kindLine(current)}</p>
          </div>
        </div>
        {#if current.rec.brand}<p class="sub">{current.rec.brand}</p>{/if}
        {#if current.qty > 1}<p class="sub">{t('Weigh all {n} pieces together.', { n: current.qty })}</p>{/if}
        {#if current.kind === 'bike'}<p class="sub">{t('Without bags, with mounts and bottle cages.')}</p>{/if}
        {#if before(current)}<p class="sub quiet">{before(current)}</p>{/if}
        {#if current.rec.weightNote}<p class="sub quiet">{current.rec.weightNote}</p>{/if}
        <label class="lbl" for="w-g">{t('Weight in grams')}</label>
        <div class="row">
          <input id="w-g" bind:this={input} class="inp big num" type="text" inputmode="numeric" enterkeyhint="next" autocomplete="off" placeholder="0" bind:value={grams} aria-describedby="w-err" />
          <span class="unit">g</span>
        </div>
        <p id="w-err" class="err" role="alert">{error}</p>
        <div class="acts">
          <button type="submit" class="btn hi" disabled={busy}>{t('Save & next')}</button>
          <button type="button" class="btn" onclick={skip}>{t('Skip')}</button>
          {#if onclose}<button type="button" class="btn" onclick={onclose}>{t('Done')}</button>{/if}
        </div>
        {#if total}
          <div class="pbar" aria-hidden="true"><i style:width="{Math.round((saved / total) * 100)}%"></i></div>
        {/if}
      </form>
      {#if queue.length > 1}
        <aside class="up" aria-labelledby="up-h">
          <h3 class="uph" id="up-h">{t('Up next')}</h3>
          <ol class="card">
            {#each queue.slice(1, 6) as q (q.key)}
              {@const QI = KIcon(q)}
              <li><span class="ic" aria-hidden="true"><QI size={16} /></span><span class="nm">{label(q)}<small>{q.kind === 'item' ? t(CATEGORY[q.rec.category]?.name ?? '') : kindLine(q)}</small></span></li>
            {/each}
            {#if queue.length > 6}<li class="more">{t('+{n} more', { n: queue.length - 6 })}</li>{/if}
          </ol>
        </aside>
      {/if}
    </div>
  {/if}
  <!-- The last save with its Undo, in the page under the card (never over the buttons). -->
  {#if last}
    <div class="toast" role="status">
      <span>{last.text}</span>
      {#if last.snap}<button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
    </div>
  {/if}
  {#if !current}
    <div class="card none">
      <p>{saved ? t('Everything is weighed. {n} saved now.', { n: saved }) : t('Nothing left to weigh.')}</p>
      {#if onclose}<button type="button" class="btn" onclick={onclose}>{t('Done')}</button>{/if}
    </div>
  {/if}
</section>


<style>
  /* v0.102.0 Design-Refresh P3 (M6): the card «one after the other» and the list card «Up next» */
  .weigh {
    max-width: 1080px;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 4px 12px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .head .title {
    font-size: var(--fs-sub);
    font-weight: 600;
    margin: 0;
  }
  .pos {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  .wrap {
    display: grid;
    gap: 24px;
  }
  @media (min-width: 720px) {
    .wrap {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      align-items: start;
    }
  }
  .wcard {
    min-width: 0;
  }
  .who {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .whot {
    min-width: 0;
  }
  .name {
    margin: 0;
    font-weight: 600;
    font-size: var(--fs-sub);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .kind {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .sw {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
  }
  .sub {
    margin: 8px 0 0 42px;
    color: var(--ink-2);
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lbl {
    display: block;
    margin-top: 14px;
  }
  .row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .big {
    font-size: var(--fs-title);
    font-weight: 600;
    min-height: 56px;
    width: 100%;
    max-width: 180px;
    font-variant-numeric: tabular-nums;
  }
  .unit {
    color: var(--ink-2);
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    margin: 4px 0 8px;
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pbar {
    height: 6px;
    margin-top: 16px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .pbar i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--accent);
  }
  .uph {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .up ol {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .up li {
    display: flex;
    gap: 12px;
    align-items: center;
    min-height: 56px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .up li:first-child {
    border-top: 0;
  }
  .up .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .up small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
  .none p {
    margin: 0;
    flex: 1 1 200px;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 900px;
    margin-top: 12px;
    padding: 6px 8px 6px 16px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .toast span {
    flex: 1;
    min-width: 0;
  }
  .toast .btn {
    flex: none;
    min-height: 44px;
    background: none;
    border-color: transparent;
    color: var(--paper);
    text-decoration: underline;
  }
  /* On a phone the up-next list stays out of the way: one thing per screen. */
  @media (max-width: 719px) {
    .up {
      display: none;
    }
  }
</style>

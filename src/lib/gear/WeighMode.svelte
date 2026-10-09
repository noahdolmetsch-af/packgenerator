<script>
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
  import { Undo2 } from '@lucide/svelte';

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
    timer = setTimeout(() => (last = null), 10_000);
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

<section class="weigh" aria-labelledby="weigh-h">
  <div class="head">
    <h2 id="weigh-h" class="title">{t('Record weights')}</h2>
    {#if total}<span class="pos num" aria-live="polite">{t('{a} of {b}|weigh', { a: pos, b: total })}</span>{/if}
    {#if onclose}<button type="button" class="btn" onclick={onclose}>{t('Done')}</button>{/if}
  </div>
  {#if total}
    <div class="pbar" aria-hidden="true"><i style:width="{Math.round((saved / total) * 100)}%"></i></div>
  {/if}

  {#if current}
    <div class="wrap">
      <form class="card" onsubmit={save} novalidate>
        <p class="kind">{#if current.kind === 'item'}<span class="sw" style:background={CATEGORY[current.rec.category]?.color}></span>{/if}{kindLine(current)}</p>
        <p class="name">{label(current)}</p>
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
        </div>
      </form>
      {#if queue.length > 1}
        <aside class="up" aria-label={t('Up next')}>
          <span class="lbl">{t('Up next')}</span>
          <ol>
            {#each queue.slice(1, 6) as q (q.key)}<li><span class="nm">{label(q)}</span><small>{q.kind === 'item' ? t(CATEGORY[q.rec.category]?.name ?? '') : kindLine(q)}</small></li>{/each}
          </ol>
          {#if queue.length > 6}<p class="more">{t('+{n} more', { n: queue.length - 6 })}</p>{/if}
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
  .weigh {
    max-width: 900px;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px 14px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .head .title {
    font-size: var(--fs-section);
    margin: 0;
  }
  .pos {
    flex: 1;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .pbar {
    height: 4px;
    border-radius: 2px;
    background: var(--paper-2);
    overflow: hidden;
    margin-bottom: 14px;
  }
  .pbar i {
    display: block;
    height: 100%;
    background: var(--ink-2);
  }
  .wrap {
    display: grid;
    gap: 18px;
  }
  @media (min-width: 720px) {
    .wrap {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      align-items: start;
    }
    form {
      padding: 22px 26px;
    }
  }
  .kind {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
    font-weight: 600;
  }
  .sw {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    flex: none;
  }
  .name {
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 30px;
    line-height: var(--lh-title);
    margin: 6px 0;
    overflow-wrap: anywhere;
  }
  .sub {
    margin: 0 0 4px;
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
    font-size: 32px;
    min-height: 56px;
    width: 100%;
    max-width: 200px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .unit {
    font-size: 22px;
    font-weight: 700;
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    margin: 4px 0 8px;
    font-size: 14px;
  }
  .acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .acts .btn {
    min-height: 48px;
  }
  .up ol {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  .up li {
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
    color: var(--ink-2);
  }
  .up .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .up small {
    color: var(--ink-3);
  }
  .more {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 6px 0 0;
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
    overflow-wrap: anywhere;
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

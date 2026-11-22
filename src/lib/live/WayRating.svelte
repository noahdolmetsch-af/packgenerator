<script>
  /**
   * «Wege-Gedächtnis» (Noah 07.11.2026 «4a»): after the ride the stretches of the ride, each with a thumb up or down.
   * A bad stretch is avoided when the app plans a new way, a good one gets a sign on the live map. Nothing is
   * required: no tap, nothing is kept. Props: ride (the closed recording).
   */
  import { liveQuery } from 'dexie';
  import { ThumbsUp, ThumbsDown } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import { saveFailed } from '../ui/ask.js';
  import { fixesOf } from './live-lib.js';
  import { WAYS_KEY, sectionsOf, cleanMemory, rate, wayId } from './wegegedaechtnis.js';

  let { ride } = $props();

  const memQ = liveQuery(() => db.settings.get(WAYS_KEY));
  const mem = $derived(cleanMemory($memQ?.value));
  const sections = $derived(sectionsOf(fixesOf(ride)));
  const ratingOf = (s) => mem.ways.find((w) => w.id === wayId(ride.id, s.i))?.rating ?? null;
  let err = $state('');
  let active = $state(null);

  async function mark(s, rating) {
    err = '';
    try {
      await db.settings.put({ key: WAYS_KEY, value: rate(mem, { rideId: ride.id, day: ride.day ?? '', section: s, rating }) });
    } catch (e) {
      err = saveFailed(e);
    }
  }

  // the shape of the ride, each stretch in the colour of its mark (grey: not marked)
  const frame = $derived.by(() => {
    const all = sections.flatMap((s) => s.line);
    if (!all.length) return null;
    const lat = all.map((p) => p[0]);
    const lon = all.map((p) => p[1]);
    const [la0, la1, lo0, lo1] = [Math.min(...lat), Math.max(...lat), Math.min(...lon), Math.max(...lon)];
    const k = Math.cos(((la0 + la1) / 2) * (Math.PI / 180));
    const w = Math.max((lo1 - lo0) * k, 1e-6);
    const h = Math.max(la1 - la0, 1e-6);
    const sc = Math.min(96 / w, 56 / h);
    return { la1, lo0, k, sc, ox: (100 - w * sc) / 2, oy: (60 - h * sc) / 2 };
  });
  const shape = (line) => (frame ? line.map((p) => `${(frame.ox + (p[1] - frame.lo0) * frame.k * frame.sc).toFixed(1)},${(frame.oy + (frame.la1 - p[0]) * frame.sc).toFixed(1)}`).join(' ') : '');
  const fmt = (v) => num(Math.round(v * 10) / 10);
</script>

{#if sections.length}
  <div class="wr" data-way-rating>
    <h3>{t('How were the stretches?')}</h3>
    <p class="tp-small tp-muted">{t('Mark a stretch you liked or want to avoid. The app avoids a bad stretch when it plans a new way, and shows a good one on the live map. You decide; leave it out if you like.')}</p>
    {#if frame}
      <svg class="wr-shape" viewBox="0 0 100 60" role="img" aria-label={t('The ride, each stretch marked')}>
        {#each sections as s (s.i)}
          <polyline points={shape(s.line)} class="wr-line" class:up={ratingOf(s) === 'up'} class:down={ratingOf(s) === 'down'} class:on={active === s.i} />
        {/each}
      </svg>
    {/if}
    <ul class="wr-list">
      {#each sections as s (s.i)}
        <li class="wr-row" data-way-section={s.i} onmouseenter={() => (active = s.i)} onmouseleave={() => (active = null)}>
          <span class="wr-name">{t('km {a}–{b}', { a: fmt(s.fromKm), b: fmt(s.toKm) })}</span>
          <button type="button" class="btn sm wr-btn" aria-pressed={ratingOf(s) === 'up'} aria-label={t('Good stretch')} onclick={() => mark(s, 'up')} onfocus={() => (active = s.i)} data-way-up><ThumbsUp size={16} aria-hidden="true" /></button>
          <button type="button" class="btn sm wr-btn" aria-pressed={ratingOf(s) === 'down'} aria-label={t('Stretch to avoid')} onclick={() => mark(s, 'down')} onfocus={() => (active = s.i)} data-way-down><ThumbsDown size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    <p class="tp-small tp-muted">{t('Change or delete your marks later in the options of the live map, under «Remembered ways».')}</p>
    {#if err}<p class="wr-err" role="alert">{err}</p>{/if}
  </div>
{/if}

<style>
  .wr {
    display: grid;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .wr h3 {
    margin: 0;
    font-size: var(--fs-body);
  }
  .wr p {
    margin: 0;
  }
  .wr-shape {
    width: 100%;
    max-width: 320px;
    height: auto;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .wr-line {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.55;
  }
  .wr-line.up {
    stroke: var(--ok);
    opacity: 1;
    stroke-width: 2.2;
  }
  .wr-line.down {
    stroke: var(--bad);
    opacity: 1;
    stroke-width: 2.2;
  }
  .wr-line.on {
    stroke-width: 3.2;
    opacity: 1;
  }
  .wr-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wr-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wr-name {
    flex: 1;
    min-width: 0;
    font-variant-numeric: tabular-nums;
  }
  .wr-btn {
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
  }
  .wr-btn[aria-pressed='true'][data-way-up] {
    background: var(--ok);
    color: var(--paper);
  }
  .wr-btn[aria-pressed='true'][data-way-down] {
    background: var(--bad);
    color: var(--paper);
  }
  .wr-err {
    color: var(--bad);
  }
</style>

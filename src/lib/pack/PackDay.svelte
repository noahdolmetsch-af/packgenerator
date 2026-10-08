<script>
  /**
   * Pack (v0.29.0, Noah 2a, 6a): a normal page with the trip band and its tabs (was a full screen
   * of its own). The bags one under the other: the packed ones closed with a green ✓, the current one
   * open with big rows; the whole row is the tap area. Open items on top, packed ones slide down.
   * A full bag jumps to the next one by itself; "Whole bag packed" for the hurried, Undo in the card.
   * The ready check is the last "bag". "Next: On the way" also works with something missing (it asks).
   * Everything is saved at once, so the phone can sleep or the page close in between.
   *
   * steps: from packSteps(). ontoggle(itemId), onready(row), onpack(itemIds | null), onreadyall(): save.
   * onnext(): the next step (On the way, or the debrief for a trip without a bike). onundo(): the page's Undo.
   */
  import { Check, ChevronDown, ChevronRight, Undo2, ArrowRight, Briefcase, UserRound, Bike, ListChecks, BatteryCharging } from '@lucide/svelte';
  import { tick as settle, untrack } from 'svelte';
  import TripBand from '../trip/TripBand.svelte';
  import { formatWeight } from '../gear.js';
  import { readyDone, RAIN } from '../trips.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';
  import '../trip/trip.css';

  let { trip, steps, itemsById, badges = {}, ready = [], wxGap = null, onwx = () => {}, ontoggle, onready, onpack = () => {}, onreadyall = () => {}, onnext, onundo = () => {}, canUndo = false, bike = true, lessons = [], oncharge = null } = $props();
  const wxText = (w) => `${w.min === w.max ? w.min : `${w.min}–${w.max}`} °C, ${t(RAIN[w.rain ?? 'none'])}`;
  const READY = '__ready';

  const total = $derived(steps.reduce((s, x) => s + x.entries.length, 0));
  const packed = $derived(steps.reduce((s, x) => s + x.done, 0));
  const readyN = $derived(ready.filter((r) => readyDone(r, trip)).length);
  const readyAll = $derived(readyN === ready.length);
  const full = (s) => s.done === s.entries.length;
  const bagsLeft = $derived(steps.filter((s) => !full(s)).length);
  const firstOpen = () => steps.find((s) => !full(s))?.key ?? READY;
  // The open bag: the first one that still has something to pack (a tap on another opens that one).
  let cur = $state(firstOpen());
  // "{bag} is packed. Next: …": shown while that bag is still full (an untick takes it away again).
  let note = $state(null); // { from, to }
  let timer = null;
  // Everything packed and checked: a card of its own at the top (v0.30.1, Noah B10: the status line
  // alone was too quiet), whichever bag is open.
  const finished = $derived(total > 0 && packed === total && readyAll);
  const doneText = $derived(bike ? t('Everything is in. Have a good ride!') : t('Everything is in. Have a good trip!'));
  const stepOf = (key) => steps.find((x) => x.key === key);
  const status = $derived(finished ? '' : note && stepOf(note.from) && full(stepOf(note.from)) ? t('{bag} is packed. Next: {next}', { bag: titleOf(note.from), next: titleOf(note.to) }) : '');
  const nextAfter = (key) => {
    const i = steps.findIndex((s) => s.key === key);
    return [...steps.slice(i + 1), ...steps.slice(0, Math.max(0, i))].find((s) => !full(s))?.key ?? READY;
  };
  const titleOf = (key) => (key === READY ? t('Ready check') : steps.find((s) => s.key === key)?.title ?? '');

  // v0.30.1 (Noah B4, B6, phone test of 0.29.2): on a phone a quick double tap is two clicks, and
  // after the first one the ticked row slides down, so the second lands on another row (or on the same
  // one again). A second tap within TAP_MS on the same spot of the screen (or, from the keyboard, on
  // the same item) counts as the first one. Quick taps on two different rows both count, and a
  // deliberate later tap still unticks (B3).
  const TAP_MS = 400;
  const SAME_SPOT = 40; // px: rows are 60 px high
  // Noah 6a: a full bag jumps to the next one by itself, a moment later so the last tick is seen.
  // The jump waits JUMP_MS and is called off when the bag is not full any more, or when the finger
  // touches the bag again in between (B6: "tick the last item and tap it again" keeps the bag open).
  const JUMP_MS = 700;
  let lastTap = { at: -Infinity, y: null, id: null };
  let downAt = -Infinity; // the last pointerdown inside the open bag
  const now = () => performance.now();
  function cancelJump() {
    clearTimeout(timer);
    timer = null;
  }
  function touchBag() {
    downAt = now();
    cancelJump();
  }
  function advance(from, delay = JUMP_MS, at = now()) {
    cancelJump();
    const to = nextAfter(from);
    note = { from, to };
    if (!delay) {
      if (cur === from) cur = to; // "Whole bag packed": no tick to show, move on at once
      return;
    }
    if (downAt > at) return; // touched again while the tick was saved
    timer = setTimeout(() => {
      timer = null;
      const s = stepOf(from);
      if (cur === from && (!s || full(s)) && downAt <= at) cur = to;
    }, delay);
  }
  // v0.30.1 (Noah B7): Undo puts back the open bag too (a whole bag or a full bag had moved on).
  // One entry per change made here, in step with the page's Undo list.
  let back = [];
  const remember = () => (back = [...back.slice(-19), cur]);
  // A tap is saved before the next one on the same row counts (seen on a slow machine, 8.10.2026).
  const busy = new Set();
  async function tick(step, e, ev) {
    const at = now();
    const y = ev?.detail ? ev.clientY : null; // detail 0: Enter or Space
    const same = y != null && lastTap.y != null ? Math.abs(y - lastTap.y) < SAME_SPOT : lastTap.id === e.itemId;
    if (at - lastTap.at < TAP_MS && same) return;
    lastTap = { at, y, id: e.itemId };
    if (busy.has(e.itemId)) return;
    busy.add(e.itemId);
    const willFill = !e.packed && step.done + 1 === step.entries.length;
    try {
      remember();
      await ontoggle(e.itemId);
    } finally {
      busy.delete(e.itemId);
    }
    if (willFill) advance(step.key, JUMP_MS, at);
    else if (timer) cancelJump();
  }
  async function wholeBag(step) {
    cancelJump();
    remember();
    await onpack(step.entries.map((e) => e.itemId));
    advance(step.key, 0);
  }
  async function readyTick(r) {
    const key = `ready:${r.id ?? r.itemId}`;
    if (busy.has(key)) return;
    busy.add(key);
    try {
      remember();
      await onready(r);
    } finally {
      busy.delete(key);
    }
  }
  function readyAllTick() {
    remember();
    onreadyall();
  }
  async function everything() {
    cancelJump();
    remember();
    await onpack(null);
    remember();
    await onreadyall();
    note = null; // the all-done card takes over (all bags fold, see below)
  }
  function undo() {
    cancelJump();
    note = null;
    if (back.length) {
      cur = back.at(-1);
      back = back.slice(0, -1);
    }
    onundo();
  }
  // Open items on top, packed ones at the bottom. v0.30.2 (test P4.7): the order is fixed when
  // a bag opens, so a ticked row stays under the finger and a quick second tap hits the next item.
  const sorted = (s) => [...s.entries.filter((e) => !e.packed), ...s.entries.filter((e) => e.packed)];
  let order = $state.raw({ key: '', ids: [] });
  $effect(() => {
    const key = cur;
    const s = untrack(() => steps.find((x) => x.key === key));
    order = { key, ids: s ? sorted(s).map((e) => e.itemId) : [] };
  });
  const ordered = (s) => {
    if (order.key !== s.key) return sorted(s);
    const at = (e) => {
      const i = order.ids.indexOf(e.itemId);
      return i < 0 ? order.ids.length + (e.packed ? 1 : 0) : i;
    };
    return [...s.entries].sort((a, b) => at(a) - at(b));
  };
  const names = (s) => s.entries.filter((e) => !e.packed).map((e) => (itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId) + ((e.qty || 1) > 1 ? ` × ${e.qty}` : '')).join(' · ');
  const iconOf = (key) => (key === 'body' ? UserRound : key === 'mounted' ? Bike : Briefcase);
  const hintOf = (id) => (badges[id] ?? []).map((b) => (b.key === 'tip' ? b.text : b.label)).join(' · ');
  const kicker = $derived(packed < total ? `${t('Packing day')} · ${tn(total - packed, '{n} item left', '{n} items left')} ${tn(bagsLeft, 'in {n} bag', 'in {n} bags')}` : `${t('Packing day')} · ${t('everything packed')}`);

  // "Next: On the way" with something missing asks first (Noah: also works when something is missing).
  let askEl = $state();
  const missing = $derived(total - packed + (ready.length - readyN));
  function next() {
    if (missing) askEl?.showModal();
    else onnext();
  }

  // Keep the screen on while packing (where the browser allows it).
  $effect(() => {
    let lock = null;
    const get = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen');
      } catch {
        /* not allowed here: the screen may go dark, nothing is lost */
      }
    };
    get();
    const again = () => document.visibilityState === 'visible' && get();
    document.addEventListener('visibilitychange', again);
    return () => {
      lock?.release?.();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', again);
    };
  });
  const pct = $derived(total ? packed / total : 0);
  // The card comes into view when packing ends here (not when the page opens already finished).
  let doneEl = $state();
  let wasDone = untrack(() => finished);
  $effect(() => {
    const f = finished;
    if (f && !wasDone) {
      cur = '';
      settle().then(() => doneEl?.scrollIntoView?.({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
    }
    wasDone = f;
  });
</script>

{#snippet ring(size)}
  {@const r = size / 2 - 5}
  {@const c = 2 * Math.PI * r}
  <span class="ring" style:width="{size}px" style:height="{size}px" role="img" aria-label={t('{n} of {total} items packed', { n: packed, total })}>
    <svg width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" stroke-width="6" /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ok)" stroke-width="6" stroke-linecap="round" stroke-dasharray={c} stroke-dashoffset={c * (1 - pct)} /></svg>
    <b class="num">{packed}/{total}</b>
  </span>
{/snippet}
{#snippet go()}<button type="button" class="btn hi go" onclick={next}>{bike ? t('Next: On the way') : t('Next: Debrief')}<ArrowRight size={20} aria-hidden="true" /></button>{/snippet}
{#snippet aside()}{@render ring(52)}{/snippet}

<div class="pd trip-page" aria-label={t('Packing day: {title}', { title: trip.title })}>
  <TripBand {trip} tab="pack" {kicker} action={go} {aside} hint={missing ? tn(missing, '{n} still missing', '{n} still missing') : t('Everything is in.')} />

  {#if wxGap}
    <div class="tp-card wxgap" role="note">
      <p><b>{t('The forecast is {wx}.', { wx: wxText(wxGap.fc) })}</b> {t('This trip is packed for {wx}.', { wx: wxText(wxGap.have) })}</p>
      <button type="button" class="btn" onclick={onwx}>{t('Pack for the forecast first')}</button>
    </div>
  {/if}

  <!-- v0.30.2 (test R6.6): what earlier debriefs taught, before the first bag. -->
  {#if lessons.length}
    <div class="tp-card lessons" role="note">
      <p class="tp-small"><b>{t('From earlier trips')}</b></p>
      <ul>{#each lessons as l (l.id)}<li>{l.rule}</li>{/each}</ul>
    </div>
  {/if}

  {#if !phone.matches}
    <div class="tp-card prog">
      {@render ring(72)}
      <div><p class="pt">{packed < total ? tn(total - packed, '{n} item left', '{n} items left') + ' ' + tn(bagsLeft, 'in {n} bag', 'in {n} bags') : t('Everything is in.')}</p><p class="tp-muted tp-small">{t('Tap the whole row. A full bag jumps to the next one.')}</p></div>
    </div>
  {/if}
  <!-- v0.30.1 (B6): read out here, shown in the bag's foot: a line appearing above the bags pushed the
       open bag down under the finger, so a quick second tap closed it. -->
  <p class="sr" role="status">{status}</p>
  {#if finished}
    <!-- v0.30.1 (Noah B10): the end of packing is a card of its own at the top, with the next step. -->
    <section class="alldone" bind:this={doneEl} role="status" aria-labelledby="alldone-h" tabindex="-1">
      <span class="okbig" aria-hidden="true"><Check size={28} strokeWidth={2.5} /></span>
      <div class="adtext">
        <h2 id="alldone-h">{doneText}</h2>
        <p>{tn(total, '{n} item packed', '{n} items packed')}{#if ready.length}{' · '}{t('Ready check done')}{/if}</p>
      </div>
      <!-- dark, not orange: the one orange button of the page stays in the band (at the thumb on a phone) -->
      <button type="button" class="btn ink adgo" onclick={onnext}>{bike ? t('Next: On the way') : t('Next: Debrief')}<ArrowRight size={20} aria-hidden="true" /></button>
    </section>
  {/if}

  <div class="pgrid">
    {#each steps as s (s.key)}
      {@const Icon = iconOf(s.key)}
      {@const done = full(s)}
      {#if s.key === cur}
        <section class="pbag cur" aria-labelledby="pb-{s.key}" style:--span={steps.length + 1} onpointerdown={touchBag}>
          <button type="button" class="bagh" aria-expanded="true" onclick={() => { if (now() - lastTap.at >= TAP_MS) cur = ''; }}>
            <Icon size={20} aria-hidden="true" /><span class="bt"><b id="pb-{s.key}">{s.title}</b>{#if s.sub}<small>{s.sub}</small>{/if}</span>
            <span class="r"><span class="mini" aria-hidden="true"><i style:width="{(s.done / s.entries.length) * 100}%"></i></span><span class="num">{s.done}/{s.entries.length}</span><ChevronDown size={18} aria-hidden="true" /></span>
          </button>
          <ul class="items">
            {#each ordered(s) as e (e.itemId)}
              {@const it = itemsById[e.itemId]}
              {@const hint = hintOf(e.itemId)}
              <li class:in={e.packed}>
                <button type="button" class="it" aria-pressed={!!e.packed} onclick={(ev) => tick(s, e, ev)}>
                  <span class="box" aria-hidden="true">{#if e.packed}<Check size={20} />{/if}</span>
                  <span class="nm">{it ? nameOf(it) : e.itemId}{#if (e.qty || 1) > 1}<b class="q">{' '}× {e.qty}</b>{/if}{#if hint}<small>{hint}</small>{/if}</span>
                  <span class="w num">{it?.weightG != null ? formatWeight(it.weightG * (e.qty || 1)) : t('not weighed')}</span>
                </button>
              </li>
            {/each}
          </ul>
          <div class="bagfoot">
            {#if !done}<button type="button" class="tp-link" onclick={() => wholeBag(s)}>{t('Whole bag packed')}</button>{:else}<span class="tp-muted tp-small packed-note" aria-hidden={status && note?.from === s.key ? 'true' : undefined}>{status && note?.from === s.key ? status : t('all in')}</span>{/if}
            {#if canUndo}<button type="button" class="tp-link" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
          </div>
        </section>
      {:else}
        <section class="pbag" class:done aria-labelledby="pb-{s.key}">
          <button type="button" class="bagh" aria-expanded="false" onclick={() => (cur = s.key)}>
            <Icon size={20} aria-hidden="true" /><span class="bt"><b id="pb-{s.key}">{s.title}</b></span>
            <span class="r">{#if done}<span class="num">{s.done}/{s.entries.length}</span><span class="tp-okdot" aria-label={t('all in')}><Check size={16} aria-hidden="true" /></span>{:else}<span class="mini" aria-hidden="true"><i style:width="{(s.done / s.entries.length) * 100}%"></i></span><span class="num">{s.done}/{s.entries.length}</span><ChevronRight size={18} aria-hidden="true" />{/if}</span>
          </button>
          {#if !done}<p class="preview">{names(s)}</p>{/if}
        </section>
      {/if}
    {/each}
    {#if ready.length}
      {@const done = readyAll}
      <section class="pbag" class:cur={cur === READY} class:done={done && cur !== READY} aria-labelledby="pb-ready" style:--span={steps.length + 1}>
        <button type="button" class="bagh" aria-expanded={cur === READY} onclick={() => (cur = cur === READY ? '' : READY)}>
          <ListChecks size={20} aria-hidden="true" /><span class="bt"><b id="pb-ready">{t('Ready check')}</b></span>
          <span class="r"><span class="num">{readyN}/{ready.length}</span>{#if done && cur !== READY}<span class="tp-okdot"><Check size={16} aria-hidden="true" /></span>{:else if cur === READY}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}</span>
        </button>
        {#if cur === READY}
          <ul class="items">
            {#each ready as r (r.id)}
              {@const ok = readyDone(r, trip)}
              <li class:in={ok}>
                <button type="button" class="it" aria-pressed={ok} disabled={!!r.itemId && ok} onclick={() => readyTick(r)}>
                  <span class="box" aria-hidden="true">{#if ok}<Check size={20} />{/if}</span>
                  <span class="nm">{t(r.label)}</span>
                </button>
                <!-- v0.34.0 (L4): which devices, from the packing list -->
                {#if r.id === 'charged' && oncharge}<button type="button" class="tp-link chg" onclick={oncharge}><BatteryCharging size={16} aria-hidden="true" />{t('Charge list')}</button>{/if}
              </li>
            {/each}
          </ul>
          <div class="bagfoot">
            {#if !done}<button type="button" class="tp-link" onclick={readyAllTick}>{t('Tick all checks')}</button>{:else}<span class="tp-muted tp-small">{t('all in')}</span>{/if}
            {#if canUndo}<button type="button" class="tp-link" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
          </div>
        {:else if !done}<p class="preview">{ready.filter((r) => !readyDone(r, trip)).map((r) => t(r.label)).join(' · ')}</p>{/if}
      </section>
    {/if}
  </div>
  {#if packed < total || !readyAll}<p class="all"><button type="button" class="tp-link" onclick={everything}>{t('Everything is packed')}</button></p>{/if}
</div>

<dialog class="sheet ask" bind:this={askEl} aria-labelledby="ask-h">
  <h2 id="ask-h">{tn(missing, '{n} thing is not ticked yet. Go anyway?', '{n} things are not ticked yet. Go anyway?')}</h2>
  <p class="tp-muted">{t('Nothing is lost: you can come back to Pack any time.')}</p>
  <div class="askacts">
    <button type="button" class="btn ink" onclick={() => { askEl.close(); onnext(); }}>{t('Go anyway')}</button>
    <button type="button" class="btn" onclick={() => askEl.close()}>{t('Keep packing')}</button>
  </div>
</dialog>

<style>
  /* v0.30.1 (Noah B10): all done, calm and clear: green for the state; orange stays on the band's button. */
  .alldone { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 12px 14px; margin: 0 0 12px; padding: 18px 16px; border: 2px solid var(--ok); border-radius: 12px; background: var(--ok-soft); scroll-margin-top: 72px; }
  .alldone:focus { outline: none; }
  .okbig { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: var(--ok); color: #fff; }
  .alldone h2 { margin: 0; font: 700 21px/1.25 var(--font-body); color: var(--ink); overflow-wrap: anywhere; }
  .alldone p { margin: 2px 0 0; font-size: 15px; color: var(--ink-2); }
  .adgo { grid-column: 1 / -1; min-height: 48px; font-size: 16px; }
  @media (min-width: 720px) { .alldone { grid-template-columns: auto minmax(0, 1fr) auto; } .adgo { grid-column: auto; } }
  .prog { display: flex; align-items: center; gap: 16px; }
  .prog p { margin: 0; }
  .prog .pt { font-weight: 600; font-size: 17px; }
  .ring { position: relative; display: inline-block; flex: none; }
  .ring svg { transform: rotate(-90deg); display: block; }
  .ring b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; font-weight: 700; color: var(--ink); }
  .wxgap { background: #e3eef8; }
  .wxgap p { margin: 0 0 10px; }
  .lessons p { margin: 0 0 4px; }
  .lessons ul { margin: 0; padding-left: 20px; }
  .lessons li { overflow-wrap: anywhere; }
  .pgrid { display: grid; gap: 10px; }
  .pbag { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; min-width: 0; }
  .pbag.cur { border: 2px solid var(--ink); }
  .bagh { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 8px 14px; border: 0; background: none; color: var(--ink); font: 600 16px var(--font-body); text-align: left; cursor: pointer; }
  .bagh :global(svg) { color: var(--ink-3); flex: none; }
  .bt { min-width: 0; overflow-wrap: anywhere; }
  .bt small { display: block; font-size: 13px; font-weight: 400; color: var(--ink-3); }
  .pbag.done .bt b { color: var(--ink-3); }
  .r { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 400; color: var(--ink-3); white-space: nowrap; }
  .mini { width: 120px; height: 6px; border-radius: 9px; background: var(--paper-2); overflow: hidden; display: none; }
  .mini i { display: block; height: 100%; background: var(--ok); }
  .preview { margin: -6px 14px 10px 46px; font-size: 14px; color: var(--ink-2); line-height: 1.5; overflow-wrap: anywhere; }
  .items { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); }
  .it { display: flex; align-items: center; gap: 14px; width: 100%; min-height: 60px; padding: 6px 14px; border: 0; border-top: 1px solid var(--paper-2); background: none; color: var(--ink); font: 400 17px/1.25 var(--font-body); text-align: left; cursor: pointer; }
  .box { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; border: 2px solid var(--line-strong); background: #fff; }
  /* v0.30.1 (Noah B1): every item name in the same face, size and weight; × n and the hint line
     only quieter in colour (before: × n bold, so rows with an amount looked like another font). */
  .nm { flex: 1; min-width: 0; overflow-wrap: anywhere; font: inherit; }
  .nm small { display: block; font: 400 14px/1.35 var(--font-body); color: var(--ink-3); }
  .q { font: inherit; color: var(--ink-3); white-space: nowrap; }
  .w { flex: none; font-size: 14px; color: var(--ink-3); white-space: nowrap; }
  .in .box { background: var(--ink); border-color: var(--ink); color: #fff; }
  .in .nm > :global(:not(small)), .in .nm { color: var(--ink-3); }
  .in .nm { text-decoration: line-through; text-decoration-thickness: 1px; }
  .in .nm small { text-decoration: none; }
  li:has(> .chg) { display: flex; align-items: center; border-top: 1px solid var(--paper-2); }
  li:has(> .chg) .it { border-top: 0; }
  .chg { flex: none; padding: 0 14px; font-size: 14px; white-space: nowrap; }
  .bagfoot { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 4px 14px 6px; border-top: 1px solid var(--paper-2); }
  .all { margin: 12px 0 0; }
  .ask h2 { margin: 0 0 8px; font: 600 19px/1.3 var(--font-body); }
  .askacts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  @media (min-width: 900px) {
    .pgrid { grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); gap: 10px 20px; align-items: start; }
    .pgrid .pbag { grid-column: 1; }
    .pgrid .pbag.cur { grid-column: 2; grid-row: 1 / span var(--span, 8); }
    .pgrid .pbag.cur .it { min-height: 64px; font-size: 18px; }
    .mini { display: block; }
  }
</style>

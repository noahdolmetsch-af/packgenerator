<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
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
   *
   * v0.106.0 Design-Refresh P5 «Packen» (T6, approved 12.10.2026 «Runde 20 freigegeben»): «Taschen» as one
   * light list (each bag with its items, weight and a small bar, the open one tinted), the open bag below
   * it as its own section with check boxes, and on the right «Gewicht nach Taschen» (the scale of P4),
   * «Aus früheren Touren» and «Mehr» (Laden). The open bag keeps its classes (.pbag.cur, #pb-<key>).
   */
  import HintCard from '../pageinfo/HintCard.svelte';
  import PowerLine from './PowerLine.svelte';
  import TipLine from '../pageinfo/TipLine.svelte';
  import { Check, ChevronRight, Undo2, ArrowRight, Briefcase, UserRound, Bike, ListChecks, BatteryCharging, Volume2, Columns3, Camera, ArrowLeftRight } from '@lucide/svelte';
  import WeightCard from './WeightCard.svelte';
  import LessonsCard from './LessonsCard.svelte';
  import DocChecks from './DocChecks.svelte';
  import { tick as settle, untrack } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { flip } from '../ui/flip.js';
  import { laterSort, glide } from '../ui/latersort.svelte.js';
  import { buzz } from '../bedienung.svelte.js';
  import TripBand from '../trip/TripBand.svelte';
  import { askReopen } from '../trip/reopen.svelte.js';
  import Empty from '../ui/Empty.svelte';
  import { formatWeight, isConsumable } from '../gear.js';
  import { readyDone, RAIN } from '../trips.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';
  import { localDay } from '../localday.js';
  import { swipeRight } from '../ui/swipe.js';
  import PackBike from './PackBike.svelte';
  import '../trip/trip.css';

  let { trip, steps, itemsById, badges = {}, ready = [], wxGap = null, onwx = () => {}, ontoggle, onready, onpack = () => {}, onreadyall = () => {}, onnext, onundo = () => {}, canUndo = false, main = { kind: 'finish', label: 'Finish packing' }, onend = () => {}, bike = true, lessons = [], reminders = [], oncharge = null, pressure = '', stats = null, charge = null, top = null, fixed = false, onread = null, onmove = null, spare = [] } = $props();
  // TZ-2 «Fest nach der Fahrt» (mockup TZ2, Noah 5a): a completed or rated trip (fixed) shows its bags as
  // packed then, to read: no ticks, no «Whole bag packed»; the band under the steps says why and offers
  // «Wieder öffnen».
  // v0.124.0 B4 (mockup «Bausteine beim Packen»): top: the building blocks as big buttons (Pack's PackBlocks), above the bags.
  // v0.105.0 P5 (T6): stats for «Gewicht nach Taschen»; charge { names, done, total } for the row «Laden» in «Mehr».
  // v0.65.0 «Velo-Masse»: pressure: the trip bike's target pressure («1.6 / 1.7 bar»), named in the tyre row.
  const readyLabel = (r) => (r.id === 'tyres' && pressure ? `${t(r.label)} · ${t('Target')} ${pressure}` : t(r.label));
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
  // v0.67.0 (U001): «Gute Fahrt!» only fits on the day itself; before it the bags are simply ready.
  // v0.67.0 (U001): «Gute Fahrt!» only from the start day on, not five days early
  const doneText = $derived(trip?.startDate && trip.startDate <= localDay() ? (bike ? t('Everything is in. Have a good ride!') : t('Everything is in. Have a good trip!')) : t('Everything is in.'));
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
    if (sortT) sortLater(); // a finger in the bag: the rows wait a bit longer
  }
  // «Bewegung» Stelle 1 (Noah 19.10.2026 «alle 1-3»): when a full bag moves on by itself, its row in «Taschen»
  // lights up green for a moment, so the eye sees where the finished bag went (also with reduced motion).
  let flash = $state('');
  let flashT = null;
  function moved(from) {
    clearTimeout(flashT);
    flash = from;
    flashT = setTimeout(() => (flash = ''), 900);
  }
  function advance(from, delay = JUMP_MS, at = now()) {
    cancelJump();
    const to = nextAfter(from);
    note = { from, to };
    if (!delay) {
      if (cur === from) {
        cur = to; // "Whole bag packed": no tick to show, move on at once
        moved(from);
      }
      return;
    }
    if (downAt > at) return; // touched again while the tick was saved
    timer = setTimeout(() => {
      timer = null;
      const s = stepOf(from);
      if (cur === from && (!s || full(s)) && downAt <= at) {
        cur = to;
        moved(from);
      }
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
    if (!e.packed) buzz(); // FE7 (Noah 13.10.2026): a short buzz when an item goes in, where the phone can
    try {
      remember();
      await ontoggle(e.itemId);
    } finally {
      busy.delete(e.itemId);
    }
    if (willFill) advance(step.key, JUMP_MS, at);
    else if (timer) cancelJump();
    sortLater();
  }
  async function wholeBag(step) {
    cancelJump();
    remember();
    await onpack(step.entries.map((e) => e.itemId));
    advance(step.key, 0);
  }
  // the ready check sorts the same way: done checks slide down a moment after the last tap
  const readySort = laterSort((r) => r.id, (r) => readyDone(r, trip));
  async function readyTick(r) {
    const key = `ready:${r.id ?? r.itemId}`;
    if (busy.has(key)) return;
    busy.add(key);
    readySort.tap(ready);
    if (!readyDone(r, trip)) buzz(); // FE7: only when it gets ticked
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
  // «Bewegung» + «Gestaltungsrichtung B» 4b (Noah 19.10.2026): a ticked item slides down to the packed
  // ones, but only SORT_MS after the last tap in the bag, so quick ticks in a row never move a row away
  // under the finger (B3/B4). The rows glide (250 ms); with reduced motion they move at once.
  const SORT_MS = 1000;
  let sortT = null;
  function sortLater() {
    clearTimeout(sortT);
    sortT = setTimeout(() => {
      sortT = null;
      const s = stepOf(cur);
      if (s && order.key === cur) order = { key: cur, ids: sorted(s).map((e) => e.itemId) };
    }, SORT_MS);
  }
  const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const openOf = (s) => s.entries.filter((e) => !e.packed).length;
  const names = (s) => s.entries.filter((e) => !e.packed).map((e) => (itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId) + ((e.qty || 1) > 1 ? ` × ${e.qty}` : '')).join(' · ');
  const iconOf = (key) => (key === 'body' ? UserRound : key === 'mounted' ? Bike : Briefcase);
  const shownTips = $derived(new Set(Object.values(badges).flat().filter((b) => b.key === 'tip').map((b) => b.text)));
  const newLessons = $derived(lessons.filter((l) => !shownTips.has(l.rule)));
  const hintOf = (id) => (badges[id] ?? []).map((b) => (b.key === 'tip' ? b.text : b.label)).join(' · ');
  // v0.105.0 P5 (T6): the line under a bag in «Taschen»: «6 Teile · 3.4 kg».
  // Impeccable 18.10.2026 (Packen 3): the same calculation as «Gewicht nach Taschen» (touren.js weightByPlace:
  // gear without food and water); a bag with food or water says so: «2.5 kg mit Essen».
  const eats = (i) => isConsumable(i) || i.waterL > 0;
  const kgOf = (s, food = false) => s.entries.reduce((g, e) => {
    const it = itemsById[e.itemId];
    return it && eats(it) === food ? g + (it.weightG ?? 0) * (e.qty || 1) : g;
  }, 0);
  const kgText = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const kgLine = (s) => {
    const gear = kgOf(s);
    const food = kgOf(s, true);
    return food ? t('{kg} with food|bag', { kg: kgText(gear + food) }) : gear ? kgText(gear) : '';
  };
  const subOf = (s) => [tn(s.entries.length, '{n} item', '{n} items'), kgLine(s)].filter(Boolean).join(' · ');
  // A tap on a bag in the list opens it below; when the open bag is out of sight the page goes there.
  let openEl = $state();
  async function pick(key) {
    cur = key;
    await settle();
    const r = openEl?.getBoundingClientRect?.();
    if (r && (r.top < 0 || r.top > innerHeight - 120)) openEl.scrollIntoView?.({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  const kicker = $derived(packed < total ? `${t('Packing day')} · ${tn(total - packed, '{n} item left', '{n} items left')} ${tn(bagsLeft, 'in {n} bag', 'in {n} bags')}` : `${t('Packing day')} · ${t('everything packed')}`);

  // "Next: On the way" with something missing asks first (Noah: also works when something is missing).
  let askEl = $state();
  const missing = $derived(total - packed + (ready.length - readyN));
  // Impeccable 18.10.2026 (Packen 3): the bar names both counts: «30 Teile und 2 Checks fehlen noch»
  const missingText = $derived.by(() => {
    const items = total - packed;
    const checks = ready.length - readyN;
    if (items && checks) return t('{items} and {checks} still missing', { items: tn(items, '{n} item', '{n} items'), checks: tn(checks, '{n} check', '{n} checks') });
    if (checks) return tn(checks, '{n} check still missing', '{n} checks still missing');
    return tn(items, '{n} item still missing', '{n} items still missing');
  });
  // Impeccable 18.10.2026 (Packen 2, Noah «alle Vorschläge angenommen»): while less than half is packed the
  // main button packs: «Satteltasche packen (0 von 12)» opens the next open bag; from half on it is
  // «Packen abschliessen» again, which stays reachable as a quiet link at the end of the bags.
  const packFirst = $derived(main.kind === 'finish' && !fixed && total > 0 && packed * 2 < total);
  const nextBag = $derived(steps.find((x) => x.key === cur && !full(x)) ?? steps.find((x) => !full(x)) ?? null);
  async function packNext() {
    if (!nextBag) return;
    cur = nextBag.key;
    await settle();
    openEl?.scrollIntoView?.({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
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
      clearTimeout(flashT);
      clearTimeout(sortT);
      readySort.stop();
      document.removeEventListener('visibilitychange', again);
    };
  });
  // Paket «Reste» 1038 (Gestaltungsrichtungen 5b): on a big screen all bags can stand side by side, one
  // column each, to tick in any bag without opening it. A switch above the bags; this device remembers it.
  const boardQ = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1100px)') : null;
  let roomy = $state(boardQ?.matches ?? false);
  $effect(() => {
    const f = (e) => (roomy = e.matches);
    boardQ?.addEventListener('change', f);
    return () => boardQ?.removeEventListener('change', f);
  });
  const SIDE_KEY = 'pack-side-by-side';
  // «332 sichtbar» (Noah 26.10.2026): in «All bags side by side» an item can be dragged into another bag; the
  // arrows button next to it does the same without a mouse (Regel: arrows and drag).
  const canMove = $derived(!!onmove && !fixed);
  let dragId = $state(null);
  let dropKey = $state(null);
  let moving = $state(null); // the item whose «Move to» row is open
  function dragStart(ev, e) {
    dragId = e.itemId;
    ev.dataTransfer?.setData('text/plain', e.itemId);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }
  function dragOver(ev, key) {
    if (!dragId) return;
    ev.preventDefault();
    dropKey = key;
  }
  function drop(ev, key) {
    ev.preventDefault();
    const id = dragId ?? ev.dataTransfer?.getData('text/plain');
    dragId = dropKey = null;
    if (id) moveTo(id, key);
  }
  function moveTo(id, key) {
    moving = null;
    const from = steps.find((st) => st.entries.some((x) => x.itemId === id));
    if (!from || from.key === key) return;
    onmove?.(id, key);
  }
  const readSide = () => {
    try {
      return localStorage.getItem(SIDE_KEY) === '1';
    } catch {
      return false;
    }
  };
  let sidePick = $state(readSide());
  function setSide(v) {
    sidePick = v;
    try {
      localStorage.setItem(SIDE_KEY, v ? '1' : '0');
    } catch {
      /* private window: the switch holds until the page closes */
    }
  }
  const side = $derived(roomy && sidePick);
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
<!-- v0.67.0 «Übergänge 1» (U001, U003, U013): the main button follows the phase (phase.js mainStep):
     «Packen abschliessen» (asks when something is missing, then the interstitial «Gepackt»), packed and
     waiting «Fertig gepackt · zurück zu Touren» (Gesamttest 20.10.2026 B5), under way «Weiter zu Unterwegs», after the trip «Weiter zum Rückblick». -->
{#snippet go()}{#if packFirst && nextBag}<button type="button" class="btn hi go" onclick={packNext} data-pack-next title={t('Pack {bag}|next', { bag: nextBag.title })} aria-label={`${t('Pack {bag}|next', { bag: nextBag.title })} ${t('({done} of {n})|next', { done: nextBag.done, n: nextBag.entries.length })}`}><span class="golbl">{t('Pack {bag}|next', { bag: nextBag.title })}</span><span class="gocnt">{' '}{t('({done} of {n})|next', { done: nextBag.done, n: nextBag.entries.length })}</span><span class="gophone" aria-hidden="true">{t('Continue packing')}<small>{nextBag.title}</small></span><ArrowRight size={20} aria-hidden="true" /></button>
{:else if main.kind === 'finish'}<button type="button" class="btn hi go" onclick={next}><span class="golbl">{t(main.label)}</span><ArrowRight size={20} aria-hidden="true" /></button>
{:else if main.kind === 'end'}<button type="button" class="btn hi go" onclick={onend}><span class="golbl">{t(main.label)}</span><ArrowRight size={20} aria-hidden="true" /></button>
{:else if main.kind === 'go'}<a class="btn hi go" href={main.href}>{t(main.label)}<ArrowRight size={20} aria-hidden="true" /></a>{/if}{/snippet}
<!-- Paket H «4a und b»: «Read aloud» next to the ring, at the thumb on a phone; the window explains the rest -->
{#snippet aside()}{@render ring(52)}{#if onread}<button type="button" class="tp-icon-btn pd-read" aria-label={t('Read aloud')} title={t('Read aloud')} onclick={onread}><Volume2 size={22} aria-hidden="true" /></button>{/if}{/snippet}

<!-- v0.105.0 P5 (T6): one bag in the list «Taschen»: icon, name, «6 Teile · 3.4 kg», a small bar, the count -->
{#snippet bagRing(n, of, done)}
  <!-- «Neuer Schwung» Packen (S2 «Kacheln mit Tiefe», Baustein B4 Ringe): each bag as a tile with a ring that fills
       as you pack; n of the total in the middle, a ✓ when the bag is full. The ring draws itself when the page opens. -->
  <span class="bring" class:full={done} data-bag-ring role="img" aria-label={done ? t('all in') : t('{n} of {total} packed', { n, total: of })}>
    <svg viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="20" /><circle class="fg" cx="24" cy="24" r="20" pathLength="100" style:stroke-dashoffset={100 - (of ? (n / of) * 100 : 0)} /></svg>
    <span class="rn num" aria-hidden="true">{#if done}<Check size={18} strokeWidth={2.5} />{:else}{n}/{of}{/if}</span>
  </span>
{/snippet}

{#snippet bagRow(s, Icon, done, isCur)}
  {#if isCur}
    <!-- the open bag: tinted in the list; its items (with the id and the heading) are in the section below -->
    <li class="brow open"><button type="button" class="bsel" aria-current="true" onclick={() => pick(s.key)}>
      {@render bagRing(s.done, s.entries.length, done)}<span class="bt"><b>{s.title}</b><small>{subOf(s)}</small></span>
    </button></li>
  {:else}
    <li class="brow pbag" class:done class:flash={flash === s.key} aria-labelledby="pb-{s.key}">
      <button type="button" class="bagh" aria-expanded="false" onclick={() => pick(s.key)}>
        {@render bagRing(s.done, s.entries.length, done)}<span class="bt"><b id="pb-{s.key}">{s.title}</b><small>{subOf(s)}</small></span>
      </button>
    </li>
  {/if}
{/snippet}

{#snippet itemRow(s, e)}
  {@const it = itemsById[e.itemId]}
  {@const hint = hintOf(e.itemId)}
  <button type="button" class="it" aria-pressed={!!e.packed} disabled={fixed} onclick={(ev) => tick(s, e, ev)} use:swipeRight={() => tick(s, e)}>
    <span class="box" aria-hidden="true">{#if e.packed}<Check size={16} strokeWidth={2.5} />{/if}</span>
    <span class="nm">{it ? nameOf(it) : e.itemId}{#if (e.qty || 1) > 1}<b class="q">{' '}× {e.qty}</b>{/if}{#if hint}<small>{hint}</small>{:else if e.packed}<small class="drin">{t('in|packed')}</small>{/if}</span>
    <span class="w num">{it?.weightG != null ? formatWeight(it.weightG * (e.qty || 1)) : t('not weighed')}</span>
  </button>
{/snippet}
<!-- Versteckte Funktionen (Noah 22.10.2026 «1a»): «Per Foto abhaken» is a visible camera button at the top of Packen -->
{#snippet photoTick()}<a class="btn sm photo-tick" href={`#/me/tools/packphoto?trip=${encodeURIComponent(trip.id)}`} data-pack-photo><Camera size={16} aria-hidden="true" /> {t('Tick off by photo')}</a>{/snippet}
{#snippet sideSwitch()}{#if roomy}<button type="button" class="btn sm pd-side" aria-pressed={side} onclick={() => setSide(!sidePick)} data-pack-side title={t('Shows every bag as its own column, so you can tick in any bag.')}><Columns3 size={16} aria-hidden="true" /> {side ? t('One bag at a time') : t('All bags side by side')}</button>{/if}{/snippet}
{#snippet sideCards()}
  {#if stats}<WeightCard {trip} {stats} {itemsById} title={t('Weight by bag')} />{/if}
  <!-- v0.30.2 (test R6.6): what earlier debriefs taught. v0.40.0: a learning that already stands
       under its item is not repeated here. -->
  <LessonsCard lessons={newLessons} {reminders} />
  <!-- P3b «Daten sicher» (D3/D4): «ID and cash with you?» and the other papers marked for the packing list -->
  <DocChecks {trip} />
  {#if oncharge}
    <section class="psec" aria-labelledby="more-h">
      <h2 id="more-h" class="sh">{t('More')}</h2>
      <ul class="card mlist">
        <li><button type="button" class="mrow" onclick={oncharge}>
          <span class="bic" aria-hidden="true"><BatteryCharging size={18} /></span>
          <span class="bt"><b>{t('Charge the evening before')}</b>{#if charge?.names?.length}<small>{charge.names.slice(0, 3).join(', ')}{charge.names.length > 3 ? ' …' : ''}</small>{/if}</span>
          <span class="r">{#if charge}<span class="num">{charge.done}/{charge.total}</span>{/if}<ChevronRight size={18} aria-hidden="true" /></span>
        </button></li>
      </ul>
    </section>
  {/if}
{/snippet}

<div class="pd trip-page" aria-label={t('Packing day: {title}', { title: trip.title })}>
  <TripBand {trip} tab="pack" kicker={fixed ? t('Packing list as ridden') : kicker} action={main.kind ? go : null} {aside} hint={fixed ? '' : missing ? missingText : t('Everything is in.')} note />
  <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the tip of the day, a fitting «Passt zu heute» first -->
  <HintCard page="pack" />
  <!-- Alles fertig (Versteckte Funktionen, Noah 22.10.2026 «1a»): the power line open at the top, not only in «Charge» -->
  {#if oncharge}<PowerLine {trip} items={Object.values(itemsById)} />{/if}
  {@render top?.()}
  <!-- v0.67.0 (U014, kit Empty): an empty list says so and leads to adding gear (never «Alles gepackt»). -->
  {#if total === 0 && fixed}<Empty icon={ListChecks} text={t('It was ridden without a list from the app. Reopen it to add one.')} action={{ label: t('Reopen'), onclick: () => askReopen(trip) }} />
  {:else if total === 0}<Empty icon={ListChecks} text={t('The packing list is still empty. Add gear in Plan first, then pack here.')} action={{ label: t('Add material'), href: '#/pack?add' }} />{/if}

  {#if wxGap}
    <div class="card wxgap" role="note">
      <p><b>{t('The forecast is {wx}.', { wx: wxText(wxGap.fc) })}</b> {t('This trip is packed for {wx}.', { wx: wxText(wxGap.have) })}</p>
      <button type="button" class="btn" onclick={onwx} data-explain={t('Pack for the forecast first')}>{t('Forecast first')}</button>
    </div>
  {/if}

  <!-- v0.30.1 (B6): read out here, shown in the bag's foot: a line appearing above the bags pushed the
       open bag down under the finger, so a quick second tap closed it. -->
  <p class="sr" role="status">{status}</p>
  {#if finished && !fixed}
    <!-- v0.30.1 (Noah B10): the end of packing is a card of its own at the top, with the next step. -->
    <section class="alldone" bind:this={doneEl} role="status" aria-labelledby="alldone-h" tabindex="-1">
      <span class="okbig" aria-hidden="true"><Check size={28} strokeWidth={2.5} /></span>
      <div class="adtext">
        <h2 id="alldone-h">{doneText}</h2>
        <p>{tn(total, '{n} item packed', '{n} items packed')}{#if ready.length}{' · '}{t('Ready check done')}{/if}</p>
      </div>
      <!-- v0.67.0 (U001): no second «Weiter» here: the one button of the page is in the band (at the thumb on a phone) -->
    </section>
  {/if}

  {#if total > 0 && side}
    <section class="psec" aria-labelledby="bags-h" data-pack-board>
      <h2 id="bags-h" class="sh">{t('Bags')}</h2>
      <p class="ssub"><span class="num packed-count">{t('{n} of {total} packed', { n: packed, total })}</span>{' · '}{t('all bags side by side: tick in any bag')}{#if canMove}{' · '}{t('drag an item into another bag, or use the arrows next to it')}{/if}{#if !fixed}{@render photoTick()}{/if}{#if onread}<button type="button" class="btn sm pd-read-w" onclick={onread}><Volume2 size={16} aria-hidden="true" /> {t('Read aloud')}</button>{/if}{@render sideSwitch()}</p>
      <div class="board">
        {#each steps as s (s.key)}
          {@const Icon = iconOf(s.key)}
          {@const done = full(s)}
          <section class="card bcol" class:done class:drop={dropKey === s.key} aria-labelledby="bc-{s.key}" data-board-bag={s.key} ondragover={(ev) => dragOver(ev, s.key)} ondragleave={() => dropKey === s.key && (dropKey = null)} ondrop={(ev) => drop(ev, s.key)}>
            <div class="bchead"><span class="bic" aria-hidden="true"><Icon size={18} /></span><span class="bt"><b id="bc-{s.key}">{s.title}</b><small>{subOf(s)}</small></span><span class="r"><span class="num">{s.done}/{s.entries.length}</span>{#if done}<span class="tp-okdot" aria-label={t('all in')}><Check size={16} aria-hidden="true" /></span>{/if}</span></div>
            <ul class="items">
              {#each s.entries as e (e.itemId)}
                <li class:in={e.packed} class:mv={canMove} class:dragging={dragId === e.itemId} draggable={canMove} ondragstart={(ev) => dragStart(ev, e)} ondragend={() => (dragId = dropKey = null)} data-board-item={e.itemId}>
                  {@render itemRow(s, e)}
                  {#if canMove}<button type="button" class="mvbtn" aria-expanded={moving === e.itemId} aria-label={t('Move {name} to another bag', { name: itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId })} title={t('Move to another bag')} onclick={() => (moving = moving === e.itemId ? null : e.itemId)} data-board-move><ArrowLeftRight size={16} aria-hidden="true" /></button>{/if}
                  {#if moving === e.itemId}
                    <div class="mvto" role="group" aria-label={t('Move to another bag')}>
                      {#each [...steps, ...spare].filter((o) => o.key !== s.key) as o (o.key)}<button type="button" class="btn sm" onclick={() => moveTo(e.itemId, o.key)} data-board-move-to={o.key}>{o.title}</button>{/each}
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
            {#if !done && !fixed}<div class="bagfoot"><button type="button" class="tp-link" onclick={() => wholeBag(s)}>{t('Whole bag packed')}</button></div>{/if}
          </section>
        {/each}
        {#if canMove}
          {#each spare as s (s.key)}
            {@const Icon = iconOf(s.key)}
            <section class="card bcol empty" class:drop={dropKey === s.key} aria-labelledby="bc-{s.key}" data-board-bag={s.key} data-board-empty ondragover={(ev) => dragOver(ev, s.key)} ondragleave={() => dropKey === s.key && (dropKey = null)} ondrop={(ev) => drop(ev, s.key)}>
              <div class="bchead"><span class="bic" aria-hidden="true"><Icon size={18} /></span><span class="bt"><b id="bc-{s.key}">{s.title}</b><small>{s.sub}</small></span><span class="r"><span class="num">0</span></span></div>
              <p class="emptyhint">{t('Still empty: drag an item here, or use the arrows next to an item.')}</p>
            </section>
          {/each}
        {/if}
        {#if ready.length}
          <section class="card bcol" class:done={readyAll} aria-labelledby="bc-ready" data-board-bag="ready">
            <div class="bchead"><span class="bic" aria-hidden="true"><ListChecks size={18} /></span><span class="bt"><b id="bc-ready">{t('Ready check')}</b></span><span class="r"><span class="num">{readyN}/{ready.length}</span></span></div>
            <ul class="items">
              {#each ready as r (r.id)}
                {@const ok = readyDone(r, trip)}
                <li class:in={ok}><button type="button" class="it" aria-pressed={ok} disabled={fixed || (!!r.itemId && ok)} onclick={() => readyTick(r)}><span class="box" aria-hidden="true">{#if ok}<Check size={16} strokeWidth={2.5} />{/if}</span><span class="nm">{readyLabel(r)}</span></button></li>
              {/each}
            </ul>
          </section>
        {/if}
      </div>
      <div class="bagfoot board-foot">
        {#if !fixed && (packed < total || !readyAll)}<button type="button" class="tp-link" onclick={everything}>{t('Everything is packed')}</button>{/if}
        {#if canUndo && !fixed}<button type="button" class="tp-link" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
      </div>
    </section>
    <div class="pside board-side">{@render sideCards()}</div>
  {:else if total > 0}
  <div class="pcols">
    <div class="pmain">
      <section class="psec" aria-labelledby="bags-h">
        <h2 id="bags-h" class="sh">{t('Bags')}</h2>
        <p class="ssub"><span class="num packed-count">{t('{n} of {total} packed', { n: packed, total })}</span>{' · '}{t('tap a bag')}{#if !fixed}{@render photoTick()}{/if}{#if onread && !phone.matches}<button type="button" class="btn sm pd-read-w" onclick={onread}><Volume2 size={16} aria-hidden="true" /> {t('Read aloud')}</button>{/if}{@render sideSwitch()}</p>
        <PackBike {steps} {cur} onpick={pick} />
        <ul class="blist">
          {#each steps as s (s.key)}{@render bagRow(s, iconOf(s.key), full(s), s.key === cur)}{/each}
          {#if ready.length}
            {#if cur === READY}
              <li class="brow open"><button type="button" class="bsel" aria-current="true" onclick={() => pick(READY)}>{@render bagRing(readyN, ready.length, readyAll)}<span class="bt"><b>{t('Ready check')}</b></span></button></li>
            {:else}
              <li class="brow pbag" class:done={readyAll} aria-labelledby="pb-ready">
                <button type="button" class="bagh" aria-expanded="false" onclick={() => pick(READY)}>
                  {@render bagRing(readyN, ready.length, readyAll)}<span class="bt"><b id="pb-ready">{t('Ready check')}</b>{#if !readyAll}<small>{ready.filter((r) => !readyDone(r, trip)).map((r) => readyLabel(r)).join(' · ')}</small>{/if}</span>
                </button>
              </li>
            {/if}
          {/if}
        </ul>
      </section>

      {#each steps as s (s.key)}
        {#if s.key === cur}
          {@const done = full(s)}
          <section class="pbag cur" aria-labelledby="pb-{s.key}" bind:this={openEl} onpointerdown={touchBag}>
            <div class="bagh">
              <h2 class="sh"><b id="pb-{s.key}">{s.title}</b></h2>
              <p class="ssub">{t('{done} of {n} · a full bag jumps to the next one', { done: s.done, n: s.entries.length })}{#if phone.matches && !fixed}{' · '}<span data-swipe-hint>{t('or swipe a row to the right')}</span>{/if}{#if s.sub}{' · '}{s.sub}{/if}</p>
            </div>
            <div class="card ibox">
              <ul class="items">
                {#each ordered(s) as e, i (e.itemId)}
                  <li class:in={e.packed} animate:flip={{ duration: still() ? 0 : 250, easing: cubicOut }}>
                    <!-- UI-Grundlagen (Gestaltungsregeln B §5.3): a quiet line over the packed rows once they have slid down -->
                    {#if e.packed && i > 0 && i === openOf(s) && ordered(s).slice(i).every((x) => x.packed)}<p class="donehead">{t('Already packed · {n}', { n: s.entries.length - i })}</p>{/if}
                    {@render itemRow(s, e)}
                  </li>
                {/each}
              </ul>
              <div class="bagfoot">
                {#if !done && !fixed}<button type="button" class="tp-link" onclick={() => wholeBag(s)}>{t('Whole bag packed')}</button>{:else}<span class="tp-muted tp-small packed-note" aria-hidden={status && note?.from === s.key ? 'true' : undefined}>{status && note?.from === s.key ? status : t('all in')}</span>{/if}
                {#if canUndo && !fixed}<button type="button" class="tp-link" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
              </div>
            </div>
          </section>
        {/if}
      {/each}
      {#if ready.length && cur === READY}
        <section class="pbag cur" aria-labelledby="pb-ready" bind:this={openEl}>
          <div class="bagh">
            <h2 class="sh"><b id="pb-ready">{t('Ready check')}</b></h2>
            <p class="ssub num">{readyN}/{ready.length}</p>
          </div>
          <div class="card ibox">
            <ul class="items">
              {#each readySort.order(ready) as r (r.id)}
                {@const ok = readyDone(r, trip)}
                <li class:in={ok} animate:flip={glide()}>
                  <button type="button" class="it" aria-pressed={ok} disabled={fixed || (!!r.itemId && ok)} onclick={() => readyTick(r)} use:swipeRight={() => readyTick(r)}>
                    <span class="box" aria-hidden="true">{#if ok}<Check size={16} strokeWidth={2.5} />{/if}</span>
                    <span class="nm">{readyLabel(r)}</span>
                  </button>
                  <!-- v0.34.0 (L4): which devices, from the packing list -->
                  {#if r.id === 'charged' && oncharge}<button type="button" class="tp-link chg" onclick={oncharge}><BatteryCharging size={16} aria-hidden="true" />{t('Charge list')}</button>{/if}
                </li>
              {/each}
            </ul>
            <div class="bagfoot">
              {#if !readyAll && !fixed}<button type="button" class="tp-link" onclick={readyAllTick}>{t('Tick all checks')}</button>{:else if readyAll}<span class="tp-muted tp-small">{t('all in')}</span>{/if}
              {#if canUndo && !fixed}<button type="button" class="tp-link" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
            </div>
          </div>
        </section>
      {/if}
      {#if !fixed && (packed < total || !readyAll)}<p class="all"><button type="button" class="tp-link" onclick={everything}>{t('Everything is packed')}</button>{#if packFirst}<button type="button" class="tp-link" onclick={next} data-finish-quiet>{t(main.label)}</button>{/if}</p>{/if}
    </div>

    <div class="pside">{@render sideCards()}</div>
  </div>
  {/if}
  <!-- Gesamttest 20.10 Design / UI-Grundlagen (idea 1): the tip of the day follows the bags, not the help box -->
  <TipLine page="pack" name={t('Pack')} />
</div>

<dialog use:backClose class="sheet ask" bind:this={askEl} aria-labelledby="ask-h">
  <h2 id="ask-h">{tn(missing, '{n} thing is not ticked yet. Go anyway?', '{n} things are not ticked yet. Go anyway?')}</h2>
  <p class="tp-muted">{t('Nothing is lost: you can come back to Pack any time.')}</p>
  <div class="askacts">
    <button type="button" class="btn ink" onclick={() => { askEl.close(); onnext(); }}>{t('Go anyway')}</button>
    <button type="button" class="btn" onclick={() => askEl.close()}>{t('Keep packing')}</button>
  </div>
</dialog>

<style>
  /* v0.106.0 Design-Refresh P5 (T6): light sections with a title and a short line, white cards. */
  .alldone { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 12px 14px; margin: 0 0 16px; padding: 18px 16px; border: 1px solid var(--card-line); border-radius: var(--radius-card); background: var(--ok-soft); scroll-margin-top: 72px; }
  .alldone:focus { outline: none; }
  .okbig { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: var(--ok); color: var(--paper); }
  .alldone h2 { margin: 0; font: 700 var(--fs-sub) / 1.25 var(--font-body); color: var(--ink); overflow-wrap: break-word; }
  .alldone p { margin: 2px 0 0; font-size: var(--fs-small); color: var(--ink-2); }
  .ring { position: relative; display: inline-block; flex: none; }
  .ring svg { transform: rotate(-90deg); display: block; }
  .ring b { position: absolute; inset: 0; display: grid; place-items: center; font-size: var(--fs-tiny); font-weight: 700; color: var(--ink); }
  .wxgap { margin: 0 0 16px; background: var(--info-soft); }
  .wxgap p { margin: 0 0 10px; }
  .pcols { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
  .pmain, .pside { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-content: start; min-width: 0; }
  @media (min-width: 900px) { .pcols { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); align-items: start; } }
  .psec, .pbag { min-width: 0; }
  /* 1038: all bags side by side (only from 1100 px, switched on above the bags) */
  .pd-side { margin-left: 12px; vertical-align: middle; }
  .board { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; align-items: start; }
  .bcol { min-width: 0; padding-top: 4px; padding-bottom: 4px; }
  .bcol.done { background: var(--ok-soft); }
  .bcol.empty { border-style: dashed; }
  .emptyhint { margin: 12px 0; color: var(--ink-2); font-size: var(--fs-small); }
  .bcol.drop { outline: 2px dashed var(--accent); outline-offset: 2px; }
  .items li.mv { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 4px; }
  .items li.mv[draggable='true'] { cursor: grab; }
  .items li.dragging { opacity: 0.5; }
  .mvbtn { display: inline-grid; place-items: center; min-width: 44px; min-height: 44px; border: 0; border-radius: 8px; background: none; color: var(--ink-2); cursor: pointer; }
  .mvbtn:hover, .mvbtn[aria-expanded='true'] { background: var(--accent-soft); color: var(--accent); }
  .mvto { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0 10px; }
  .bchead { display: flex; align-items: center; gap: 10px; min-height: 56px; border-bottom: 1px solid var(--line); }
  .board-foot { border-top: 0; margin-top: 8px; justify-content: flex-start; gap: 0 16px; }
  .board-side { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: 24px; }
  .sh { margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); color: var(--ink); overflow-wrap: break-word; }
  .sh b { font-weight: 600; }
  .ssub { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  /* Paket H: on a computer «Read aloud» stands in the line above the bags (on a phone it is next to the ring) */
  .pd-read-w { margin-left: 12px; vertical-align: middle; }
  .photo-tick { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; margin-left: 8px; vertical-align: middle; text-decoration: none; }
  /* «Neuer Schwung» Packen (S2, B4): the bags as tiles with a ring each, the open one framed in the accent */
  .mlist { list-style: none; margin: 0; padding: 0; overflow: hidden; }
  .mlist li + li { border-top: 1px solid var(--line); }
  .mrow { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 64px; padding: 8px 16px; border: 0; background: none; color: var(--ink); font: 400 var(--fs-body) var(--font-body); text-align: left; cursor: pointer; }
  .blist { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(132px, 100%), 1fr)); gap: 10px; }
  @media (max-width: 479px) { .blist { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; } }
  /* on the smallest phones (320 px) three tiles are too narrow for «Oberrohrtasche»: two per row */
  @media (max-width: 359px) { .blist { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .brow { min-width: 0; border: 1px solid var(--line); border-radius: 14px; background: var(--paper); box-shadow: 0 1px 2px var(--shadow); transition: border-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out); }
  .brow.open { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .brow .bagh, .brow .bsel { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; height: 100%; min-height: 44px; padding: 12px 6px 10px; border: 0; border-radius: inherit; background: none; color: var(--ink); font: 400 var(--fs-body) var(--font-body); text-align: center; cursor: pointer; }
  .bring { position: relative; display: grid; place-items: center; width: 56px; height: 56px; flex: none; }
  .bring > svg { position: absolute; inset: 0; width: 100%; height: 100%; rotate: -90deg; }
  .bring circle { fill: none; stroke-width: 5; }
  .bring .bg { stroke: var(--paper-2); }
  .bring .fg { stroke: var(--hi); stroke-linecap: round; stroke-dasharray: 100; transition: stroke-dashoffset 450ms var(--ease-out); }
  .bring.full .fg { stroke: var(--ok, var(--hi)); }
  .bring .rn { position: relative; font: 600 var(--fs-small) / 1 var(--font-body); color: var(--ink); }
  .bring.full .rn { color: var(--ok, var(--hi)); }
  @keyframes pk-ring { from { stroke-dashoffset: 100; } }
  @media (prefers-reduced-motion: no-preference) { .bring .fg { animation: pk-ring 700ms var(--ease-out) 120ms backwards; } }
  @media (prefers-reduced-motion: reduce) { .bring .fg { transition: none; } }
  .brow .bt { flex: none; width: 100%; min-width: 0; }
  .brow .bt b { overflow-wrap: break-word; font-size: var(--fs-small); line-height: 1.3; }
  @media (max-width: 479px) { .brow .bt b { letter-spacing: -0.02em; } .brow .bagh, .brow .bsel { padding-inline: 4px; } }
  .brow .bt small { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .mrow .r { flex-shrink: 0; }
  .bic { display: grid; flex: none; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: var(--paper-2); color: var(--ink-2); }
  /* v0.77.0: the title never gets narrower than its longest word (capped at the row), so a short
     row takes the room from the bar (.r) instead (no «Oberrohrtasche» broken mid-word). */
  .bt { flex: 1 1 auto; min-width: min(min-content, 100%); overflow-wrap: break-word; }
  .bt b { display: block; font-weight: 500; }
  .bt small { display: block; font-size: var(--fs-small); color: var(--ink-2); }
  .pbag.done .bt b { color: var(--ink-3); }
  .r { margin-left: auto; min-width: 0; flex-shrink: 20; display: flex; align-items: center; gap: 10px; font-size: var(--fs-small); color: var(--ink-2); white-space: nowrap; }
  .r :global(svg) { color: var(--ink-3); flex: none; }
  /* the open bag: its own section, the items with check boxes */
  .pbag.cur { scroll-margin-top: 72px; }
  /* «Bewegung» Stelle 1 (Noah 19.10.2026 «alle 1-3», notes/bewegung-2026-10-19): the bag that opens comes up
     from 8 px below and fades in (260 ms); a tick fills the box in 120 ms and the ✓ grows from 80 %. Transitions,
     not keyframes: a quick second tap turns the move round from where it is. Nothing waits for a move.
     Reduced motion: no moving or growing, the colours still change softly and the green row still shows. */
  section.pbag.cur { transition: opacity 260ms var(--ease-out), translate 260ms var(--ease-out); }
  @starting-style { section.pbag.cur { opacity: 0; translate: 0 8px; } }
  .box { transition: background-color 120ms var(--ease-out), border-color 120ms var(--ease-out); }
  .box :global(svg) { transition: scale 120ms var(--ease-out), opacity 120ms var(--ease-out); }
  @starting-style { .box :global(svg) { scale: 0.8; opacity: 0; } }
  .nm { transition: color 150ms ease-out; }
  .brow.flash { animation: bag-done 900ms ease-out; }
  @keyframes bag-done { from, 30% { background: var(--ok-soft); } }
  @media (prefers-reduced-motion: reduce) {
    section.pbag.cur, .box :global(svg) { transition: none; }
  }
  .pbag.cur .bagh { display: block; min-height: 0; padding: 0; cursor: default; }
  .ibox { padding-top: 4px; padding-bottom: 4px; }
  .items { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); }
  .items li + li { border-top: 1px solid var(--line); }
  .it { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 6px 0; border: 0; background: none; color: var(--ink); font: 400 var(--fs-body) / 1.3 var(--font-body); text-align: left; cursor: pointer; }
  /* TZ-2: a fixed list is to read: the ticks as they were, no hand */
  .it:disabled { cursor: default; }
  /* «Neuer Schwung» Packen 2 (B6): swipe a row to the right to tick it; the row follows the finger, green shows through */
  .it { position: relative; overflow: hidden; touch-action: pan-y; }
  .it::before { content: ''; position: absolute; inset: 0; background: color-mix(in srgb, var(--ok) 22%, transparent); opacity: var(--sp, 0); pointer-events: none; }
  .it > span { position: relative; }
  /* only while the finger is on the row (the own transitions of the box and the name stay as they are) */
  .it:global(.swiping) > span { translate: var(--sx, 0) 0; }
  .box { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; border: 1.5px solid var(--line-strong); background: var(--paper); }
  /* v0.30.1 (Noah B1): every item name in the same face, size and weight; × n and the hint only quieter. */
  .nm { flex: 1; min-width: 0; overflow-wrap: break-word; font: inherit; }
  .nm small { display: block; font: 400 var(--fs-small) / 1.35 var(--font-body); color: var(--ink-3); }
  .q { font: inherit; color: var(--ink-3); white-space: nowrap; }
  .w { flex: none; font-size: var(--fs-small); color: var(--ink-2); white-space: nowrap; }
  /* Gesamttest 26.10.2026: on a very small phone «nicht gewogen» takes two lines, so a long name keeps its words whole */
  @media (max-width: 359px) { .w { white-space: normal; max-width: 5.5em; text-align: right; } }
  .in .box { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  /* UI-Grundlagen (Gestaltungsregeln B §5.3): packed rows are quieter, never struck through; the word «drin» says it */
  .in .nm { color: var(--ink-3); font-weight: 400; }
  .drin { color: var(--hi); }
  .donehead { margin: 0; padding: 10px 0 6px; border-top: 1px solid var(--line); font-size: var(--fs-small); color: var(--ink-3); }
  li:has(> .chg) { display: flex; align-items: center; }
  .chg { flex: none; padding: 0 0 0 12px; font-size: var(--fs-small); white-space: nowrap; }
  .bagfoot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 12px; border-top: 1px solid var(--line); }
  .bagfoot .tp-link, .all .tp-link { font-size: var(--fs-small); }
  .all { display: flex; flex-wrap: wrap; gap: 0 16px; margin: -12px 0 0; }
  .ask h2 { margin: 0 0 8px; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .askacts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  /* a phone held sideways keeps the trip band compact: the count is in the steps already */
  @media (max-height: 500px) { .gocnt { display: none; } }
  .gophone { display: none; }
  /* UI-Grundlagen (Noah 20.10.2026, idea 3): on a phone the ring beside the button shows the count, so the main
     button keeps one line («Werkzeugtasche packen»); a long bag name ends with «…» instead of wrapping (the button's
     title keeps the whole name). */
  @media (max-width: 600px) {
    .gocnt { display: none; }
    .go { min-width: 0; }
    .golbl { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* Klick-Rundgang 22.10.2026 H05: a long bag name no longer ends in «…» in the main button: on a phone it says
       «Weiter packen» and the bag goes on a small second line (the full name stays the button's title and name) */
    .go:has(.gophone) .golbl { display: none; }
    .gophone { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; line-height: 1.15; text-align: left; }
    .gophone small { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--fs-small); font-weight: 400; }
  }
</style>

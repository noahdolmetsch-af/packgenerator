<script>
  /**
   * «Quick Links» step 2 (Noah 28.10.2026 «1a 2a»): the small grey pin at the top right of every card,
   * table and tab that is a function of the catalogue. A tap pins it into the Quick Links of this device
   * (into the first group), a second tap unpins it; both with Undo. The first note says what the pin does.
   *
   * The pins sit in their own layer above the page, so no page needs its own code: the functions whose home
   * is this page (heimat.js) are found by their title, as tests/e2e/heimat.spec.js does. A pin only sits
   * where it covers nothing to tap (else at the end of the title, else none). Switched off in Quick Links.
   */
  import { Pin } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { FEATURE } from '../features.js';
  import { QUICK_KEYS, deviceKind, cleanQuick, isPinned, addPin } from './quicklinks.js';
  import { MARK_KEYS, featuresOn, textFits, placePin } from './pinmarks.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { hash = '' } = $props();

  const KEY = QUICK_KEYS[deviceKind()];
  let s = $state(null);
  let on = $state(false);
  let hintSeen = $state(true);
  let found = []; // { id, card, title }: the cards found on the page (plain, not shown)
  let marks = $state([]); // { id, x, y }: the pins in sight
  let layer = $state(null);

  $effect(() => {
    const sub = liveQuery(() => db.settings.bulkGet([KEY, MARK_KEYS.on, MARK_KEYS.hint])).subscribe({
      next: ([mine, onRec, hint]) => {
        s = cleanQuick(mine?.value);
        on = onRec?.value !== false;
        hintSeen = !!hint?.value;
      },
      error: () => {},
    });
    return () => sub.unsubscribe();
  });

  const SEL = 'h1, h2, h3, h4, summary, button, a, label, [role=tab], th';
  const CARD = 'section, article, details, li, [role=tab], table, .card, [class*="card"], [class*="tile"]';
  const TAP = 'button, a, input, select, textarea, summary, label, [role=button], [role=tab], [role=switch], [tabindex]';

  /** Look for the cards of this page's functions (after the page changed). */
  function find() {
    const main = document.querySelector('main');
    if (!main || /^#\/quick(\/|\?|$)/.test(hash)) return (found = []);
    // titles first (a card's heading), then folds, tabs and table heads, buttons and links last
    const rank = (e) => (/^H[1-4]$/.test(e.tagName) ? 0 : /^(SUMMARY|TH|LABEL)$/.test(e.tagName) || e.getAttribute('role') === 'tab' ? 1 : 2);
    const els = [...main.querySelectorAll(SEL)]
      .filter((e) => e.getClientRects().length && !e.closest('dialog, [role=dialog]'))
      .sort((a, b) => rank(a) - rank(b));
    const used = new Set();
    found = [];
    for (const id of featuresOn(hash)) {
      const name = t(FEATURE[id].title);
      const title = els.find((e) => textFits(e.innerText || e.getAttribute('aria-label') || '', name));
      if (!title) continue;
      let card = title.closest(CARD);
      if (!card || !main.contains(card) || card.getBoundingClientRect().height > innerHeight * 1.5) card = title;
      if (used.has(card)) continue;
      used.add(card);
      found.push({ id, card, title });
    }
  }

  /** Is a box (page coordinates) free of things to tap and of bars on top? */
  function free(b) {
    const pts = [
      [b.x + b.w / 2, b.y + b.h / 2],
      [b.x + 4, b.y + 4],
      [b.x + b.w - 4, b.y + 4],
      [b.x + 4, b.y + b.h - 4],
      [b.x + b.w - 4, b.y + b.h - 4],
    ];
    for (const [px, py] of pts) {
      const x = px - scrollX;
      const y = py - scrollY;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
      const top = document.elementsFromPoint(x, y).find((e) => !layer?.contains(e));
      if (!top) continue;
      if (!top.closest('main')) return false; // a bar or a window on top
      if (top.closest(TAP)) return false;
    }
    return true;
  }

  /** Place the pins of the cards in sight. */
  function place() {
    if (!on || !s) return (marks = []);
    const w = document.documentElement.clientWidth;
    // «Grösse» zooms the whole app (html zoom): the boxes are in screen pixels, the layer in zoomed ones
    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const next = [];
    for (const f of found) {
      if (!f.card.isConnected) continue;
      const r = f.card.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const tr = f.title.getBoundingClientRect();
      const doc = (q) => ({ top: q.top + scrollY, right: q.right + scrollX, height: q.height });
      const at = placePin(doc(r), doc(tr), w, free);
      if (at) next.push({ id: f.id, x: at.x / z, y: at.y / z, hx: Math.max(8, Math.min(at.x - 200, w - 248)) / z });
    }
    marks = next;
  }

  let findTimer = null;
  let frame = 0;
  const later = () => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), place()));
  };
  // at most every 300 ms, also while the page keeps changing (a clock, a timer)
  const refind = () => {
    if (!findTimer) findTimer = setTimeout(() => ((findTimer = null), find(), place()), 300);
  };

  $effect(() => {
    void hash;
    void on;
    refind();
    const main = document.querySelector('main');
    const mo = main ? new MutationObserver(refind) : null;
    mo?.observe(main, { childList: true, subtree: true, characterData: true });
    const ro = main ? new ResizeObserver(later) : null;
    ro?.observe(main);
    addEventListener('scroll', later, { passive: true, capture: true });
    addEventListener('resize', later);
    return () => {
      mo?.disconnect();
      ro?.disconnect();
      clearTimeout(findTimer);
      findTimer = null;
      removeEventListener('scroll', later, { capture: true });
      removeEventListener('resize', later);
    };
  });

  const save = (v) => db.settings.put({ key: KEY, value: JSON.parse(JSON.stringify(v)) });
  async function toggle(id) {
    const before = $state.snapshot(s);
    const name = t(FEATURE[id].title);
    if (isPinned(s, id)) {
      await save({ ...s, pins: s.pins.filter((p) => p.feature !== id) });
      offerDone(t('«{name}» unpinned.', { name }), () => save(before));
    } else {
      await save(addPin(s, id, s.groups[0]?.id ?? ''));
      // the first time the note says what the pin does (Noah «2a»: explain where users could get lost)
      const text = hintSeen ? t('«{name}» is in your Quick Links.', { name }) : t('«{name}» is in your Quick Links. A tap there brings you right back here.', { name });
      offerDone(text, () => save(before));
      if (!hintSeen) db.settings.put({ key: MARK_KEYS.hint, value: true });
    }
  }
</script>

{#if marks.length}
  <div class="pm-layer" bind:this={layer} data-pinmarks>
    {#each marks as m (m.id)}
      {@const pinned = isPinned(s, m.id)}
      <button
        type="button"
        class="pm"
        class:on={pinned}
        style:left="{m.x}px"
        style:top="{m.y}px"
        aria-pressed={pinned}
        aria-label={pinned ? t('Pinned in Quick Links') : t('Pin to Quick Links')}
        title={t(FEATURE[m.id].title)}
        data-pinmark={m.id}
        onclick={() => toggle(m.id)}
      ><span class="pm-dot"><Pin size={15} aria-hidden="true" /></span></button>
    {/each}
  </div>
{/if}

<style>
  .pm-layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    z-index: 4;
  }
  .pm {
    position: absolute;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .pm-dot {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--paper);
    border: 1px solid var(--line);
    color: var(--ink-3);
    box-shadow: 0 1px 3px var(--shadow);
  }
  .pm:hover .pm-dot,
  .pm:focus-visible .pm-dot {
    color: var(--ink);
    border-color: var(--line-strong);
  }
  .pm.on .pm-dot {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
</style>

<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * v0.34.0 (L3, Noah 1a): the shopping list of the open trip. A quiet row in Plan (only with food
   * on the trip) and a sheet: one row per item with its amount, a tick per row, "Share" sends the
   * list as text (the phone's share sheet when there is one, else it is copied). Today's schedule
   * opens it two days before the start (#/pack?shop). The ticks are stored on the trip
   * (trip.shop = { [itemId]: true }); items and entries never change.
   */
  import { ShoppingCart, ChevronRight, Share2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, tn } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';
  import { shopList, shopCount, toggleShop, shopText, shopLine, peopleOf } from '../shop.js';
  import { flip } from '../ui/flip.js';
  import { laterSort, glide } from '../ui/latersort.svelte.js';
  import { Minus, Plus } from '@lucide/svelte';

  let { trip, itemsById } = $props();

  const rows = $derived(shopList(trip, itemsById));
  const count = $derived(shopCount(rows));
  let open = $state(false);
  let el = $state();
  let note = $state('');
  let copyText = $state('');

  // #/pack?shop (Today's schedule): open once, then the address is plain #/pack again.
  $effect(() => {
    if (/^#\/pack\?(?:.*&)?shop\b/.test(location.hash)) {
      history.replaceState(null, '', '#/pack');
      open = true;
    }
  });
  $effect(() => {
    if (open && el && !el.open) el.showModal();
  });

  // «Bewegung» 4b (Noah 19.10.2026 «1a»): bought items slide down a moment after the last tap
  const sort = laterSort((r) => r.itemId, (r) => r.done);
  $effect(() => () => sort.stop());
  async function tick(itemId) {
    sort.tap(rows);
    const id = trip.id;
    await db.transaction('rw', db.trips, async () => {
      const cur = await db.trips.get(id);
      if (cur) await db.trips.update(id, touched({ shop: toggleShop(cur.shop, itemId) }));
    });
  }

  // Paket H (#365): food for several people: the amounts count for everyone who eats from it
  const people = $derived(peopleOf(trip));
  async function setPeople(n) {
    const id = trip.id;
    const v = Math.min(20, Math.max(1, n));
    await db.trips.update(id, touched({ people: v === 1 ? null : v }));
  }

  async function share() {
    const text = shopText(trip, rows);
    note = '';
    copyText = '';
    try {
      if (navigator.share && phone.matches) {
        await navigator.share({ title: t('Shopping list: {title}', { title: trip.title }), text });
        return;
      }
      await navigator.clipboard.writeText(text);
      note = t('Copied. Paste it into a message or a note.');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      // No clipboard here: the text to copy by hand.
      copyText = text;
    }
  }
</script>

{#if rows.length}
  <button type="button" class="tp-fold shop-row" onclick={() => (open = true)}>
    <ShoppingCart size={20} aria-hidden="true" /><span>{t('Shopping list')}</span>
    <span class="r"><i class="tp-badge">{count.open ? tn(count.open, '{n} to buy', '{n} to buy') : t('all bought')}</i><ChevronRight class="chev" size={18} aria-hidden="true" /></span>
  </button>
{/if}

{#if open}
  <dialog use:backClose class="calm-sheet shop-sheet" bind:this={el} onclose={() => ((open = false), (note = ''), (copyText = ''))} aria-labelledby="shop-h">
    <header><h2 id="shop-h">{t('Shopping list')}</h2><button type="button" class="text-button" onclick={() => el.close()}>{t('Close')}</button></header>
    {#if rows.length}
      <p class="sub">{t('{open} of {total} still to buy.', { open: count.open, total: count.total })}</p>
      <div class="ppl">
        <span>{t('For how many people')}</span>
        <button type="button" class="btn sm" aria-label={t('One person less')} disabled={people <= 1} onclick={() => setPeople(people - 1)}><Minus size={16} aria-hidden="true" /></button>
        <b class="num" aria-live="polite">{people}</b>
        <button type="button" class="btn sm" aria-label={t('One person more')} disabled={people >= 20} onclick={() => setPeople(people + 1)}><Plus size={16} aria-hidden="true" /></button>
      </div>
      {#if people > 1}<p class="sub ppl-n">{t('The amounts are for {n} people. Your packing list stays as it is.', { n: people })}</p>{/if}
      <ul class="shop" aria-label={t('Shopping list')}>
        {#each sort.order(rows) as r (r.itemId)}
          <li class:done={r.done} animate:flip={glide()}>
            <label>
              <input type="checkbox" checked={r.done} onchange={() => tick(r.itemId)} />
              <span class="nm">{r.name}</span>
              <span class="qty num" aria-label={t('Amount {n}', { n: r.qty })}>{r.qty}×</span>
            </label>
          </li>
        {/each}
      </ul>
    {:else}
      <p>{t('Nothing to buy for this trip.')} {t('Food and drink on the list show up here with their amounts.')}</p>
    {/if}
    {#if note}<p class="calm-status" role="status">{note}</p>{/if}
    {#if copyText}<label class="copy"><span>{t('Copy this text:')}</span><textarea class="inp" readonly rows={Math.min(10, copyText.split('\n').length + 1)}>{copyText}</textarea></label>{/if}
    <footer>
      <button type="button" class="primary" onclick={() => el.close()}>{t('Done')}</button>
      {#if rows.length}<button type="button" class="text-button" onclick={share}><Share2 size={18} aria-hidden="true" />{t('Share as text')}</button>{/if}
    </footer>
  </dialog>
{/if}

<style>
  .shop-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 6px 16px; color: var(--ink); font: 500 var(--fs-body) var(--font-body); text-align: left; cursor: pointer; }
  .shop-row > :global(svg:first-child) { color: var(--ink-3); flex: none; }
  /* Gesamttest 26.10.2026: «Einkaufsliste» stays one word at 320 px; the badge wraps instead */
  .shop-row > span:not(.r) { min-width: min-content; overflow-wrap: break-word; }
  .shop-row .r { margin-left: auto; display: flex; flex-wrap: wrap; justify-content: flex-end; min-width: 0; align-items: center; gap: 4px 8px; color: var(--ink-3); }
  .shop-sheet { max-width: 520px; }
  .shop-sheet > footer { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; margin-top: 16px; }
  .sub { margin: -12px 0 8px; color: var(--ink-3); font-size: var(--fs-small); }
  .ppl { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; }
  .ppl b { min-width: 2ch; text-align: center; }
  .ppl-n { margin: 0 0 8px; }
  .shop { list-style: none; margin: 0; padding: 0; }
  .shop li { border-bottom: 1px solid var(--line); }
  .shop li:last-child { border-bottom: 0; }
  .shop label { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 4px 0; cursor: pointer; }
  .shop input { width: 22px; height: 22px; flex: none; accent-color: var(--ok); }
  .shop .nm { flex: 1 1 auto; min-width: 0; overflow-wrap: break-word; }
  .shop .qty { flex: none; min-width: 3ch; text-align: right; font-variant-numeric: tabular-nums; color: var(--ink-2); font-weight: 600; }
  .shop li.done .nm { color: var(--ink-3); text-decoration: line-through; }
  .copy { display: grid; gap: 6px; margin-top: 12px; font-size: var(--fs-small); }
  .copy textarea { width: 100%; box-sizing: border-box; font: var(--fs-body)/1.4 var(--font-body); }
</style>

<script>
  /**
   * v0.59.0 «Tauschen» (OP2a, Noah a): the sheet a tap on a worn piece opens. The alternatives of the
   * same zone and layer from the wardrobe: first those that fit the trip's weather (the best one with
   * a star), then the ones picked before, «Fits less» quieter below but still one tap (a suggestion is
   * never forced). One tap swaps and closes; the message has Undo. «Take off» leaves the piece out.
   */
  import { X, Thermometer, CloudSun, CloudRain, Clock3, Minus, Shirt, Star } from '@lucide/svelte';
  import TempBar from '../ui/TempBar.svelte';
  import { t, tn, nameOf, num } from '../i18n.svelte.js';
  import { formatWeight, itemWeight } from '../gear.js';
  import { ZONES, LAYERS, tempRange } from '../wardrobe.js';
  import { swapChoices, zoneOf, layerOf, fitOf } from '../swap.js';
  let { trip, item, items, memory = {}, range = null, rain = 'dry', wardrobeHref, places = [], onpick, ontakeoff, onmove, onclose } = $props();

  let el = $state();
  $effect(() => { if (el && !el.open) el.showModal(); });
  const zone = $derived(zoneOf(item));
  const layer = $derived(layerOf(item));
  const kicker = $derived([zone ? t(ZONES.find((z) => z.key === zone)?.name ?? zone) : null, layer ? t(LAYERS.find((l) => l.key === layer)?.name ?? layer) : null].filter(Boolean).join(' · '));
  const choices = $derived(swapChoices(item, items, trip, memory, { range, rain }));
  const now = $derived(fitOf(item, range, rain));
  const rangeText = $derived(range ? (range.min === range.max ? `${range.min}°` : `${range.min}–${range.max}°`) : '');
  const CLASS = { warm: 'warm|temp', mittel: 'medium|temp', kalt: 'cold|temp' };
  const tr = (s, v) => t(s, v);
  const range0 = (i) => (typeof i.tempMin === 'number' && typeof i.tempMax === 'number' ? `${i.tempMin}–${i.tempMax}°` : tempRange(i.tempMin, i.tempMax, tr) || (i.tempClass ? t(CLASS[i.tempClass] ?? i.tempClass) : ''));
  const whyText = (why) => (!why ? '' : why.key === 'cool' ? t('only from {n}°', { n: why.n }) : why.key === 'warm' ? t('only up to {n}°', { n: why.n }) : why.key === 'rain' ? t('only for rain') : t('keeps no rain out'));
  const memText = (m) => (!m ? '' : typeof m.c === 'number' ? t('last at {n}°', { n: m.c }) : t('picked before'));
  const g = (i) => (i.weightG == null ? '–' : formatWeight(itemWeight(i)));
  function pick(to) {
    el.close();
    onpick(to);
  }
  function move(slot) {
    el.close();
    onmove(slot);
  }
  function takeOff() {
    el.close();
    ontakeoff();
  }
</script>

<dialog class="calm-sheet swap-sheet" bind:this={el} onclose={onclose} aria-labelledby="swap-h">
  <header class="sh">
    <span class="st">
      {#if kicker}<small class="kick">{kicker}</small>{/if}
      <h2 id="swap-h">{t('Swap')}</h2>
      <span class="facts num">
        {#if rangeText}<span><Thermometer size={16} aria-hidden="true" />{rangeText}</span>{/if}
        <span>{#if rain === 'wet'}<CloudRain size={16} aria-hidden="true" />{t('Rain')}{:else}<CloudSun size={16} aria-hidden="true" />{t('Dry|weather')}{/if}</span>
        {#if trip.hours}<span><Clock3 size={16} aria-hidden="true" />{t('{n} h', { n: num(trip.hours) })}</span>{/if}
      </span>
    </span>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => el.close()}><X size={22} aria-hidden="true" /></button>
  </header>

  <div class="now">
    <small>{t('On the list now')}</small>
    <p class="row0"><span class="nm">{nameOf(item)}</span><span class="w num">{g(item)}</span></p>
    <p class="tl"><TempBar {item} mark={range} width={84} /><small class="num">{range0(item)}</small>{#if !now.ok}<small class="why">{whyText(now.why)}</small>{/if}</p>
  </div>

  {#if !choices.fits.length && !choices.less.length}
    <p class="empty">{t('No other piece of this zone and layer in your wardrobe yet.')}</p>
  {/if}
  {#if choices.fits.length}
    <h3 class="zlabel">{rangeText ? t('Fits {range}', { range: rangeText }) : t('From your wardrobe')}</h3>
    <ul class="alts">
      {#each choices.fits as r, n (r.item.id)}
        {@render alt(r, n === 0 && choices.fits.length > 1)}
      {/each}
    </ul>
  {/if}
  {#if choices.less.length}
    <h3 class="zlabel">{t('Fits less')} · {choices.less.length}</h3>
    <ul class="alts less">
      {#each choices.less as r (r.item.id)}
        {@render alt(r, false)}
      {/each}
    </ul>
  {/if}

  <footer class="sf">
    <button type="button" class="btn" onclick={takeOff}><Minus size={18} aria-hidden="true" />{t('Leave it off')}</button>
    <a class="btn" href={wardrobeHref} onclick={() => el.close()}><Shirt size={18} aria-hidden="true" />{t('Wardrobe')}</a>
  </footer>
  {#if places.length}
    <!-- the piece is not worn but packed (the jacket in the saddle bag): the old row menu's «Move to» -->
    <label class="mv"><span>{t('Pack it in')}</span><select class="sel" value="" onchange={(e) => e.currentTarget.value && move(e.currentTarget.value)}><option value="">{t('Choose a bag')}</option>{#each places as p (p.key)}<option value={p.key}>{p.name}</option>{/each}</select></label>
  {/if}
  <p class="hint">{t('One tap swaps and closes. Undo is in the message.')}</p>
</dialog>

{#snippet alt(r, best)}
  <li>
    <button type="button" class="alt" aria-label={t('Swap for {name}', { name: nameOf(r.item) })} onclick={() => pick(r.item.id)}>
      <span class="ring" aria-hidden="true"></span>
      <span class="mid">
        <span class="nm">{nameOf(r.item)}{#if best}<i class="pill ok best"><Star size={12} aria-hidden="true" />{t('fits best')}</i>{/if}</span>
        <span class="tl"><TempBar item={r.item} mark={range} width={64} /><small class="num">{range0(r.item)}</small>{#if !r.fit.ok}<small class="why">{whyText(r.fit.why)}</small>{:else if r.mem}<small>{memText(r.mem)}{r.mem.n > 1 ? ` · ${r.mem.n}×` : ''}</small>{/if}</span>
      </span>
      <span class="w num">{g(r.item)}</span>
    </button>
  </li>
{/snippet}

<style>
  .swap-sheet { max-width: 560px; padding: 18px 18px 14px; }
  .sh { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .st { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .kick { color: var(--ink-3); font: 600 var(--fs-label)/1.3 var(--font-body); letter-spacing: 0.06em; text-transform: uppercase; }
  .st h2 { margin: 0; font-size: var(--fs-section); }
  .facts { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--ink-2); font-size: var(--fs-small); }
  .facts span { display: inline-flex; align-items: center; gap: 5px; }
  .facts :global(svg) { color: var(--ink-3); }
  .x { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--paper-2); color: var(--ink); cursor: pointer; }
  .now { padding: 10px 12px; border-radius: 10px; background: var(--paper-2); }
  .now small { color: var(--ink-3); font-size: var(--fs-small); }
  .now p { margin: 2px 0 0; }
  .row0 { display: flex; align-items: baseline; gap: 10px; }
  .row0 .nm { flex: 1; min-width: 0; font-weight: 600; overflow-wrap: break-word; }
  .alts { list-style: none; margin: 0; padding: 0; }
  .alts li { border-top: 1px solid var(--line); }
  .alts li:first-child { border-top: 0; }
  .alt { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 6px 4px; border: 0; border-radius: 8px; background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
  @media (hover: hover) { .alt:hover { background: var(--paper-2); } }
  .ring { flex: none; width: 22px; height: 22px; border: 2px solid var(--line-strong); border-radius: 50%; box-sizing: border-box; }
  .mid { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .nm { font-weight: 500; overflow-wrap: break-word; hyphens: auto; }
  .best { margin-left: 8px; vertical-align: 1px; }
  .tl { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
  .tl small { color: var(--ink-3); font-size: var(--fs-small); }
  .tl .why { color: var(--badge-ink); }
  .w { flex: none; color: var(--ink-2); font-size: var(--fs-small); }
  .less .alt { color: var(--ink-2); }
  .less .nm { font-weight: 400; }
  .empty { margin: 12px 0; color: var(--ink-2); }
  .sf { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
  .sf .btn { justify-content: center; gap: 8px; min-height: 48px; }
  .mv { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-top: 10px; color: var(--ink-2); font-size: var(--fs-small); }
  .mv select { flex: 1 1 10em; min-width: 0; min-height: 44px; }
  .hint { margin: 8px 0 0; text-align: center; color: var(--ink-3); font-size: var(--fs-small); }
  @media (max-width: 719px) {
    /* a sheet from the bottom on a phone, thumb height */
    .swap-sheet { margin: auto 0 0; width: 100vw; max-width: 100vw; max-height: 88dvh; border-radius: 16px 16px 0 0; border-bottom: 0; box-sizing: border-box; }
  }
</style>

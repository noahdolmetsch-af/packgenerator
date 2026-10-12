<script>
  /**
   * v0.59.0 «Tauschen» (OP2a, Noah a): the sheet a tap on a worn piece opens. The alternatives of the
   * same zone and layer from the wardrobe: first those that fit the trip's weather (the best one with
   * a star), then the ones picked before, «Fits less» quieter below but still one tap (a suggestion is
   * never forced). One tap swaps and closes; the message has Undo. «Take off» leaves the piece out.
   */
  import { X, Shirt, ArrowLeftRight } from '@lucide/svelte';
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
  // v0.105.0 P5 (T7): «Oberkörper · Basis · Tourwetter 6–18°, trocken» and where the piece is now
  const wxLine = $derived(rangeText ? t('trip weather {range}, {rain}', { range: rangeText, rain: rain === 'wet' ? t('rain') : t('dry') }) : '');
  const placeOf = $derived.by(() => {
    const slot = trip.entries?.find((e) => e.itemId === item.id)?.slot;
    return !slot || slot === 'body' ? t('On me') : places.find((p) => p.key === slot)?.name ?? '';
  });
  let moving = $state(false);
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
  <!-- v0.106.0 Design-Refresh P5 (T7, approved 12.10.2026): «{piece} tauschen», the zone and the trip
       weather in one line, «Jetzt auf der Liste», «Aus deinem Kleiderschrank» with «Tauschen» per row,
       a hint box and the quiet actions at the bottom right. -->
  <header class="sh">
    <span class="st">
      <h2 id="swap-h">{t('Swap {name}', { name: nameOf(item) })}</h2>
      <span class="facts num">{[kicker, wxLine].filter(Boolean).join(' · ')}</span>
    </span>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => el.close()}><X size={20} aria-hidden="true" /></button>
  </header>

  <h3 class="zh">{t('On the list now|swap')}</h3>
  <div class="card now">
    <span class="ic" aria-hidden="true"><Shirt size={18} /></span>
    <span class="mid"><span class="nm">{nameOf(item)}</span><small class="num">{[range0(item) ? t('fits {range}', { range: range0(item) }) : '', !now.ok ? whyText(now.why) : '', placeOf].filter(Boolean).join(' · ')}</small></span>
    <span class="w num">{g(item)}</span>
  </div>

  <h3 class="zh">{t('From your wardrobe')}</h3>
  <p class="zsub">{t('same zone and layer · sorted by fit')}</p>
  {#if !choices.fits.length && !choices.less.length}
    <p class="card empty">{t('No other piece of this zone and layer in your wardrobe yet.')}</p>
  {:else}
    <div class="card list">
      {#if choices.fits.length}
        <ul class="alts">
          {#each choices.fits as r, n (r.item.id)}
            {@render alt(r, n === 0 && choices.fits.length > 1, n === 0)}
          {/each}
        </ul>
      {/if}
      {#if choices.less.length}
        <p class="lessh">{t('Fits less')} · {choices.less.length}</p>
        <ul class="alts less">
          {#each choices.less as r (r.item.id)}
            {@render alt(r, false, false)}
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  <p class="hint"><ArrowLeftRight size={16} aria-hidden="true" /><span>{t('One tap swaps and closes. Undo is in the message.')}</span></p>
  {#if moving && places.length}
    <!-- the piece is not worn but packed (the jacket in the saddle bag): the old row menu's «Move to» -->
    <label class="mv"><span>{t('Pack it in')}</span><select class="sel" value="" onchange={(e) => e.currentTarget.value && move(e.currentTarget.value)}><option value="">{t('Choose a bag')}</option>{#each places as p (p.key)}<option value={p.key}>{p.name}</option>{/each}</select></label>
  {/if}
  <footer class="sf">
    <a class="btn btn-link" href={wardrobeHref} onclick={() => el.close()}>{t('Wardrobe')}</a>
    {#if places.length}<button type="button" class="btn" aria-expanded={moving} onclick={() => (moving = !moving)}>{t('Choose another bag')}</button>{/if}
    <button type="button" class="btn" onclick={takeOff}>{t('Leave it off')}</button>
  </footer>
</dialog>

{#snippet alt(r, best, first)}
  <li>
    <button type="button" class="alt" aria-label={t('Swap for {name}', { name: nameOf(r.item) })} onclick={() => pick(r.item.id)}>
      <span class="ic" aria-hidden="true"><Shirt size={18} /></span>
      <span class="mid">
        <span class="nm">{nameOf(r.item)}{#if best}<i class="pill ok best">{t('fits best')}</i>{:else if !r.fit.ok}<i class="pill warn best">{t('fits less')}</i>{/if}</span>
        <small class="num">{[range0(r.item) ? t('fits {range}', { range: range0(r.item) }) : '', !r.fit.ok ? whyText(r.fit.why) : r.mem ? `${memText(r.mem)}${r.mem.n > 1 ? ` · ${r.mem.n}×` : ''}` : ''].filter(Boolean).join(' · ')}</small>
      </span>
      <span class="w num">{g(r.item)}</span>
      <span class="go" class:first aria-hidden="true">{t('Swap')}</span>
    </button>
  </li>
{/snippet}

<style>
  .swap-sheet { max-width: 640px; padding: 20px 20px 16px; }
  .sh { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
  .st { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .st h2 { margin: 0; font: 600 var(--fs-section) / 1.25 var(--font-body); overflow-wrap: break-word; }
  .facts { color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  .x { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: var(--r-ctl); background: var(--paper-2); color: var(--ink); cursor: pointer; }
  .zh { margin: 16px 0 8px; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .zsub { margin: -6px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
  .now { display: flex; align-items: center; gap: 12px; padding-top: 12px; padding-bottom: 12px; }
  .list { padding-top: 4px; padding-bottom: 4px; }
  .ic { display: grid; flex: none; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: var(--paper-2); color: var(--ink-2); }
  .mid { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .mid small { color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  .nm { font-weight: 500; overflow-wrap: break-word; }
  .best { margin-left: 8px; vertical-align: 1px; font-style: normal; }
  .w { flex: none; color: var(--ink); font-size: var(--fs-body); }
  .alts { list-style: none; margin: 0; padding: 0; }
  .alts li + li { border-top: 1px solid var(--line); }
  .alt { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 60px; padding: 8px 0; border: 0; background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
  .go { flex: none; display: inline-flex; align-items: center; min-height: 36px; padding: 0 12px; border: 1px solid var(--line-strong); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font-weight: 500; font-size: var(--fs-small); }
  .go.first { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); font-weight: 600; }
  @media (hover: hover) { .alt:hover .go:not(.first) { background: var(--paper-2); } }
  .lessh { margin: 0; padding: 8px 0 4px; border-top: 1px solid var(--line); color: var(--ink-2); font-size: var(--fs-small); font-weight: 600; }
  .alts:first-child + .lessh, .lessh:first-child { border-top: 0; }
  .empty { margin: 0; color: var(--ink-2); }
  .hint { display: flex; align-items: flex-start; gap: 10px; margin: 12px 0 0; padding: 10px 12px; border-radius: var(--r-ctl); background: var(--paper-2); color: var(--ink-2); font-size: var(--fs-small); }
  .hint :global(svg) { flex: none; margin-top: 2px; }
  .mv { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-top: 10px; color: var(--ink-2); font-size: var(--fs-small); }
  .mv select { flex: 1 1 10em; min-width: 0; min-height: 44px; }
  .sf { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 14px; }
  .sf .btn-link { margin-right: auto; }
  @media (max-width: 719px) {
    /* a sheet from the bottom on a phone, thumb height */
    .swap-sheet { margin: auto 0 0; width: 100vw; max-width: 100vw; max-height: 88dvh; border-radius: 16px 16px 0 0; border-bottom: 0; box-sizing: border-box; padding: 16px; }
  }
  @media (max-width: 389px) { .go { display: none; } }
</style>

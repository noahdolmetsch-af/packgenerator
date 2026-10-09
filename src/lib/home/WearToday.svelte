<script>
  /**
   * v0.45.0 "Kleiderschrank 2" (Noah, decision 9): "What do I wear today?" on Today, for a day ride
   * at the home place. The coldest riding hour of the home forecast (felt, with the learned offset),
   * then one owned piece per row the onion needs (the legs always). One button: the wardrobe.
   * No sorted owned clothing: no card. No home place or no forecast: one short hint with the place
   * search. Rules: home/outfit.js (todayOutfit) and wardrobe.js (outfitFor).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { HOME_PLACE, HOME_FORECAST } from '../know.js';
  import { CLOTHING_OFFSET } from '../wardrobe.js';
  import { todayOutfit } from './outfit.js';
  import HomePlaceForm from '../know/HomePlaceForm.svelte';
  import { t, nameOf } from '../i18n.svelte.js';
  import { Shirt } from '@lucide/svelte';

  let { items = [], trips = [] } = $props();

  const placeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const fcQ = liveQuery(async () => (await db.meta.get(HOME_FORECAST)) ?? null);
  const offsetQ = liveQuery(async () => (await db.settings.get(CLOTHING_OFFSET)) ?? null);

  const ready = $derived($placeQ !== undefined && $fcQ !== undefined && $offsetQ !== undefined);
  const o = $derived(ready ? todayOutfit({ place: $placeQ, forecast: $fcQ, items, trips, offset: Number($offsetQ?.value) || 0 }) : { state: 'none' });
  const hh = (h) => `${String(h).padStart(2, '0')}`;
  const meta = $derived.by(() => {
    if (o.state !== 'ok') return '';
    const { win, outfit, place } = o;
    const parts = [place.name.split(',')[0], t('{a}–{b} h', { a: hh(win.start), b: hh(win.start + win.hours) }), outfit.from === 'hour' ? t('coldest {c} °C', { c: outfit.real }) : t('lowest {c} °C', { c: outfit.real })];
    if (outfit.c !== outfit.real) parts.push(t('feels {c} °C', { c: outfit.c }));
    if (outfit.wet && outfit.pct != null) parts.push(t('rain {n} %', { n: outfit.pct }));
    return parts.join(' · ');
  });
  let editPlace = $state(false);
</script>

{#if o.state !== 'none'}
  <section class="wear" aria-labelledby="wear-h" data-wear-card>
    <h2 id="wear-h" class="lbl"><Shirt size={16} aria-hidden="true" />{o.win?.tomorrow ? t('What do I wear tomorrow?') : t('What do I wear today?')}</h2>
    {#if o.state === 'ok'}
      <p class="meta num">{meta}</p>
      <ul>
        {#each o.outfit.rows as r (r.key)}
          <li><span class="k">{t(r.name)}</span>{#if r.item}<span class="v">{nameOf(r.item)}</span>{:else}<span class="v gap">{r.rain ? t('nothing waterproof') : t('nothing warm enough')}</span>{/if}</li>
        {/each}
      </ul>
      <a class="btn sm go" href="#/wardrobe">{t('Open the wardrobe')}</a>
    {:else}
      <p class="hint">{o.state === 'noplace' ? t('Set your home place: then Today says what to wear for a ride.') : t('No forecast for {place} right now. It loads when you are online.', { place: o.place.name.split(',')[0] })}</p>
      <button type="button" class="btn sm go" aria-expanded={editPlace} onclick={() => (editPlace = !editPlace)}>{o.state === 'noplace' ? t('Set home place') : t('Change place')}</button>
      {#if editPlace}<div class="pf"><HomePlaceForm onchosen={() => (editPlace = false)} /></div>{/if}
    {/if}
  </section>
{/if}

<style>
  .lbl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-3);
  }
  .meta,
  .hint {
    margin: 8px 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: minmax(6.5em, auto) minmax(0, 1fr);
    gap: 4px 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .k {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .v {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .gap {
    color: var(--ink-3);
    font-style: italic;
  }
  .go {
    margin-top: 10px;
    min-height: 44px;
  }
  .pf {
    margin-top: 8px;
  }
</style>

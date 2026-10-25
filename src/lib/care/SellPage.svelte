<script>
  /**
   * Paket VG 1130 «Verkaufsinserat» (Noah 20.10.2026 «3a»): Bikes › Care › «Sale listing»
   * (#/bikes?tab=care&view=sell&bike=<id>). A text from the bike's km, services, parts and photos; the price
   * and own words are the person's fields (griff.sell, per bike). «Copy» or «Share» (the phone's share sheet,
   * with the photos when the phone can). No price service, nothing leaves the device unless shared.
   */
  import { liveQuery } from 'dexie';
  import { Copy, Share2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num, dateOf } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { withVisits } from '../workshop.js';
  import { bikePhotos } from '../photo.js';
  import { KIND_NAME, kindOf } from '../bikekind.js';
  import { wearRows } from '../wear.js';
  import { partName } from '../care.js';
  import { saleText, SELL_KEY } from '../griff.js';
  import { changeSetting } from '../griffdb.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import GriffHead from './GriffHead.svelte';
  import './griff.css';
  import Handover from '../werkstatt/Handover.svelte'; // Paket B part 3: handover after the sale

  let { bikeId = null } = $props();
  const today = localDay();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());
  const sellQ = liveQuery(() => db.settings.get(SELL_KEY));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const view = $derived(bike ? withVisits(bike, $visitsQ ?? []) : null);
  const own = $derived(bike ? ($sellQ?.value?.[bike.id] ?? {}) : {});
  const shots = $derived(bike ? bikePhotos(bike, $photosQ ?? []) : []);
  const rows = $derived(view ? wearRows(view, { today }) : []);
  const text = $derived(
    view
      ? saleText(
          { ...view, parts: (view.parts ?? []).map((p) => ({ ...p, name: partName(p) })) },
          { rows, visits: $visitsQ ?? [], price: own.price ?? '', extra: own.extra ?? '', kindName: t(KIND_NAME[kindOf(bike)] ?? ''), photos: shots.length, T: t, num, dateOf },
        )
      : '',
  );
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  let msg = $state('');

  const save = (patch) => changeSetting(SELL_KEY, {}, (all) => ({ ...(all ?? {}), [bike.id]: { ...((all ?? {})[bike.id] ?? {}), ...patch } }));
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      offerDone(t('Listing copied.'));
    } catch {
      msg = t('Copying did not work. Select the text and copy it by hand.');
    }
  }
  async function share() {
    msg = '';
    try {
      const files = await Promise.all(shots.slice(0, 4).map(async (p, i) => new File([await (await fetch(p.src)).blob()], `${bike.name}-${i + 1}.jpg`, { type: 'image/jpeg' }))).catch(() => []);
      const data = { title: bike.name, text };
      if (files.length && navigator.canShare?.({ files })) data.files = files;
      await navigator.share(data);
    } catch (err) {
      if (err?.name !== 'AbortError') msg = t('Sharing did not work. Copy the text instead.');
    }
  }
</script>

<div class="gp">
  <GriffHead {bikes} {bike} view="sell" title={t('Sale listing')} sub={t('A text from km, services, parts and photos, ready to copy or share')} />
  {#if !bike}
    <p class="quiet">{t('No bike yet. Add a bike under Bikes first.')}</p>
  {:else}
    <section class="gcard" aria-labelledby="sl-own">
      <h2 id="sl-own">{t('Your part')}</h2>
      <p class="quiet">{t('The app does not suggest a price. Type your own, and anything a buyer should know.')}</p>
      <div class="row">
        <label class="grow"><span class="quiet">{t('Price CHF')}</span><br /><input class="inp" type="text" inputmode="decimal" maxlength="12" value={own.price ?? ''} onchange={(e) => save({ price: e.currentTarget.value.trim() })} data-sell-price /></label>
      </div>
      <label><span class="quiet">{t('Your own words')}</span><textarea class="inp" rows="3" maxlength="1000" value={own.extra ?? ''} onchange={(e) => save({ extra: e.currentTarget.value })} data-sell-extra></textarea></label>
    </section>
    <section class="gcard" aria-labelledby="sl-text">
      <h2 id="sl-text">{t('The listing')}</h2>
      <pre class="txt" data-sell-text>{text}</pre>
      {#if shots.length}
        <div class="shots">{#each shots.slice(0, 4) as p (p.id)}<img src={p.src} alt={p.name} />{/each}</div>
      {:else}
        <p class="quiet">{t('No photo of the bike yet: add one under Bikes › Setup.')}</p>
      {/if}
      <div class="row">
        <button type="button" class="btn hi" onclick={copy} data-sell-copy><Copy size={16} aria-hidden="true" />{t('Copy')}</button>
        {#if canShare}<button type="button" class="btn" onclick={share} data-sell-share><Share2 size={16} aria-hidden="true" />{t('Share')}</button>{/if}
      </div>
      {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    </section>
    <Handover bikeId={bike.id} rec={own.handover ?? null} />
  {/if}
</div>

<style>
  .txt {
    margin: 0 0 10px;
    padding: 12px;
    border-radius: 10px;
    background: var(--paper-2);
    font: inherit;
    font-size: var(--fs-small);
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  .shots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 6px;
  }
  .shots img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 8px;
  }
  textarea.inp {
    width: 100%;
    margin-top: 4px;
  }
</style>

<script>
  /**
   * v0.47.0 «Aufpimpen» (design release D1, Noah 8 a+b): the focal point of a bike trip. The bike
   * drawing with the bags of this trip and what each weighs (packed contents), or the setup photo
   * when the bike has one (a toggle). Read-only: a tap on a bag opens it in the packing list (onbag).
   * v0.102.0 Design-Refresh P4 «Touren» (T3 «Velo und Taschen», approved 12.10.2026): a heading with the
   * bike and its bags and «Taschen ändern» (onbags); the weight moved into its own light card
   * (WeightCard), so the dark weight card and the three numbers under the drawing are gone.
   * Taschen-Setups TS5 (14.10.2026): with trips, the chip «Setup: …» to change the trip's setup.
   */
  import SetupDrawing from '../bikes/SetupDrawing.svelte';
  import Seg from '../ui/Seg.svelte';
  import { SLOTS, onBikeSlot } from '../bikes.js';
  import { bagWords } from '../bikes/bagwords.js';
  import { t, tn, locale, bagName } from '../i18n.svelte.js';
  import { UserRound, ChevronRight } from '@lucide/svelte';
  import SetupPick from './SetupPick.svelte';

  let { trip, stats, bike, photo = null, onbag = null, onphoto = null, onbags = null, trips = null, items = [], readonly = false } = $props();

  const kgN = (g) => (g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const zoneOf = (key) => stats.zones.find((z) => z.key === key) ?? null;
  const places = $derived(
    SLOTS.filter((s) => !s.worn && trip.setup?.[s.key]).map((s) => {
      const z = zoneOf(s.key);
      return { key: s.key, name: t(s.name), box: s.box, on: true, bag: z?.bag ? { name: bagName(z.bag.name), sub: `${tn(z.entries.length, '{n} item', '{n} items')} · ${kgN(z.grams)} kg` } : null };
    }),
  );
  const onMeN = $derived(stats.zones.filter((z) => z.key === 'body' || z.worn).reduce((s, z) => s + z.entries.length, 0));
  let view = $state('drawing');
</script>

{#if places.length}
  <section class="tbike" aria-labelledby="tb-h">
    <div class="hd">
      <div>
        <h2 id="tb-h">{t('Bike and bags')}</h2>
        <p class="sub">{[bike?.name ?? '', bagWords(places.length, places.filter((p) => onBikeSlot(p.key)).length), t('a tap opens the bag')].filter(Boolean).join(' · ')}</p>
      </div>
      {#if onbags}<button type="button" class="btn btn-link lk" onclick={onbags}>{t('Change bags')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
    </div>
    {#if trips && bike}<SetupPick {trip} {bike} {trips} {items} {readonly} {onbags} />{/if}
    <div class="card draw">
      {#if photo}
        <div class="dh"><Seg small full={false} label={t('Drawing or photo')} value={view} options={[{ key: 'drawing', name: t('Drawing') }, { key: 'photo', name: t('Setup photo') }]} onchange={(k) => (view = k)} /></div>
      {/if}
      {#if view === 'photo' && photo}
        <button type="button" class="ph" onclick={() => onphoto?.()} aria-label={t('Open photo')}><img src={photo} alt={t('Setup photo of {bike}', { bike: bike?.name ?? '' })} /></button>
      {:else}
        <SetupDrawing {places} quietSpots tapText={(p) => t('{bag}: {sub}, show in the list', { bag: p.bag.name, sub: p.bag.sub })} label={t('{bike} with its bags', { bike: bike?.name ?? '' })} onpick={(k) => onbag?.(k)} />
      {/if}
      {#if stats.onMeG}
        <p class="onme num"><UserRound size={16} aria-hidden="true" /><span>{t('On me')}: {tn(onMeN, '{n} item', '{n} items')} · {kgN(stats.onMeG)} kg</span></p>
      {/if}
    </div>
  </section>
{/if}

<style>
  .tbike {
    min-width: 0;
  }
  .hd {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 0 8px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lk {
    flex: none;
    gap: 2px;
    padding-inline: 4px;
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .draw {
    min-width: 0;
  }
  .dh {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  .ph {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
  }
  .ph img {
    display: block;
    width: 100%;
    max-height: 420px;
    object-fit: cover;
    border-radius: var(--r-ctl);
  }
  .onme {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 0;
    padding: 8px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>

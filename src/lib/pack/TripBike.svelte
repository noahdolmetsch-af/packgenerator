<script>
  /**
   * v0.47.0 «Aufpimpen» (design release D1, Noah 8 a+b): the focal point of a bike trip. The bike
   * drawing with the bags of this trip and what each weighs (packed contents), or the setup photo
   * when the bike has one (a toggle). Next to it, on a computer, the weight as one dark card: base
   * on the bike, on me, food and water, total. On a phone the three numbers sit under the drawing.
   * Read-only: a tap on a bag opens it in the packing list (onbag).
   */
  import SetupDrawing from '../bikes/SetupDrawing.svelte';
  import Seg from '../ui/Seg.svelte';
  import { SLOTS } from '../bikes.js';
  import { t, tn, locale, bagName } from '../i18n.svelte.js';
  import { UserRound } from '@lucide/svelte';

  let { trip, stats, bike, photo = null, onbag = null, onphoto = null } = $props();

  const kgN = (g) => (g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const zoneOf = (key) => stats.zones.find((z) => z.key === key) ?? null;
  const places = $derived(
    SLOTS.filter((s) => !s.worn && trip.setup?.[s.key]).map((s) => {
      const z = zoneOf(s.key);
      return { key: s.key, name: t(s.name), box: s.box, on: true, bag: z?.bag ? { name: bagName(z.bag.name), sub: `${kgN(z.grams)} kg` } : null };
    }),
  );
  const total = $derived(stats.baseG + stats.wornG + stats.consumablesG);
  const parts = $derived([
    { key: 'base', name: t('Base on the bike'), g: stats.baseG, c: 'var(--hi)' },
    { key: 'worn', name: t('On me'), g: stats.wornG, c: 'var(--l3)' },
    { key: 'food', name: t('Food & water'), g: stats.consumablesG, c: 'var(--line-strong)' },
  ]);
  let view = $state('drawing');
</script>

{#if places.length}
  <section class="tbike" aria-label={t('{bike} with its bags', { bike: bike?.name ?? '' })}>
    <div class="surf draw">
      <div class="dh">
        <p class="bk"><span class="dot" aria-hidden="true"></span><b>{bike?.name ?? ''}</b> <span>{tn(places.length, '{n} bag', '{n} bags')}</span></p>
        {#if photo}
          <Seg small full={false} label={t('Drawing or photo')} value={view} options={[{ key: 'drawing', name: t('Drawing') }, { key: 'photo', name: t('Setup photo') }]} onchange={(k) => (view = k)} />
        {/if}
      </div>
      {#if view === 'photo' && photo}
        <button type="button" class="ph" onclick={() => onphoto?.()} aria-label={t('Open photo')}><img src={photo} alt={t('Setup photo of {bike}', { bike: bike?.name ?? '' })} /></button>
      {:else}
        <SetupDrawing {places} tapText={(p) => t('{bag}: {sub}, show in the list', { bag: p.bag.name, sub: p.bag.sub })} label={t('{bike} with its bags', { bike: bike?.name ?? '' })} onpick={(k) => onbag?.(k)} />
      {/if}
      {#if stats.onMeG}
        <p class="onme num"><UserRound size={16} aria-hidden="true" /><b>{t('On me')}</b> {kgN(stats.onMeG)} kg</p>
      {/if}
      <!-- the phone: the three numbers under the drawing (the dark card is for wide screens) -->
      <dl class="nums">
        {#each parts as p (p.key)}<div><dt>{p.name}</dt><dd class="num"><b class="bn">{kgN(p.g)}</b> kg</dd></div>{/each}
      </dl>
    </div>
    <div class="wcard">
      <p class="wl">{t('Weight')}</p>
      <p class="wbig num"><span class="bn">{kgN(stats.baseG)}</span> kg</p>
      <p class="wsub">{t('Base on the bike, without food and water')}</p>
      {#if total > 0}
        <div class="wbar" aria-hidden="true">{#each parts as p (p.key)}{#if p.g}<i style="flex: {p.g}; background: {p.c}"></i>{/if}{/each}</div>
      {/if}
      <dl class="wrows">
        {#each parts as p (p.key)}<div><dt><i style="background: {p.c}" aria-hidden="true"></i>{p.name}</dt><dd class="num">{kgN(p.g)} kg</dd></div>{/each}
        <div class="tot"><dt>{t('Total')}</dt><dd class="num">{kgN(total)} kg</dd></div>
      </dl>
      {#if stats.unweighed}<p class="miss">{tn(stats.unweighed, '{n} item not weighed', '{n} items not weighed')}</p>{/if}
    </div>
  </section>
{/if}

<style>
  .tbike {
    display: grid;
    gap: 16px;
    margin: 0 0 16px;
  }
  @media (min-width: 960px) {
    .tbike {
      grid-template-columns: minmax(0, 1fr) 320px;
    }
  }
  .draw {
    padding: 16px 20px;
    min-width: 0;
  }
  .dh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    margin-bottom: 8px;
  }
  .bk {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--ink-3);
    font-size: 14px;
  }
  .bk b {
    color: var(--ink);
    font-weight: 500;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--accent);
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
    border-radius: 12px;
  }
  .onme {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 10px 0 0;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: 14px;
  }
  .onme b {
    color: var(--ink);
    font-weight: 500;
  }
  .nums {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 12px 0 0;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .nums div {
    min-width: 0;
  }
  .nums dt {
    order: 2;
    color: var(--ink-3);
    font-size: 13px;
    line-height: 1.25;
  }
  .nums dd {
    margin: 0;
    color: var(--ink-2);
  }
  .nums div {
    display: flex;
    flex-direction: column-reverse;
  }
  .bn {
    font: 800 26px/1 var(--font-brand);
    color: var(--ink);
  }
  .wcard {
    display: none;
  }
  @media (min-width: 960px) {
    .nums {
      display: none;
    }
    .wcard {
      display: flex;
      flex-direction: column;
      padding: 20px 22px;
      border-radius: var(--radius-card);
      background: var(--brand);
      color: var(--brand-ink);
    }
  }
  .wl {
    margin: 0;
    color: var(--brand-ink-2);
    font: 600 12px/1.3 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .wbig {
    margin: 8px 0 0;
    font-size: 22px;
  }
  .wbig .bn {
    font-size: 64px;
    color: var(--brand-ink);
  }
  .wsub {
    margin: 2px 0 14px;
    color: var(--brand-ink-2);
    font-size: 14px;
  }
  .wbar {
    display: flex;
    gap: 3px;
    height: 10px;
    margin-bottom: 12px;
    border-radius: 5px;
    overflow: hidden;
  }
  .wrows {
    margin: 0;
  }
  .wrows div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 0;
    border-top: 1px solid color-mix(in srgb, var(--brand-ink) 14%, transparent);
  }
  .wrows dt {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wrows dt i {
    width: 9px;
    height: 9px;
    border-radius: 2px;
  }
  .wrows dd {
    margin: 0;
  }
  .wrows .tot dt {
    padding-left: 17px;
  }
  .miss {
    margin: auto 0 0;
    padding-top: 10px;
    color: var(--brand-ink-2);
    font-size: 13px;
  }
</style>

<script>
  /**
   * «Anprobe» (Noah 21.11.2026 «1-5a 4b», Weg A): #/wardrobe/tryon. Pick a temperature (today's ride, the next
   * tour or your own) and see the onion the wardrobe builds for it: one piece per place, a gap where nothing
   * fits, arrows to swap a piece for the next one of that place, the weight at the end. Nothing is saved until
   * «Pack it for the tour» (one Undo). Rules: src/lib/wardrobe-tryon.js; the pieces come from the same rules
   * as «What do I wear today?» (home/wearday.js) and the packing list (wardrobe.js).
   */
  import { liveQuery } from 'dexie';
  import { Shirt, ChevronLeft, ChevronRight, Minus, Plus, Undo2, Check } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { UNDO_MS } from '../lib/ui/undo.js';
  import { HOME_PLACE, HOME_FORECAST } from '../lib/know.js';
  import { CLOTHING_OFFSET, WEAR_RULE, wearRule, coldest, isWet, isClothing, layerKey, zoneGroup, tempRange, ZONES, LAYERS } from '../lib/wardrobe.js';
  import { todayOutfit } from '../lib/home/outfit.js';
  import { nextTrip } from '../lib/debrief.js';
  import { touched } from '../lib/trips.js';
  import { isInventory, formatWeight, itemWeight } from '../lib/gear.js';
  import { TRY_MIN, TRY_MAX, clampTemp, tryOn, stepPick, packEntries } from '../lib/wardrobe-tryon.js';

  const itemsQ = liveQuery(() => db.items.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const placeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const fcQ = liveQuery(async () => (await db.meta.get(HOME_FORECAST)) ?? null);
  const offsetQ = liveQuery(async () => (await db.settings.get(CLOTHING_OFFSET)) ?? null);
  const ruleQ = liveQuery(async () => (await db.settings.get(WEAR_RULE)) ?? null);

  const items = $derived($itemsQ ?? []);
  const trips = $derived($tripsQ ?? []);
  const loaded = $derived($itemsQ !== undefined && $tripsQ !== undefined && $placeQ !== undefined && $fcQ !== undefined && $offsetQ !== undefined && $ruleQ !== undefined);
  const rule = $derived(wearRule($ruleQ?.value));
  const offset = $derived((Number($offsetQ?.value) || 0) + rule.shift);
  const sorted = $derived(items.some((i) => isInventory(i) && isClothing(i) && (layerKey(i.layer) || zoneGroup(i.zone))));

  // where the temperature comes from: today's ride at the home place, the next tour, or your own
  const today = $derived(loaded ? todayOutfit({ place: $placeQ, forecast: $fcQ, items, trips, offset: Number($offsetQ?.value) || 0, rule }) : { state: 'none' });
  const trip = $derived(nextTrip(trips));
  const cold = $derived(trip ? coldest(trip) : null);
  const starts = $derived([
    ...(today.state === 'ok' ? [{ key: 'today', c: today.outfit.real, wet: today.outfit.wet, label: t('Today {c}°', { c: today.outfit.real }) }] : []),
    ...(trip && cold ? [{ key: 'trip', c: cold.c, wet: isWet(trip), label: `${trip.title} ${cold.c}°` }] : []),
  ]);

  let source = $state(null); // 'today' | 'trip' | 'own'; null: the first start (the tour, else today, else your own)
  let own = $state(8);
  let ownWet = $state(false);
  let picks = $state({});
  const start = $derived(starts.find((s) => s.key === source) ?? (source === 'own' ? null : starts.find((s) => s.key === 'trip') ?? starts[0] ?? null));
  const real = $derived(start ? start.c : own);
  const wet = $derived(start ? start.wet : ownWet);
  const fit = $derived(loaded && sorted ? tryOn(items, real, { wet, offset, rule, picks }) : null);

  function pickSource(key) {
    source = key;
    picks = {};
  }
  function setTemp(c) {
    const n = clampTemp(c);
    if (n == null) return;
    const w = wet;
    source = 'own';
    own = n;
    ownWet = w;
    picks = {};
  }
  function setWet(w) {
    if (!start) return (ownWet = w);
    const c = real;
    source = 'own';
    own = c;
    ownWet = w;
    picks = {};
  }
  function swap(row, dir) {
    const id = stepPick(row, dir);
    if (id) picks = { ...picks, [row.key]: id };
  }

  const tr = (s, v) => t(s, v);
  const rangeOf = (i) => tempRange(i.tempMin, i.tempMax, tr);
  const weightOf = (i) => (itemWeight(i) == null ? '' : formatWeight(itemWeight(i)));
  const rowName = (r) => t(r.name);
  const FITS = { ok: 'Fits', warm: 'Warmer than needed', light: 'Too light for this' };
  const reason = (row) => {
    const g = row.gap;
    if (!g) return '';
    if (g.kind === 'rain') return t('Nothing waterproof is sorted as outer layer.');
    if (g.kind === 'light') return g.from != null ? t('Your pieces here are made for {n} °C and warmer, not for {c} °C.', { n: g.from, c: fit.c }) : t('Your pieces here are too light for {c} °C.', { c: fit.c });
    if (g.kind === 'unsorted') return tn(g.unsorted, '{n} piece for this still waits in «To sort». Once sorted, it counts.', '{n} pieces for this still wait in «To sort». Once sorted, they count.');
    return t('Nothing in the wardrobe for this yet.');
  };
  const place = (i) => [ZONES.find((z) => z.key === zoneGroup(i.zone))?.name, LAYERS.find((l) => l.key === layerKey(i.layer))?.name].filter(Boolean).map((s) => t(s)).join(' · ');

  // «Pack it for the tour»: the pieces shown go on the list of the next tour, worn; one Undo
  let last = $state.raw(null); // { text, tripId, before }
  let timer;
  const toPack = $derived(trip && fit ? packEntries(trip, fit.rows) : null);
  async function pack() {
    if (!trip || !toPack?.ids.length) return;
    const before = trip.entries ?? [];
    await db.trips.update(trip.id, touched({ entries: toPack.entries }));
    clearTimeout(timer);
    last = { text: tn(toPack.ids.length, '{n} piece is on the list of {trip}', '{n} pieces are on the list of {trip}', { trip: trip.title }), tripId: trip.id, before };
    timer = setTimeout(() => (last = null), UNDO_MS);
  }
  async function undo() {
    if (!last) return;
    const { tripId, before } = last;
    clearTimeout(timer);
    last = null;
    await db.trips.update(tripId, touched({ entries: before }));
  }
</script>

<div class="wtry">
  <header>
    <Crumbs crumbs={[{ label: t('Gear|place'), href: '#/gear' }, { label: t('Wardrobe'), href: '#/wardrobe' }]} here={t('Try on')} />
    <h1 class="title">{t('Try on')}</h1>
    <p class="page-sub">{t('Pick a temperature and see which pieces the onion takes. Swap with the arrows; nothing is saved until you pack it.')}</p>
  </header>

  {#if !loaded}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if !sorted}
    <Empty icon={Shirt} title={t('No clothing sorted yet')} text={t('Give your clothes a temperature, layer and body zone first, then try them on here.')} action={{ label: t('Set up wardrobe'), href: '#/wardrobe/setup' }} />
  {:else if fit}
    <section class="ctl" aria-label={t('Temperature')}>
      <div class="chips" role="group" aria-label={t('Start from')}>
        {#each starts as s (s.key)}
          <button type="button" class="chip" class:on={start?.key === s.key} aria-pressed={start?.key === s.key} onclick={() => pickSource(s.key)} data-try-start={s.key}>{s.label}</button>
        {/each}
        <button type="button" class="chip" class:on={!start} aria-pressed={!start} onclick={() => pickSource('own')} data-try-start="own">{t('Your own')}</button>
      </div>
      <div class="temp">
        <button type="button" class="step" aria-label={t('One degree colder')} onclick={() => setTemp(real - 1)} data-try-down><Minus size={20} aria-hidden="true" /></button>
        <b class="deg num" data-try-temp aria-live="polite">{real} °C</b>
        <button type="button" class="step" aria-label={t('One degree warmer')} onclick={() => setTemp(real + 1)} data-try-up><Plus size={20} aria-hidden="true" /></button>
      </div>
      <input class="slide" type="range" min={TRY_MIN} max={TRY_MAX} step="1" value={real} aria-label={t('Temperature')} oninput={(e) => setTemp(e.currentTarget.value)} />
      <label class="rain"><input type="checkbox" checked={wet} onchange={(e) => setWet(e.currentTarget.checked)} data-try-rain /><span>{t('Rain on the way')}</span></label>
    </section>

    <section class="rows" aria-label={t('Pieces')}>
      <ul>
        {#each fit.rows as r (r.key)}
          <li data-try-row={r.key} class:gap={!r.item}>
            <b class="nm">{rowName(r)}</b>
            <div class="mid">
              {#if r.item}
                <span class="piece" data-try-piece>{nameOf(r.item)}</span>
                <small class="num">{[rangeOf(r.item), weightOf(r.item)].filter(Boolean).join(' · ')}</small>
                {#if r.fit !== 'ok'}<small class="warn" data-try-fit={r.fit}>{t(FITS[r.fit])}</small>{/if}
              {:else}
                <span class="gaptx" data-try-gap={r.gap?.kind}>{t('Gap')}: {reason(r)}</span>
              {/if}
            </div>
            <span class="arrows">
              <button type="button" class="arr" aria-label={t('Previous piece for {row}', { row: rowName(r) })} disabled={!stepPick(r, -1)} onclick={() => swap(r, -1)} data-try-prev={r.key}><ChevronLeft size={20} aria-hidden="true" /></button>
              <button type="button" class="arr" aria-label={t('Next piece for {row}', { row: rowName(r) })} disabled={!stepPick(r, 1)} onclick={() => swap(r, 1)} data-try-next={r.key}><ChevronRight size={20} aria-hidden="true" /></button>
            </span>
          </li>
        {/each}
      </ul>
    </section>

    <section class="sum" aria-label={t('In short')}>
      <p class="line"><b class="num" data-try-felt>{fit.c !== fit.real ? t('Feels like {c} °C', { c: fit.c }) : `${fit.c} °C`}</b></p>
      <p class="note num" data-try-sum>{[tn(fit.count, '{n} piece', '{n} pieces'), fit.weightG ? formatWeight(fit.weightG) : '', fit.gaps ? tn(fit.gaps, '{n} gap', '{n} gaps') : ''].filter(Boolean).join(' · ')}</p>
    </section>

    <div class="acts">
      {#if trip}
        <button type="button" class="btn hi" disabled={!toPack?.ids.length} onclick={pack} data-try-pack>{toPack?.ids.length ? t('Pack it for {trip}', { trip: trip.title }) : t('All of it is on the list of {trip}', { trip: trip.title })}</button>
      {/if}
    </div>
    <p class="next note">{t('Next: the packing list shows the gaps that are left.')} <a href={trip ? '#/pack' : '#/trips'}>{trip ? t('Open the packing list') : t('Plan a tour')}</a></p>
  {/if}

  {#if last}
    <p class="undo" role="status"><span><Check size={16} aria-hidden="true" /> {last.text}</span><button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button></p>
  {/if}
</div>

<style>
  .wtry { max-width: 760px; display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
  .note { color: var(--ink-3); font-size: var(--fs-small); margin: 0; overflow-wrap: break-word; }
  .hint { color: var(--ink-3); }
  .ctl { display: grid; gap: var(--sp-3); background: var(--paper); border: 1px solid var(--card-line, var(--line)); border-radius: var(--radius-card, 12px); padding: var(--sp-4); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .chip { display: inline-flex; align-items: center; min-height: 44px; max-width: 100%; padding: 6px 14px; border: 1px solid var(--line-strong); border-radius: var(--r-btn, 999px); background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; overflow-wrap: break-word; text-align: left; }
  .chip.on { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .temp { display: flex; align-items: center; justify-content: center; gap: var(--sp-4); }
  .deg { min-width: 5.5em; text-align: center; font-size: var(--fs-section); }
  .step, .arr { display: inline-grid; place-items: center; flex: none; width: 44px; height: 44px; border: 1px solid var(--line-strong); border-radius: 99px; background: var(--paper); color: var(--ink); cursor: pointer; }
  .arr:disabled { opacity: 0.35; cursor: default; }
  .slide { width: 100%; min-height: 32px; accent-color: var(--ink); }
  .rain { display: flex; align-items: center; gap: var(--sp-2); min-height: 44px; }
  .rain input { width: 22px; height: 22px; }
  .rows ul { list-style: none; margin: 0; padding: 0; background: var(--paper); border: 1px solid var(--card-line, var(--line)); border-radius: var(--radius-card, 12px); }
  .rows li { display: grid; grid-template-columns: minmax(4.5em, 5.5em) minmax(0, 1fr) auto; align-items: center; gap: var(--sp-2) var(--sp-3); padding: var(--sp-3) var(--sp-4); border-top: 1px solid var(--line); }
  .rows li:first-child { border-top: 0; }
  .nm { font-weight: 600; }
  .mid { display: grid; gap: 2px; min-width: 0; }
  .piece { font-weight: 500; overflow-wrap: break-word; }
  .mid small { color: var(--ink-3); font-size: var(--fs-small); overflow-wrap: break-word; }
  .mid .warn { color: var(--warn, var(--ink-2)); }
  .gaptx { color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  li.gap { background: var(--paper-2); }
  .arrows { display: inline-flex; gap: 6px; }
  .sum { display: grid; gap: 2px; }
  .line { margin: 0; font-size: var(--fs-sub); }
  .acts { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .acts .btn { flex: 1 1 auto; justify-content: center; }
  .next a { margin-left: 4px; }
  .undo { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin: 0; padding: 10px 14px; border-radius: var(--radius-card, 12px); background: var(--ink); color: var(--paper); }
  .undo :global(.btn) { background: transparent; color: var(--paper); border-color: var(--paper); }
  @media (max-width: 420px) {
    .rows li { grid-template-columns: minmax(0, 1fr) auto; }
    .nm { grid-column: 1 / -1; }
  }
</style>

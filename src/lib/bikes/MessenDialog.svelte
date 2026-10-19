<script>
  /**
   * «Werte messen» Teil 2 (Noah 15.10.2026, W4–W6 «freigeben», answers «2b 4a 5a»): one small window,
   * three kinds, opened from Today's bike buttons, from Bike care and from the Pick-up check.
   * - 'calc' (W4b «Druck berechnen»): a pressure from the weight, the tyre width, tubeless and the
   *   ground; «Use as target» writes it as the bike's target pressure.
   * - 'pressure' (W5 «Druck erfassen»): front and rear as measured, when; a tyre that loses air gets a hint.
   * - 'chain' (W6 «Kette messen»): the chain checker's value, the scale, the values so far and a forecast.
   * Everything is a suggestion and can be changed; the rules are in lib/messen.js.
   */
  import { liveQuery } from 'dexie';
  import { X, Minus, Plus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { sortBikes } from '../bikes.js';
  import { fitValue, setFit } from '../bikespecs.js';
  import { withVisits, tyreSetup, lastPrice } from '../workshop.js';
  import { quickLog, chainWish } from '../quickcare.js';
  import { nextId } from '../gear.js';
  import { tripStats } from '../trips.js';
  import { nextTrip } from '../debrief.js';
  import { GROUNDS, WHEN, CHAIN_QUICK, suggestPressure, pressureStart, logPressure, pressures, pressureLoss, chainValues, chainState, widthMm } from '../messen.js';
  import { backClose } from '../ui/backclose.js';
  import { t, num, dateOf } from '../i18n.svelte.js';
  import './velo-dlg.css';

  let { kind = 'pressure', bikeId = null, onclose, onsaved = null } = $props();

  let dialog;
  const today = localDay();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  // svelte-ignore state_referenced_locally
  const tripsQ = kind === 'calc' ? liveQuery(() => db.trips.toArray()) : null;
  // svelte-ignore state_referenced_locally
  const itemsQ = liveQuery(() => db.items.toArray());
  // svelte-ignore state_referenced_locally
  const bagsQ = kind === 'calc' ? liveQuery(() => db.containers.toArray()) : null;

  const bikes = $derived(sortBikes($bikesQ ?? []));
  // svelte-ignore state_referenced_locally
  let pick = $state(bikeId);
  const stored = $derived(bikes.find((b) => b.id === pick) ?? bikes[0] ?? null);
  const view = $derived(stored ? withVisits(stored, $visitsQ ?? []) : null);
  const tyres = $derived(stored ? tyreSetup(stored, $visitsQ ?? []) : null);

  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const TITLE = { calc: 'Calculate the pressure', pressure: 'Record the pressure', chain: 'Measure the chain' };
  let msg = $state('');
  let busy = $state(false);

  /* ---------- W4b: calculate ---------- */
  const trip = $derived(kind === 'calc' && stored ? nextTrip(($tripsQ ?? []).filter((x) => x.bikeId === stored.id), today) : null);
  const luggageG = $derived.by(() => {
    if (!trip || !stored) return null;
    const s = tripStats(trip, $itemsQ ?? [], $bagsQ ?? [], stored, null);
    return s.gearG + s.onMeG + s.bagsG;
  });
  const start = $derived(stored ? pressureStart(stored, { riderG: $riderQ?.value ?? null, luggageG, tyres }) : null);
  let own = $state({}); // what was changed by hand: weight, width, tubeless, ground
  const weight = $derived(own.weight ?? (start?.weightKg != null ? String(start.weightKg) : ''));
  const width = $derived(own.width ?? start?.widthF ?? null);
  const tubeless = $derived(own.tubeless ?? start?.tubeless ?? false);
  const ground = $derived(own.ground ?? start?.ground ?? 'road');
  const WIDTHS = [25, 28, 32, 35, 40, 45, 50, 56, 61, 66];
  const widths = $derived([...new Set([...WIDTHS, ...(start?.widthF ? [start.widthF] : [])])].sort((a, b) => a - b));
  const inch = (mm) => (mm >= 50 ? ` · ${num(Math.round((mm / 25.4) * 10) / 10)}″` : '');
  const sugg = $derived(suggestPressure({ weightKg: Number(String(weight).replace(',', '.')), widthF: width, widthR: own.width ? width : (start?.widthR ?? width), tubeless, ground }));
  const target = $derived(stored ? { f: fitValue(stored, 'pressureF'), r: fitValue(stored, 'pressureR') } : null);
  const pair = (f, r) => (f == null && r == null ? '–' : `${f == null ? '–' : num(f)} / ${r == null ? '–' : num(r)} bar`);

  async function takeTarget() {
    if (!sugg || !stored) return;
    busy = true;
    try {
      const fresh = await db.bikes.get(stored.id);
      const a = setFit(fresh, 'pressureF', sugg.f);
      const b = setFit({ ...fresh, ...a }, 'pressureR', sugg.r);
      await db.bikes.update(stored.id, { ...a, ...b });
      onsaved?.(t('{bike}: target pressure {f} / {r} bar.', { bike: stored.name, f: num(sugg.f), r: num(sugg.r) }));
      dialog.close();
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }

  /* ---------- W5: record the pressure ---------- */
  const lastP = $derived(view ? (pressures(view).at(-1) ?? null) : null);
  let pf = $state(null);
  let pr = $state(null);
  let when = $state('before');
  $effect(() => {
    if (kind !== 'pressure' || !stored) return;
    if (pf == null) pf = lastP?.f ?? target?.f ?? null;
    if (pr == null) pr = lastP?.r ?? target?.r ?? null;
  });
  const step = (v, d) => Math.max(0.1, Math.round(((v ?? 1.5) + d) * 10) / 10);
  const loss = $derived(view ? pressureLoss(view) : null);

  async function savePressure() {
    if (!stored) return;
    busy = true;
    try {
      const fresh = await db.bikes.get(stored.id);
      const res = logPressure(fresh, { f: pf, r: pr, when, today });
      if (!res) return (msg = t('Type a pressure, e.g. 1.6.'));
      await db.bikes.update(stored.id, res.changes);
      onsaved?.(t('{bike}: pressure {f} / {r} bar saved.', { bike: stored.name, f: num(pf), r: num(pr) }));
      dialog.close();
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }

  /* ---------- W6: measure the chain ---------- */
  let wear = $state(null);
  let exact = $state('');
  const chain = $derived(view ? chainState(view) : null);
  const vals = $derived(view ? chainValues(view).slice(-4).reverse() : []);
  const limit = $derived(chain?.limit ?? 0.5);
  const warnAt = $derived(chain?.warnAt ?? 0.4);
  const shown = $derived(wear ?? chain?.value ?? null);
  const pos = (v) => `${Math.min(100, Math.max(0, (v / 0.75) * 100))}%`;
  const toneOf = (v) => (v == null ? '' : v >= limit ? 'worn' : v >= warnAt ? 'warn' : 'ok');

  async function saveChain() {
    const v = exact.trim() ? Number(exact.replace(',', '.')) : wear;
    if (!stored || v == null || !Number.isFinite(v)) return (msg = t('Pick a value or type one, e.g. 0.3.'));
    busy = true;
    try {
      const fresh = await db.bikes.get(stored.id);
      const res = quickLog(fresh, 'wear', { today, value: v });
      if (!res) return (msg = t('Type the wear in %, between 0 and 5.'));
      await db.bikes.update(stored.id, res.changes);
      // at the limit the chain goes on the wishlist too, as in Bike care (never twice)
      if (res.entry.result === 'needed') {
        const items = $itemsQ ?? [];
        const item = chainWish({ ...fresh, ...res.changes }, items, { id: nextId(items, 'bike'), value: v, today, price: lastPrice($visitsQ ?? [], stored.id, 'chain') });
        if (item) await db.items.put(item);
      }
      onsaved?.(t('{bike}: chain {value} % saved.', { bike: stored.name, value: num(v) }));
      dialog.close();
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }
  const save = () => (kind === 'calc' ? takeTarget() : kind === 'pressure' ? savePressure() : saveChain());
</script>

<dialog class="sheet vdlg from-below messen" bind:this={dialog} use:backClose {onclose} aria-labelledby="ms-h" data-messen={kind}>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="ms-h">{t(TITLE[kind])}</h2>
      {#if stored}<p class="vd-sub">{stored.name}</p>{/if}
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if !bikeId && bikes.length > 1}
    <div class="vd-chips" role="group" aria-label={t('Bike')}>
      {#each bikes as b (b.id)}<button type="button" class="vd-chip" aria-pressed={stored?.id === b.id} onclick={() => ((pick = b.id), (own = {}), (pf = null), (pr = null), (wear = null))}>{b.name}</button>{/each}
    </div>
  {/if}

  {#if !stored}
    <p class="quiet">{t('No bike yet.')}</p>
  {:else if kind === 'calc'}
    <div class="vd-field">
      <label class="vd-lbl" for="ms-w">{t('Weight on the bike')}</label>
      <p class="sum num">
        {#if start.riderKg != null}{t('You')} {num(start.riderKg)}{:else}<a href="#/bikes?tab=setup">{t('Your weight: enter it under Setup')}</a>{/if}
        + {t('Bike')} {start.bikeKg != null ? num(start.bikeKg) : '–'}
        + {trip ? t('Luggage next trip') : t('Luggage')} {num(start.luggageKg)} kg
      </p>
      <input id="ms-w" class="inp num wt" type="text" inputmode="decimal" value={weight} oninput={(e) => (own = { ...own, weight: e.currentTarget.value })} aria-describedby="ms-wh" />
      <small id="ms-wh" class="quiet">{t('kg in all · you can change it')}</small>
    </div>
    <div class="vd-field">
      <span class="vd-lbl">{t('Tyre width')}</span>
      <div class="vd-chips" role="group" aria-label={t('Tyre width')}>
        {#each widths as w (w)}<button type="button" class="vd-chip" aria-pressed={width === w} onclick={() => (own = { ...own, width: w })}>{w} mm{inch(w)}{#if w === start.widthF}<small class="n">&nbsp;· {t('this bike')}</small>{/if}</button>{/each}
      </div>
    </div>
    <div class="vd-field">
      <span class="vd-lbl">{t('Tyres')}</span>
      <div class="vd-chips" role="group" aria-label={t('Tyres')}>
        <button type="button" class="vd-chip" aria-pressed={tubeless} onclick={() => (own = { ...own, tubeless: true })}>{t('Tubeless')}</button>
        <button type="button" class="vd-chip" aria-pressed={!tubeless} onclick={() => (own = { ...own, tubeless: false })}>{t('Tube')}</button>
      </div>
    </div>
    <div class="vd-field">
      <span class="vd-lbl">{t('Ground')}</span>
      <div class="vd-chips" role="group" aria-label={t('Ground')}>
        {#each GROUNDS as g (g.key)}<button type="button" class="vd-chip" aria-pressed={ground === g.key} onclick={() => (own = { ...own, ground: g.key })}>{t(g.name)}</button>{/each}
      </div>
    </div>
    <div class="res" role="status" data-testid="pressure-suggestion">
      {#if sugg}
        <p class="big num"><span><small>{t('front')}</small>{num(sugg.f)}</span><span><small>{t('rear')}</small>{num(sugg.r)}</span><span class="u">bar</span></p>
        <p class="quiet">{t('Set now: {pair}', { pair: pair(target?.f, target?.r) })} · {t('a rule of thumb, not a must')}</p>
      {:else}
        <p class="quiet">{t('Type the weight and pick the tyre width.')}</p>
      {/if}
    </div>
  {:else if kind === 'pressure'}
    <div class="wheels">
      {#each [['f', 'Front', pf], ['r', 'Rear', pr]] as [w, label, v] (w)}
        <div class="wheel">
          <span class="vd-lbl">{t(label)}</span>
          <div class="stepper">
            <button type="button" class="btn sq" aria-label={t('0.1 bar less')} onclick={() => (w === 'f' ? (pf = step(pf, -0.1)) : (pr = step(pr, -0.1)))}><Minus size={18} aria-hidden="true" /></button>
            <input class="inp num" type="text" inputmode="decimal" aria-label={t(label)} value={v == null ? '' : String(v)} oninput={(e) => { const n = Number(e.currentTarget.value.replace(',', '.')); if (w === 'f') pf = Number.isFinite(n) && n > 0 ? n : null; else pr = Number.isFinite(n) && n > 0 ? n : null; }} />
            <button type="button" class="btn sq" aria-label={t('0.1 bar more')} onclick={() => (w === 'f' ? (pf = step(pf, 0.1)) : (pr = step(pr, 0.1)))}><Plus size={18} aria-hidden="true" /></button>
          </div>
          <small class="quiet num">{t('Target')} {target?.[w] != null ? `${num(target[w])} bar` : '–'}</small>
        </div>
      {/each}
    </div>
    <div class="vd-field">
      <span class="vd-lbl">{t('When')}</span>
      <div class="vd-chips" role="group" aria-label={t('When')}>
        {#each WHEN as x (x.key)}<button type="button" class="vd-chip" aria-pressed={when === x.key} onclick={() => (when = x.key)}>{t(x.name)}</button>{/each}
      </div>
    </div>
    {#if loss}<p class="warn" data-testid="pressure-loss">{t('The {wheel} tyre loses about {bar} bar a week since {date}: check the sealant?', { wheel: loss.wheel === 'f' ? t('front|tyre') : t('rear|tyre'), bar: num(loss.perWeek), date: dateOf(loss.from) })}</p>{/if}
    {#if lastP}<p class="quiet num">{t('Last measured {date}: {pair}', { date: dateOf(lastP.date), pair: pair(lastP.f, lastP.r) })}</p>{/if}
    <p class="where quiet">{t('Saved in: the tyre history, the Bike pass «last measured», the Pick-up check «before»')}</p>
  {:else}
    <div class="vd-field">
      <span class="vd-lbl">{t('Chain checker')}</span>
      <div class="vd-chips" role="group" aria-label={t('Chain checker')}>
        {#each CHAIN_QUICK as q (q)}<button type="button" class="vd-chip" aria-pressed={wear === q && !exact} onclick={() => ((wear = q), (exact = ''))}>{num(q)} %</button>{/each}
      </div>
      <label class="exact"><span class="vd-lbl">{t('Exact value in %')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={exact} oninput={() => (wear = Number(exact.replace(',', '.')) || null)} placeholder="0.3" /></label>
    </div>
    <div class="scale" aria-hidden="true">
      <span class="z ok" style:width={pos(warnAt)}></span><span class="z warn" style:width={`calc(${pos(limit)} - ${pos(warnAt)})`}></span><span class="z worn"></span>
      {#if shown != null}<span class="mark {toneOf(shown)}" style:left={pos(shown)}></span>{/if}
    </div>
    <p class="scl quiet num">{t('up to {warn} % fine · from {warn} % warning · from {limit} % replace', { warn: num(warnAt), limit: num(limit) })}</p>
    {#if shown != null && toneOf(shown) === 'worn'}<p class="warn">{t('At the limit: the Workshop order suggests «replace the chain».')}</p>{/if}
    {#if chain?.left != null}<p class="quiet">{t('At this pace about {km} km until {limit} %.', { km: num(chain.left), limit: num(limit) })}</p>{/if}
    {#if vals.length}
      <p class="vd-lbl">{t('So far')}</p>
      <ul class="hist num">
        {#each vals as v (v.date + v.value)}<li><span>{dateOf(v.date)}{v.km != null ? ` · ${num(v.km)} km` : ''}</span><b class={toneOf(v.value)}>{num(v.value)} %</b></li>{/each}
      </ul>
    {/if}
    <p class="where quiet">{t('Saved in: the chain history, the Service plan, the Workshop order, the bike light on Today')}</p>
  {/if}

  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    {#if stored}<button type="button" class="btn hi" disabled={busy || (kind === 'calc' && !sugg)} onclick={save} data-messen-save>{kind === 'calc' ? t('Use as target pressure') : t('Save')}</button>{/if}
  </div>
</dialog>

<style>
  .messen .vd-chips {
    margin: 0 0 12px;
  }
  .sum {
    margin: 0 0 6px;
    color: var(--ink-2);
  }
  .wt {
    max-width: 140px;
  }
  .res {
    margin: 8px 0 0;
    padding: 12px 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .res p {
    margin: 0;
  }
  .big {
    display: flex;
    align-items: baseline;
    gap: 18px;
    font: 600 var(--fs-page) / 1.2 var(--font-body);
  }
  .big small {
    display: block;
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-3);
  }
  .big .u {
    font: 400 var(--fs-body) / 1.3 var(--font-body);
  }
  .wheels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 0 0 12px;
  }
  .wheel {
    display: grid;
    gap: 4px;
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .stepper .inp {
    width: 100%;
    min-width: 0;
    text-align: center;
  }
  .btn.sq {
    flex: none;
    width: 44px;
    min-height: 44px;
    padding: 0;
    justify-content: center;
  }
  .exact {
    display: grid;
    gap: 4px;
    max-width: 200px;
  }
  .scale {
    position: relative;
    display: flex;
    height: 10px;
    margin: 6px 0 4px;
    border-radius: 999px;
    overflow: visible;
  }
  .z {
    height: 100%;
  }
  .z.ok {
    background: var(--ok-soft);
    border-radius: 999px 0 0 999px;
  }
  .z.warn {
    background: var(--warn-soft);
  }
  .z.worn {
    flex: 1;
    background: var(--bad-soft);
    border-radius: 0 999px 999px 0;
  }
  .mark {
    position: absolute;
    top: -4px;
    width: 4px;
    height: 18px;
    margin-left: -2px;
    border-radius: 2px;
    background: var(--ink);
  }
  .scl {
    margin: 0 0 10px;
    font-size: var(--fs-small);
  }
  .hist {
    margin: 4px 0 10px;
    padding: 0;
    list-style: none;
  }
  .hist li {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  b.ok {
    color: var(--ok);
  }
  b.warn,
  .warn {
    color: var(--warn);
  }
  b.worn {
    color: var(--bad);
  }
  p.warn {
    margin: 8px 0;
    font-weight: 600;
  }
  .where {
    margin: 10px 0 0;
    font-size: var(--fs-small);
  }
  .quiet {
    color: var(--ink-3);
  }
</style>

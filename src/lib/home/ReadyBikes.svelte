<script>
  /**
   * v0.38.0 "Heute und Menü" (Noah 8a, 10a): "Bikes ready?" on Today. One row per bike with its
   * ready light (a small dot, always with a word: Ready / Due soon / Due), and under the chosen bike
   * six buttons for what is done every day: chain lubed, chain wear measured, washed, sealant, tyre
   * pressure, km. Each saves with date (and km) the way Bike care does (quickcare.js, care.js) and
   * offers Undo. The buttons are for the bike used last; a tap on another bike's row chooses it.
   * Below: "Day ride now" and "Note + photo" in their own row.
   */
  import { db } from '../db.js';
  import { bikesHash } from '../bikes.js';
  import { lastBikeId } from '../dayride.js';
  import { dayRide, openNote } from '../nav.js';
  import { readyLight, LIGHT_WORD, quickHints, quickLog, addPressure, parseBar, kmFrom, stepWear, chainWish } from '../quickcare.js';
  import { nextId } from '../gear.js';
  import { lastPrice } from '../workshop.js';
  import { PART } from '../care.js';
  import BikesHubActions from '../hubs/BikesHubActions.svelte';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';
  import { Droplet, Ruler, SprayCan, Droplets, Gauge, Route, Sun, Camera, ChevronDown, ChevronRight, Minus, Plus } from '@lucide/svelte';

  let { bikes = [], trips = [], tasks = [], visits = [], next = null, today } = $props();

  /* ---------- which bike the buttons are for ---------- */
  const KEY = 'home.bike';
  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };
  let chosen = $state(read()); // a bike id, 'none' (all closed) or null (not chosen: the bike used last)
  const openId = $derived(chosen === 'none' ? null : bikes.some((b) => b.id === chosen) ? chosen : lastBikeId(trips, bikes, today));
  function choose(id) {
    chosen = openId === id ? 'none' : id;
    try {
      localStorage.setItem(KEY, chosen);
    } catch {
      /* private mode: only this visit */
    }
  }
  const rows = $derived(bikes.map((b) => ({ bike: b, light: readyLight(b, { tasks, visits, trip: next?.bikeId === b.id ? next : null, today }), hints: quickHints(b, { visits, today }) })));

  /* ---------- saving, with Undo ---------- */
  let notice = $state(null); // { id, text, undo: { bikeId, prev }, pressure? }
  let timer;
  const UNDO_MS = 8000;
  function say(text, undo = null, extra = {}) {
    clearTimeout(timer);
    notice = { id: Date.now(), text, undo, ...extra };
    timer = setTimeout(() => (notice = null), UNDO_MS);
  }
  $effect(() => () => clearTimeout(timer));
  /** Change one bike as stored (never the view with the workshop visits) and remember what it was. */
  async function change(bikeId, make) {
    let out = null;
    await db.transaction('rw', db.bikes, db.items, async () => {
      const stored = await db.bikes.get(bikeId);
      if (!stored) return;
      const res = make(stored);
      if (!res) return;
      const prev = Object.fromEntries(Object.keys(res.changes).map((k) => [k, stored[k]]));
      await db.bikes.update(bikeId, res.changes);
      // v0.40.0 (Noah 1 "b und a"): chain wear at the limit puts the chain on the wishlist, in the same step.
      let wish = null;
      if (res.entry?.result === 'needed' && res.entry.value != null) {
        const items = await db.items.toArray();
        wish = chainWish(stored, items, { id: nextId(items, 'bike'), value: res.entry.value, today, price: lastPrice(visits, bikeId, 'chain') });
        if (wish) await db.items.put(wish);
      }
      out = { ...res, prev, stored, wish };
    });
    return out;
  }
  async function undo() {
    const u = $state.snapshot(notice?.undo);
    clearTimeout(timer);
    notice = null;
    if (!u) return;
    // Undo takes back the whole tap: the bike as it was and the wishlist item it made (v0.40.0).
    await db.transaction('rw', db.bikes, db.items, async () => {
      await db.bikes.update(u.bikeId, u.prev);
      if (u.itemId) await db.items.delete(u.itemId);
    });
  }
  const nameOfBike = (id) => bikes.find((b) => b.id === id)?.name ?? '';
  const inDays = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);

  async function tap(bikeId, kind, value = null) {
    const r = await change(bikeId, (stored) => quickLog(stored, kind, { today, value }));
    if (!r) return;
    const bike = nameOfBike(bikeId);
    const u = { bikeId, prev: r.prev, itemId: r.wish?.id ?? null };
    if (kind === 'chain') say(r.entry.km != null ? t('{bike}: chain lubed. Next time at {km} km.', { bike, km: num(r.entry.km + PART.chain.everyKm) }) : t('{bike}: chain lubed.', { bike }), u);
    else if (kind === 'wear') say(`${t('{bike}: chain wear {value} % saved.', { bike, value: num(r.entry.value) })}${r.entry.result === 'needed' ? ` ${r.wish ? t('Time for a new chain: it is on the wishlist.') : t('Time for a new chain.')}` : ''}`, u);
    else if (kind === 'wash') say(t('{bike}: washed.', { bike }), u);
    else if (kind === 'sealant') say(t('{bike}: sealant topped up. Next time {date}.', { bike, date: dateOf(inDays(today, PART.tyres.everyDays)) }), u);
    else if (kind === 'pressure') say(t('{bike}: tyre pressure checked.', { bike }), u, { pressure: bikeId });
  }

  /* ---------- the three small windows: chain wear, km, pressure ---------- */
  let ask = $state(null); // { kind: 'wear' | 'km' | 'pressure', bikeId }
  let dlg = $state();
  let field = $state('');
  let field2 = $state('');
  let err = $state('');
  $effect(() => {
    if (ask && dlg && !dlg.open) dlg.showModal();
    if (!ask && dlg?.open) dlg.close();
  });
  const askBike = $derived(ask ? rows.find((r) => r.bike.id === ask.bikeId) : null);
  function open(kind, bikeId) {
    const h = rows.find((r) => r.bike.id === bikeId)?.hints;
    err = '';
    field = kind === 'wear' ? String(h?.wear ?? 0.2) : '';
    field2 = '';
    if (kind === 'pressure') clearTimeout(timer);
    ask = { kind, bikeId };
  }
  async function submit(e) {
    e.preventDefault();
    const { kind, bikeId } = ask;
    if (kind === 'wear') {
      const v = Number(String(field).replace(',', '.'));
      if (String(field).trim() === '' || !Number.isFinite(v) || v < 0 || v > 1.5) return (err = t('Type a number, e.g. 0.4'));
      ask = null;
      return tap(bikeId, 'wear', v);
    }
    if (kind === 'km') {
      const cur = askBike?.bike.km ?? null;
      const n = kmFrom(field, cur);
      if (n == null) return (err = t('Type the km ridden (+42) or the new counter.'));
      if (Number.isNaN(n)) return (err = t('Type the km as a whole number, e.g. 12400.'));
      ask = null;
      const r = await change(bikeId, () => ({ changes: { km: n, kmDate: today } }));
      if (r) say(t('{bike}: {km} km saved.', { bike: nameOfBike(bikeId), km: num(n) }), { bikeId, prev: r.prev });
      return;
    }
    if (kind === 'pressure') {
      const f = parseBar(field);
      const rr = parseBar(field2);
      if (Number.isNaN(f) || Number.isNaN(rr)) return (err = t('Type the pressure in bar, e.g. 1.8'));
      ask = null;
      if (f == null && rr == null) return;
      const r = await change(bikeId, (stored) => {
        const parts = addPressure(stored, { f, r: rr, today });
        return parts ? { changes: { parts } } : null;
      });
      if (r) say(t('{bike}: pressure saved.', { bike: nameOfBike(bikeId) }), { bikeId, prev: r.prev });
    }
  }
  const shortDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });

  const BTN = [
    { key: 'chain', label: 'Chain lubed', icon: Droplet },
    { key: 'wear', label: 'Chain wear', icon: Ruler },
    { key: 'wash', label: 'Washed', icon: SprayCan },
    { key: 'sealant', label: 'Sealant', icon: Droplets },
    { key: 'pressure', label: 'Tyre pressure', icon: Gauge },
    { key: 'km', label: 'Add km', icon: Route },
  ];
  /** The small word beside a button's name: when it is due next, the last value, … */
  function hint(key, h) {
    if (key === 'chain') return h.chain ? (h.chain.left < 0 ? t('{km} km over', { km: num(-h.chain.left) }) : h.chain.left === 0 ? t('due') : t('in {km} km', { km: num(h.chain.left) })) : '';
    if (key === 'wear') return h.wear != null ? `${num(h.wear)} %` : '';
    if (key === 'wash') return h.wash ? shortDay(h.wash) : '';
    if (key === 'sealant') return h.sealant ? (h.sealant.days <= 0 ? t('due') : h.sealant.days < 45 ? tn(h.sealant.days, 'in {n} day', 'in {n} days') : tn(Math.round(h.sealant.days / 30.4), 'in {n} month', 'in {n} months')) : '';
    if (key === 'pressure') return h.pressure ? `${[h.pressure.f, h.pressure.r].map((x) => (x == null ? '–' : num(x))).join(' / ')} bar` : '';
    if (key === 'km') return h.km != null ? `${num(h.km)} km` : '';
    return '';
  }
  const run = (key, bikeId) => (key === 'wear' || key === 'km' ? open(key, bikeId) : tap(bikeId, key));
  const lightWord = (l) => (l.tone === 'due' ? tn(l.n, '{n} due', '{n} due') : t(LIGHT_WORD[l.tone]));
</script>

<section class="ready" aria-labelledby="ready-h">
  <div class="sh">
    <h2 id="ready-h" class="lbl">{t('Bikes ready?')}</h2>
    <a class="tap" href="#/bikes?tab=care">{t('Bike care')} ›</a>
  </div>
  <ul class="bikes">
    {#each rows as { bike, light, hints } (bike.id)}
      {@const isOpen = openId === bike.id}
      <li class="br" class:open={isOpen}>
        <button type="button" class="bh" aria-expanded={isOpen} aria-controls="qb-{bike.id}" onclick={() => choose(bike.id)}>
          <span class="dot {light.tone}" aria-hidden="true"></span>
          <span class="nm"><b>{bike.name}</b><small class="num">{[bike.km != null ? `${num(bike.km)} km` : t('km not set'), next?.bikeId === bike.id ? t('next trip') : null].filter(Boolean).join(' · ')}</small></span>
          <span class="lw" data-tone={light.tone}>{lightWord(light)}</span>
          <span class="chev" aria-hidden="true">{#if isOpen}<ChevronDown size={20} />{:else}<ChevronRight size={20} />{/if}</span>
        </button>
        {#if isOpen}
          <div class="qb" id="qb-{bike.id}" role="group" aria-label={t('Quick buttons: {bike}', { bike: bike.name })}>
            {#each BTN.filter((b) => b.key !== 'sealant' || hints.sealant !== false) as b (b.key)}
              {@const h = hint(b.key, hints)}
              <button type="button" class="q" data-q={b.key} onclick={() => run(b.key, bike.id)}><b.icon size={20} aria-hidden="true" /><span class="ql">{t(b.label)}</span>{#if h}<small class="qh num">{h}</small>{/if}</button>
            {/each}
          </div>
        {/if}
      </li>
    {/each}
  </ul>
  <!-- v0.25.1 (Noah 2b, 3a): what the Bikes tile had and no menu has: a problem, an idea, the shop. -->
  <BikesHubActions {bikes} {next} />

  <h2 class="lbl sh2">{t('Quick|today')}</h2>
  <div class="qrow">
    <button type="button" class="q" onclick={dayRide}><Sun size={20} aria-hidden="true" /><span class="ql">{t('Day ride now')}</span></button>
    <button type="button" class="q" onclick={() => openNote('')}><Camera size={20} aria-hidden="true" /><span class="ql">{t('Note + photo')}</span></button>
  </div>
</section>

{#if notice}
  {#key notice.id}
    <div class="notice" role="status">
      <span>{notice.text}</span>
      <span class="na">
        {#if notice.pressure}<button type="button" class="btn sm" onclick={() => open('pressure', notice.pressure)}>{t('Add pressure')}</button>{/if}
        {#if notice.undo}<button type="button" class="btn sm" onclick={undo}>{t('Undo')}</button>{/if}
      </span>
    </div>
  {/key}
{/if}

<dialog class="sheet ask" bind:this={dlg} onclose={() => (ask = null)} aria-labelledby="ask-h">
  {#if ask && askBike}
    <form onsubmit={submit}>
      <p class="meta">{askBike.bike.name}</p>
      {#if ask.kind === 'wear'}
        <h2 id="ask-h" class="title">{t('Chain wear measured')}</h2>
        <p class="hint">{askBike.hints.wear != null ? t('Last time {value} %.', { value: num(askBike.hints.wear) }) : t('No value yet.')} {t('Chain checker: 0.4 % warning, 0.5 % replace')}</p>
        <div class="stepper">
          <button type="button" class="btn" aria-label={t('Less')} onclick={() => (field = String(stepWear(field, -1)))}><Minus size={20} aria-hidden="true" /></button>
          <label><span class="sr">{t('Chain wear in %')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={field} /></label>
          <span class="unit">%</span>
          <button type="button" class="btn" aria-label={t('More|amount')} onclick={() => (field = String(stepWear(field, 1)))}><Plus size={20} aria-hidden="true" /></button>
        </div>
        <div class="scale" aria-hidden="true"><i style="left: {(Math.min(1, Number(String(field).replace(',', '.')) / 0.75) || 0) * 100}%"></i><span style="left: {(0.4 / 0.75) * 100}%">0.4</span><span style="left: {(0.5 / 0.75) * 100}%">0.5</span></div>
      {:else if ask.kind === 'km'}
        <h2 id="ask-h" class="title">{t('Add km')}</h2>
        <p class="hint num">{askBike.bike.km != null ? (askBike.bike.kmDate ? t('Now {km} km, set {date}.', { km: num(askBike.bike.km), date: dateOf(askBike.bike.kmDate) }) : t('Now {km} km.', { km: num(askBike.bike.km) })) : t('No km yet.')}</p>
        <label><span class="lbl">{t('km ridden (+42) or the new counter')}</span>
          <!-- svelte-ignore a11y_autofocus -->
          <input class="inp num" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" bind:value={field} placeholder={askBike.bike.km != null ? `+42 ${t('or')} ${askBike.bike.km + 42}` : t('e.g. 2400')} autofocus />
        </label>
      {:else}
        <h2 id="ask-h" class="title">{t('Tyre pressure')}</h2>
        <div class="two">
          <label><span class="lbl">{t('Pressure front')} (bar)</span><input class="inp num" type="text" inputmode="decimal" bind:value={field} placeholder="1.8" /></label>
          <label><span class="lbl">{t('Pressure rear')} (bar)</span><input class="inp num" type="text" inputmode="decimal" bind:value={field2} placeholder="1.9" /></label>
        </div>
      {/if}
      {#if err}<p class="err" role="alert">{err}</p>{/if}
      <div class="foot">
        <button type="submit" class="btn hi">{t('Save')}</button>
        <button type="button" class="btn" onclick={() => (ask = null)}>{t('Cancel')}</button>
      </div>
    </form>
  {/if}
</dialog>

<style>
  .ready {
    min-width: 0;
  }
  .sh {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }
  .sh .lbl,
  .sh2 {
    margin: 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-3);
  }
  .sh a {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    font: 600 var(--fs-small) var(--font-body);
    color: var(--ink-2);
    text-decoration: none;
  }
  .sh2 {
    margin: 22px 0 0;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }
  .bikes {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
  }
  .br {
    border-bottom: 1px solid var(--line);
  }
  .bh {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0 12px;
    width: 100%;
    min-height: 56px;
    padding: 6px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .bh:hover .nm b {
    text-decoration: underline;
  }
  .nm {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .nm b {
    font-weight: 600;
    font-size: 17px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* Noah 10a: a small dot, always with its word beside it. */
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--line-strong);
  }
  .dot.ok {
    background: var(--ok);
  }
  .dot.soon {
    background: #c99400;
  }
  .dot.due {
    background: var(--bad);
  }
  .lw {
    color: var(--ink-2);
    font-size: 15px;
    white-space: nowrap;
  }
  .chev {
    display: inline-flex;
    color: var(--ink-3);
  }
  .qb {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 2px 0 14px;
  }
  @media (min-width: 720px) {
    .qb {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .qrow {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding-top: 10px;
  }
  @media (min-width: 720px) {
    .qrow {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .q {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    min-height: 48px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 15px/1.2 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .q:hover {
    background: var(--paper-2);
  }
  .q :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .ql {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .qh {
    margin-left: auto;
    color: var(--ink-3);
    font-weight: 400;
    font-size: 13px;
    white-space: nowrap;
  }
  @media (max-width: 359px) {
    .q {
      padding: 6px 10px;
      font-size: 14px;
    }
    .qh {
      display: none;
    }
  }
  .ready :global(.hub-actions) {
    margin-top: 4px;
  }
  /* after a tap: what was saved, with Undo; above the phone bar, wherever the page is scrolled */
  .notice {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    width: max-content;
    max-width: min(560px, calc(100vw - 32px));
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    font-size: 15px;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
    box-sizing: border-box;
  }
  .notice span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .na {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .notice .btn {
    background: transparent;
    border-color: var(--paper);
    color: var(--paper);
  }
  @media (max-width: 719px) {
    .notice {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
  .ask .meta {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ask h2 {
    margin: 0 0 6px;
  }
  .hint {
    margin: 0 0 12px;
    color: var(--ink-2);
    font-size: 15px;
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .stepper .btn {
    min-width: 48px;
    min-height: 48px;
  }
  .stepper label {
    flex: 1;
  }
  .stepper .inp {
    text-align: center;
    font-size: 22px;
  }
  .unit {
    font-size: 18px;
  }
  .scale {
    position: relative;
    height: 26px;
    margin: 14px 4px 4px;
    border-top: 6px solid var(--paper-2);
    background: linear-gradient(to right, transparent 53.3%, var(--warn-soft) 53.3%, var(--warn-soft) 66.6%, var(--bad-soft) 66.6%) top / 100% 6px no-repeat;
  }
  .scale i {
    position: absolute;
    top: -10px;
    width: 3px;
    height: 14px;
    background: var(--ink);
  }
  .scale span {
    position: absolute;
    top: 2px;
    transform: translateX(-50%);
    font-size: 12px;
    color: var(--ink-3);
  }
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .ask label {
    display: grid;
    gap: 4px;
  }
  .err {
    margin: 8px 0 0;
    color: var(--bad);
    font-size: 14px;
  }
  .foot {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }
</style>

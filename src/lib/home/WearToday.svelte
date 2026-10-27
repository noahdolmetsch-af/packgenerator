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
  import { CLOTHING_OFFSET, ONION, GAP_RULES, gapWish, tempRange, zoneGroup, layerKey } from '../wardrobe.js';
  import { WEAR_DAY, NONE, WHY_LIMITS, dayChoice, dayRecord, isChanged, withPick, withoutPick, withAdd, withoutAdd, withSet, applyDay, addableRows, swapOptions, gapReason } from './wearday.js';
  import { WEAR_SEEDED, WEAR_REMEMBER, AUTO, seedPlan, wearSets, matchSet, activeSet, orderedSets, setPieces, setOutfit, setRowPlan, fillPlan, rangePlan } from './wearsets.js';
  import { SETS_KEY } from '../sets.js';
  import { todayOutfit } from './outfit.js';
  import HomePlaceForm from '../know/HomePlaceForm.svelte';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { Shirt } from '@lucide/svelte';

  // edit: the window on Today (swap, add, why); without it a calm read-only card (the day card).
  let { items = [], trips = [], edit = false } = $props();

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

  /* «Was ziehe ich an? selbst anpassen» step 1 (Noah 27.10.2026): with edit (the window on Today) every row
     can be swapped, left out or added, for this ride day only; a gap says why; «Why so?» explains the rule. */
  const dayQ = liveQuery(async () => (await db.settings.get(WEAR_DAY)) ?? null);
  const choice = $derived(dayChoice($dayQ, o.win?.date));

  /* Step 2 «Kleider-Sets» (Noah 27.10.2026 «1a 2a oder b wählbar 3a 5a»): the nine sample sets are made
     once when the window opens; the set that fits today comes first, its pieces before the app's;
     a swap holds for today only or goes into the set, as you choose. */
  const setsQ = liveQuery(async () => (await db.settings.get(SETS_KEY)) ?? null);
  const seededQ = liveQuery(async () => (await db.settings.get(WEAR_SEEDED)) ?? null);
  const rememberQ = liveQuery(async () => (await db.settings.get(WEAR_REMEMBER))?.value ?? 'today');
  const sets = $derived(wearSets($setsQ?.value));
  const match = $derived(o.state === 'ok' ? matchSet(sets, o.outfit.c, o.outfit.wet) : null);
  const active = $derived(activeSet(sets, choice.set, match));
  const chips = $derived(orderedSets(sets, match));
  // calm: «Automatic», the set that fits and the chosen one; the others behind «More sets»
  let moreSets = $state(false);
  const hidden = $derived(chips.filter((s) => s.key !== match?.key && s.key !== active?.key).length);
  const pieces = $derived(setPieces(active, items));
  const remember = $derived(active ? $rememberQ : 'today');
  const shown = $derived(o.state === 'ok' ? applyDay(setOutfit(o.outfit, active, items), items, choice) : null);
  let seeding = false;
  $effect(() => {
    if (edit && o.state !== 'none' && $seededQ === null && !seeding) {
      seeding = true;
      seedSets();
    }
  });
  async function seedSets() {
    await db.transaction('rw', db.settings, db.items, async () => {
      if (await db.settings.get(WEAR_SEEDED)) return;
      const prev = (await db.settings.get(SETS_KEY)) ?? null;
      const plan = seedPlan(prev?.value ?? [], await db.items.toArray());
      await db.settings.put({ ...(prev ?? { key: SETS_KEY }), value: plan.value });
      if (plan.items.length) await db.items.bulkPut(plan.items);
      await db.settings.put({ key: WEAR_SEEDED, value: 1 });
    });
  }
  async function chooseSet(key) {
    await save(withSet(choice, key));
  }
  const setRemember = (v) => db.settings.put({ key: WEAR_REMEMBER, value: v });
  /** Write a set plan (setRowPlan / fillPlan) and offer Undo. */
  async function writeSet(plan, text) {
    const prev = (await db.settings.get(SETS_KEY)) ?? null;
    await db.transaction('rw', db.settings, db.items, async () => {
      await db.settings.put({ ...(prev ?? { key: SETS_KEY }), value: plan.value });
      if (plan.items.length) await db.items.bulkPut(plan.items);
    });
    toast(text, async () => {
      await db.transaction('rw', db.settings, db.items, async () => {
        if (prev) await db.settings.put(prev);
        if (plan.before.length) await db.items.bulkPut(plan.before);
      });
    });
  }
  async function setRow(key, id) {
    const plan = setRowPlan($setsQ?.value ?? [], items, active.key, key, id);
    const row = t(ONION.find((r) => r.key === key)?.name ?? key);
    // the day choice of this row steps back, so the set shows
    if (choice.pick[key] != null) await save(withoutPick(choice, key));
    await writeSet(plan, id == null ? t('{row}: the app picks again, not the set {set}.', { row, set: active.name }) : t('Saved in the set {set}: {row}.', { set: active.name, row }));
  }
  /* Noah 27.10.2026 «2a»: the °C range of the chosen set, changed right here (empty = no border). */
  let range = $state(null); // { key, from, to, err } while the form is open
  function openRange() {
    range = { key: active.key, from: active.minC ?? '', to: active.maxC ?? '', err: '' };
  }
  async function saveRange() {
    const plan = rangePlan($setsQ?.value ?? [], range.key, range.from, range.to);
    if (plan.error) {
      range.err = plan.error === 'order' ? t('«From» must not be above «to».') : t('Please type numbers only, e.g. 5 or −3.');
      return;
    }
    const name = active.name;
    range = null;
    const s = plan.value.find((x) => x.key === active.key);
    const text = tempRange(s?.minC, s?.maxC, t);
    await writeSet({ ...plan, items: [], before: [] }, text ? t('Set {set} now fits at {range}.', { set: name, range: text }) : t('Set {set} has no °C range now: choose it by hand.', { set: name }));
  }
  async function fillSet() {
    const plan = fillPlan($setsQ?.value ?? [], items, active.key, shown.rows);
    await writeSet(plan, tn(plan.items.length, 'The set {set} holds {n} piece now.', 'The set {set} holds {n} pieces now.', { set: active.name }));
  }
  const addable = $derived(edit && shown ? addableRows(o.outfit, choice) : []);
  const changed = $derived(isChanged(choice));
  let swapKey = $state(null);
  let addOpen = $state(false);
  // The note with «Undo» sits inside the card: the window on Today is modal, a toast outside could not be tapped.
  let note = $state(null);
  let noteTimer = null;
  function toast(text, undo = null) {
    clearTimeout(noteTimer);
    note = { text, undo };
    noteTimer = setTimeout(() => (note = null), 8000);
  }
  async function runNote() {
    const u = note?.undo;
    note = null;
    clearTimeout(noteTimer);
    if (u) await u();
  }
  const rangeOf = (i) => tempRange(i.tempMin, i.tempMax, t);
  const FIT = { ok: 'fits', warm: 'rather too warm', light: 'too light for {c} °C' };
  async function save(next) {
    const prev = $dayQ;
    await db.settings.put(dayRecord(o.win.date, next));
    return prev;
  }
  async function pick(key, id) {
    swapKey = null;
    if (remember === 'set' && active) return setRow(key, id);
    await save(withPick(choice, key, id));
  }
  async function backToApp(key) {
    swapKey = null;
    await save(withoutPick(choice, key));
  }
  async function addRow(key) {
    addOpen = false;
    await save(withAdd(choice, key));
  }
  async function dropRow(key) {
    swapKey = null;
    await save(withoutAdd(choice, key));
  }
  async function resetDay() {
    const prev = await save({ pick: {}, add: [] });
    toast(t('Back to the suggestion of the app.'), () => (prev ? db.settings.put(prev) : db.settings.delete(WEAR_DAY)));
  }
  async function wish(key) {
    const rule = GAP_RULES.find((g) => g.key === key);
    if (!rule) return;
    const isWish = (i) => i.ownership === 'wishlist' || i.ownership === 'to-buy';
    const gap = { ...rule, wished: items.find((i) => isWish(i) && zoneGroup(i.zone) === rule.zone && (rule.any || layerKey(i.layer) === rule.layer)) ?? null };
    const rec = gapWish(gap, items, { name: t(rule.wish), reason: t('For {c} °C and colder', { c: o.outfit.c }) });
    if (!rec) {
      toast(t('{name} is already on the wishlist', { name: nameOf(gap.wished) }));
      return;
    }
    await db.items.add(rec);
    toast(t('{name} is on the wishlist', { name: rec.name }), () => db.items.delete(rec.id));
  }
  const reasonText = (r) => {
    const g = gapReason(r.key, items, o.outfit.c, { rain: r.rain });
    if (g.kind === 'rain') return { g, text: t('Nothing waterproof is sorted as outer layer.') };
    if (g.kind === 'light') {
      const first = g.from != null ? t('Your pieces here are made for {n} °C and warmer. Today: {c} °C.', { n: g.from, c: o.outfit.c }) : t('Your pieces here are too light for {c} °C.', { c: o.outfit.c });
      return { g, text: g.unsorted ? `${first} ${tn(g.unsorted, '{n} piece for this still waits in «To sort». Once sorted, it counts.', '{n} pieces for this still wait in «To sort». Once sorted, they count.')}` : first };
    }
    if (g.kind === 'unsorted') return { g, text: tn(g.unsorted, '{n} piece for this still waits in «To sort». Once sorted, it counts.', '{n} pieces for this still wait in «To sort». Once sorted, they count.') };
    return { g, text: t('Nothing in the wardrobe for this yet.') };
  };
  const rowNames = (keys) => keys.map((k) => t(ONION.find((r) => r.key === k)?.name ?? k)).join(', ');
  const notYet = $derived(shown ? ONION.filter((r) => r.key !== 'base' && r.key !== 'legs' && !o.outfit.rows.some((x) => x.key === r.key) && !choice.add.includes(r.key)).map((r) => r.key) : []);
</script>

{#if o.state !== 'none'}
  <section class="wear" aria-labelledby="wear-h" data-wear-card>
    <h2 id="wear-h" class="lbl"><Shirt size={16} aria-hidden="true" />{o.win?.tomorrow ? t('What do I wear tomorrow?') : t('What do I wear today?')}</h2>
    {#if o.state === 'ok'}
      <p class="meta num">{meta}</p>
      {#if edit && sets.length}
        <div class="wsets" role="group" aria-label={t('Clothing sets')} data-wear-sets>
          <button type="button" class="wset" aria-pressed={!active} onclick={() => chooseSet(AUTO)} data-wear-set="auto">{t('Automatic|wear')}</button>
          {#each chips.filter((s) => moreSets || s.key === match?.key || s.key === active?.key) as s (s.key)}
            <button type="button" class="wset" aria-pressed={active?.key === s.key} onclick={() => chooseSet(s.key)} data-wear-set={s.key}>{s.name}{#if match?.key === s.key}<small>{t('fits today')}</small>{/if}</button>
          {/each}
          {#if !moreSets && hidden}<button type="button" class="wset" aria-expanded="false" onclick={() => (moreSets = true)} data-wear-more>{t('More sets ({n})', { n: hidden })}</button>{/if}
        </div>
        <p class="sh2" data-wear-setline>
          {active ? t('Set {set}: its pieces come first. Rows it has nothing for, the app fills.', { set: active.name }) : t('The app picks from all your pieces.')}
          <a href="#/blocks">{t('Edit the sets')}</a>
        </p>
        {#if active}
          {#if range?.key === active.key}
            <form class="wrange" onsubmit={(e) => (e.preventDefault(), saveRange())} data-wear-range>
              <label><span class="lbl">{t('from °C')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={range.from} oninput={() => (range.err = "")} placeholder="–" data-wear-from /></label>
              <label><span class="lbl">{t('to °C')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={range.to} oninput={() => (range.err = "")} placeholder="–" data-wear-to /></label>
              <button type="submit" class="btn sm" data-wear-rangesave>{t('Save')}</button>
              <button type="button" class="btn sm" onclick={() => (range = null)}>{t('Cancel')}</button>
              <p class="sh">{range.err || t('Empty means no border. The set fits when the felt temperature is in this range.')}</p>
            </form>
          {:else}
            <div class="acts"><button type="button" class="btn sm" onclick={openRange} data-wear-rangeopen>{tempRange(active.minC, active.maxC, t) ? t('Fits at {range}: change', { range: tempRange(active.minC, active.maxC, t) }) : t('Give the set a °C range')}</button></div>
          {/if}
        {/if}
        {#if active && !pieces.length}
          <div class="acts"><button type="button" class="btn sm" onclick={fillSet} data-wear-fill>{t('Fill the set with this suggestion')}</button></div>
        {/if}
      {/if}
      <ul>
        {#each shown.rows as r (r.key)}
          <li data-wear-row={r.key}>
            <span class="k">{t(r.name)}</span>
            {#if r.item}<span class="v">{nameOf(r.item)}{#if r.mine}<small class="own">{r.added ? t('added by you · today only') : t('chosen by you · today only')}</small>{:else if r.fromSet && active}<small class="own" data-wear-fromset>{r.light ? t('from the set · too light for {c} °C', { c: o.outfit.c }) : t('from the set')}</small>{/if}</span>
            {:else if r.none}<span class="v gap">{t('nothing|wear')}<small class="own">{t('left out by you · today only')}</small></span>
            {:else if r.setOff && active}<span class="v gap">{t('nothing|wear')}<small class="own">{t('left out in the set {set}', { set: active.name })}</small></span>
            {:else}<span class="v gap">{r.rain ? t('nothing waterproof') : t('nothing warm enough')}</span>{/if}
            {#if edit}<button type="button" class="btn sm wsw" aria-expanded={swapKey === r.key} aria-controls="wsw-{r.key}" onclick={() => (swapKey = swapKey === r.key ? null : r.key)} data-wear-swap={r.key}>{t('Swap|wear')}</button>{/if}
            {#if edit && !r.item && !r.none && !r.setOff}
              {@const why = reasonText(r)}
              <div class="gapbox" data-wear-gap={why.g.kind}>
                <p>{why.text}</p>
                <div class="acts">
                  {#if why.g.unsorted}<a class="btn sm" href="#/wardrobe">{t('Sort them')}</a>{/if}
                  {#if why.g.warmest}<button type="button" class="btn sm" onclick={() => pick(r.key, why.g.warmest.id)} data-wear-anyway>{t('Take anyway: {name}', { name: nameOf(why.g.warmest) })}</button>{/if}
                  {#if GAP_RULES.some((g) => g.key === r.key)}<button type="button" class="btn sm" onclick={() => wish(r.key)} data-wear-wish>{t('Add to the wishlist')}</button>{/if}
                </div>
              </div>
            {/if}
            {#if edit && swapKey === r.key}
              <div class="swap" id="wsw-{r.key}" role="group" aria-label={t('Swap {row}', { row: t(r.name) })}>
                <p class="sh">{t('Your pieces for this, for today ({c} °C):', { c: o.outfit.c })}</p>
                {#each swapOptions(r.key, items, o.outfit.c) as op (op.item.id)}
                  <button type="button" class="opt" class:on={r.item?.id === op.item.id} aria-pressed={r.item?.id === op.item.id} onclick={() => pick(r.key, op.item.id)} data-wear-opt={op.item.id}>
                    <span class="on1">{nameOf(op.item)}</span>
                    <span class="tg {op.fit}">{t(FIT[op.fit], { c: o.outfit.c })}</span>
                    {#if rangeOf(op.item)}<small class="num">{rangeOf(op.item)}</small>{/if}
                  </button>
                {:else}
                  <p class="sh">{t('No sorted piece for this yet.')}</p>
                {/each}
                <button type="button" class="opt" class:on={r.none} aria-pressed={r.none} onclick={() => pick(r.key, NONE)} data-wear-opt="none"><span class="on1">{t('Nothing|wear')}</span><small>{remember === 'set' && active ? t('leave it out in the set') : t('leave it out today')}</small></button>
                <div class="acts">
                  {#if r.added}<button type="button" class="btn sm" onclick={() => dropRow(r.key)}>{t('Remove the row')}</button>
                  {:else if r.mine}<button type="button" class="btn sm" onclick={() => backToApp(r.key)} data-wear-back>{t('Back to the suggestion')}</button>
                  {:else if active && (r.fromSet || r.setOff)}<button type="button" class="btn sm" onclick={() => ((swapKey = null), setRow(r.key, null))} data-wear-unset>{t('Let the app pick')}</button>{/if}
                  <a class="btn sm" href="#/wardrobe">{t('Open the wardrobe')}</a>
                </div>
                {#if active}
                  <div class="acts rem" role="group" aria-label={t('Remember the swap')}>
                    <span>{t('Remember:')}</span>
                    <button type="button" class="btn sm" aria-pressed={remember === 'today'} onclick={() => setRemember('today')} data-wear-remember="today">{t('today only')}</button>
                    <button type="button" class="btn sm" aria-pressed={remember === 'set'} onclick={() => setRemember('set')} data-wear-remember="set">{t('in the set {set}', { set: active.name })}</button>
                  </div>
                {/if}
                <p class="sh">{remember === 'set' && active ? t('Goes into the set {set}. It comes again whenever the set fits.', { set: active.name }) : t('Holds for today only. Tomorrow the app suggests again.')}</p>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      {#if edit}
        <div class="acts more">
          {#if addable.length}<button type="button" class="btn sm" aria-expanded={addOpen} onclick={() => (addOpen = !addOpen)} data-wear-add>{t('+ Add a layer')}</button>{/if}
          {#if changed}<button type="button" class="btn sm" onclick={resetDay} data-wear-reset>{t('Back to the suggestion')}</button>{/if}
        </div>
        {#if addOpen}
          <div class="acts" role="group" aria-label={t('+ Add a layer')}>
            {#each addable as a (a.key)}<button type="button" class="btn sm" onclick={() => addRow(a.key)} data-wear-addrow={a.key}>{t(a.name)}</button>{/each}
          </div>
        {/if}
        {#if note}<p class="wnote2" role="status">{note.text}{#if note.undo}<button type="button" class="btn sm" onclick={runNote}>{t('Undo')}</button>{/if}</p>{/if}
        <details class="why" data-wear-why>
          <summary>{t('Why so?')}</summary>
          <ol>
            <li>{o.outfit.from === 'hour' ? t('The coldest hour of your ride: {c} °C.', { c: o.outfit.real }) : t('The lowest temperature of the day: {c} °C.', { c: o.outfit.real })}{#if o.outfit.c !== o.outfit.real}{' '}{t('From your debriefs it counts as {c} °C.', { c: o.outfit.c })}{/if}</li>
            <li>{t('Base layer and legs always. Mid layer below {mid} °C, outer layer below {outer} °C or with rain, hands below {hands} °C, head below {head} °C, feet below {feet} °C.', WHY_LIMITS)}</li>
            {#if notYet.length}<li>{t('Not needed yet today: {rows}. «+ Add a layer» adds them anyway.', { rows: rowNames(notYet) })}</li>{/if}
            <li>{t('A piece fits when its lower border is at most 2 °C above that. Of several, the one made for this temperature comes, then the lightest.')}</li>
            <li>{t('Only sorted pieces count (layer and body part), not those only for everyday.')}</li>
            {#if sets.length}<li>{t('A clothing set fits by its °C range, with rain the set Rain. Its pieces come before the app’s choice.')}</li>{/if}
          </ol>
        </details>
      {/if}
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
    overflow-wrap: break-word;
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul > li {
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
    overflow-wrap: break-word;
  }
  .gap {
    color: var(--ink-3);
    font-style: italic;
  }
  .go {
    margin-top: 10px;
    min-height: 44px;
  }
  .own {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-style: normal;
  }
  ul > li:has(.wsw) {
    grid-template-columns: minmax(6.5em, auto) minmax(0, 1fr) auto;
    align-items: center;
  }
  .wsw {
    min-height: 36px;
  }
  .gapbox,
  .swap {
    grid-column: 1 / -1;
    border-radius: var(--radius);
    padding: 8px 10px;
    font-size: var(--fs-small);
  }
  .gapbox {
    background: var(--warn-soft);
    color: var(--ink);
  }
  .gapbox p,
  .swap .sh {
    margin: 0 0 6px;
  }
  .swap {
    background: var(--paper-2);
  }
  .opt {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    width: 100%;
    min-height: 44px;
    margin: 0 0 6px;
    padding: 8px 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .opt.on {
    border-width: 2px;
    border-color: var(--accent);
  }
  .on1 {
    font-weight: 600;
  }
  .tg {
    font-size: var(--fs-small);
    border-radius: 6px;
    padding: 0 6px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tg.ok {
    background: var(--ok-soft);
    color: var(--ink);
  }
  .tg.light {
    background: var(--warn-soft);
    color: var(--ink);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .acts .btn {
    min-height: 40px;
  }
  .more {
    margin-top: 10px;
  }
  .wnote2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 10px 0 0;
    padding: 6px 10px;
    border-radius: var(--radius);
    background: var(--ok-soft);
    font-size: var(--fs-small);
  }
  .why {
    margin-top: 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .why summary {
    min-height: 40px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink);
    font-weight: 600;
  }
  .why ol {
    margin: 4px 0 0;
    padding-left: 20px;
  }
  .pf {
    margin-top: 8px;
  }
  .wrange {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 6px;
    margin: 4px 0 8px;
  }
  .wrange label {
    display: grid;
    gap: 2px;
  }
  .wrange .inp {
    width: 5.5em;
  }
  .wrange .sh {
    flex-basis: 100%;
    margin: 0;
  }
  .wsets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 4px;
  }
  .wset {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    min-height: 40px;
    padding: 4px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .wset[aria-pressed='true'] {
    border-width: 2px;
    border-color: var(--accent);
    font-weight: 600;
  }
  .wset small {
    font-weight: 400;
    color: var(--ink-3);
  }
  .sh2 {
    margin: 4px 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .rem span {
    align-self: center;
    font-size: var(--fs-small);
  }
  .rem .btn[aria-pressed='true'] {
    border-color: var(--accent);
    font-weight: 600;
  }
</style>

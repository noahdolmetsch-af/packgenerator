<script>
  import { db } from '../db.js';
  import { newTrip, lastTripOn, switchBike, WX_PRESETS } from '../trips.js';
  import { contextSummary, startEntries, applyContext, hasContext } from '../context.js';
  import { isEvent } from '../care.js';
  import { tripFromTemplate } from '../templates.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { DOMAINS, DOMAIN, BIKEPACKING, domainName, lastDomain, rememberDomain, newPackTrip, lastTripIn, readyKey, inDomain, hasBike } from '../domains.js';
  import { isInventory } from '../gear.js';
  import { rideName, rideDate, lastBikeId, buildBikeTrip, fetchHomeForecast, forecastPreset, homeOf } from '../dayride.js';

  /**
   * trip: the trip to edit, or null for "New trip".
   * A new trip is a copy of the last trip with the same bike (decision 5a),
   * or starts from a template (4.10.2026) or from the standard set.
   * v0.21.0 (package 5): a new trip asks the area first (domain; default the last one used on this
   * device). Areas without a bike skip the bike and templates; their bags come with the area.
   * v0.25.0 (M3, Noah 1a–10): for a bike trip the dialog asks what kind of trip it is (hours per day,
   * overnight stay, cooking, weather, event) and shows live what the packing list will be
   * (context.js). Editing a trip applies a changed context at once through onchange (Pack's
   * change(), so Undo works, 9b).
   */
  let { trip, trips, bikes, items, templates = [], startFrom = 'last', domain = null, defaultBikeId = null, onclose, oncreated, onchange = null } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !trip;
  // svelte-ignore state_referenced_locally
  let draft = $state(
    trip
      ? { title: trip.title, startDate: trip.startDate ?? '', days: trip.days ?? 1, bikeId: trip.bikeId ?? bikes[0]?.id }
      : // v0.25.1 (Noah 2a): a new trip starts filled in: start date (today, after 14:00 tomorrow) and
        // the bike of the open or last trip; the name follows below. "Create trip" works untouched.
        { title: '', startDate: rideDate(), days: 1, bikeId: bikes.some((b) => b.id === defaultBikeId) ? defaultBikeId : lastBikeId(trips, bikes) ?? bikes[0]?.id },
  );
  // v0.25.1 (Noah 2a): the name is made from bike, date and days until Noah types in it.
  let autoName = $state(isNew);
  // v0.25.0 (M3): the trip's context. An older trip without an overnight value shows none chosen.
  // svelte-ignore state_referenced_locally
  const was = {
    hours: trip?.hours != null ? String(trip.hours) : '',
    overnight: trip?.overnight ?? null,
    cook: !!trip?.cook,
    min: trip?.wx?.min ?? null,
    max: trip?.wx?.max ?? null,
    rain: trip?.wx?.rain ?? 'none',
    event: trip ? isEvent(trip) : false,
  };
  let ctx = $state({ ...was });
  const days = $derived(Math.max(1, Number(draft.days) || 1));
  // Noah 1a: None for 1 day, Outdoor from 2 days on, until one is chosen.
  const night = $derived(ctx.overnight ?? (isNew ? (days > 1 ? 'outdoor' : 'none') : null));
  const hoursNum = $derived(ctx.hours.trim() === '' ? null : Number(ctx.hours.replace(',', '.')));
  const hoursOk = $derived(hoursNum === null || (hoursNum >= 0.5 && hoursNum <= 24));
  const wet = $derived(ctx.rain === 'showers' || ctx.rain === 'rain');
  const wxOut = $derived(ctx.min != null || ctx.max != null || ctx.rain !== 'none' ? { min: ctx.min, max: ctx.max, rain: ctx.rain } : null);
  function pickWx(p) {
    wxTouched = true; // v0.25.1: Noah's own choice; the forecast leaves it alone
    if (ctx.min === p.min && ctx.max === p.max) (ctx.min = null), (ctx.max = null);
    else (ctx.min = p.min), (ctx.max = p.max);
  }
  /** The context fields to store (only for bike trips). */
  const ctxFields = () => ({ hours: hoursOk ? hoursNum : null, overnight: night, cook: night === 'outdoor' && ctx.cook, wx: wxOut, event: ctx.event });
  const OVERNIGHTS = [
    { key: 'none', name: 'None|overnight' },
    { key: 'lodging', name: 'Lodging' },
    { key: 'outdoor', name: 'Outdoor (tent, bivvy)' },
  ];
  // svelte-ignore state_referenced_locally
  let start = $state(startFrom);
  // A template always makes a bikepacking trip.
  // svelte-ignore state_referenced_locally
  let area = $state(templates.some((x) => x.id === startFrom) ? BIKEPACKING : DOMAIN[domain] ? domain : lastDomain());
  const byBike = $derived(isNew ? !!DOMAIN[area]?.bike : hasBike(trip));
  const fromArea = $derived(isNew && !byBike ? lastTripIn(area, trips) : null);
  const areaItems = $derived(items.filter((i) => isInventory(i) && inDomain(i, area)).length);
  // A template does not fit an area without a bike: back to "last" (copy or the area's items).
  $effect(() => {
    if (!byBike && templates.some((x) => x.id === start)) start = 'last';
  });
  let error = $state('');
  let dialog;
  const bike = $derived(bikes.find((b) => b.id === draft.bikeId));
  const from = $derived(isNew && bike ? lastTripOn(bike.id, trips) : null);
  $effect(() => {
    if (autoName) draft.title = rideName({ bike: byBike ? bike?.name : '', label: byBike ? '' : t(domainName(area)), date: draft.startDate, days });
  });

  // v0.25.1 (Noah 3a): with a home place and the internet, the weather preset comes from the
  // forecast for the start date (short timeout; offline or failed: nothing happens). Once Noah
  // picks a weather himself, the forecast no longer changes it.
  let forecast = $state.raw(null);
  let wxTouched = $state(false);
  const fcWx = $derived(isNew && byBike ? forecastPreset(forecast, draft.startDate) : null);
  const fromForecast = $derived(!!fcWx && ctx.min === fcWx.min && ctx.max === fcWx.max && ctx.rain === fcWx.rain);
  $effect(() => {
    if (!isNew) return;
    let gone = false;
    db.settings.get('homePlace').then((r) => (homeOf(r?.value) ? fetchHomeForecast(r.value) : null)).then((fc) => !gone && fc && (forecast = fc)).catch(() => {});
    return () => (gone = true);
  });
  $effect(() => {
    if (!fcWx || wxTouched) return;
    ctx.min = fcWx.min;
    ctx.max = fcWx.max;
    ctx.rain = fcWx.rain;
  });

  $effect(() => {
    dialog.showModal();
  });

  /** The start of a new bike trip (template, last trip or standard set), before its context. */
  function startTrip() {
    const tpl = templates.find((x) => x.id === start);
    const base = tpl ? tripFromTemplate({ ...draft, bike }, tpl, items) : newTrip({ ...draft, bike, overnight: night }, start === 'standard' ? [] : trips, items);
    return { base, tpl, fromCopy: !tpl && !!base.copiedFrom };
  }
  // v0.25.0 (M3): "Your packing list", live from the same pure functions as "Create trip".
  const preview = $derived.by(() => {
    if (!isNew || !byBike || !bike) return null;
    const { base, tpl, fromCopy } = startTrip();
    const fields = ctxFields();
    const trip = { ...base, ...fields, hours: fields.hours ?? base.hours ?? null };
    const start = fromCopy ? startEntries(trip, items) : base.entries;
    const from = tpl ? t('your template {name}', { name: tpl.name }) : fromCopy ? t('your last trip {title}', { title: trips.find((x) => x.id === base.copiedFrom)?.title ?? '' }) : t('your standard set');
    return { from, ...contextSummary(start, trip, items) };
  });
  const setName = (key) => (key === 'lodging' ? t('Lodging') : key === 'base' ? t('Base') : key === 'sleep' ? t('Sleep') : key === 'warm' ? t('Warm') : t('Cook'));

  async function save(event) {
    event.preventDefault();
    if (!draft.title.trim()) return (error = t('Give the trip a name.'));
    if (byBike && !bike) return (error = t('Choose a bike.'));
    if (byBike && !hoursOk) return (error = t('Riding hours per day: between 0.5 and 24, or leave it empty.'));
    if (isNew && !byBike) {
      const readyStandard = (await db.settings.get(readyKey(area)))?.value ?? null;
      const nt = newPackTrip({ ...draft, domain: area, readyStandard }, start === 'standard' ? [] : trips, items);
      await db.trips.put(nt);
      rememberDomain(area);
      oncreated?.(nt.id);
    } else if (isNew) {
      const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
      // v0.25.1: the same path as the day ride (dayride.js buildBikeTrip); wxFrom says the weather came from the forecast.
      const fields = { ...ctxFields(), ...(fromForecast ? { wxFrom: 'forecast' } : {}) };
      const nt = buildBikeTrip({ draft: $state.snapshot(draft), bike: $state.snapshot(bike), start, templates, trips, items, readyStandard, fields });
      await db.trips.put($state.snapshot(nt));
      rememberDomain(BIKEPACKING);
      oncreated?.(nt.id);
    } else {
      const changes = { title: draft.title.trim(), startDate: draft.startDate, days: Math.max(1, Number(draft.days) || 1) };
      if (byBike) {
        // v0.25.0 (M3): only what was changed here is stored (an older trip keeps its values).
        const f = ctxFields();
        if (ctx.hours !== was.hours) changes.hours = f.hours;
        if (night && (night !== was.overnight || ctx.cook !== was.cook)) Object.assign(changes, { overnight: night, cook: f.cook });
        // v0.25.1: weather chosen here is no longer "from the forecast".
        if (ctx.min !== was.min || ctx.max !== was.max || ctx.rain !== was.rain) Object.assign(changes, { wx: f.wx, wxFrom: null });
        if (ctx.event !== was.event) changes.event = ctx.event;
      }
      const switching = byBike && draft.bikeId !== trip.bikeId;
      // Another bike brings its own bags; items in a place it has no bag for go to the seat pack.
      // 9b: a changed context (duration, overnight stay, weather) applies at once, with Undo in Pack.
      const fn = (cur) => {
        const next = { ...cur, ...changes, ...(switching ? switchBike(cur, bike) : {}) };
        const out = { ...changes, ...(switching ? switchBike(cur, bike) : {}) };
        return hasContext(next) ? { ...out, ...applyContext(next, items, cur) } : out;
      };
      if (onchange) await onchange(fn);
      else await db.trips.update(trip.id, fn(await db.trips.get(trip.id)));
    }
    dialog.close();
  }

  async function remove() {
    if (!confirm(t('Delete the trip "{title}"? A backup file can bring it back.', { title: trip.title }))) return;
    await db.trips.delete(trip.id);
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} {onclose} aria-labelledby="trip-h">
  <form onsubmit={save} novalidate>
    <h2 id="trip-h" class="title">{isNew ? t('New trip') : t('Trip details')}</h2>
    <div class="grid">
      {#if isNew}
        <!-- v0.21.0 (package 5): the area first; it decides bike or own bags. -->
        <fieldset class="wide area">
          <legend class="lbl">{t('Area')}</legend>
          <div class="areas">
            {#each DOMAINS as d (d.key)}<button type="button" class="toggle" aria-pressed={area === d.key} onclick={() => (area = d.key)}>{t(d.name)}</button>{/each}
          </div>
        </fieldset>
      {/if}
      <label class="wide"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.title} oninput={() => (autoName = false)} placeholder={t('e.g. Jura weekend')} required /></label>
      <label><span class="lbl">{t('Start date')}</span><input class="inp" type="date" bind:value={draft.startDate} /></label>
      {#if byBike}
        <label>
          <span class="lbl">{t('Bike')}</span>
          <select class="sel" bind:value={draft.bikeId}>
            {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
          </select>
        </label>
      {:else}
        <label><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" bind:value={draft.days} /></label>
      {/if}
    </div>
    {#if byBike}
      <!-- v0.25.0 (M3, Noah 1a): what kind of trip it is, all on one page. -->
      <fieldset class="ctx">
        <legend class="lbl">{t('How long?')}</legend>
        <div class="grid">
          <label><input class="inp num" type="number" min="1" max="60" bind:value={draft.days} aria-label={t('Days')} /><span class="sub">{t('Days')}</span></label>
          <label><input class="inp num" type="text" inputmode="decimal" bind:value={ctx.hours} placeholder={t('e.g. 2')} aria-label={t('Riding hours per day')} aria-invalid={!hoursOk} /><span class="sub">{t('Riding hours per day')}</span></label>
        </div>
        {#if !hoursOk}<p class="warn">{t('Riding hours per day: between 0.5 and 24, or leave it empty.')}</p>{/if}
      </fieldset>
      <fieldset class="ctx">
        <legend class="lbl">{t('Overnight')}</legend>
        <div class="chips">
          {#each OVERNIGHTS as o (o.key)}<button type="button" class="toggle" aria-pressed={night === o.key} onclick={() => (ctx.overnight = o.key)}>{t(o.name)}</button>{/each}
        </div>
        {#if !night}<p class="note">{t('Not set for this trip: its list stays as it is until you choose.')}</p>{/if}
        {#if days > 1 && night === 'none'}<p class="note">{t('More than one day without a night? Choose where you sleep.')}</p>{/if}
        <!-- Noah 3a: cooking only for a night outdoors. -->
        {#if night === 'outdoor'}<label class="ck"><input type="checkbox" bind:checked={ctx.cook} /> {t('Cooking')}</label>{/if}
      </fieldset>
      <fieldset class="ctx">
        <legend class="lbl">{t('Weather')}</legend>
        <div class="chips">
          {#each WX_PRESETS as p (p.name)}<button type="button" class="toggle" aria-pressed={ctx.min === p.min && ctx.max === p.max} onclick={() => pickWx(p)}>{t(p.name)} <small>{p.min}–{p.max}°</small>{#if fromForecast && ctx.min === p.min && ctx.max === p.max}<small class="fcmark">{t('from forecast')}</small>{/if}</button>{/each}
          <button type="button" class="toggle" aria-pressed={wet} onclick={() => ((wxTouched = true), (ctx.rain = wet ? 'none' : 'rain'))}>+ {t('Rain')}</button>
        </div>
        {#if fromForecast}<p class="note small fc">{t('From the forecast for {place}', { place: forecast.place?.name ?? '' })}</p>
        {:else}<p class="note small">{t('or get the forecast later in Pack (Edit trip conditions)')}</p>{/if}
      </fieldset>
      <label class="ck ev"><input type="checkbox" bind:checked={ctx.event} /> {t('Event (race or organised ride)')}</label>
    {/if}
    {#if isNew && !byBike}
      {#if fromArea}
        <label class="start"><span class="lbl">{t('Start from')}</span>
          <select class="sel" bind:value={start}>
            <option value="last">{t('Last {area} trip: {title}', { area: t(domainName(area)), title: fromArea.title })}</option>
            <option value="standard">{t('Items of this area')}</option>
          </select>
        </label>
      {/if}
      <p class="note">
        {#if fromArea && start !== 'standard'}{t('A copy of {title}. Nothing is ticked off yet.', { title: fromArea.title })}
        {:else if areaItems}{t('Starts with the {area} items marked worn, standard or "On every trip". Bags: {bags}.', { area: t(domainName(area)), bags: DOMAIN[area].packs.map((p) => t(p.name)).join(', ') })}
        {:else}{t('No items for {area} yet, so the list starts empty. Add items in Pack (search finds all your gear), or in Gear: open an item and tick {area} under Areas.', { area: t(domainName(area)) })}{/if}
      </p>
    {:else if isNew}
      <label class="start"><span class="lbl">{t('Start from')}</span>
        <select class="sel" bind:value={start}>
          <option value="last">{from ? t('Last trip on this bike: {title}', { title: from.title }) : t('Last trip on this bike (none yet)')}</option>
          {#each templates as tp (tp.id)}<option value={tp.id}>{t('Template: {name}', { name: tp.name })}</option>{/each}
          <option value="standard">{t('Standard set')}</option>
        </select>
      </label>
      <!-- v0.25.0 (M3): live, from the same functions as "Create trip" (context.js). -->
      {#if preview}
        <section class="plan" aria-labelledby="plan-h" aria-live="polite">
          <h3 id="plan-h">{t('Your packing list|preview')}</h3>
          <ul>
            <li>{tn(preview.start, '{n} item from {from}', '{n} items from {from}', { from: preview.from })}{#if start === 'last' && from}{' '}<span class="muted">{t('(a copy, nothing ticked off)')}</span>{/if}</li>
            {#if preview.amounts.length}<li>{t('By duration')}: {#each preview.amounts as a, n (a.item.id)}{n ? ', ' : ''}{nameOf(a.item)} <b>{a.qty}</b>{/each}</li>{/if}
            {#if preview.weather.length}<li>{t('For the weather')}: {preview.weather.map((i) => nameOf(i)).join(', ')}</li>{/if}
            {#if night === 'lodging'}<li>{t('Overnight: lodging set, {n} more', { n: preview.sets[0]?.n ?? 0 })}</li>
            {:else if night === 'outdoor'}<li>{t('Overnight outdoors: {sets}', { sets: preview.sets.map((x) => `${setName(x.key)} ${x.n}`).join(', ') })}</li>{/if}
            {#if preview.left.length}<li class="muted">{preview.left.includes('overnight') && preview.left.includes('event') ? t('Not included: overnight gear, event preparation') : preview.left.includes('overnight') ? t('Not included: overnight gear') : t('Not included: event preparation')}</li>{/if}
          </ul>
          <p class="muted small">{tn(preview.total, 'Together {n} item. You can change everything in Pack.', 'Together {n} items. You can change everything in Pack.')}</p>
        </section>
      {/if}
    {:else if byBike && draft.bikeId !== trip.bikeId}
      <p class="note">{t('The trip takes the bags of the new bike. Items in a place without a bag move to the seat pack.')}</p>
    {/if}
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{isNew ? t('Create trip') : t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete trip')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .area {
    border: 0;
    margin: 0;
    padding: 0;
  }
  .areas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .toggle {
    min-height: 40px;
    border: 1.5px solid var(--ink-3);
    background: var(--paper);
    border-radius: 999px;
    padding: 5px 14px;
    font: 600 15px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  /* v0.25.1 (Noah 3a): the preset the forecast chose. */
  .fcmark {
    margin-left: 6px;
    font-weight: 500;
    opacity: 0.85;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  /* v0.25.0 (M3): the context of a bike trip and the live "Your packing list". */
  .ctx {
    border: 0;
    margin: 14px 0 0;
    padding: 0;
    min-width: 0;
  }
  .ctx .grid label,
  .ctx label {
    display: grid;
    gap: 2px;
  }
  .sub {
    font-size: 13px;
    color: var(--ink-2);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ck {
    display: flex !important;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    min-height: 40px;
  }
  .ck input {
    width: 20px;
    height: 20px;
  }
  .ev {
    margin-top: 12px;
    font-weight: 600;
  }
  .warn {
    color: var(--bad);
    font-size: 14px;
    margin: 6px 0 0;
  }
  .plan {
    margin-top: 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
    background: var(--paper-2, var(--paper));
  }
  .plan h3 {
    margin: 0 0 6px;
    font-size: 17px;
  }
  .plan ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 4px;
  }
  .muted {
    color: var(--ink-2);
  }
  .small {
    font-size: 13px;
  }
  .start {
    display: grid;
    gap: 4px;
    margin-top: 12px;
  }
  h2 {
    font-size: var(--fs-section);
    margin: 0 0 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  /* v0.25.0: at 320 px the bike name needs the whole width. */
  @media (max-width: 360px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 12px 0 0;
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: 14px;
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
</style>

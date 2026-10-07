<script>
  import { db } from '../db.js';
  import { newTrip, lastTripOn, switchBike } from '../trips.js';
  import { tripFromTemplate } from '../templates.js';
  import { t } from '../i18n.svelte.js';
  import { DOMAINS, DOMAIN, BIKEPACKING, domainName, lastDomain, rememberDomain, newPackTrip, lastTripIn, readyKey, inDomain, hasBike } from '../domains.js';
  import { isInventory } from '../gear.js';

  /**
   * trip: the trip to edit, or null for "New trip".
   * A new trip is a copy of the last trip with the same bike (decision 5a),
   * or starts from a template (4.10.2026) or from the standard set.
   * v0.21.0 (package 5): a new trip asks the area first (domain; default the last one used on this
   * device). Areas without a bike skip the bike and templates; their bags come with the area.
   */
  let { trip, trips, bikes, items, templates = [], startFrom = 'last', domain = null, defaultBikeId = null, onclose, oncreated } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !trip;
  // svelte-ignore state_referenced_locally
  let draft = $state(
    trip
      ? { title: trip.title, startDate: trip.startDate ?? '', days: trip.days ?? 1, bikeId: trip.bikeId ?? bikes[0]?.id }
      : { title: '', startDate: '', days: 1, bikeId: defaultBikeId ?? bikes[0]?.id },
  );
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
    dialog.showModal();
  });

  async function save(event) {
    event.preventDefault();
    if (!draft.title.trim()) return (error = t('Give the trip a name.'));
    if (byBike && !bike) return (error = t('Choose a bike.'));
    if (isNew && !byBike) {
      const readyStandard = (await db.settings.get(readyKey(area)))?.value ?? null;
      const nt = newPackTrip({ ...draft, domain: area, readyStandard }, start === 'standard' ? [] : trips, items);
      await db.trips.put(nt);
      rememberDomain(area);
      oncreated?.(nt.id);
    } else if (isNew) {
      const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
      const tpl = templates.find((x) => x.id === start);
      const nt = tpl
        ? tripFromTemplate({ ...draft, bike }, tpl, items)
        : newTrip({ ...draft, bike, readyStandard }, start === 'standard' ? [] : trips, items);
      await db.trips.put(nt);
      rememberDomain(BIKEPACKING);
      oncreated?.(nt.id);
    } else {
      const changes = { title: draft.title.trim(), startDate: draft.startDate, days: Math.max(1, Number(draft.days) || 1) };
      // Another bike brings its own bags; items in a place it has no bag for go to the seat pack.
      if (byBike && draft.bikeId !== trip.bikeId) Object.assign(changes, switchBike(trip, bike));
      await db.trips.update(trip.id, changes);
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
      <label class="wide"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.title} placeholder={t('e.g. Jura weekend')} required /></label>
      <label><span class="lbl">{t('Start date')}</span><input class="inp" type="date" bind:value={draft.startDate} /></label>
      <label><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" bind:value={draft.days} /></label>
      {#if byBike}
        <label class="wide">
          <span class="lbl">{t('Bike')}</span>
          <select class="sel" bind:value={draft.bikeId}>
            {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
          </select>
        </label>
      {/if}
    </div>
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
      <p class="note">
        {#if templates.some((x) => x.id === start)}{t('Items go into the bags of this bike. Weather and ticks start empty.')}
        {:else if start === 'last' && from}{t('A copy of {title}. Nothing is ticked off yet.', { title: from.title })}
        {:else}{t('Your standard set: worn, standard pack, overnight base and the items "On every trip".')}{/if}
      </p>
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
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .start {
    display: grid;
    gap: 4px;
    margin-top: 12px;
  }
  h2 {
    font-size: 32px;
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
  .note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 12px 0 0;
  }
  .err {
    color: #b42318;
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
    border-color: #b42318;
    color: #b42318;
  }
</style>

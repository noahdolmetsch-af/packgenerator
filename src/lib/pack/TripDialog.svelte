<script>
  import { db } from '../db.js';
  import { newTrip, lastTripOn, slotFor } from '../trips.js';
  import { tripFromTemplate } from '../templates.js';

  /**
   * trip: the trip to edit, or null for "New trip".
   * A new trip is a copy of the last trip with the same bike (decision 5a),
   * or starts from a template (4.10.2026) or from the standard set.
   */
  let { trip, trips, bikes, items, templates = [], startFrom = 'last', defaultBikeId = null, onclose, oncreated } = $props();

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
  let error = $state('');
  let dialog;
  const bike = $derived(bikes.find((b) => b.id === draft.bikeId));
  const from = $derived(isNew && bike ? lastTripOn(bike.id, trips) : null);

  $effect(() => {
    dialog.showModal();
  });

  async function save(event) {
    event.preventDefault();
    if (!draft.title.trim()) return (error = 'Give the trip a name.');
    if (!bike) return (error = 'Choose a bike.');
    if (isNew) {
      const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
      const tpl = templates.find((x) => x.id === start);
      const t = tpl
        ? tripFromTemplate({ ...draft, bike }, tpl, items)
        : newTrip({ ...draft, bike, readyStandard }, start === 'standard' ? [] : trips, items);
      await db.trips.put(t);
      oncreated?.(t.id);
    } else {
      const changes = { title: draft.title.trim(), startDate: draft.startDate, days: Math.max(1, Number(draft.days) || 1) };
      if (draft.bikeId !== trip.bikeId) {
        // Another bike brings its own bags; items in a place it has no bag for go to the seat pack.
        const setup = { ...(bike.setup ?? {}) };
        changes.bikeId = bike.id;
        changes.bike = bike.name;
        changes.setup = setup;
        changes.entries = trip.entries.map((e) => (e.slot === 'body' || e.slot === 'mounted' || setup[e.slot] ? e : { ...e, slot: slotFor(e.slot, setup) }));
      }
      await db.trips.update(trip.id, changes);
    }
    dialog.close();
  }

  async function remove() {
    if (!confirm(`Delete the trip "${trip.title}"? A backup file can bring it back.`)) return;
    await db.trips.delete(trip.id);
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} {onclose} aria-labelledby="trip-h">
  <form onsubmit={save} novalidate>
    <h2 id="trip-h" class="title">{isNew ? 'New trip' : 'Trip details'}</h2>
    <div class="grid">
      <label class="wide"><span class="lbl">Name</span><input class="inp" bind:value={draft.title} placeholder="e.g. Jura weekend" required /></label>
      <label><span class="lbl">Start date</span><input class="inp" type="date" bind:value={draft.startDate} /></label>
      <label><span class="lbl">Days</span><input class="inp num" type="number" min="1" max="60" bind:value={draft.days} /></label>
      <label class="wide">
        <span class="lbl">Bike</span>
        <select class="sel" bind:value={draft.bikeId}>
          {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
        </select>
      </label>
    </div>
    {#if isNew}
      <label class="start"><span class="lbl">Start from</span>
        <select class="sel" bind:value={start}>
          <option value="last">{from ? `Last trip on this bike: ${from.title}` : 'Last trip on this bike (none yet)'}</option>
          {#each templates as t (t.id)}<option value={t.id}>Template: {t.name}</option>{/each}
          <option value="standard">Standard set</option>
        </select>
      </label>
      <p class="note">
        {#if templates.some((t) => t.id === start)}Items go into the bags of this bike. Weather and ticks start empty.
        {:else if start === 'last' && from}A copy of <b>{from.title}</b>. Nothing is ticked off yet.
        {:else}Your standard set: worn, standard pack, overnight base and the items "On every trip".{/if}
      </p>
    {:else if draft.bikeId !== trip.bikeId}
      <p class="note">The trip takes the bags of the new bike. Items in a place without a bag move to the seat pack.</p>
    {/if}
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{isNew ? 'Create trip' : 'Save'}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>Cancel</button>
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>Delete trip</button>{/if}
    </div>
  </form>
</dialog>

<style>
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

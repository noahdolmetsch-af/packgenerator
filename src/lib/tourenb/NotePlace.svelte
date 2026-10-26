<script>
  /**
   * Idee 55 «Notiz an einen späteren Ort» (Touren b, mockup B55): «An einem Ort der Strecke». Choose a tour with a
   * route and a point on it (the km slider over the elevation profile, or a planned stop); the note comes on the
   * live map of that tour 500 m before the point. value: bindable note.at2 (placenote.js) or undefined.
   */
  import { liveQuery } from 'dexie';
  import { MapPin, BellOff } from '@lucide/svelte';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { tripsWithRoute } from '../stops/nearby.js';
  import { pointAtKm, placeOf, AHEAD_M } from './placenote.js';
  import { t, num } from '../i18n.svelte.js';

  let { value = $bindable() } = $props();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const today = localDay();
  const trips = $derived(tripsWithRoute($tripsQ ?? [], today).slice(0, 12));
  // svelte-ignore state_referenced_locally
  const p0 = placeOf({ at2: value });
  // svelte-ignore state_referenced_locally
  let tripId = $state(p0?.tripId ?? '');
  // svelte-ignore state_referenced_locally
  let km = $state(p0?.km ?? 0);
  // svelte-ignore state_referenced_locally
  let name = $state(p0?.name ?? '');
  $effect(() => {
    if (!tripId && trips.length) tripId = trips[0].id;
  });
  const trip = $derived(trips.find((x) => x.id === tripId) ?? null);
  const total = $derived(Math.round(Number(trip?.route?.km) || 0));
  const stops = $derived((trip?.fuelStops ?? []).filter((s) => Number.isFinite(s.km)));
  // the elevation profile as a path (0..400 × 0..100)
  const path = $derived.by(() => {
    const pr = (trip?.route?.profile ?? []).filter((x) => Array.isArray(x) && x.length > 1);
    if (pr.length < 2) return '';
    const maxK = pr.at(-1)[0] || 1;
    const hs = pr.map((x) => x[1]);
    const lo = Math.min(...hs);
    const hi = Math.max(...hs, lo + 1);
    return pr.map(([k, h], i) => `${i ? 'L' : 'M'}${((k / maxK) * 400).toFixed(1)} ${(95 - ((h - lo) / (hi - lo)) * 80).toFixed(1)}`).join(' ');
  });
  const set = () => {
    const p = trip ? pointAtKm(trip.route, km) : null;
    value = p ? { tripId: trip.id, ...p, ...(name.trim() ? { name: name.trim().slice(0, 60) } : {}) } : undefined;
  };
  const pickStop = (s) => {
    km = s.km;
    name = s.name ?? '';
    set();
  };
</script>

<div class="np" data-note-place>
  {#if !trips.length}
    <p class="tp-small tp-muted">{t('No tour with a route yet. With a GPX route you can choose a point on it.')}</p>
  {:else}
    <label class="fld"><span class="np-lbl">{t('Tour')}</span>
      <select class="sel" bind:value={tripId} onchange={() => ((km = 0), (name = ''), value && set())} data-np-trip>
        {#each trips as x (x.id)}<option value={x.id}>{x.title || t('Untitled trip')}</option>{/each}
      </select>
    </label>
    {#if path}<svg class="prof" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><path d={`${path} L400 100 L0 100 Z`} class="fill" /><path d={path} class="line" /><line x1={total ? (km / total) * 400 : 0} x2={total ? (km / total) * 400 : 0} y1="0" y2="100" class="mark" /></svg>{/if}
    <label class="fld"><span class="np-lbl">{t('Point of the route: km {km}', { km: num(Math.round(km)) })}</span>
      <input type="range" min="0" max={total || 1} step="1" bind:value={km} onchange={set} aria-label={t('Kilometre of the route')} data-np-km />
    </label>
    {#if stops.length}
      <div class="tp-chips" role="group" aria-label={t('Planned stops')}>
        {#each stops as s (s.km + s.name)}<button type="button" class="tp-chip" aria-pressed={value && Math.round(value.km) === Math.round(s.km)} onclick={() => pickStop(s)}>{s.name || t('Stop|eat')} · km {num(Math.round(s.km))}</button>{/each}
      </div>
    {/if}
    <label class="fld"><span class="np-lbl">{t('Name of the place (optional)')}</span><input class="inp" bind:value={name} onchange={() => value && set()} placeholder={t('e.g. Fountain at the pass')} /></label>
    {#if value}
      <p class="np-on" role="status"><MapPin size={16} aria-hidden="true" />{t('Comes {m} m before km {km} on the live map of this tour.', { m: AHEAD_M, km: num(Math.round(value.km ?? 0)) })} <button type="button" class="btn sm" onclick={() => (value = undefined)} data-np-off><BellOff size={16} aria-hidden="true" />{t('No place reminder')}</button></p>
    {:else}
      <button type="button" class="btn sm hi" onclick={set} data-np-set><MapPin size={16} aria-hidden="true" />{t('Remind me at this point')}</button>
    {/if}
    <p class="tp-small tp-muted">{t('Only with the live map open and your place switched on.')}</p>
  {/if}
</div>

<style>
  .np {
    display: grid;
    gap: 8px;
    margin: 8px 0;
  }
  .fld {
    display: grid;
    gap: 4px;
  }
  .np-lbl {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .prof {
    width: 100%;
    height: 80px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .prof .fill {
    fill: color-mix(in srgb, var(--accent) 22%, transparent);
  }
  .prof .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .prof .mark {
    stroke: var(--ink);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  input[type='range'] {
    width: 100%;
    min-height: 44px;
  }
  .np-on {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
</style>

<script>
  /**
   * Paket X «Energie» on the live map: what this ride has used so far (the one rule of energie.js: your
   * weight, the riding time, the km and the climbing on the route), what to eat and drink per hour
   * (your Verpflegung values, the temperature from the weather core where you are). A guess, said so.
   * Live.svelte mounts it with one line in the sheet, after the eat card (owner: Live-Karte).
   */
  import { liveQuery } from 'dexie';
  import { Flame } from '@lucide/svelte';
  import { db } from '../db.js';
  import { FUEL_KEY, valuesOf } from '../fuel.js';
  import { loadCore, hoursBetween } from '../wetter/kern.js';
  import { RIDER_KEY } from '../weight.js';
  import { energyFor, riderKg } from '../energie.js';
  import { gainBetween } from './live-lib.js';
  import { t, num } from '../i18n.svelte.js';

  let { rideKm = 0, movingS = 0, profile = [], km = null, me = null } = $props();
  // the temperature where you are now (the weather core, at most once an hour)
  let tempC = $state(null);
  let wxAt = 0;
  $effect(() => {
    if (!me || navigator.onLine === false || Date.now() - wxAt < 60 * 6e4) return;
    wxAt = Date.now();
    loadCore(db, { lat: me.lat, lon: me.lon })
      .then((c) => {
        const h = c ? hoursBetween(c, Date.now() - 36e5, Date.now() + 36e5) : [];
        const temps = h.map((x) => x.temp).filter(Number.isFinite);
        tempC = temps.length ? Math.max(...temps) : null;
      })
      .catch(() => {});
  });
  const fuelQ = liveQuery(() => db.settings.get(FUEL_KEY));
  const kgQ = liveQuery(() => db.settings.get(RIDER_KEY));
  let fromKm = $state(null);
  $effect(() => {
    if (fromKm == null && km != null) fromKm = km;
  });
  const gainM = $derived(fromKm != null && km != null && profile?.length > 1 ? gainBetween(profile, fromKm, km) : 0);
  const hours = $derived((Number(movingS) || 0) / 3600);
  const e = $derived(energyFor({ hours, km: rideKm, gainM, tempC, kg: riderKg($kgQ?.value), fuel: $fuelQ?.value ?? null }));
</script>

{#if hours >= 0.1}
  <p class="le-line" data-live-energy>
    <Flame size={18} aria-hidden="true" />
    <span>{t('So far about {kcal} kcal used.', { kcal: num(e.burn) })} {t('Eat about {g} g carbohydrates and drink about {l} L per hour.', { g: num(valuesOf($fuelQ?.value).carbsGh), l: num(e.waterLh) })} <small>{t('A guess from your weight, time, km and climbing.')}</small></span>
  </p>
{/if}

<style>
  .le-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    overflow-wrap: break-word;
  }
  .le-line small {
    color: var(--ink-2);
  }
</style>

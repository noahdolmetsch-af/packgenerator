<script>
  /**
   * Paket X «Energie» for the ride review: what the ride used (the number of Strava or the Garmin when
   * there is one, else the guess of the one rule, energie.js) and what such a ride needs next time:
   * carbohydrates and water from your Verpflegung values. A small piece, mounted with one line by the
   * owner of the review (Tour-Auswertung): <RideEnergy km={…} hm={…} movingS={…} kcal={…} tempC={…} />.
   */
  import { liveQuery } from 'dexie';
  import { Flame } from '@lucide/svelte';
  import { db } from '../db.js';
  import { FUEL_KEY } from '../fuel.js';
  import { RIDER_KEY } from '../weight.js';
  import { energyFor, riderKg } from '../energie.js';
  import { t, num } from '../i18n.svelte.js';

  let { km = 0, hm = 0, movingS = 0, kcal = null, tempC = null } = $props();
  const fuelQ = liveQuery(() => db.settings.get(FUEL_KEY));
  const kgQ = liveQuery(() => db.settings.get(RIDER_KEY));
  const e = $derived(energyFor({ hours: (Number(movingS) || 0) / 3600, km: Number(km) || 0, gainM: Number(hm) || 0, tempC: Number.isFinite(tempC) ? tempC : null, kg: riderKg($kgQ?.value), fuel: $fuelQ?.value ?? null }));
  const measured = $derived(Number(kcal) > 0 ? Math.round(kcal) : null);
</script>

{#if e.hours >= 0.25}
  <section class="re" aria-label={t('Energy')} data-ride-energy>
    <p class="re-line">
      <Flame size={18} aria-hidden="true" />
      <span>{measured ? t('Used: {kcal} kcal (measured); the app guessed {guess} kcal.', { kcal: num(measured), guess: num(e.burn) }) : t('Used: about {kcal} kcal (a guess from your weight, time, km and climbing).', { kcal: num(e.burn) })}</span>
    </p>
    <p class="re-line re-next">{t('Next time for such a ride: about {g} g carbohydrates and {l} L to drink.', { g: num(e.carbsG), l: num(e.waterL) })} <a href="#/trips/fuel">{t('Change your values')}</a></p>
  </section>
{/if}

<style>
  .re {
    display: grid;
    gap: 4px;
  }
  .re-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    overflow-wrap: break-word;
  }
  .re-next {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>

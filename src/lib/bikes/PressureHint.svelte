<script>
  /**
   * «Werte messen» W4a + 5a (Noah 15.10.2026): the line under «Target pressure»: «Suggestion 1.6 / 1.7
   * bar · use it · calculate». Shown on Enter values, in the Pick-up check and on the Bike pass. The
   * suggestion comes from lib/messen.js (you + bike + the luggage of the next trip, the tyre width,
   * tubeless, the ground of the width); «use it» writes it as the bike's target, «calculate» opens the
   * window with every choice. Nothing is shown when the weight or the width is not known.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { fitValue, setFit } from '../bikespecs.js';
  import { tyreSetup } from '../workshop.js';
  import { tripStats } from '../trips.js';
  import { nextTrip } from '../debrief.js';
  import { pressureStart, suggestPressure } from '../messen.js';
  import { t, num } from '../i18n.svelte.js';
  import MessenDialog from './MessenDialog.svelte';

  let { bikeId, take = true } = $props();

  const today = localDay();
  // svelte-ignore state_referenced_locally
  const bikeQ = liveQuery(() => db.bikes.get(bikeId));
  const visitsQ = liveQuery(() => db.visits.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());

  const bike = $derived($bikeQ ?? null);
  const sugg = $derived.by(() => {
    if (!bike) return null;
    const trip = nextTrip(($tripsQ ?? []).filter((x) => x.bikeId === bike.id), today);
    const s = trip ? tripStats(trip, $itemsQ ?? [], $bagsQ ?? [], bike, null) : null;
    const start = pressureStart(bike, { riderG: $riderQ?.value ?? null, luggageG: s ? s.gearG + s.onMeG + s.bagsG : null, tyres: tyreSetup(bike, $visitsQ ?? []) });
    return suggestPressure(start);
  });
  const same = $derived(!!bike && !!sugg && fitValue(bike, 'pressureF') === sugg.f && fitValue(bike, 'pressureR') === sugg.r);
  let calc = $state(false);

  async function use() {
    const fresh = await db.bikes.get(bikeId);
    if (!fresh || !sugg) return;
    const a = setFit(fresh, 'pressureF', sugg.f);
    const b = setFit({ ...fresh, ...a }, 'pressureR', sugg.r);
    await db.bikes.update(bikeId, { ...a, ...b });
  }
</script>

<span class="phint" data-testid="pressure-hint">
  {#if sugg}
    <span class="num">{t('Suggestion {f} / {r} bar', { f: num(sugg.f), r: num(sugg.r) })}</span>
    {#if take && !same}<button type="button" class="lk" onclick={use}>{t('use it')}</button>{/if}
    {#if same}<span>{t('set like this')}</span>{/if}
  {/if}
  <button type="button" class="lk" onclick={() => (calc = true)}>{t('Calculate the pressure')}</button>
</span>
{#if calc}<MessenDialog kind="calc" {bikeId} onclose={() => (calc = false)} />{/if}

<style>
  .phint {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 12px;
    margin-top: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
</style>

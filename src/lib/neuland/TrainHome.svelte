<script>
  /**
   * «Zug hin, Velo heim» (Träume und Neuland N7, Noah 27.10.2026 «1-5 a»), on Touren › Träume: three places in
   * areas you do not know, about the chosen ride from home; a tap shows the next trains there and the way home
   * by bike (TrainHomeSheet). Rules in zugheim.js. Nothing is asked online before the tap.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { readRaw, computeFrom } from './store.js';
  import { trainStarts, RIDE_KM, RIDE_KM_STD } from './zugheim.js';
  import Seg from '../ui/Seg.svelte';
  import TrainHomeSheet from './TrainHomeSheet.svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import { TrainFront } from '@lucide/svelte';

  const rawQ = liveQuery(() => readRaw(db));
  let cols = $state.raw(null);
  $effect(() => {
    const raw = $rawQ;
    if (!raw?.homePlace) return;
    let live = true;
    computeFrom(raw, { only: ['municipalities'] })
      .then((r) => live && (cols = r.collections))
      .catch((err) => console.error(err));
    return () => (live = false);
  });
  const home = $derived($rawQ?.homePlace ?? null);
  let rideKm = $state(RIDE_KM_STD);
  const starts = $derived(cols && home ? trainStarts(cols, home, { rideKm }) : null);
  let open = $state(null);
</script>

{#if home}
  <section class="ich-sec" aria-labelledby="th-h" data-train-home>
    <div class="ich-h">
      <div>
        <h2 id="th-h">{t('Train there, bike home')}</h2>
        <p class="ich-hs">{t('By train to an area you do not know, then ride home through new ground.')}</p>
      </div>
    </div>
    <div class="card ich-body th">
      <Seg small full={false} label={t('Ride home')} value={String(rideKm)} onchange={(v) => (rideKm = Number(v))} options={RIDE_KM.map((k) => ({ key: String(k), name: `${k} km` }))} />
      {#if !starts}
        <p class="ich-help" role="status">{t('Looking for places …')}</p>
      {:else if starts.length}
        <ul class="th-list">
          {#each starts as x (x.id)}
            <li class="th-row" data-th-start={x.id}>
              <span class="ich-ib"><TrainFront size={18} aria-hidden="true" /></span>
              <span class="th-m"><b>{x.name}</b><small>{t('≈ {km} km home', { km: num(x.rideKm) })} · {tn(x.around, '{n} new municipality around', '{n} new municipalities around')}</small></span>
              <button type="button" class="btn sm" onclick={() => (open = x)} data-th-open>{t('Trains and the way home')}</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="ich-help">{t('No new place at this distance. Choose another distance.')}</p>
      {/if}
    </div>
  </section>
{/if}

{#if open}<TrainHomeSheet {home} start={open} onclose={() => (open = null)} />{/if}

<style>
  .th {
    display: grid;
    gap: var(--sp-3);
  }
  .th-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .th-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
  }
  .th-m {
    flex: 1;
    min-width: 10em;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow-wrap: break-word;
  }
  .th-m small {
    color: var(--ink-3);
  }
</style>

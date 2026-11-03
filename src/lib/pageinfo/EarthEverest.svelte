<script>
  /**
   * «Wusstest du» WD2 (Noah 14.10.2026, mockups approved 18:34 «wd1-wd3 freigegeben», «2a»): next to the
   * sums of Vergangene Touren, how far the km of the period go around the Earth and how often the metres
   * climbed go up the Everest. Part of «Also knowledge and fun»: the switch «Only useful tips» hides it.
   * Paket E, Idee 25 (Noah 03.11.2026 «E und F»): a third card counts the metres in a Swiss mountain
   * («1.3× Säntis»); it fits by itself and can be chosen by hand (kept in the setting far.mountain).
   */
  import { Globe, Mountain, MountainSnow } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { MOUNTAINS, MOUNTAIN_KEY, AUTO, choiceOf, mountainOf } from './berge.js';
  import { pageInfo } from './store.svelte.js';
  import { farOf, EARTH_KM, EVEREST_M } from '../pageinfo.js';
  import { t, num } from '../i18n.svelte.js';

  let { km = null, gainM = null } = $props();
  const pi = pageInfo();
  const far = $derived(farOf(km, gainM));
  // Idee 25: the Swiss mountain, chosen by hand or fitted to the metres
  let choice = $state(AUTO);
  $effect(() => {
    const sub = liveQuery(() => db.settings.get(MOUNTAIN_KEY)).subscribe({ next: (x) => (choice = choiceOf(x?.value)) });
    return () => sub.unsubscribe();
  });
  const berg = $derived(mountainOf(gainM, choice));
  const pick = (e) => putSetting(db, MOUNTAIN_KEY, e.currentTarget.value === AUTO ? null : { key: e.currentTarget.value });
</script>

{#if pi.loaded && pi.info.knowOn && (far.earth || far.everest || berg)}
  <div class="far" data-section="far">
    {#if far.earth}
      {@const e = far.earth}
      <div class="card fc" data-far="earth">
        <span class="top"><span class="ib" aria-hidden="true"><Globe size={20} /></span><span><b class="num">{e.x < 1 ? t('{n} % around the Earth', { n: num(e.pct) }) : t('{x}× around the Earth', { x: num(e.x) })}</b><small class="num">{t('{km} of {of} km at the equator', { km: num(Math.round(km)), of: num(EARTH_KM) })}</small></span></span>
        <span class="bar" role="img" aria-label="{Math.round(e.fill * 100)} %"><i style="width:{Math.max(2, Math.round(e.fill * 100))}%"></i></span>
        <small class="num">{e.next === 1 ? t('{n} km to go.', { n: num(e.left) }) : t('{n} km to round {r}.', { n: num(e.left), r: e.next })}</small>
      </div>
    {/if}
    {#if far.everest}
      {@const v = far.everest}
      <div class="card fc" data-far="everest">
        <span class="top"><span class="ib" aria-hidden="true"><Mountain size={20} /></span><span><b class="num">{t('{x}× Everest', { x: num(v.x) })}</b><small class="num">{t('{m} m climbed · one Everest = {of} m', { m: num(Math.round(gainM)), of: num(EVEREST_M) })}</small></span></span>
        <span class="bar" role="img" aria-label="{Math.round(v.fill * 100)} %"><i style="width:{Math.max(2, Math.round(v.fill * 100))}%"></i></span>
        <small class="num">{t('{n} m to Everest no. {r}.', { n: num(v.left), r: v.next })}</small>
      </div>
    {/if}
    {#if berg}
      <div class="card fc" data-far="mountain" data-mountain={berg.mountain.key}>
        <span class="top"><span class="ib" aria-hidden="true"><MountainSnow size={20} /></span><span><b class="num">{t('{x}× {name}', { x: num(berg.x), name: berg.mountain.name })}</b><small class="num">{t('{m} m climbed · {name} = {of} m above sea level', { m: num(Math.round(gainM)), name: berg.mountain.name, of: num(berg.mountain.m) })}</small></span></span>
        <span class="bar" role="img" aria-label="{Math.round(berg.fill * 100)} %"><i style="width:{Math.max(2, Math.round(berg.fill * 100))}%"></i></span>
        <small class="num">{t('{n} m to {name} no. {r}.', { n: num(berg.left), name: berg.mountain.name, r: berg.next })}</small>
        <label class="pick"><span>{t('Compare with|mountain')}</span>
          <select value={choice} onchange={pick} data-mountain-pick>
            <option value={AUTO}>{t('Fits best|mountain')}</option>
            {#each MOUNTAINS as m (m.key)}<option value={m.key}>{m.name} ({num(m.m)} m)</option>{/each}
          </select>
        </label>
      </div>
    {/if}
  </div>
{/if}

<style>
  .far {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    gap: var(--sp-3);
    margin-bottom: 22px;
  }
  .fc {
    display: grid;
    gap: 6px;
    padding: 14px 16px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .top > span:last-child {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .bar {
    display: block;
    height: 10px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--hi);
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .pick select {
    min-height: 36px;
    max-width: 100%;
    padding: 0 8px;
    border: 1px solid var(--card-line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
</style>

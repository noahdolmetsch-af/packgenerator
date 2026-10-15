<script>
  /**
   * «Wusstest du» WD2 (Noah 14.10.2026, mockups approved 18:34 «wd1-wd3 freigegeben», «2a»): next to the
   * sums of Vergangene Touren, how far the km of the period go around the Earth and how often the metres
   * climbed go up the Everest. Part of «Also knowledge and fun»: the switch «Only useful tips» hides it.
   */
  import { Globe, Mountain } from '@lucide/svelte';
  import { pageInfo } from './store.svelte.js';
  import { farOf, EARTH_KM, EVEREST_M } from '../pageinfo.js';
  import { t, num } from '../i18n.svelte.js';

  let { km = null, gainM = null } = $props();
  const pi = pageInfo();
  const far = $derived(farOf(km, gainM));
</script>

{#if pi.loaded && pi.info.knowOn && (far.earth || far.everest)}
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
  </div>
{/if}

<style>
  .far {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  @media (max-width: 719px) {
    .far {
      grid-template-columns: 1fr;
    }
  }
</style>

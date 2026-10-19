<script>
  /**
   * Paket G (Noah 19.10.2026 «1a», «4-6»): on the packing list of a planned tour, up to three short
   * hints from data the app has: the ride goes into the dark (light, reflective vest), a high UV index
   * (sunscreen, sunglasses; on a ski tour the glacier glasses) and, on a round tour with wind, which
   * way round gives the tailwind home. Each item only with «Add» (with the page's Undo); hidden for this
   * trip with «×» (trip.skyOff). Nothing shows when nothing applies.
   */
  import { lightTip, sunTip, windTip, compass } from '../toursky.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { Moon, Sun, Wind, Plus, Check, X } from '@lucide/svelte';

  let { trip, items = [], place = null, onadd, onhide = null } = $props();

  const off = $derived(new Set(trip?.skyOff ?? []));
  const light = $derived(trip && !off.has('light') ? lightTip(trip, items, place) : null);
  const sun = $derived(trip && !off.has('sun') ? sunTip(trip, items) : null);
  const wind = $derived(trip && !off.has('wind') ? windTip(trip) : null);
  const KIND = { lamp: 'Light', vest: 'Reflective vest', sunscreen: 'Sunscreen', sunglasses: 'Sunglasses', glacier: 'Glacier glasses' };
</script>

{#snippet wants(list)}
  <ul class="sk-want">
    {#each list as w (w.kind)}
      <li>
        {#if w.onList}
          <span class="sk-on"><Check size={16} aria-hidden="true" />{nameOf(w.item)}</span>
        {:else if w.item}
          <button type="button" class="btn sm" onclick={() => onadd?.(w.item.id)} data-sky-add={w.kind}><Plus size={16} aria-hidden="true" />{t('Add {item}', { item: nameOf(w.item) })}</button>
        {:else}
          <span class="sk-none">{t('{kind}: not in your material yet', { kind: t(KIND[w.kind]) })}</span>
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet hide(key)}
  {#if onhide}<button type="button" class="sk-x" aria-label={t('Hide for this trip')} onclick={() => onhide(key)}><X size={16} aria-hidden="true" /></button>{/if}
{/snippet}

{#if light || sun || wind}
  <section class="sky card" aria-label={t('Hints for this tour')} data-section="tour-sky">
    {#if light}
      <div class="sk-row" data-sky="light">
        <span class="sk-ib" aria-hidden="true"><Moon size={18} /></span>
        <div class="sk-m">
          <p class="sk-t">{light.set ? t('You ride after sunset ({time}).', { time: light.set }) : t('You ride into the dark.')}</p>
          {@render wants(light.want)}
        </div>
        {@render hide('light')}
      </div>
    {/if}
    {#if sun}
      <div class="sk-row" data-sky="sun">
        <span class="sk-ib" aria-hidden="true"><Sun size={18} /></span>
        <div class="sk-m">
          <p class="sk-t">{sun.snow ? t('UV index up to {uv}, and the snow reflects.', { uv: sun.uv }) : t('UV index up to {uv}: high.', { uv: sun.uv })}</p>
          {@render wants(sun.want)}
        </div>
        {@render hide('sun')}
      </div>
    {/if}
    {#if wind}
      <div class="sk-row" data-sky="wind">
        <span class="sk-ib" aria-hidden="true"><Wind size={18} /></span>
        <div class="sk-m">
          <p class="sk-t">{t('Wind from the {dir}, about {kmh} km/h.', { dir: t(compass(wind.windFrom)), kmh: wind.wind })}</p>
          <p class="sk-s">{wind.way === 'keep' ? t('Ride the round as planned: the tailwind comes on the way home.') : t('Ride the round the other way: then the tailwind comes on the way home.')}</p>
        </div>
        {@render hide('wind')}
      </div>
    {/if}
  </section>
{/if}

<style>
  .sky { padding: var(--sp-3); display: grid; gap: var(--sp-3); }
  .sk-row { display: flex; align-items: flex-start; gap: var(--sp-2); }
  .sk-ib { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: var(--radius); background: var(--paper-2); color: var(--ink); flex: none; }
  .sk-m { flex: 1; min-width: 0; display: grid; gap: var(--sp-1); }
  .sk-t { margin: 0; font-size: var(--fs-small); font-weight: 600; overflow-wrap: break-word; }
  .sk-s { margin: 0; font-size: var(--fs-small); color: var(--ink-2); overflow-wrap: break-word; }
  .sk-want { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .sk-want .btn.sm { min-height: 44px; }
  .sk-on { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: var(--fs-small); color: var(--ok); }
  .sk-none { display: inline-flex; align-items: center; min-height: 44px; font-size: var(--fs-small); color: var(--ink-2); }
  .sk-x { min-width: 44px; min-height: 44px; border: 0; background: none; color: var(--ink-3); border-radius: var(--r-ctl); cursor: pointer; flex: none; }
  .sk-x:focus-visible { outline: var(--focus-ring); }
</style>

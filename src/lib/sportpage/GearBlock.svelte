<script>
  /**
   * Paket O, basic block «Ausrüstung»: the main equipment of the sport with its uses and care (Ausrüstung,
   * maingear.js), and for a bike sport the sport's standard bike (sports.js sportBikeId) and the bikes.
   */
  import { ChevronRight, Bike, Plus } from '@lucide/svelte';
  import { t, tn, num, nameOf } from '../i18n.svelte.js';

  let { sport, gearRows = [], bike = null } = $props();
</script>

{#if sport.bike}
  <a class="srow" href={bike ? `#/bikes?bike=${encodeURIComponent(bike.id)}` : '#/bikes'} data-sport-bike>
    <Bike size={18} aria-hidden="true" />
    <span class="t"><b>{bike ? bike.name : t('Bikes|place')}</b><small>{bike ? t('Standard bike for this sport') : t('Add your bikes under Bikes.')}</small></span>
    <ChevronRight size={18} aria-hidden="true" />
  </a>
{/if}
{#if gearRows.length}
  <ul class="ilist">
    {#each gearRows as r (r.item.id)}
      <li><a class="ent" href="#/equipment?item={encodeURIComponent(r.item.id)}"><b>{nameOf(r.item)}</b><small class="num">{tn(r.uses.length, '{n} use', '{n} uses')}</small>{#if r.due}<span class="pill due">{tn(r.due, '{n} care due', '{n} care due')}</span>{/if}</a></li>
    {/each}
  </ul>
{:else if !sport.bike}
  <p class="none">{t('No main equipment for this sport yet (for example skis, a racket, shoes).')}</p>
{/if}
{#if !sport.bike || gearRows.length}
  <a class="lnk" href="#/equipment" data-gear-link><Plus size={14} aria-hidden="true" /> {t('Add or change equipment')}</a>
{/if}

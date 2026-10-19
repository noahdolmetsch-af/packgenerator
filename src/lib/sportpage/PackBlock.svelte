<script>
  /**
   * Paket O, basic block «Packliste»: for an activity of Aktiv its sport bag (Sporttasche, flowbag.js); for a
   * sport of a trip the last trip's list and a new trip of this sport.
   */
  import { ChevronRight, ShoppingBag, Plus } from '@lucide/svelte';
  import { switchTrip, newTrip } from '../nav.js';
  import { bagName } from '../flow/bagwords.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { sport, bag = null, lastTrip = null } = $props();
  const fmt = (d) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const area = $derived(sport.bike ? 'bikepacking' : sport.key);
</script>

{#if sport.kind === 'act'}
  {#if bag}
    <a class="srow" href="#/flow/bags?b={encodeURIComponent(bag.id)}" data-sport-bag><ShoppingBag size={18} aria-hidden="true" /><span class="t"><b>{bagName(bag)}</b><small>{tn(bag.items.length, '{n} thing', '{n} things')}</small></span><ChevronRight size={18} aria-hidden="true" /></a>
  {:else}
    <p class="none">{t('No sport bag for this activity yet.')}</p>
    <a class="lnk" href="#/flow/bags"><Plus size={14} aria-hidden="true" /> {t('Make a sport bag')}</a>
  {/if}
{:else}
  {#if lastTrip}
    <button type="button" class="srow" onclick={() => switchTrip(lastTrip.id, '#/pack')} data-last-trip><span class="t"><b>{lastTrip.title || t('Last trip')}</b><small>{t('Last trip, {date}: open its packing list', { date: fmt(lastTrip.startDate) })}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
  {:else}
    <p class="none">{t('No trip of this sport yet.')}</p>
  {/if}
  <div class="row">
    <button type="button" class="btn" onclick={() => newTrip('last', area)} data-new-trip><Plus size={16} aria-hidden="true" />{t('New trip like the last one')}</button>
    <a class="lnk" href="#/pack/templates">{t('Templates')}</a>
  </div>
{/if}

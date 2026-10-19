<script>
  /**
   * Paket U3 «Live-Karte» › Notfall (Noah 19.10.2026 «3a»): the SOS window of the live map.
   * - your position big (degrees and Swiss LV95, sos.js positionText) and the km on the route;
   * - an SMS with the position and a map link (live-lib sosText, smsHref), the calls Rega 1414 and 112;
   * - «Abort»: the nearest station from the stops (live-lib nearestStation) with the way there, the next
   *   trains home (Paket K's Heimweg window) and a hint for the bike on the train.
   */
  import { Phone, MessageSquare, Train, Copy, Navigation, X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { CALLS, positionText, telOf } from '../mountain/sos.js';
  import { sosText, smsHref, nearestStation, navLinks } from './live-lib.js';
  import Heimweg from '../unterwegs/Heimweg.svelte';
  import { t } from '../i18n.svelte.js';

  let { here = null, km = null, routeName = '', pois = [], onclose } = $props();
  let dialog = $state();
  let home = $state(false);
  let copied = $state(false);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const text = $derived(here ? sosText({ here, km, routeName, labels: (k, v) => t(k, v) }) : '');
  const station = $derived(nearestStation({ pois, here, km }));
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

<dialog class="sheet from-below lv-sos" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="lv-sos-h" data-live-sos-sheet>
  <div class="lv-sos-head">
    <h2 id="lv-sos-h">{t('Emergency')}</h2>
    <button type="button" class="rc-icon" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if here}
    <p class="lv-sos-pos" data-live-sos-pos>{positionText(here)}</p>
    {#if km != null}<p class="rc-note">{t('km {km} of {route}', { km: Math.round(km), route: routeName || t('the route') })}</p>{/if}
  {:else}
    <p class="rc-warn" role="status">{t('No position yet. Start the ride, or call: the rescue finds you by the phone too.')}</p>
  {/if}
  <div class="lv-sos-calls">
    {#each CALLS as c (c.key)}
      <a class="btn lv-sos-call" href={telOf(c.number)} data-live-call={c.key}><Phone size={20} aria-hidden="true" /><span><b>{t(c.label)}</b><small>{t(c.sub)}</small></span></a>
    {/each}
  </div>
  {#if here}
    <div class="rc-acts">
      <a class="btn" href={smsHref(text)} data-live-sms><MessageSquare size={18} aria-hidden="true" />{t('Send position by SMS')}</a>
      <button type="button" class="btn" onclick={copy}><Copy size={18} aria-hidden="true" />{copied ? t('Copied') : t('Copy position')}</button>
    </div>
    <p class="rc-note">{t('The SMS has your position, a map link and the time. You choose who gets it.')}</p>
  {/if}

  <h3 class="lv-sos-h3">{t('Abort the ride')}</h3>
  {#if station}
    {@const l = navLinks(station)}
    <p class="lv-sos-st" data-live-station>
      <Train size={18} aria-hidden="true" />
      <span><b>{station.name || t('Station')}</b> · {station.behind ? t('{d} km back', { d: station.distKm }) : t('{d} km ahead', { d: station.distKm })}</span>
    </p>
    <div class="rc-acts">
      <a class="btn sm" href={l.google} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />{t('Google Maps')}</a>
      <a class="btn sm" href={l.osmand} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />{t('OsmAnd')}</a>
    </div>
  {:else}
    <p class="rc-note">{t('No station among the stops. «Next trains home» looks for the nearest one.')}</p>
  {/if}
  <div class="rc-acts">
    <button type="button" class="btn" onclick={() => (home = true)} data-live-home><Train size={18} aria-hidden="true" />{t('Next trains home')}</button>
  </div>
  <p class="rc-note">{t('Bike on the train: in Switzerland you need a bike ticket; on many long-distance trains you must also reserve a bike place, in summer always. Abroad the rules differ: ask at the station.')}</p>
</dialog>

{#if home}<Heimweg onclose={() => (home = false)} />{/if}

<style>
  .lv-sos-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .lv-sos-head h2 {
    margin: 0;
  }
  .lv-sos-pos {
    margin: 8px 0 4px;
    font: 700 var(--fs-sub)/1.35 var(--font-body);
    font-variant-numeric: tabular-nums;
    overflow-wrap: break-word;
  }
  .lv-sos-calls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
    margin: 12px 0;
  }
  .lv-sos-call {
    justify-content: flex-start;
    gap: 10px;
    min-height: 56px;
    border-color: var(--bad);
    color: var(--bad);
  }
  .lv-sos-call span {
    display: flex;
    flex-direction: column;
    text-align: left;
  }
  .lv-sos-call small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  .lv-sos-h3 {
    margin: 16px 0 6px;
    font-size: var(--fs-sub);
  }
  .lv-sos-st {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
  }
</style>

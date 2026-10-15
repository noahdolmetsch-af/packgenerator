<script>
  /**
   * «Garmin-Seiten» GA-A1 (Noah 14.10.2026 «GA-A1–A3 freigegeben»): on the bike's page, one row per
   * Garmin profile with its pages as small pictures, and the bike's sensors. A tap opens the pages
   * of that profile (GA-A2). Only a suggestion until something is changed there.
   */
  import { ChevronRight, Radio, Smartphone } from '@lucide/svelte';
  import EdgeScreen from './EdgeScreen.svelte';
  import { garminOf, onPages, profileName, rideType, SENSORS, SENSOR_LABEL } from '../garmin.js';
  import { bikesHash } from '../bikes.js';
  import { t, tn } from '../i18n.svelte.js';

  let { bike } = $props();

  const g = $derived(garminOf(bike));
  const SHOW = 5;
</script>

<section class="gcard" aria-labelledby="ga-h">
  <div class="gh"><h2 id="ga-h">{t('Garmin pages')}</h2><p class="gs">{t('Model pages for your Edges · keep them here once, then set them up on the device')}</p></div>
  <div class="card gbox">
    {#each g.profiles as p (p.id)}
      {@const pages = onPages(p)}
      <a class="prof" href={bikesHash({ tab: 'garmin', bike: bike.id, view: p.id })}>
        <span class="pt"><b>{profileName(p, bike)}</b><span class="badge">{t('Garmin profile')} · {p.own ? t(rideType(bike)) : t(p.name === 'Bikepacking' ? 'Bikepacking' : 'own')}</span><span class="sp"></span><small class="num">{tn(pages.length, '{n} page', '{n} pages')}</small><ChevronRight class="chev" size={16} aria-hidden="true" /></span>
        <span class="thumbs" aria-hidden="true">
          {#each pages.slice(0, SHOW) as id, i (id)}<span class="mini"><EdgeScreen pageId={id} {g} width={46} idx={i} total={pages.length} /></span>{/each}
          {#if pages.length > SHOW}<span class="more num">+{pages.length - SHOW}</span>{/if}
        </span>
      </a>
    {/each}
    <div class="sens">
      {#each SENSORS.filter((s) => g.sensors[s]) as s (s)}<span><Radio size={12} aria-hidden="true" />{t(SENSOR_LABEL[s])}</span>{/each}
      <span><Smartphone size={12} aria-hidden="true" />Edge 1040 · Edge 540</span>
    </div>
  </div>
  <p class="hint">{t('A suggestion from your sensors. Every page can be switched on and off.')}</p>
</section>

<style>
  .gcard {
    margin: 0 0 24px;
  }
  .gh {
    margin: 0 2px 10px;
  }
  .gh h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .gs {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .gbox {
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
  }
  .prof {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .prof + .prof {
    border-top: 1px solid var(--line);
  }
  .prof:visited {
    color: var(--ink);
  }
  @media (hover: hover) {
    .prof:hover b {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
  .pt {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pt b {
    font-weight: 600;
  }
  .pt small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .pt :global(.chev) {
    color: var(--ink-3);
  }
  .sp {
    flex: 1 1 auto;
  }
  .badge {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .thumbs {
    display: flex;
    gap: 6px;
    overflow: hidden;
  }
  .mini {
    width: 46px;
    flex: none;
    overflow: hidden;
  }
  .more {
    width: 46px;
    flex: none;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .sens {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .sens span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .hint {
    margin: 8px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>

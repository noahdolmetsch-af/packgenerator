<script>
  /**
   * SN4g «Packmodus» band (mockups SN4g-touren-liste-entwurf / -nichts-offen, Noah 13.10.2026, answer 1b): a
   * narrow band above the list, on a computer and a phone. Two states:
   *   draft  «Packmodus · Pack-Entwurf besteht»: the trip, its state pill, «14 von 26 gepackt» and
   *          «Packmodus öffnen»; a tap anywhere on the band opens Packmodus (the trip's packing day).
   *   none   «Packmodus · nichts offen · Gerade wird keine Tour gepackt» with «Neue Tour» and «Aus einer Vorlage».
   * band: touren.js packBand(); extra: the small word of the trip's pill; onhide(): «Ausblenden» (a suggestion).
   */
  import { t, tn } from '../i18n.svelte.js';
  import { switchTrip, openNew } from '../nav.js';
  import { PACK_HREF } from '../touren.js';
  import TripState from '../ui/TripState.svelte';
  import { Backpack, ChevronRight, Plus, LayoutTemplate, X } from '@lucide/svelte';

  let { band, extra = '', onhide } = $props();
  const pct = $derived(band.state === 'draft' && band.total ? Math.round((100 * band.done) / band.total) : 0);
  const open = (e) => {
    e.preventDefault();
    switchTrip(band.tripId, PACK_HREF);
  };
</script>

<section class="band" class:draft={band.state === 'draft'} aria-labelledby="pm-h" data-pack-band={band.state}>
  <span class="bic" aria-hidden="true"><Backpack size={20} /></span>
  {#if band.state === 'draft'}
    <div class="bt">
      <p class="k" id="pm-h">{t('Pack mode')} · {t('pack draft exists')}</p>
      <a class="whole" href={PACK_HREF} onclick={open}><b>{band.title}</b></a>
    </div>
    <div class="bp">
      <TripState state="plan" {extra} />
      <span class="pr"><span class="bar" aria-hidden="true"><i style:width="{pct}%"></i></span><span class="num">{tn(band.total, '{done} of {n} packed', '{done} of {n} packed', { done: band.done })}</span></span>
    </div>
    <a class="btn hi go" href={PACK_HREF} onclick={open} data-pack-open><Backpack size={17} aria-hidden="true" /><span class="kl">{t('Open pack mode')}</span><ChevronRight size={17} aria-hidden="true" /></a>
  {:else}
    <div class="bt">
      <p class="k" id="pm-h">{t('Pack mode')} · {t('nothing open')}</p>
      <b>{t('No trip is being packed right now')}</b>
    </div>
    <div class="acts">
      <button type="button" class="btn hi" onclick={() => openNew('list')} data-band-new><Plus size={17} aria-hidden="true" /><span class="kl">{t('New trip')}</span></button>
      <a class="btn k" href="#/pack/templates" data-band-tpl><LayoutTemplate size={17} aria-hidden="true" /><span class="kl">{t('From a template|band')}</span></a>
    </div>
  {/if}
  {#if onhide}<button type="button" class="hide" aria-label={t('Hide the pack mode band')} onclick={onhide} data-band-hide><X size={16} aria-hidden="true" /></button>{/if}
</section>

<style>
  .band {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    margin: 0 0 var(--sp-4);
    padding: 12px 52px 12px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .band.draft {
    border-color: color-mix(in srgb, var(--st-plan-line) 40%, transparent);
    background: var(--st-plan-soft);
  }
  .bic {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--st-plan);
  }
  .band:not(.draft) .bic {
    background: var(--st-plan-soft);
  }
  .bt {
    display: grid;
    flex: 1 1 220px;
    min-width: 0;
  }
  .k {
    margin: 0;
    color: var(--st-plan);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .bt b {
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .whole {
    color: var(--ink);
    text-decoration: none;
  }
  /* the whole band is the tap area of «Packmodus öffnen» */
  .whole::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
  .whole:focus-visible {
    outline: none;
  }
  .whole:focus-visible::after {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .bp {
    display: grid;
    justify-items: start;
    gap: 4px;
    flex: 0 1 260px;
    min-width: 0;
  }
  .pr {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .bar {
    flex: 1;
    min-width: 60px;
    height: 6px;
    border-radius: 3px;
    background: var(--paper);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--st-plan);
  }
  .go,
  .acts .btn {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .hide {
    position: absolute;
    z-index: 1;
    top: 50%;
    right: 4px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-top: -22px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .band {
      padding: 12px 44px 12px 12px;
    }
    .hide {
      top: 4px;
      margin-top: 0;
    }
    .bp,
    .go,
    .acts {
      flex: 1 1 100%;
    }
    .go {
      justify-content: center;
    }
    .acts .btn {
      flex: 1 1 0;
      justify-content: center;
    }
  }
</style>

<script>
  /**
   * Start-Karten ST1/ST2 (Noah 14.10.2026 «1a 2a 3b»): the card on Today instead of the jump.
   * ST1 «Heute unterwegs · Tag n von d» with «Unterwegs öffnen»; ST2 «Letzter Abend · Zurück zuhause?»
   * with «Tour abschliessen». A tap on the card or its button goes there. Logic: startkarten.js.
   */
  import { Bike, Flag, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { openTrip } from '../nav.js';
  import { betweenHref } from '../phase.js';

  let { card } = $props();
  const ride = $derived(card.kind === 'ride');
  const href = $derived(ride ? '#/ride' : betweenHref(card.trip, 'ended'));
  const kick = $derived(ride ? (card.days > 1 ? `${t('On the way today')} · ${t('Day {n} of {total}', { n: card.day, total: card.days })}` : t('On the way today')) : `${t('Last evening')} · ${t('Back home?')}`);
</script>

<a class="startkarte" {href} data-startkarte={card.kind} onclick={() => openTrip(card.trip.id)}>
  <span class="ic" aria-hidden="true">{#if ride}<Bike size={20} />{:else}<Flag size={20} />{/if}</span>
  <span class="tx"><small>{kick}</small><b>{card.trip.title}</b></span>
  <span class="go">{ride ? t('Open On the way') : t('Finish the trip')}<ChevronRight size={16} aria-hidden="true" /></span>
</a>

<style>
  .startkarte {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 68px;
    padding: 12px 14px 12px 16px;
    border-radius: var(--radius-card);
    background: var(--hi-soft);
    color: var(--ink);
    text-decoration: none;
  }
  .ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 38px;
    height: 38px;
    border-radius: var(--r-ctl);
    background: var(--hi);
    color: var(--hi-ink);
  }
  .tx {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
  }
  .tx small {
    color: var(--hi);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .tx > * {
    min-width: 0;
  }
  .tx b {
    font-size: var(--fs-sub);
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .go {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--hi);
    color: var(--hi-ink);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .startkarte:hover .go {
    background: var(--hi-hover);
  }
  /* on a phone the button goes under the text, so a long trip name has the whole width */
  @media (max-width: 560px) {
    .startkarte {
      flex-wrap: wrap;
    }
    .tx {
      flex-basis: calc(100% - 52px);
    }
    .go {
      margin-left: 52px;
    }
  }
</style>

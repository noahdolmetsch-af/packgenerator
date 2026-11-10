<script>
  /**
   * «Meine Tour» (Plan «ganze App», Schritt 2a, Noah 08.11.2026 «2 a»): the card right under the greeting on Heute, only
   * while a tour is planned. It replaces the line «Eventvorbereitung» of «Jetzt dran»: the tour with its countdown, the four
   * phases (Planen, Vorbereiten, Unterwegs, Danach), the next open step as the one main button, the hints as ONE line and a
   * link to the whole path. It only reads (lib/tourpfad/karte.js, the rule of the Tour-Pfad); nothing is stored. A tile like
   * the others: move it, resize it or take it away under «Customise the start page».
   */
  import { Route, Check, ChevronRight } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { countdown } from './heute.js';
  import { hasBike, domainOf, domainName } from '../domains.js';
  import { stageDays } from '../stages.js';
  import { switchTrip, openPrep } from '../nav.js';
  import { locale } from '../i18n.svelte.js';
  import TileHead from './TileHead.svelte';

  // card: meineTour(...) of Heute (null: no planned tour, the tile is away then); trip: the tour it is about
  let { trip, card, now = new Date() } = $props();
  const cd = $derived(countdown(trip, now));
  const day = $derived(trip.startDate ? new Date(`${trip.startDate}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '');
  const sub = $derived([tn(stageDays(trip), '{n} day', '{n} days'), hasBike(trip) ? trip.bike : t(domainName(domainOf(trip))), day].filter(Boolean).join(' · '));
  // a row that needs its trip makes it the current one first (Heute can show a later tour than the one that is open)
  function go(e, href) {
    e.preventDefault();
    switchTrip(trip.id, href);
  }
  // the preparation line opens the trip at «Before the trip» (as the old line did); another hint opens its page for this trip
  function openHint(e) {
    if (card.hint.prep) return openPrep(card.hint.prep);
    go(e, card.hint.href);
  }
</script>

{#if card && trip}
  <section class="mt surf" aria-labelledby="mt-h" data-section="meinetour" data-meinetour={card.phase}>
    <TileHead icon={Route} id="mt-h" title={t('My tour')} />
    <p class="t1"><b class="tt">{card.title}</b><span class="cdn num" class:near={cd.near} data-meinetour-countdown>{cd.text}</span></p>
    {#if sub}<p class="sub num">{sub}</p>{/if}
    <ol class="strip" aria-label={t('The four phases of the tour')}>
      {#each card.phases as p, i (p.key)}
        <li class={p.state} aria-current={p.state === 'now' ? 'step' : undefined} data-meinetour-phase={p.key}>
          <span class="no" aria-hidden="true">{#if p.state === 'done'}<Check size={12} strokeWidth={3} />{:else}{i + 1}{/if}</span>{p.title}
        </li>
      {/each}
    </ol>
    {#if card.next}
      <p class="next" data-meinetour-line><b>{t('Next: {title}', { title: card.next.title })}</b>{#if card.next.line}{' · '}{card.next.line}{/if}</p>
      <p class="act"><a class="btn hi main" href={card.next.href} onclick={(e) => go(e, card.next.href)} data-meinetour-next>{card.next.button}<ChevronRight size={18} aria-hidden="true" /></a></p>
    {:else}
      <p class="next" data-meinetour-line>{t('Nothing is open in this phase.')}</p>
    {/if}
    {#if card.hint}<p class="hint" data-meinetour-hint><a href={card.hint.href} onclick={openHint}>{card.hint.text}</a></p>{/if}
    <p class="all"><a href={card.pfad} data-meinetour-all>{t('All steps')} ›</a></p>
  </section>
{/if}

<style>
  .mt {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .t1 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 2px 12px;
    margin: 0;
  }
  .tt {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .cdn {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cdn.near {
    color: var(--ink);
    font-weight: 600;
  }
  .sub,
  .next,
  .hint,
  .all {
    margin: 0;
    font-size: var(--fs-small);
  }
  .sub,
  .next {
    color: var(--ink-2);
  }
  .next b {
    color: var(--ink);
  }
  .strip {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .strip li {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px 3px 4px;
    border-radius: 999px;
    font-size: var(--fs-small);
    background: var(--line);
    color: var(--ink-2);
  }
  .no {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--paper);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .strip li.done {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .strip li.past {
    background: var(--warn-soft, var(--line));
    color: var(--ink-2);
  }
  .strip li.now {
    background: var(--hi);
    color: var(--hi-ink);
    font-weight: 600;
  }
  .strip li.now .no {
    color: var(--ink);
  }
  .act {
    margin: 4px 0 0;
  }
  .hint a {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .all a {
    color: var(--ink-2);
  }
</style>

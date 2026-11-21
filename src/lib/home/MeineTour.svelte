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
  import HeuteBild from './HeuteBild.svelte';
  import SeasonNow from '../care/SeasonNow.svelte'; // «Fits now», which «Your moment» showed beside the tour

  // card: meineTour(...) of Heute (null: no planned tour, the tile is away then); trip: the tour it is about
  // season: «Your moment» is away because it is about this tour (Noah 17.11.2026 «1-5a»): its line «Fits now» comes here
  // bild: the picture of Heute ({ line, mood, weather, href, onopen }) at the top of the card, or null (Noah 17.11.2026 «1-5a»: «My tour» holds picture and tour)
  // pack: { packed, weight } of this tour while the big trip card is away (Noah 17.11.2026 «1-5a», step 3b): how far the packing is, the base weight and the way to the packing list
  let { trip, card, now = new Date(), today = '', season = false, bild = null, pack = null } = $props();
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
    {#if bild}<HeuteBild {trip} line={bild.line} mood={bild.mood} weather={bild.weather} href={bild.href} onopen={bild.onopen} inCard />{/if}
    <TileHead icon={Route} id="mt-h" title={t('My tour')} />
    <p class="t1"><b class="tt">{card.title}</b><span class="cdn num" class:near={cd.near} data-meinetour-countdown>{cd.text}</span></p>
    {#if sub}<p class="sub num">{sub}</p>{/if}
    {#if pack?.packed}
      <div class="packed" data-meinetour-packed>
        <div class="bar" role="progressbar" aria-label={t('Packed')} aria-valuemin="0" aria-valuemax={pack.packed.of} aria-valuenow={pack.packed.packed}><span style:width="{Math.round((pack.packed.packed / pack.packed.of) * 100)}%"></span></div>
        <p class="pl"><b>{t('{n} of {m} packed', { n: pack.packed.packed, m: pack.packed.of })}</b>{#if pack.packed.left.length}<span>{t('Still: {list}', { list: pack.packed.left.join(', ') })}</span>{/if}</p>
      </div>
    {/if}
    {#if pack?.weight}<p class="sub num" data-meinetour-weight>{t('Base weight|box')} <b>{pack.weight.base}</b> · <a href="#/pack" onclick={(e) => go(e, '#/pack')} data-meinetour-packlist>{t('Packing list')} ›</a></p>{/if}
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
    {#if season && today}<SeasonNow {today} compact />{/if}
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
  .packed {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .bar {
    height: 6px;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .pl {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 8px;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pl b {
    color: var(--ink);
  }
  .sub b {
    color: var(--ink);
  }
  .sub a {
    position: relative;
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .sub a::after {
    content: '';
    position: absolute;
    inset: -14px -8px;
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
  .hint a,
  .all a {
    position: relative;
  }
  .hint a::after,
  .all a::after {
    content: '';
    position: absolute;
    inset: -14px -8px;
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

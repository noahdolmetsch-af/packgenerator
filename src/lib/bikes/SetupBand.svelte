<script>
  /**
   * v0.31.0 (Noah 9a, variant A): the head of Bikes → Setup: the bike's name, km, weight, bags and
   * "n care due"; the bikes as tabs, "+ Bike" at the end, "Edit" next to the name.
   * Design-Refresh P7 «Velo» (V1, Noah 12.10.2026 «v1-v4 freigabe»): no dark band any more. A quiet
   * line under the page title, the bikes as light chips (the chosen one dark, with a bike icon),
   * «+ Velo» dashed, then the bike's name as the section title with its numbers below.
   * VS3 (Noah 14.10.2026 «1a»): the standard bike (first in the order) has a star; one quiet line
   * «Standard bike and order · Change» opens the order window.
   * Velos aufräumen (Noah 23.11.2026): the bikes stand once, as the cards above (BikeCards); the small cards that
   * were here (a second row of the same bikes) are gone. The chosen bike is the card with the frame; «Show details» chooses it.
   */
  import { Gauge, Weight, Briefcase, Pencil, Scale, Star, Check } from '@lucide/svelte';
  import { t, tn, num, locale, importText } from '../i18n.svelte.js';
  import { formatVolume, bikeTypeName, bikesHash } from '../bikes.js';
  import { velosHref } from '../analyse/jump.js';
  import { openTrip } from '../nav.js';
  import NumLink from '../ui/NumLink.svelte'; // «Zahl mit Weg» (UI-Prüfung 07.11.2026, V1): km, costs and care lead somewhere
  import { formatWeight } from '../gear.js';
  import { bagWords } from './bagwords.js';
  import './standardvelo.css';
  import MoreActions from '../ui/MoreActions.svelte';

  let { bikes, bike, setup, kind, cost = '', due = 0, careHref = '', sub = '', ride = null, onedit, onorder = null, menu = [], link = null } = $props();

  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const bagsG = $derived(setup.bagCount && setup.unweighed < setup.bagCount ? formatWeight(setup.bagsG) : '');
  // Gesamttest 20.10.2026 C8: the type stays in the line; «What you use it for» (often a long note) is its
  // own quiet line below, at most two lines, «more» shows all of it. It is changed with «Edit».
  const kick = $derived(bike.type ? t(bikeTypeName(bike.type)) : '');
  const use = $derived(importText(String(bike.use ?? '').trim()));
  let useEl = $state();
  let useOpen = $state(false);
  let useLong = $state(false);
  $effect(() => {
    void use;
    useOpen = false;
  });
  $effect(() => {
    void use;
    const el = useEl;
    const measure = () => {
      if (el && !el.classList.contains('open')) useLong = el.scrollHeight > el.clientHeight + 1;
    };
    measure();
    if (typeof ResizeObserver === 'undefined' || !el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<section class="setup-band" aria-label={t('Bike')} data-bike-detail>
  {#if sub || ride}
    <!-- V1: «next trip» is a way to that trip's packing list (it was a sentence); the trip is chosen first, then the plain link opens Pack
         (switchTrip would reload this page for the new address before the address has changed) -->
    <p class="page-sub vb-sub">{sub}{#if ride}{sub ? ' · ' : ''}<a class="vb-ride" href="#/pack" data-bike-ride onclick={() => openTrip(ride.id)}>{ride.text}</a>{#if ride.fit}{' · '}<a class="vb-fit {ride.fit.tone}" href={ride.fit.href} data-bike-ride-fit>{#if ride.fit.tone === 'ok'}<Check size={13} aria-hidden="true" />{/if}{ride.fit.text}</a>{/if}{/if}</p>
  {/if}
  {#if onorder && bikes.length > 1}
    <p class="sv-line"><Star size={14} class="sv-star" aria-hidden="true" /><span>{t('Standard bike and order')}</span><button type="button" class="link" onclick={() => onorder()}>{t('Change')}</button></p>
  {/if}
  <h2 class="name">
    <span>{bike.name}</span>
    <button type="button" class="edit" onclick={() => onedit?.()} aria-label={t('Edit {name}', { name: bike.name })} title={t('Edit')}><Pencil size={16} aria-hidden="true" /><span class="et" aria-hidden="true">{t('Edit')}</span></button>
    <!-- Impeccable Runde 2 (Velos 2): the bike's «…», with «Link zu Hersteller und Garantie eintragen» -->
    {#if menu.length}<span class="bmenu"><MoreActions title={bike.name} label={t('More for {title}', { title: bike.name })} actions={menu} /></span>{/if}
  </h2>
  <p class="meta num">
    {#if kick}<span class="kick">{kick}</span>{/if}
    <span><Gauge size={15} aria-hidden="true" />{#if bike.km != null}<NumLink to={velosHref(bike.id)} data-bike-km-link><b>{num(bike.km)} km</b></NumLink>{:else}{t('km not set')}{/if}</span>
    <span><Weight size={15} aria-hidden="true" />{#if kind === 'missing'}{t('bike not weighed')}{:else}<NumLink to={bikesHash({ tab: 'compare', bike: bike.id })} data-bike-weight-link><b>{kind === 'estimate' ? '~' : ''}{kg(bike.weightG)}</b></NumLink> {kind === 'estimate' ? t('estimate') : t('measured')}{/if}</span>
    <span data-bag-words><Briefcase size={15} aria-hidden="true" /><NumLink to={bikesHash({ tab: 'rig', view: 'bags', bike: bike.id })} data-bike-bags-link>{bagWords(setup.bagCount, setup.cageCount)} · {formatVolume(setup.volumeL)}{bagsG ? ` · ${bagsG}` : ''}</NumLink>{#if setup.unweighed}<i class="nw" title={tn(setup.unweighed, '{n} bag not weighed', '{n} bags not weighed')}><Scale size={13} aria-hidden="true" />{setup.unweighed}<span class="sr">{tn(setup.unweighed, '{n} bag not weighed', '{n} bags not weighed')}</span></i>{/if}</span>
    {#if cost}<span class="vb-cost" data-cost><NumLink to={bikesHash({ tab: 'care', bike: bike.id, view: 'year' })} data-bike-cost-link>{cost}</NumLink></span>{/if}
    {#if link}<a class="vb-link" data-sk-link={link.kind} href={link.url} target="_blank" rel="noopener noreferrer">{link.name} ↗</a>{/if}
    {#if due}<a class="pill warn due" href={careHref}>{tn(due, 'Up now: {n} job · See', 'Up now: {n} jobs · See')}</a>{/if}
  </p>
  {#if use}
    <p class="vb-use" data-bike-use><span class="ut" class:open={useOpen} bind:this={useEl}>{use}</span>{#if useLong || useOpen}<button type="button" class="link" aria-expanded={useOpen} onclick={() => (useOpen = !useOpen)}>{useOpen ? t('less') : t('more')}</button>{/if}</p>
  {/if}
</section>

<style>
  .setup-band {
    margin: 0 0 16px;
    min-width: 0;
  }
  .sv-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0 0 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sv-line .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .vb-sub {
    margin: 0 0 8px;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 2px;
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .name span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  /* «Alles selbst bearbeiten» (Noah 19.10.2026): the pencil says «Bearbeiten», so name, photo and delete are easy to find */
  .edit {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 44px;
    height: 44px;
    padding: 0 10px;
    font-size: var(--fs-small);
    font-weight: 500;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .edit:hover {
    color: var(--ink);
    background: var(--paper-2);
  }
  .vb-use {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0 8px;
    margin: 6px 0 0;
    max-width: 60em;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vb-use .ut {
    flex: 1 1 14em;
    min-width: 0;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: break-word;
  }
  .vb-use .ut.open {
    display: block;
    -webkit-line-clamp: unset;
    line-clamp: none;
  }
  .vb-use .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .meta > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .meta b {
    color: var(--ink-2);
    font-weight: 600;
  }
  .meta > .vb-cost {
    color: var(--ink-2);
    font-weight: 600;
  }
  /* V1: a number that leads somewhere keeps the line as it was; the 44 px tap area sits around it (like «Up now») */
  .meta :global(a.numlink) {
    min-height: 0;
  }
  .meta :global(a.numlink)::after,
  .vb-ride::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .vb-fit {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: 99px;
    color: var(--ink-2);
    font-weight: 600;
    text-decoration: none;
    position: relative;
  }
  .vb-fit.ok {
    color: var(--accent);
  }
  .vb-fit.due,
  .vb-fit.soon {
    color: var(--warn);
    background: var(--warn-soft);
  }
  .vb-fit::after {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .vb-ride {
    position: relative;
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .bmenu {
    flex: none;
    display: inline-flex;
    font: 400 var(--fs-body) / 1 var(--font-body);
  }
  /* quiet like the pencil beside it: no frame until hover or focus */
  .bmenu :global(.btn.dots) {
    border-color: transparent;
    background: none;
    color: var(--ink-3);
  }
  .bmenu :global(.btn.dots:hover),
  .bmenu :global(.btn.dots:focus-visible) {
    background: var(--paper-2);
    color: var(--ink);
  }
  .vb-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    color: var(--accent);
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 3px;
    overflow-wrap: break-word;
  }
  .nw {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-style: normal;
    font-size: var(--fs-tiny);
  }
  .due {
    position: relative;
    text-decoration: none;
  }
  /* 44 px tap area around the small badge and the link, without moving the layout. */
  .vb-link::after,
  .due::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
</style>

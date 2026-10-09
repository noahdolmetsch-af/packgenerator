<script>
  /**
   * v0.25.1 (Noah 2b, 3a): the buttons of the Bikes tile on Today, in order of priority.
   * v0.38.0: under "Bikes ready?". Visible: Log a problem · Idea. Under "More": Log a workshop visit ·
   * Workshop order · Choose a bike (only with a next bike trip).
   * The open ideas ("Was geil wäre") per bike show as one line above the buttons.
   */
  import HubActions from './HubActions.svelte';
  import BikeQuickDialog from './BikeQuickDialog.svelte';
  import { openTrip } from '../nav.js';
  import { bikesHash } from '../bikes.js';
  import { hubBike, openIdeas, IDEAS_KEY } from '../hubs.js';
  import { hasBike } from '../domains.js';
  import { t, tn } from '../i18n.svelte.js';

  let { bikes = [], next = null, shown = 2 } = $props();

  const first = $derived(hubBike(next, bikes));
  const canChoose = $derived(!!next && hasBike(next) && bikes.length > 0);
  let dialog = $state(null); // 'problem' | 'idea' | 'visit'
  let saved = $state(null); // { kind, bikeId }
  let savedTimer;
  const need = (kind) => () => (bikes.length ? (dialog = kind) : (location.hash = '#/bikes'));
  const actions = $derived(
    [
      { key: 'problem', label: t('Log a problem'), plus: true, run: need('problem') },
      { key: 'idea', label: t('Idea'), run: need('idea') },
      // v0.38.0 (Noah 13a): Log km, Bike care and Note on a bike left this list: they are the quick
      // buttons and the "Bike care" link right above it, and "Note + photo" (one place each).
      { key: 'visit', label: t('Log a workshop visit'), run: need('visit') },
      { key: 'order', label: t('Workshop order'), href: '#/bikes?tab=care' },
      canChoose ? { key: 'choose', label: t('Choose a bike for the trip'), href: '#/pack?choose', run: () => openTrip(next.id) } : null,
    ].filter(Boolean),
  );
  const ideas = $derived(bikes.map((b) => ({ bike: b, n: openIdeas(b.ideas) })).filter((x) => x.n));
  // The ideas section on Bikes → Setup opens (and comes into view) when reached from here.
  const wantIdeas = () => {
    try {
      localStorage.setItem(IDEAS_KEY, '1');
    } catch {
      /* private mode: the section stays closed */
    }
  };
  function done(s) {
    clearTimeout(savedTimer);
    saved = s;
    savedTimer = setTimeout(() => (saved = null), 6000);
  }
  $effect(() => () => clearTimeout(savedTimer));
  const savedText = { problem: 'Saved in Bike care.', idea: 'Idea saved.', visit: 'Workshop visit saved.' };
  const savedHref = (s) => (s.kind === 'idea' ? bikesHash({ bike: s.bikeId }) : bikesHash({ tab: 'care', bike: s.bikeId, open: true }));
</script>

{#if ideas.length}
  <p class="ideas">
    <span class="lbl">{t('Ideas|bike')}</span>
    {#each ideas as x, i (x.bike.id)}{#if i}<span aria-hidden="true"> · </span>{/if}<a href={bikesHash({ bike: x.bike.id })} onclick={wantIdeas}>{x.bike.name}: {tn(x.n, '{n} idea', '{n} ideas')}</a>{/each}
  </p>
{/if}
<HubActions {actions} {shown} label={t('Bikes|place')} />
{#if saved}
  <p class="saved" role="status">{t(savedText[saved.kind])} <a href={savedHref(saved)} onclick={() => saved.kind === 'idea' && wantIdeas()}>{t('Open')}</a></p>
{/if}
{#if dialog}
  <BikeQuickDialog kind={dialog} {bikes} bikeId={first} tripId={next?.id ?? null} onsaved={done} onclose={() => (dialog = null)} />
{/if}

<style>
  .ideas {
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .ideas .lbl {
    margin-right: 8px;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-3);
  }
  .ideas a {
    color: var(--ink);
  }
  .saved {
    margin: 0;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--ink);
    color: var(--paper);
    font-size: 14px;
  }
  .saved a {
    color: var(--hi-bright, var(--hi));
  }
</style>

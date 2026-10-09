<script>
  import Home from './pages/Home.svelte';
  import Gear from './pages/Gear.svelte';
  import Bikes from './pages/Bikes.svelte';
  import Pack from './pages/Pack.svelte';
  import Templates from './pages/Templates.svelte';
  import Debrief from './pages/Debrief.svelte';
  import Share from './pages/Share.svelte';
  import Ride from './pages/Ride.svelte';
  import Inbox from './pages/Inbox.svelte';
  import Notes from './pages/Notes.svelte';
  import Favorites from './pages/Favorites.svelte';
  import PastTrips from './pages/PastTrips.svelte';
  import Trips from './pages/Trips.svelte';
  import Blocks from './pages/Blocks.svelte';
  import BlockCheck from './pages/BlockCheck.svelte';
  import Features from './pages/Features.svelte';
  import GearImport from './pages/GearImport.svelte';
  import Rides from './pages/Rides.svelte';
  import Wardrobe from './pages/Wardrobe.svelte';
  import Flow from './pages/Flow.svelte';
  import FlowLayer from './lib/flow/FlowLayer.svelte';
  import DemoBar from './lib/DemoBar.svelte';
  import QuickNote from './lib/QuickNote.svelte';
  import NewSheet from './lib/nav/NewSheet.svelte';
  import Search from './lib/nav/Search.svelte';
  import { parseBikesHash } from './lib/bikes.js';
  import { liveQuery } from 'dexie';
  import { db } from './lib/db.js';
  import { phone } from './lib/media.svelte.js';
  import { Menu, Sun, Route, Backpack, Bike } from '@lucide/svelte';
  import MoreSheet from './lib/nav/MoreSheet.svelte';
  import { sortBikes } from './lib/bikes.js';
  import { withVisits } from './lib/workshop.js';
  import { bikeCare } from './lib/readiness.js';
  import { localDay } from './lib/localday.js';
  import { PLACES, pageOf, placeOf, redirectOf } from './lib/nav.js';
  import { t, lang } from './lib/i18n.svelte.js';

  // A tiny "router": the part of the address after # decides which page is shown,
  // e.g. …/packgenerator/#/gear. It works offline and needs no server setup.
  // v0.49.0 R1: an old address of a page that became part of another (#/review, #/debrief/compare)
  // is replaced by the new one, so a bookmark or an old link still lands on the right page.
  let spot = $state('');
  const follow = (h) => {
    const r = redirectOf(h);
    if (!r) return h;
    history.replaceState(null, '', `${location.pathname}${location.search}${r.hash}`);
    spot = r.spot;
    return r.hash;
  };
  let hash = $state(follow(location.hash));
  $effect(() => {
    const update = () => {
      spot = '';
      hash = follow(location.hash);
      menuOpen = false;
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  // v0.23.0 (AP07): the address → page and its main place live in nav.js (tested there).
  const page = $derived(pageOf(hash, parseBikesHash(hash).tab === 'care'));
  const place = $derived(placeOf(page));
  const ICONS = { today: Sun, trips: Route, gear: Backpack, bikes: Bike };
  const places = PLACES.map((p) => ({ ...p, icon: ICONS[p.key] }));
  let menuOpen = $state(false);
  // #/debrief/<trip id> opens one trip's debrief.
  const param = $derived(hash.split('/')[2] ?? '');
  // v0.41.0: #/debrief/ride/<ride id>
  const sub = $derived(decodeURIComponent(hash.split('/').slice(3).join('/')));

  // Quick note (v0.19.3): the + button, the app shortcut "New note" (#/inbox/new) and text shared
  // from another app (Android share sheet opens the app with ?title=…&text=…&url=…).
  let noteOpen = $state(false);
  let notePrefill = $state('');
  $effect(() => {
    const q = new URLSearchParams(location.search);
    if (['title', 'text', 'url'].some((k) => q.get(k))) {
      notePrefill = ['title', 'text', 'url'].map((k) => q.get(k)?.trim()).filter(Boolean).join('\n');
      history.replaceState(null, '', `${location.pathname}#/inbox`);
      hash = '#/inbox';
      noteOpen = true;
    }
  });
  // v0.19.6 (answers 3a, 4a): "New" opens every way to create something; the start page opens it too.
  let newMode = $state(null);
  $effect(() => {
    const open = (e) => (newMode = e.detail ?? 'all');
    // v0.25.1 (Noah 3a): "Note on a bike" on Today sends { text, bikeId }.
    const quick = (e) => (e.detail && typeof e.detail === 'object' ? note(e.detail.text ?? '', e.detail.bikeId ?? null) : note(e.detail ?? ''));
    // v0.25.1 (Noah 1a): "Day ride" from any page: Pack makes the trip (it listens itself while open).
    const day = () => {
      if (pageOf(location.hash) === 'pack') return;
      keepDayRide();
      location.hash = '#/pack';
    };
    window.addEventListener('pg:new', open);
    window.addEventListener('pg:note', quick);
    window.addEventListener('pg:dayride', day);
    return () => {
      window.removeEventListener('pg:new', open);
      window.removeEventListener('pg:note', quick);
      window.removeEventListener('pg:dayride', day);
    };
  });
  let noteBike = $state(null);
  // v0.35.0 (AP29): another trip from the band's "In progress" list: the page opens afresh (nav.js switchTrip).
  let switchN = $state(0);
  $effect(() => {
    const bump = () => (switchN++, window.scrollTo(0, 0));
    window.addEventListener('pg:switchtrip', bump);
    return () => window.removeEventListener('pg:switchtrip', bump);
  });
  const keepDayRide = () => {
    try {
      // v0.46.0: a bike chosen for the ride (nav.js dayRide) stays chosen
      if (!localStorage.getItem('pack.dayRide')) localStorage.setItem('pack.dayRide', '1');
    } catch {
      /* private mode: Pack opens without the new day ride */
    }
  };
  const note = (prefill, bikeId = null) => {
    notePrefill = prefill;
    noteBike = bikeId;
    noteOpen = true;
  };
  // v0.20.0: the page language for screen readers and the browser.
  $effect(() => {
    document.documentElement.lang = lang.v;
  });
  // v0.27.0 (AP21): Tab stays inside an open dialog (the native ones and the packing day): after the
  // last control it goes back to the first, never to the page behind or the browser's address bar.
  $effect(() => {
    const SEL = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
    const trap = (e) => {
      if (e.key !== 'Tab' || e.defaultPrevented) return;
      const box = [...document.querySelectorAll('dialog[open]')].filter((d) => d.matches(':modal')).at(-1) ?? document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!box) return;
      const els = [...box.querySelectorAll(SEL)].filter((el) => el.getClientRects().length && !el.closest('[inert]'));
      if (!els.length) return;
      const first = els[0];
      const last = els.at(-1);
      const at = document.activeElement;
      if (!box.contains(at) || (e.shiftKey && at === first) || (!e.shiftKey && at === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  });
  const inboxQ = liveQuery(() => db.notes.where('status').equals('open').count());
  // v0.38.0 (Noah E): a number only where something waits: how many bikes have something due (Bikes place).
  const dueQ = liveQuery(async () => {
    const [bikes, tasks, visits] = await Promise.all([db.bikes.toArray(), db.maintenance.toArray(), db.visits.toArray()]);
    const today = localDay();
    return sortBikes(bikes).filter((b) => bikeCare(withVisits(b, visits), { tasks, visits, today })?.status === 'due').length;
  });
  $effect(() => {
    if (hash === '#/inbox/new') {
      history.replaceState(null, '', '#/inbox');
      hash = '#/inbox';
      noteOpen = true;
    }
  });
</script>

<!-- v0.19.6 (start page answers 1a-4a): the same places on every page, search, Inbox and one "New".
     On a phone the places move to a bar at the bottom, with the + in the middle.
     v0.23.0 (AP07): one navigation for every page, Today / Trips / Gear / Bikes (the Pack page no longer
     has its own). Debriefs, templates, a quick note and the language sit in the menu behind the profile icon. -->
<header class="top">
  <a class="brand" href="#/" aria-label={t('Pack Generator, start page')}><span class="long">Pack Generator</span><span class="short" aria-hidden="true">PG</span></a>
  {#if !phone.matches}
    <nav class="places" aria-label={t('Sections')}>
      {#each places as p (p.key)}<a href={p.href} aria-current={place === p.key ? 'page' : undefined}>{t(p.label)}{#if p.key === 'bikes' && $dueQ}<span class="due num"><span class="sr">, {t('{n} due', { n: $dueQ })}</span><span aria-hidden="true">{$dueQ}</span></span>{/if}</a>{/each}
    </nav>
  {/if}
  <div class="tools">
    <Search />
    {#if !phone.matches && page !== 'share'}
      <button type="button" class="btn hi new" onclick={() => (newMode = 'all')} aria-haspopup="dialog">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>{t('New')}
      </button>
    {/if}
    <!-- v0.38.0 (Noah 11a, 12a): "More" took the place of the profile icon and the Inbox icon;
         the Inbox count shows on it. -->
    <button type="button" class="more-btn" aria-haspopup="dialog" aria-expanded={menuOpen} aria-label={$inboxQ ? t('More, Inbox: {n} to sort', { n: $inboxQ }) : t('More')} onclick={() => (menuOpen = true)}>
      <Menu size={24} aria-hidden="true" />{#if !phone.matches}<span class="ml">{t('More')}</span>{/if}
      <!-- v0.47.1 (Noah): no number on the button, only a small dot; the count stays in the label. -->
      {#if $inboxQ}<span class="mdot" aria-hidden="true"></span>{/if}
    </button>
  </div>
</header>

<DemoBar />

<main class:calm={page === 'pack' || page === 'ride' || (page === 'debrief' && !!param && !['learnings', 'pace', 'compare', 'logbook'].includes(param))} class:wide={page === 'pack' || page === 'ride' || page === 'debrief' || page === 'rides' || page === 'past' || page === 'templates' || page === 'gear' || page === 'blocks' || page === 'blockcheck' || page === 'home' || page === 'features' || page === 'wardrobe' || page === 'flow'}>
  {#key switchN}
  {#if page === 'gear'}
    <Gear />
  {:else if page === 'gearimport'}
    <!-- v0.36.0 (Noah 1a): the reviewed gear list waits here before it goes into Gear -->
    <GearImport />
  {:else if page === 'pack'}
    <Pack />
  {:else if page === 'bikes' || page === 'care'}
    <!-- v0.21.0 (Noah 6a): Setup and Care are tabs of one page; #/care lands on Care. -->
    <Bikes />
  {:else if page === 'templates'}
    <Templates />
  {:else if page === 'trips'}
    <!-- v0.46.1 (Noah): «Touren», the overview of all trips -->
    <Trips />
  {:else if page === 'past'}
    <!-- v0.25.1 (Noah 3a): the finished trips, from Today's Trips tile -->
    <PastTrips />
  {:else if page === 'ride'}
    <Ride />
  {:else if page === 'share'}
    {#key param}<Share code={param} />{/key}
  {:else if page === 'blockcheck'}
    <!-- v0.64.0 (Noah 4a): «Bausteine prüfen», one block after the other -->
    <BlockCheck />
  {:else if page === 'blocks'}
    <!-- v0.26.0 (Noah 2a/2b): building blocks (item sets) you can see and make -->
    <Blocks />
  {:else if page === 'features'}
    <!-- v0.30.0 (Noah 3a): everything the app can do, with ✓ and how much is used -->
    <Features />
  {:else if page === 'favorites'}
    <!-- v0.21.0 (package 5): all my favourite things, by area -->
    <Favorites />
  {:else if page === 'wardrobe'}
    <!-- v0.42.0 (Noah 1): the wardrobe, by layer and body zone -->
    <Wardrobe />
  {:else if page === 'flow'}
    <!-- v0.51.0 «Im Flow»: rings, ticks, goals × days; #/flow/goals, #/flow/edit/<id>, #/flow/new -->
    <Flow sub={hash.split('/').slice(2).join('/')} />
  {:else if page === 'inbox'}
    <Inbox onnew={() => (noteOpen = true)} />
  {:else if page === 'notes'}
    <!-- v0.48.0: Notes (kept notes) and the inbox side by side -->
    <Notes />
  {:else if page === 'rides'}
    <!-- v0.41.0 (Noah 1-4): upload a ride; #/debrief/ride/<id> one ride, #/debrief/ride/shared a shared file -->
    {#key sub}<Rides {sub} />{/key}
  {:else if page === 'debrief'}
    {#key param}<Debrief {param} {spot} />{/key}
  {:else}
    <Home />
  {/if}
  {/key}
</main>

{#if page !== 'share'}
  <QuickNote {page} bind:open={noteOpen} prefill={notePrefill} prefillBike={noteBike} />
  <NewSheet bind:mode={newMode} onnote={note} />
{/if}
{#if page !== 'share'}<FlowLayer page={page === 'flow' && !/^#\/flow\/?$/.test(hash) ? 'flow-sub' : page} />{/if}
<MoreSheet bind:open={menuOpen} inbox={$inboxQ ?? 0} current={hash} />
{#if phone.matches}
  <!-- v0.23.0 (AP07): the same four places on every page, also under a shared list (there without +). -->
  <nav class="bottom" aria-label={t('Sections')}>
    {#each places as p, i (p.key)}
      {#if i === 2 && page !== 'share'}<button type="button" class="plus" aria-label={t('New')} aria-haspopup="dialog" onclick={() => (newMode = 'all')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>{/if}
      <a href={p.href} aria-current={place === p.key ? 'page' : undefined}><span class="pi"><p.icon size={22} strokeWidth={2} aria-hidden="true" />{#if p.key === 'bikes' && $dueQ}<span class="due num" aria-hidden="true">{$dueQ}</span>{/if}</span>{t(p.label)}{#if p.key === 'bikes' && $dueQ}<span class="sr">, {t('{n} due', { n: $dueQ })}</span>{/if}</a>
    {/each}
  </nav>
{/if}

<style>
  /* v0.38.0 (Noah 11a, 12a): "More" top right; the Inbox count on it, small and orange like before. */
  .more-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 44px; height: 44px; padding: 0 12px; border: 0; border-radius: 8px; background: rgba(255, 255, 255, 0.08); color: var(--brand-ink); font: 500 16px var(--font-body); cursor: pointer; }
  .more-btn:hover, .more-btn[aria-expanded='true'] { background: rgba(255, 255, 255, 0.16); }
  @media (max-width: 719px) { .more-btn { background: none; padding: 0; } }
  /* the count of something waiting on the Bikes place (bikes with something due), small and neutral */
  .top .due, .bottom .due { display: inline-block; min-width: 20px; height: 20px; margin-left: 6px; padding: 0 5px; border-radius: 10px; background: rgba(255, 255, 255, 0.18); color: var(--brand-ink); font: 600 12px/20px var(--font-body); text-align: center; vertical-align: 2px; box-sizing: border-box; }
  .bottom .pi { position: relative; display: inline-flex; }
  .bottom .due { position: absolute; top: -6px; left: 16px; margin: 0; }
  /* v0.29.0: the trip steps use the same gutter as every page (16 px on a phone). */
  main.calm { padding: var(--gut) var(--gut) 80px; max-width: none; }
  @media (max-width: 719px) { main.calm { padding: 12px var(--gut) calc(106px + env(safe-area-inset-bottom)); } }

  .top {
    position: sticky;
    top: 0;
    z-index: 5;
  }
  /* v0.46.1: the open search sheet (in the top bar) covers the page's bottom bars too. */
  :global(body.search-open) .top {
    z-index: 40;
  }
  .top {
    display: flex;
    align-items: center;
    min-height: 64px;
    box-sizing: border-box;
    gap: 6px 22px;
    padding: calc(8px + env(safe-area-inset-top)) var(--gut) 8px;
    background: var(--brand);
    color: var(--brand-ink);
  }
  /* v0.22.0 (AP03): places in Fira Sans, sentence case; the condensed face stays for the logo. */
  .top a {
    font: 500 16px var(--font-body);
    color: var(--brand-ink);
    text-decoration: none;
  }
  /* v0.27.0 (AP21): the logo link is 44 px high (was 31 px). */
  .top .brand {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    min-width: 44px; /* v0.44.1 (AP21): "PG" on a phone is a 44 px target too */
    font-family: var(--font-brand);
    color: var(--hi-bright);
    font-size: 26px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  /* Focus on the dark bars: a light ring that shows against the green. */
  .top :focus-visible,
  .bottom :focus-visible {
    outline-color: var(--focus-on-dark);
  }
  .places {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 28px;
    margin-left: 8px;
  }
  .places a {
    font-size: 17px;
    padding: 10px 0 7px;
    border-bottom: 3px solid transparent;
    color: var(--brand-ink-2);
  }
  .top a[aria-current='page'] {
    color: var(--brand-ink);
    font-weight: 600;
    border-bottom-color: var(--hi-bright);
  }
  .tools {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .more-btn .mdot {
    position: absolute;
    top: 8px;
    right: 6px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--hi-bright);
    box-shadow: 0 0 0 2px var(--brand);
  }
  .new {
    gap: 6px;
  }
  .top .short {
    display: none;
  }
  @media (max-width: 719px) {
    .top {
      gap: 6px 10px;
    }
    .top .long {
      display: none;
    }
    .top .short {
      display: inline;
    }
    .tools {
      min-width: 0;
      gap: 2px;
    }
  }
  /* v0.30.1 (Noah D6): a phone turned sideways (844×390) is wider than 720 px and gets the big-screen
     bar, which took 102 of 390 px (logo and places on two lines). Low there: one line, 48 px. */
  @media (max-height: 500px) and (min-width: 720px) {
    .top {
      min-height: 48px;
      gap: 4px 16px;
      padding: calc(2px + env(safe-area-inset-top)) max(var(--gut), env(safe-area-inset-right)) 2px max(var(--gut), env(safe-area-inset-left));
    }
    .top .long {
      display: none;
    }
    .top .short {
      display: inline;
    }
    .places {
      flex-wrap: nowrap;
      gap: 4px 20px;
      margin-left: 0;
    }
    .places a {
      font-size: 16px;
      white-space: nowrap;
    }
    .tools {
      min-width: 0;
      gap: 6px;
    }
  }
  /* A small phone sideways (667×375) keeps the phone layout: low bars there too. */
  @media (max-height: 500px) and (max-width: 719px) {
    .top {
      min-height: 48px;
      padding-top: calc(2px + env(safe-area-inset-top));
      padding-bottom: 2px;
    }
  }
  /* Phone (answer 3a): the places at the bottom, in reach of the thumb, + in the middle. */
  .bottom {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    padding: 4px 6px calc(6px + env(safe-area-inset-bottom));
    background: var(--brand);
  }
  .bottom a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 52px;
    justify-content: center;
    color: var(--brand-ink-2);
    font: 500 13px var(--font-body);
    text-decoration: none;
  }
  /* The current place: white label plus a short orange bar, not colour alone. */
  .bottom a[aria-current='page'] {
    color: var(--brand-ink);
    font-weight: 600;
    box-shadow: inset 0 3px 0 var(--hi-bright);
  }
  .bottom svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }
  .bottom .plus {
    flex: none;
    width: 60px;
    height: 60px;
    margin: -22px 4px 0;
    border-radius: 50%;
    border: 4px solid var(--ground);
    background: var(--hi);
    color: var(--hi-ink);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .bottom .plus svg {
    width: 26px;
    height: 26px;
    stroke-width: 2.6;
  }
  .bottom .plus:focus-visible {
    outline: 3px solid var(--focus-on-dark);
    outline-offset: 2px;
  }
  /* v0.30.1 (D6): sideways, the bottom bar is one 44 px row: icon next to the label, a smaller +. */
  @media (max-height: 500px) {
    .bottom {
      padding: 2px max(6px, env(safe-area-inset-right)) calc(2px + env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left));
    }
    .bottom a {
      flex-direction: row;
      gap: 6px;
      min-height: 44px;
    }
    .bottom .plus {
      width: 44px;
      height: 44px;
      margin: 0 4px;
      border-width: 0;
    }
  }
  main {
    padding: var(--gut);
    max-width: 1200px;
    margin: 0 auto;
  }
  /* Pack, Gear and Home use the full width on a big screen (design audit G4, H4). */
  main.wide {
    max-width: 1600px;
  }
  /* Room for the bottom bar on a phone. */
  @media (max-width: 719px) {
    main {
      padding-bottom: calc(96px + env(safe-area-inset-bottom));
    }
  }
  /* v0.30.1 (D6): sideways, less room above the page, and clear of a notch at the side. */
  @media (max-height: 500px) {
    main,
    main.calm {
      padding-top: 10px;
      padding-left: max(var(--gut), env(safe-area-inset-left));
      padding-right: max(var(--gut), env(safe-area-inset-right));
    }
  }
  /* v0.23.0 (AP07): the bars never print (a shared list, Print list). */
  @media print {
    .top,
    .bottom {
      display: none !important;
    }
  }
</style>

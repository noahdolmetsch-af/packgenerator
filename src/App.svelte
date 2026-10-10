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
  import Between from './pages/Between.svelte';
  import { parseBetween } from './lib/phase.js';
  import FlowLayer from './lib/flow/FlowLayer.svelte';
  import DemoBar from './lib/DemoBar.svelte';
  import QuickNote from './lib/QuickNote.svelte';
  import NewSheet from './lib/nav/NewSheet.svelte';
  import Search from './lib/nav/Search.svelte';
  import { parseBikesHash } from './lib/bikes.js';
  import { liveQuery } from 'dexie';
  import { db } from './lib/db.js';
  import { wide, phone } from './lib/media.svelte.js';
  import Me from './pages/Me.svelte';
  import SideBar from './lib/nav/SideBar.svelte';
  import PlaceBar from './lib/nav/PlaceBar.svelte';
  import MeButton from './lib/nav/MeButton.svelte';
  import Keys from './lib/nav/Keys.svelte';
  import { shortcutOf, typing, G_WAIT } from './lib/nav/keys.js';
  import { sortBikes } from './lib/bikes.js';
  import { withVisits } from './lib/workshop.js';
  import { bikeCare } from './lib/readiness.js';
  import { localDay } from './lib/localday.js';
  import { pageOf, placeOf, redirectOf } from './lib/nav.js';
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
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  // v0.23.0 (AP07): the address → page and its main place live in nav.js (tested there).
  const page = $derived(pageOf(hash, parseBikesHash(hash).tab === 'care'));
  const place = $derived(placeOf(page));
  // v0.74.0 «Fünf Orte» 1: the place tints the page and colours the bars (app.css --pc, --tint).
  $effect(() => {
    if (place) document.documentElement.dataset.place = place;
    else delete document.documentElement.dataset.place;
  });
  // The trip pages have their own main button at the bottom (rule U1): the round + sits above it there.
  const calm = $derived(page === 'pack' || page === 'ride' || page === 'between' || (page === 'debrief' && !!param && !['learnings', 'pace', 'compare', 'logbook'].includes(param)));
  // v0.74.0: the keyboard shortcuts (nav/keys.js), «?» shows them (also from Ich).
  let keysOpen = $state(false);
  $effect(() => {
    const open = () => (keysOpen = true);
    let gAt = 0;
    const key = (e) => {
      if (typing(e)) return;
      const afterG = Date.now() - gAt < G_WAIT;
      const s = shortcutOf(e.key, afterG);
      gAt = s?.wait ? Date.now() : 0;
      if (!s || s.wait) return;
      e.preventDefault();
      if (s.go) location.hash = s.go;
      else if (s.act === 'me') location.hash = '#/me';
      else if (s.act === 'help') keysOpen = true;
      else if (s.act === 'new' && page !== 'share') newMode = 'all';
      else if (s.act === 'search') {
        const field = document.querySelector('.side .search input');
        if (field) field.focus();
        else document.querySelector('header.top .search button.icon')?.click();
      }
    };
    window.addEventListener('pg:keys', open);
    document.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pg:keys', open);
      document.removeEventListener('keydown', key);
    };
  });
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
     v0.74.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): five places. On a computer a sidebar on the left
     (logo, search, Ich, + Neu, the places with their pages); on a phone the top bar with search and
     «Ich», the places at the bottom and a round + above them. «More» is gone: its pages are under
     their place or in «Ich». -->
<div class="shell" class:wide={wide.matches}>
{#if wide.matches}
  <SideBar {place} {hash} due={$dueQ ?? 0} inbox={$inboxQ ?? 0} shownew={page !== 'share'} onnew={() => (newMode = 'all')} />
{:else}
  <header class="top">
    <a class="brand" href="#/" aria-label={t('Pack Generator, start page')}><span class="long">Pack Generator</span><span class="short" aria-hidden="true">PG</span></a>
    <div class="tools">
      <Search compact />
      <MeButton inbox={$inboxQ ?? 0} current={place === 'me'} />
    </div>
  </header>
{/if}
<div class="col">
<DemoBar />

<main class:calm class:fab={!wide.matches && !calm && page !== 'share'} class:wide={page === 'pack' || page === 'ride' || page === 'debrief' || page === 'rides' || page === 'past' || page === 'templates' || page === 'gear' || page === 'blocks' || page === 'blockcheck' || page === 'home' || page === 'features' || page === 'wardrobe' || page === 'flow'} class:bar={!wide.matches}>
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
  {:else if page === 'between'}
    <!-- v0.67.0 «Übergänge 1» (Ü3a): #/trip/<id>/packed | ended | debriefed, the interstitials -->
    {@const b = parseBetween(hash)}
    {#key hash}<Between id={b?.id ?? ''} kind={b?.kind ?? 'packed'} />{/key}
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
    <!-- v0.66.0 (Noah 4a): «Bausteine prüfen», one block after the other -->
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
  {:else if page === 'me'}
    <!-- v0.74.0 «Fünf Orte» 1: «Ich», top right -->
    <Me />
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
<Keys bind:open={keysOpen} />
{#if !wide.matches}
  <!-- v0.74.0: the five places at the bottom (also under a shared list, there without +). -->
  <PlaceBar {place} due={$dueQ ?? 0} fab={page !== 'share'} high={calm && phone.matches} onnew={() => (newMode = 'all')} />
{/if}
</div>
</div>

<style>
  /* v0.74.0 «Fünf Orte» 1: on a computer the sidebar on the left and the page next to it. */
  .shell.wide {
    display: grid;
    grid-template-columns: 252px minmax(0, 1fr);
    min-height: 100vh;
  }
  .col {
    min-width: 0;
  }
  /* v0.29.0: the trip steps use the same gutter as every page (16 px on a phone). */
  main.calm { padding: var(--gut) var(--gut) 80px; max-width: none; }
  @media (max-width: 719px) { main.calm { padding: 12px var(--gut) calc(106px + env(safe-area-inset-bottom)); } }

  .top {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    min-height: 56px;
    gap: 6px 10px;
    padding: calc(6px + env(safe-area-inset-top)) var(--gut) 6px;
    background: var(--brand);
    color: var(--brand-ink);
  }
  /* v0.46.1: the open search sheet (in the top bar) covers the page's bottom bars too. */
  :global(body.search-open) .top {
    z-index: 40;
  }
  /* v0.27.0 (AP21): the logo link is 44 px high (was 31 px). */
  .top .brand {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    min-width: 44px; /* v0.44.1 (AP21): "PG" on a phone is a 44 px target too */
    font: 900 var(--fs-section) / 1 var(--font-brand);
    color: var(--hi-bright);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  /* Focus on the dark bar: a light ring that shows against it. */
  .top :focus-visible {
    outline-color: var(--focus-on-dark);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
    margin-left: auto;
  }
  .top .short {
    display: none;
  }
  @media (max-width: 719px) {
    .top .long {
      display: none;
    }
    .top .short {
      display: inline;
    }
  }
  /* A phone turned sideways: a low top bar. */
  @media (max-height: 500px) {
    .top {
      min-height: 48px;
      padding: calc(2px + env(safe-area-inset-top)) max(var(--gut), env(safe-area-inset-right)) 2px max(var(--gut), env(safe-area-inset-left));
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
  /* Room for the bottom bar, and for the round + on the right (v0.74.0). */
  main.bar:not(.calm) {
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }
  /* a trip page on a phone: its main button at the bottom, the round + above it */
  @media (max-width: 719px) {
    main.bar.calm {
      padding-bottom: calc(214px + env(safe-area-inset-bottom));
    }
  }
  main.bar.fab {
    padding-bottom: calc(150px + env(safe-area-inset-bottom));
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
    .shell :global(.side) {
      display: none !important;
    }
    .shell.wide {
      display: block;
    }
  }
</style>

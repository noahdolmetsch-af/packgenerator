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
  import Helper from './pages/Helper.svelte';
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
  import KomootSheet from './lib/komoot/KomootSheet.svelte';
  import Search from './lib/nav/Search.svelte';
  import { parseBikesHash } from './lib/bikes.js';
  import { liveQuery } from 'dexie';
  import { db } from './lib/db.js';
  import { wide } from './lib/media.svelte.js';
  import { Plus } from '@lucide/svelte';
  import Me from './pages/Me.svelte';
  import Look from './pages/Look.svelte';
  import Data from './pages/Data.svelte';
  import Docs from './pages/Docs.svelte';
  import WasNeu from './pages/WasNeu.svelte';
  import Phone from './pages/Phone.svelte';
  import Checks from './pages/Checks.svelte';
  import Abfragen from './pages/Abfragen.svelte';
  import Verlauf from './pages/Verlauf.svelte';
  import Auswertung from './pages/Auswertung.svelte';
  import Pay from './pages/Pay.svelte';
  import Handbook from './pages/Handbook.svelte';
  import MiniApps from './pages/MiniApps.svelte';
  import Inspiration from './pages/Inspiration.svelte';
  import { linkFrom } from './lib/notebook.js';
  import { INSPO_WISH } from './lib/inspiration.js';
  import Lists from './pages/Lists.svelte';
  import { listsReady } from './lib/listsready.svelte.js';
  import Timer from './pages/Timer.svelte';
  import TimerFaces from './pages/TimerFaces.svelte';
  import TimerLog from './pages/TimerLog.svelte';
  import TimerFloat from './lib/timer/TimerFloat.svelte';
  import Invoices from './pages/Invoices.svelte';
  import Bills from './pages/Bills.svelte';
  import PayLink from './pages/PayLink.svelte';
  import InvoiceNew from './pages/InvoiceNew.svelte';
  import SideBar from './lib/nav/SideBar.svelte';
  import PlaceBar from './lib/nav/PlaceBar.svelte';
  import MeButton from './lib/nav/MeButton.svelte';
  import Keys from './lib/nav/Keys.svelte';
  import { shortcutOf, typing, G_WAIT } from './lib/nav/keys.js';
  import { ops } from './lib/bedienung.svelte.js';
  import { sortBikes } from './lib/bikes.js';
  import { withVisits } from './lib/workshop.js';
  import { bikeCare } from './lib/readiness.js';
  import { localDay } from './lib/localday.js';
  import { pageOf, placeOf, redirectOf, tabOf, keepTab, PLACES, PLACE_TABS } from './lib/nav.js';
  import PlaceTabs from './lib/nav/PlaceTabs.svelte';
  import ErrorPage from './lib/ui/ErrorPage.svelte';
  import MiniBar from './lib/nav/MiniBar.svelte';
  import { miniAppOf, miniStart } from './lib/miniapps.js';
  import { t, lang } from './lib/i18n.svelte.js';

  // A tiny "router": the part of the address after # decides which page is shown,
  // e.g. …/packgenerator/#/gear. It works offline and needs no server setup.
  // v0.49.0 R1: an old address of a page that became part of another (#/review, #/debrief/compare)
  // is replaced by the new one, so a bookmark or an old link still lands on the right page.
  let spot = $state('');
  // v0.78.0 «Fünf Orte» 2 (Noah O2.6a): the old address that led here, shown once in a small note.
  let moved = $state(null);
  const follow = (h) => {
    const r = redirectOf(h);
    if (!r) return h;
    history.replaceState(null, '', `${location.pathname}${location.search}${r.hash}`);
    spot = r.spot;
    moved = r.old ?? null;
    return r.hash;
  };
  // Kleine Apps (Noah 14.10.2026): …/apps/<key>/ is a small app (miniapps.js); it starts on its own area.
  const mini = miniAppOf(location.pathname);
  if (mini && miniStart(mini, location.hash) !== location.hash) history.replaceState(null, '', `${location.pathname}${location.search}${miniStart(mini, location.hash)}`);
  let hash = $state(follow(location.hash));
  // v0.127.0 A-U2 (mockup «Fehlerseite»): a page that throws shows the error page, never a white page.
  // failReset: the boundary's reset while the error page shows; failName: the page's name in the text.
  let failReset = null;
  const onfail = (e, reset) => {
    failReset = reset;
    console.error(e);
  };
  const failName = $derived.by(() => {
    if (place === 'me') return t('Me|place');
    const tabEntry = (PLACE_TABS[place] ?? []).find((x) => x.key === tab);
    const p = PLACES.find((x) => x.key === place);
    return tabEntry && p ? `${t(p.label)} › ${t(tabEntry.label)}` : p ? t(p.label) : '';
  });
  $effect(() => {
    const update = () => {
      spot = '';
      moved = null;
      hash = follow(location.hash);
      // v0.127.0 A-U2: another address leaves the error page; the new page is built afresh
      if (failReset) {
        const r = failReset;
        failReset = null;
        r();
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  // v0.23.0 (AP07): the address → page and its main place live in nav.js (tested there).
  const page = $derived(pageOf(hash, parseBikesHash(hash).tab === 'care'));
  const place = $derived(placeOf(page));
  // v0.78.0 «Fünf Orte» 2 (Noah O2.2a): each place remembers the tab opened last (nav.js placeHref).
  const tab = $derived(place ? tabOf(place, hash) : null);
  $effect(() => {
    if (place && tab) keepTab(place, tab);
  });
  // v0.76.0 «Fünf Orte» 1: the place tints the page and colours the bars (app.css --pc, --tint).
  $effect(() => {
    if (place) document.documentElement.dataset.place = place;
    else delete document.documentElement.dataset.place;
  });
  // The trip pages have their own main button at the bottom (rule U1): the round + sits above it there.
  // v0.94.0 «Kachel-Wand»: Today has no row of 8 buttons any more, so the round + no longer steps aside there.
  const calm = $derived(page === 'pack' || page === 'ride' || page === 'between' || (page === 'debrief' && !!param && !['learnings', 'pace', 'compare', 'logbook'].includes(param)));
  // v0.76.0: the keyboard shortcuts (nav/keys.js), «?» shows them (also from Ich).
  let keysOpen = $state(false);
  $effect(() => {
    const open = () => (keysOpen = true);
    let gAt = 0;
    const key = (e) => {
      // FE6 (Noah 13.10.2026): the shortcuts can be switched off in Ich › Darstellung › Bedienung
      if (!ops.keys || typing(e)) return;
      const afterG = Date.now() - gAt < G_WAIT;
      const s = shortcutOf(e.key, afterG, place);
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
      // «Inspiration» UC2-4: a shared link (browser «Teilen» › Pack Generator) opens «Link hinzufügen» on
      // the Inspiration page; its window offers «Into the Inbox instead». Text without a link: Inbox as before.
      const shared = linkFrom(notePrefill);
      if (shared) {
        const title = (q.get('title')?.trim() || notePrefill.replace(shared.url, '').trim().split('\n')[0] || '').slice(0, 120);
        let kept = false;
        try {
          localStorage.setItem(INSPO_WISH, JSON.stringify({ url: shared.url, title: title === shared.url ? '' : title }));
          kept = true;
        } catch {
          /* private mode: the link goes to the Inbox below */
        }
        if (kept) {
          history.replaceState(null, '', `${location.pathname}#/inspiration`);
          hash = '#/inspiration';
          window.dispatchEvent(new Event('pg:inspo'));
          return;
        }
      }
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
  // v0.38.0 (Noah E): a number only where something waits (Bikes place).
  const dueQ = liveQuery(async () => {
    const [bikes, tasks, visits] = await Promise.all([db.bikes.toArray(), db.maintenance.toArray(), db.visits.toArray()]);
    const today = localDay();
    // v0.137.0 (DK1): the points due over all bikes, the same number as Bikes › Care.
    return sortBikes(bikes).reduce((n, b) => n + (bikeCare(withVisits(b, visits), { tasks, visits, today })?.rows.length ?? 0), 0);
  });
  // SN1c «Tour aus komoot übernehmen»: a GPX without times shared to the app (public/share-target.js)
  // opens #/komoot/shared; the sheet opens over Touren, where the new trip will be.
  let komootOpen = $state(false);
  $effect(() => {
    if (hash === '#/komoot/shared') {
      history.replaceState(null, '', `${location.pathname}#/trips`);
      hash = '#/trips';
      komootOpen = true;
    }
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
     v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): five places. On a computer a sidebar on the left
     (logo, search, Ich, + Neu, the places with their pages); on a phone the top bar with search and
     «Ich», the places at the bottom and a round + above them. «More» is gone: its pages are under
     their place or in «Ich».
     v0.98.0 Design-Refresh R2 (G4/G5 A★): the top bar and the sidebar are light; on a phone the + sits
     in the top bar next to the search (never over the page), the round + above the bottom bar is gone. -->
<div class="shell" class:wide={wide.matches && !mini} class:mini={!!mini}>
{#if wide.matches && !mini}
  <SideBar {place} {hash} due={$dueQ ?? 0} inbox={$inboxQ ?? 0} shownew={page !== 'share'} onnew={() => (newMode = 'all')} />
{:else}
  <header class="top">
    {#if mini}<a class="brand" href={mini.tabs[0].href}><span class="mark" aria-hidden="true">PG</span><span class="long show">{t(mini.name)}</span></a>{:else}<a class="brand" href="#/" aria-label={t('Pack Generator, start page')}><span class="mark" aria-hidden="true">PG</span><span class="long">Pack Generator</span></a>{/if}
    <div class="tools">
      <Search compact />
      {#if page !== 'share'}<button type="button" class="plus" aria-label={t('New')} aria-haspopup="dialog" aria-keyshortcuts="n" onclick={() => (newMode = 'all')}><Plus size={22} strokeWidth={2.4} aria-hidden="true" /></button>{/if}
      <MeButton inbox={$inboxQ ?? 0} current={place === 'me'} />
    </div>
  </header>
{/if}
<div class="col">
<DemoBar />

<main class:calm class:wide={page === 'pack' || page === 'ride' || page === 'debrief' || page === 'rides' || page === 'past' || page === 'templates' || page === 'gear' || page === 'blocks' || page === 'blockcheck' || page === 'home' || page === 'features' || page === 'wardrobe' || page === 'flow' || page === 'timer'} class:bar={!wide.matches || !!mini}>
  {#if !calm && page !== 'share' && !mini}<PlaceTabs {place} {hash} {moved} onclosemoved={() => (moved = null)} />{/if}
  <svelte:boundary onerror={onfail}>
  {#key `${switchN}-${listsReady.v}`}
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
  {:else if page === 'timer'}
    <!-- «Timer» (mockups Z2–Z5): #/timer, #/timer/faces (Z3), #/timer/log (Z5), pages of Heute -->
    {#key hash}{#if hash.startsWith('#/timer/faces')}<TimerFaces />{:else if hash.startsWith('#/timer/log')}<TimerLog />{:else}<Timer />{/if}{/key}
  {:else if page === 'me'}
    <!-- v0.76.0 «Fünf Orte» 1: «Ich», top right -->
    <Me />
  {:else if page === 'look'}
    <!-- v0.97.0 Design-Refresh R1: Ich › Darstellung -->
    <Look />
  {:else if page === 'data'}
    <!-- Design-Refresh P9 (I2): Ich › Daten und Backup, its own page -->
    <Data />
  {:else if page === 'docs'}
    <!-- P3b «Daten sicher» (mockups D3/D4): Ich › Dokumente, one document at #/me/docs/<id> -->
    {#key hash.split('?')[0]}<Docs />{/key}
  {:else if page === 'news'}
    <!-- v0.110.0 Design-Refresh P10 (I11): Ich › Was ist neu -->
    {#key hash}<WasNeu />{/key}
  {:else if page === 'phone'}
    <!-- Design-Refresh P9 (B35): Ich › Daten › Aufs Handy, the QR code -->
    <Phone />
  {:else if page === 'checks'}
    <!-- v0.111.0 (mockup V4): Ich › Checks pro Reiseart -->
    <Checks />
  {:else if page === 'handbook'}
    <!-- Ich › Handbuch (mockup HB2, Noah 14.10.2026 «hb freigeben») -->
    <Handbook />
  {:else if page === 'miniapps'}
    <!-- Ich › Kleine Apps (mockup HB2) -->
    <MiniApps />
  {:else if page === 'abfragen'}
    <!-- AB1/AB5 «Deine Abfragen»: Ich › Deine Abfragen -->
    <Abfragen />
  {:else if page === 'history'}
    <!-- AB4: Ich › Daten › Verlauf, all values in one place -->
    <Verlauf />
  {:else if page === 'analysis'}
    <!-- AB6: Ich › Daten › Auswertung (Noah 4ab: also on «Deine Abfragen») -->
    <Auswertung />
  {:else if page === 'pay'}
    <!-- Ich › Bezahlen (mockups BZ1 + BZ2b, Noah 14.10.2026 «bz freigeben») -->
    <Pay />
  {:else if page === 'inspiration'}
    <!-- «Inspiration» UC2-1, UC2-2, UC2-4: your own links; sidebar on a computer, Ich › Inspiration on a phone -->
    <Inspiration />
  {:else if page === 'lists'}
    <!-- v0.134.0 «Listen und Typen» (LI1–LI4): Ich › Die App › Listen und Typen -->
    {#key hash}<Lists />{/key}
  {:else if page === 'invoices'}
    <!-- Ich › Bezahlen › Rechnungen (mockups QR2 + QR7, Noah 14.10.2026 04:00 «a») -->
    <Invoices />
  {:else if page === 'paylink'}
    <!-- the payer page of an invoice link: «Ich habe bezahlt» (mockup QR5, Noah 14.10.2026 04:00 «a») -->
    <PayLink part={param} />
  {:else if page === 'bills'}
    <!-- Ich › Bezahlen › Zu zahlen (mockup QR9, Noah 14.10.2026 05:10 «a») -->
    <Bills />
  {:else if page === 'invoice'}
    <!-- Ich › Bezahlen › Rechnungen › Neue Rechnung or one invoice (mockups QR1 + QR4) -->
    <InvoiceNew />
  {:else if page === 'helper'}
    <!-- v0.77.0 KI-Helfer (K1a): the helper's settings, Ich › Helfer -->
    <Helper />
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
  {#snippet failed(error, reset)}<ErrorPage {error} name={failName} onreset={() => ((failReset = null), reset())} />{/snippet}
  </svelte:boundary>
</main>

{#if page !== 'share'}
  <QuickNote {page} bind:open={noteOpen} prefill={notePrefill} prefillBike={noteBike} />
  <NewSheet bind:mode={newMode} onnote={note} />
{/if}
{#if page !== 'share'}<FlowLayer page={page === 'flow' && !/^#\/flow\/?$/.test(hash) ? 'flow-sub' : page} />{/if}
<!-- «Timer» (Z1): a running timer stays in sight on every other page -->
{#if page !== 'share' && page !== 'timer'}<TimerFloat />{/if}
<Keys bind:open={keysOpen} />
{#if komootOpen}<KomootSheet onclose={() => (komootOpen = false)} />{/if}
{#if mini}
  <!-- Kleine Apps: only the tabs of the small app and «Whole app» -->
  <MiniBar app={mini} {hash} />
{:else if !wide.matches}
  <!-- v0.76.0: the five places at the bottom (also under a shared list). -->
  <PlaceBar {place} {hash} due={$dueQ ?? 0} />
{/if}
</div>
</div>

<style>
  /* v0.76.0 «Fünf Orte» 1: on a computer the sidebar on the left and the page next to it. */
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
    background: var(--tint, var(--ground));
    color: var(--ink);
  }
  /* v0.46.1: the open search sheet (in the top bar) covers the page's bottom bars too. */
  :global(body.search-open) .top {
    z-index: 40;
  }
  /* v0.27.0 (AP21): the logo link is 44 px high (was 31 px). */
  .top .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    min-width: 44px; /* v0.44.1 (AP21): "PG" on a phone is a 44 px target too */
    color: var(--ink);
    font: 600 var(--fs-body) / 1 var(--font-brand);
    text-decoration: none;
  }
  .top .mark {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--brand);
    color: var(--brand-ink);
    font: 700 var(--fs-small) / 1 var(--font-brand);
    letter-spacing: 0.02em;
  }
  /* v0.98.0 R2: «Neu» in the top bar, round, between the search and «Ich» */
  .plus {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--hi);
    color: var(--hi-ink);
    cursor: pointer;
  }
  .plus:hover {
    background: var(--hi-hover);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
    margin-left: auto;
  }
  @media (max-width: 719px) {
    .top .long:not(.show) {
      display: none;
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
  /* Room for the bottom bar (v0.98.0 R2: the round + above it is gone). */
  main.bar:not(.calm) {
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }
  /* a trip page on a phone: its main button above the bottom bar (v0.100.0: up to 899 px) */
  @media (max-width: 719px), (max-width: 899px) and (min-height: 501px) {
    main.bar.calm {
      padding-bottom: calc(150px + env(safe-area-inset-bottom));
    }
  }
  /* v0.100.0 P1 (G7): on a computer room for the bar with the next step at the bottom of the window */
  @media (min-width: 900px) and (min-height: 501px) {
    main.calm {
      padding-bottom: 120px;
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
    .shell :global(.side) {
      display: none !important;
    }
    .shell.wide {
      display: block;
    }
  }
</style>

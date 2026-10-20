<script>
  import Home from './pages/Home.svelte';
  import LazyPage from './lib/nav/LazyPage.svelte';
  import { warmUp } from './lib/nav/lazy.js';
  import SkiTurn from './lib/ski/SkiTurn.svelte';
  import { parseBetween } from './lib/phase.js';
  import FlowLayer from './lib/flow/FlowLayer.svelte';
  import DemoBar from './lib/DemoBar.svelte';
  import TourHost from './lib/tour/TourHost.svelte';
  import TourStart from './lib/tour/TourStart.svelte';
  import QuickNote from './lib/QuickNote.svelte';
  import NewSheet from './lib/nav/NewSheet.svelte';
  import KomootSheet from './lib/komoot/KomootSheet.svelte';
  import Search from './lib/nav/Search.svelte';
  import { parseBikesHash } from './lib/bikes.js';
  import { liveQuery } from 'dexie';
  import { rainLimitOf, setRainLimit } from './lib/rainlimit.svelte.js';
  import { db } from './lib/db.js';
  import { watchTourBike } from './lib/tourbike.svelte.js';
  import { watchVeloImGriff } from './lib/veloimgriff.svelte.js';
  import { watchInspect } from './lib/inspect/live.svelte.js';
  import { wide } from './lib/media.svelte.js';
  import { Plus, MessageCircle } from '@lucide/svelte';
  import { startPushSync } from './lib/push/client.js';
  import { linkFrom } from './lib/notebook.js';
  import { INSPO_WISH } from './lib/inspiration.js';
  import { listsReady } from './lib/listsready.svelte.js';
  import TimerFloat from './lib/timer/TimerFloat.svelte';
  import CreditNotice from './lib/helper/CreditNotice.svelte';
  import RemindCard from './lib/remind/RemindCard.svelte';
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
  import { OWN_KEY } from './lib/ownvalues.js';
  import { useOwn } from './lib/ownlive.svelte.js';
  import { checkPart } from './lib/flowcheck.js';
  import { pageOf, placeOf, redirectOf, tabOf, keepTab, PLACES, PLACE_TABS } from './lib/nav.js';
  import PlaceTabs from './lib/nav/PlaceTabs.svelte';
  import PlaceSwitch from './lib/nav/PlaceSwitch.svelte';
  import ErrorPage from './lib/ui/ErrorPage.svelte';
  import OfflineLine from './lib/clear/OfflineLine.svelte';
  import DbWaitLine from './lib/clear/DbWaitLine.svelte';
  import ComebackWindow from './lib/clear/ComebackWindow.svelte';
  import YearCheckWindow from './lib/clear/YearCheckWindow.svelte';
  import DiaryReminder from './lib/tagebuch/Reminder.svelte';
  import MiniBar from './lib/nav/MiniBar.svelte';
  import { miniAppOf, miniStart } from './lib/miniapps.js';
  import { toolKeyOf } from './lib/tools/tools.js';
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
  // «Tagebuch» (20.10.2026): #/tagebuch is its own page; the nav thread adds it to pageOf/placeOf with the new bar
  const page = $derived(hash.startsWith('#/tagebuch') ? 'tagebuch' : pageOf(hash, parseBikesHash(hash).tab === 'care'));
  const place = $derived(placeOf(page));
  // a page for someone without the app's data (a shared list, Paket S «Reise-Spur»: a tour's read link)
  const guest = $derived(page === 'share' || page === 'spurlink');
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
      else if (s.act === 'new' && !guest) newMode = 'all';
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
      // «Mail in die App» round 4 «1a»: the Mac bookmark «In den Eingang» (…?title=…&url=…&to=inbox) keeps the page
      // straight away as an Eingang entry, without a window (sorted there like everything else)
      if (q.get('to') === 'inbox') {
        db.notes.put({ id: `web-${Date.now().toString(36)}`, at: new Date().toISOString(), text: notePrefill.slice(0, 4000), photo: null, page: 'web', tripId: null, bikeId: null, status: 'open', to: null, sortedAt: null }).catch(() => {});
        history.replaceState(null, '', `${location.pathname}#/inbox`);
        hash = '#/inbox';
        return;
      }
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
  // Erinnerungen aufs Handy (Web-Push): the next reminders go to the server when the app opens and when it goes to the background.
  $effect(() => startPushSync());
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
  // VS2 (Noah 14.10.2026): which bike a new trip brings, read once and kept up to date
  watchTourBike(db);
  // «Velo im Griff»: the part templates per bike kind and the riding hours, live for the care rules
  watchVeloImGriff(db);
  watchInspect(db);
  const inboxQ = liveQuery(() => db.notes.where('status').equals('open').count());
  // v0.144.0 RE «Regen überall gleich»: the one rain limit (Bausteine › Regen) for every page, kept current.
  const rainQ = liveQuery(() => db.settings.get('sets'));
  $effect(() => setRainLimit(rainLimitOf($rainQ?.value)));
  // «Mehr selbst einstellen» (IS 254–255): Ich › Eigene Werte, live for every page (ownlive.svelte.js).
  const ownQ = liveQuery(() => db.settings.get(OWN_KEY));
  $effect(() => useOwn($ownQ?.value));
  // v0.38.0 (Noah E): a number only where something waits (Bikes place).
  const dueQ = liveQuery(async () => {
    const [bikes, tasks, visits, ownRec] = await Promise.all([db.bikes.toArray(), db.maintenance.toArray(), db.visits.toArray(), db.settings.get(OWN_KEY)]);
    useOwn(ownRec?.value); // the km check of «Eigene Werte» counts here too, also right after a change
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
  // Tempo «Seiten später laden» (Noah 19.10.2026, #1045): every page but Heute loads on its first visit
  // (nav/lazy.js); the service worker stores all parts, so they open offline too. A new page goes here.
  const PAGES = {
    Gear: () => import('./pages/Gear.svelte'),
    Bikes: () => import('./pages/Bikes.svelte'),
    Pack: () => import('./pages/Pack.svelte'),
    Templates: () => import('./pages/Templates.svelte'),
    Debrief: () => import('./pages/Debrief.svelte'),
    Share: () => import('./pages/Share.svelte'),
    Ride: () => import('./pages/Ride.svelte'),
    Abfahrt: () => import('./pages/Abfahrt.svelte'),
    Hueter: () => import('./pages/Hueter.svelte'),
    Inbox: () => import('./pages/Inbox.svelte'),
    Notes: () => import('./pages/Notes.svelte'),
    Favorites: () => import('./pages/Favorites.svelte'),
    PastTrips: () => import('./pages/PastTrips.svelte'),
    Trips: () => import('./pages/Trips.svelte'),
    Race: () => import('./pages/Race.svelte'),
    Live: () => import('./pages/Live.svelte'),
    Blocks: () => import('./pages/Blocks.svelte'),
    BlockCheck: () => import('./pages/BlockCheck.svelte'),
    Check: () => import('./pages/Check.svelte'),
    CheckQuestions: () => import('./pages/CheckQuestions.svelte'),
    Routine: () => import('./pages/Routine.svelte'),
    Woche: () => import('./pages/Woche.svelte'),
    WochePlanen: () => import('./pages/WochePlanen.svelte'),
    WocheFerien: () => import('./pages/WocheFerien.svelte'),
    Erkenntnisse: () => import('./pages/Erkenntnisse.svelte'),
    Features: () => import('./pages/Features.svelte'),
    Helper: () => import('./pages/Helper.svelte'),
    Assistent: () => import('./pages/Assistent.svelte'),
    GearImport: () => import('./pages/GearImport.svelte'),
    Rides: () => import('./pages/Rides.svelte'),
    Wardrobe: () => import('./pages/Wardrobe.svelte'),
    Flow: () => import('./pages/Flow.svelte'),
    Between: () => import('./pages/Between.svelte'),
    Me: () => import('./pages/Me.svelte'),
    Look: () => import('./pages/Look.svelte'),
    AiProjects: () => import('./pages/AiProjects.svelte'),
    Data: () => import('./pages/Data.svelte'),
    Docs: () => import('./pages/Docs.svelte'),
    Fitbit: () => import('./pages/Fitbit.svelte'),
    DocScan: () => import('./pages/DocScan.svelte'),
    Agenda: () => import('./pages/Agenda.svelte'),
    MailPage: () => import('./pages/Mail.svelte'),
    WasNeu: () => import('./pages/WasNeu.svelte'),
    WasKommt: () => import('./pages/WasKommt.svelte'), // Paket N #68: Ich › Was kommt
    Dreams: () => import('./pages/Dreams.svelte'), // Paket N: Touren › Träume
    Compass: () => import('./pages/Compass.svelte'), // Paket N: Ich › Mein Kompass
    Phone: () => import('./pages/Phone.svelte'),
    Checks: () => import('./pages/Checks.svelte'),
    Push: () => import('./pages/Push.svelte'),
    Abfragen: () => import('./pages/Abfragen.svelte'),
    Verlauf: () => import('./pages/Verlauf.svelte'),
    Auswertung: () => import('./pages/Auswertung.svelte'),
    Weight: () => import('./pages/Weight.svelte'),
    Wohl: () => import('./pages/Wohl.svelte'), // Paket P «Was mir gut tut»
    Tools: () => import('./pages/Tools.svelte'), // Paket L «Werkzeugkasten»
    WebLinks: () => import('./pages/WebLinks.svelte'), // Paket L «Werkzeuge und Links»
    Hinweise: () => import('./pages/Hinweise.svelte'), // Paket Q #148: Ich › Hinweise und News
    Quiz: () => import('./pages/Quiz.svelte'), // Paket M «Quiz am Vorabend»
    Chronik: () => import('./pages/Chronik.svelte'), // Paket M «Chronik»
    Gelernt: () => import('./pages/Gelernt.svelte'), // Paket M «Was die App gelernt hat»
    JahrStory: () => import('./pages/JahrStory.svelte'), // Paket M «Dein Jahr als Bildgeschichte»
    Neuland: () => import('./pages/Neuland.svelte'), // «Neuland»
    Heatmap: () => import('./pages/Heatmap.svelte'), // «Heatmap» (20.10.2026)
    Spur: () => import('./pages/Spur.svelte'), // Paket S «Reise-Spur»
    Tour: () => import('./pages/Tour.svelte'), // «Tour» (Noah 19.10.2026 «1a»): one finished tour
    SpurLink: () => import('./pages/SpurLink.svelte'), // Paket S: the family's read link
    Abfahrt: () => import('./pages/Abfahrt.svelte'), // Paket K #87 «Vor der Abfahrt»
    Mountain: () => import('./pages/Mountain.svelte'), // Paket J: Berg, Schnee und Notfall
    Supplies: () => import('./pages/Supplies.svelte'), // Paket H: Material › Vorrat
    Lend: () => import('./pages/Lend.svelte'), // Paket H: Material › Ausgeliehen
    Fuel: () => import('./pages/Fuel.svelte'), // Verpflegung (Noah 19.10.2026 «1a»): Touren › Verpflegung
    Power: () => import('./pages/Power.svelte'), // Strombudget (Noah 19.10.2026 «2a»): Material › Strom
    Pay: () => import('./pages/Pay.svelte'),
    Handbook: () => import('./pages/Handbook.svelte'),
    MiniApps: () => import('./pages/MiniApps.svelte'),
    Inspiration: () => import('./pages/Inspiration.svelte'),
    TravelLinks: () => import('./pages/TravelLinksPage.svelte'),
    Lists: () => import('./pages/Lists.svelte'),
    Equipment: () => import('./pages/Equipment.svelte'),
    Ski: () => import('./pages/Ski.svelte'),
    OwnValues: () => import('./pages/OwnValues.svelte'),
    Reminders: () => import('./pages/Reminders.svelte'),
    Merken: () => import('./pages/Merken.svelte'),
    ListPage: () => import('./pages/ListPage.svelte'),
    Timer: () => import('./pages/Timer.svelte'),
    TimerFaces: () => import('./pages/TimerFaces.svelte'),
    TimerLog: () => import('./pages/TimerLog.svelte'),
    Invoices: () => import('./pages/Invoices.svelte'),
    Bills: () => import('./pages/Bills.svelte'),
    PayLink: () => import('./pages/PayLink.svelte'),
    Shop: () => import('./pages/Shop.svelte'),
    ShopOrders: () => import('./pages/ShopOrders.svelte'),
    ShopBuy: () => import('./pages/ShopBuy.svelte'),
    InvoiceNew: () => import('./pages/InvoiceNew.svelte'),
    Offers: () => import('./pages/Offers.svelte'),
    Privacy: () => import('./pages/Privacy.svelte'),
    Pros: () => import('./pages/Pros.svelte'),
    Frei: () => import('./pages/Frei.svelte'),
    Tagebuch: () => import('./pages/Tagebuch.svelte'),
    Alltag: () => import('./pages/Alltag.svelte'),
  };
  // once Heute is drawn, the most used pages load quietly in the background
  $effect(() => warmUp([PAGES.Gear, PAGES.Pack, PAGES.Trips, PAGES.Bikes, PAGES.Me, PAGES.Flow, PAGES.Debrief]));
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
  <SideBar {place} {hash} due={$dueQ ?? 0} inbox={$inboxQ ?? 0} shownew={!guest} onnew={() => (newMode = 'all')} />
{:else}
  <header class="top">
    {#if mini}<a class="brand" href={mini.tabs[0].href}><span class="mark" aria-hidden="true">PG</span><span class="long show">{t(mini.name)}</span></a>{:else}<a class="brand" href="#/" aria-label={t('Pack Generator, start page')}><span class="mark" aria-hidden="true">PG</span><span class="long">Pack Generator</span></a>{/if}
    <div class="tools">
      <!-- «Assistent» (Noah 15.10.2026 «3 a und b»): its own button next to the search -->
      <a class="asst-ic" href="#/assistent" aria-label={t('Assistant')}><MessageCircle size={22} aria-hidden="true" /></a>
      <Search compact />
      {#if !guest}<button type="button" class="plus" aria-label={t('New')} aria-haspopup="dialog" aria-keyshortcuts="n" onclick={() => (newMode = 'all')}><Plus size={22} strokeWidth={2.4} aria-hidden="true" /></button>{/if}
      <MeButton inbox={$inboxQ ?? 0} current={place === 'me'} />
    </div>
  </header>
{/if}
<div class="col">
<DemoBar />
<OfflineLine />
<DbWaitLine />
{#if !mini && !guest}<ComebackWindow care={$dueQ ?? 0} inbox={$inboxQ ?? 0} /><YearCheckWindow {hash} /><DiaryReminder {hash} />{/if}

<main class:calm class:wide={page === 'pack' || page === 'ride' || page === 'debrief' || page === 'rides' || page === 'stravarides' || page === 'past' || page === 'templates' || page === 'gear' || page === 'supplies' || page === 'power' || page === 'fuel' || page === 'tour' || page === 'lend' || page === 'blocks' || page === 'blockcheck' || page === 'home' || page === 'features' || page === 'wardrobe' || page === 'flow' || page === 'timer' || page === 'check' || page === 'routine' || page === 'week' || page === 'neuland' || page === 'heatmap'} class:bar={!wide.matches || !!mini}>
  {#if !calm && !guest && !mini}<PlaceTabs {place} {hash} {moved} onclosemoved={() => (moved = null)} />{/if}
  <!-- AU1 «1b»: on a phone Velos and Ausrüstung share a slot. Gesamttest 20.10.2026 B7: the switch stands only
       on Ausrüstung (the way back); Velos already has its tabs and path, Ausrüstung is one row on Velos › Übersicht -->
  {#if (place === 'equipment' || place === 'gear') && !mini}<PlaceSwitch {place} />{/if}
  <!-- ER1/ER2: «Soll ich dich erinnern?» on top of the next page, in the page (never over its buttons) -->
  {#if !guest && page !== 'home'}<RemindCard />{/if}
  <svelte:boundary onerror={onfail}>
  {#key `${switchN}-${listsReady.v}`}
  {#if page === 'gear'}
    <LazyPage load={PAGES.Gear} />
  {:else if page === 'gearimport'}
    <!-- v0.36.0 (Noah 1a): the reviewed gear list waits here before it goes into Gear -->
    <LazyPage load={PAGES.GearImport} />
  {:else if page === 'pack'}
    <LazyPage load={PAGES.Pack} />
  {:else if page === 'bikes' || page === 'care'}
    <!-- v0.21.0 (Noah 6a): Setup and Care are tabs of one page; #/care lands on Care. -->
    <LazyPage load={PAGES.Bikes} />
  {:else if page === 'equipment'}
    <!-- AU1 «Ausrüstung» (Noah 15.10.2026 «5b», «1-5a»): the main equipment of each sport -->
    <LazyPage load={PAGES.Equipment} />
  {:else if page === 'templates'}
    <LazyPage load={PAGES.Templates} />
  {:else if page === 'between'}
    <!-- v0.67.0 «Übergänge 1» (Ü3a): #/trip/<id>/packed | ended | debriefed, the interstitials -->
    {@const b = parseBetween(hash)}
    {#key hash}<LazyPage load={PAGES.Between} id={b?.id ?? ''} kind={b?.kind ?? 'packed'} />{/key}
  {:else if page === 'trips' || page === 'stravarides'}
    <!-- v0.46.1 (Noah): «Touren», the overview of all trips; Gesamttest 20.10.2026 B3: #/trips/rides, the tab «Fahrten» (Strava activities);
         N1 «Neue Leiste» (Noah 20.10.2026): Fahrten stands under Auswerten, same page and address -->
    <LazyPage load={PAGES.Trips} sub={page === 'stravarides' ? 'rides' : ''} />
  {:else if page === 'quiz'}
    <!-- Paket M «Quiz am Vorabend» (#207): #/quiz, #/quiz/<tripId> -->
    {#key hash}<LazyPage load={PAGES.Quiz} tripId={decodeURIComponent(hash.split('?')[0].split('/')[2] ?? '')} />{/key}
  {:else if page === 'race'}
    <!-- Paket U «Rennen»: #/race, #/race/<trip>/<part>, #/race/brief/<trip> -->
    <LazyPage load={PAGES.Race} {hash} />
  {:else if page === 'ski'}
    <!-- v0.97.0 «Skitouren»: Touren › Skitouren; #/ski/check, /start, /care, /after/<trip> -->
    <LazyPage load={PAGES.Ski} sub={hash.split('/').slice(2).join('/')} />
  {:else if page === 'mountain'}
    <!-- Paket J «Berg, Schnee und Notfall»: #/mountain, /sos, /qr, /map, /scales; loads only when opened -->
    <LazyPage load={PAGES.Mountain} sub={hash.split('/').slice(2).join('/')} />
  {:else if page === 'past'}
    <!-- v0.25.1 (Noah 3a): the finished trips, from Today's Trips tile -->
    <LazyPage load={PAGES.PastTrips} />
  {:else if page === 'ride'}
    <!-- Paket K #87 «Blatt Vor der Abfahrt»: #/ride/abfahrt, loaded only when opened -->
    {#if param === 'abfahrt'}<LazyPage load={PAGES.Abfahrt} />{:else}<LazyPage load={PAGES.Ride} />{/if}
  {:else if page === 'share'}
    <!-- Paket 4 «Wohnungs-Hüter-Liste»: #/share/hueter/<code>, the list travels in the link -->
    {#if param === 'hueter'}{#key hash}<LazyPage load={PAGES.Hueter} code={hash.split('/')[3] ?? ''} />{/key}
    {:else}{#key param}<LazyPage load={PAGES.Share} code={param} />{/key}{/if}
  {:else if page === 'live'}
    <!-- Paket U3 «Live-Karte»: the map with your position on a ride (#/live, #/live/<tripId>) -->
    {#key param}<LazyPage load={PAGES.Live} id={decodeURIComponent((param ?? '').split('?')[0])} />{/key}
  {:else if page === 'spur'}
    <!-- Paket S «Reise-Spur»: a tour's map, days, read link and travel book; loaded only when opened (with its map) -->
    {#key param}<LazyPage load={PAGES.Spur} id={decodeURIComponent(param.split('?')[0])} />{/key}
  {:else if page === 'tour'}
    <!-- «Tour» (Noah 19.10.2026 «1a»): the page of one finished tour, #/tour/<a:…|g:…|t:…> -->
    {#key param}<LazyPage load={PAGES.Tour} key={decodeURIComponent(param.split('?')[0])} />{/key}
  {:else if page === 'spurlink'}
    <!-- Paket S «Reise-Spur»: what the family sees behind the read link -->
    {#key hash}<LazyPage load={PAGES.SpurLink} {hash} />{/key}
  {:else if page === 'blockcheck'}
    <!-- v0.66.0 (Noah 4a): «Bausteine prüfen», one block after the other -->
    <LazyPage load={PAGES.BlockCheck} />
  {:else if page === 'blocks'}
    <!-- v0.26.0 (Noah 2a/2b): building blocks (item sets) you can see and make -->
    <LazyPage load={PAGES.Blocks} />
  {:else if page === 'features'}
    <!-- v0.30.0 (Noah 3a): everything the app can do, with ✓ and how much is used -->
    <LazyPage load={PAGES.Features} />
  {:else if page === 'supplies'}
    <!-- Paket H (answer 2b): Material › Vorrat, loaded only when opened -->
    <LazyPage load={PAGES.Supplies} />
  {:else if page === 'lend'}
    <!-- Paket H (answer 5a+b): Material › Ausgeliehen, loaded only when opened -->
    <LazyPage load={PAGES.Lend} />
  {:else if page === 'fuel'}
    <!-- Verpflegung (Noah 19.10.2026 «1a»): Touren › Verpflegung, loaded only when opened -->
    {#key hash}<LazyPage load={PAGES.Fuel} />{/key}
  {:else if page === 'power'}
    <!-- Strombudget (Noah 19.10.2026 «2a»): Material › Strom, loaded only when opened -->
    <LazyPage load={PAGES.Power} />
  {:else if page === 'favorites'}
    <!-- v0.21.0 (package 5): all my favourite things, by area -->
    <LazyPage load={PAGES.Favorites} />
  {:else if page === 'wardrobe'}
    <!-- v0.42.0 (Noah 1): the wardrobe, by layer and body zone -->
    <LazyPage load={PAGES.Wardrobe} />
  {:else if page === 'flow'}
    <!-- v0.51.0 «Im Flow»: rings, ticks, goals × days; #/flow/goals, #/flow/edit/<id>, #/flow/new -->
    <LazyPage load={PAGES.Flow} sub={hash.split('/').slice(2).join('/')} />
  {:else if page === 'week'}
    <!-- «Woche planen» (WP1–WP3): the week, the Sunday planning, the holidays -->
    {#if hash.startsWith('#/week/plan')}<LazyPage load={PAGES.WochePlanen} />{:else if hash.startsWith('#/week/away')}<LazyPage load={PAGES.WocheFerien} />{:else}<LazyPage load={PAGES.Woche} />{/if}
  {:else if page === 'timer'}
    <!-- «Timer» (mockups Z2–Z5): #/timer, #/timer/faces (Z3), #/timer/log (Z5), pages of Heute -->
    {#key hash}{#if hash.startsWith('#/timer/faces')}<LazyPage load={PAGES.TimerFaces} />{:else if hash.startsWith('#/timer/log')}<LazyPage load={PAGES.TimerLog} />{:else}<LazyPage load={PAGES.Timer} />{/if}{/key}
  {:else if page === 'check'}
    <!-- v0.127.0 «Tages-Check» 1 (back 18.10.2026, Noah «1 a und b»): #/check/morning (T1) and #/check/evening (T2), pages of Heute -->
    <!-- v0.127.0 «Tages-Check» 2: #/check/questions (T4), the 15 questions with a switch each -->
    {#key hash}{#if checkPart(hash) === 'questions'}<LazyPage load={PAGES.CheckQuestions} />{:else}<LazyPage load={PAGES.Check} part={checkPart(hash)} />{/if}{/key}
  {:else if page === 'frei' || page === 'impulse'}
    <!-- Paket T «Freie Zeit»: Ich › Freie Zeit (#/me/frei/…) and Aktiv › Impulse (#/flow/impulse); the page picks its part -->
    <LazyPage load={PAGES.Frei} {hash} />
  {:else if page === 'tagebuch'}
    <!-- «Tagebuch» (Noah 20.10.2026, like Day One): #/tagebuch, one entry at #/tagebuch/<id> -->
    <LazyPage load={PAGES.Tagebuch} {hash} />
  {:else if page === 'alltag'}
    <!-- Paket V «Alltag»: Ich › Alltag (#/me/alltag/…): shopping list, contracts, «Not seen for a while» -->
    <LazyPage load={PAGES.Alltag} {hash} />
  {:else if page === 'routine'}
    <!-- Routine «Das tut mir gut» (mockup D2): compose the list, a page of Heute -->
    <LazyPage load={PAGES.Routine} />
  {:else if page === 'me'}
    <!-- v0.76.0 «Fünf Orte» 1: «Ich», top right -->
    <LazyPage load={PAGES.Me} />
  {:else if page === 'hinweise'}
    <!-- Paket Q #148: Ich › Hinweise und News -->
    <LazyPage load={PAGES.Hinweise} />
  {:else if page === 'aiprojects'}
    <!-- «Meine KI-Projekte» (Noah 19.10.2026 «2a»): Ich › own links to AI projects and chats -->
    <LazyPage load={PAGES.AiProjects} />
  {:else if page === 'look'}
    <!-- v0.97.0 Design-Refresh R1: Ich › Darstellung -->
    <LazyPage load={PAGES.Look} />
  {:else if page === 'data'}
    <!-- Design-Refresh P9 (I2): Ich › Daten und Backup, its own page -->
    <LazyPage load={PAGES.Data} />
  {:else if page === 'docs'}
    <!-- P3b «Daten sicher» (mockups D3/D4): Ich › Dokumente, one document at #/me/docs/<id> -->
    {#key hash.split('?')[0]}<LazyPage load={PAGES.Docs} />{/key}
  {:else if page === 'fitbit'}
    <!-- Fitbit über Google (mockup G1): Ich › Daten und Backup › Fitbit -->
    <LazyPage load={PAGES.Fitbit} />
  {:else if page === 'docscan'}
    <!-- Dokumente-PDF: «Dokument fotografieren», check and keep as PDF -->
    <LazyPage load={PAGES.DocScan} />
  {:else if page === 'connections'}
    <!-- package G #155: Ich › Verbindungen, loaded only when opened (main.js stays small) -->
    {#await import('./pages/Connections.svelte') then m}<m.default />{/await}
  {:else if page === 'agenda'}
    <!-- Google Kalender und Aufgaben (GA): Ich › Termine und Aufgaben -->
    <LazyPage load={PAGES.Agenda} />
  {:else if page === 'mail'}
    <!-- Google Mail (GM): Ich › Mail; keyed so «Mails dazu» from an appointment starts fresh -->
    {#key hash}<LazyPage load={PAGES.MailPage} />{/key}
  {:else if page === 'compass'}
    <LazyPage load={PAGES.Compass} />
  {:else if page === 'dreams'}
    <LazyPage load={PAGES.Dreams} />
  {:else if page === 'next'}
    <LazyPage load={PAGES.WasKommt} />
  {:else if page === 'news'}
    <!-- v0.110.0 Design-Refresh P10 (I11): Ich › Was ist neu -->
    {#key hash}<LazyPage load={PAGES.WasNeu} />{/key}
  {:else if page === 'phone'}
    <!-- Design-Refresh P9 (B35): Ich › Daten › Aufs Handy, the QR code -->
    <LazyPage load={PAGES.Phone} />
  {:else if page === 'push'}
    <!-- Erinnerungen aufs Handy (Web-Push, Noah 15.10.2026 «1a 2b 3a 4b 5a»): Ich › Erinnerungen aufs Handy -->
    <LazyPage load={PAGES.Push} />
  {:else if page === 'checks'}
    <!-- v0.111.0 (mockup V4): Ich › Checks pro Reiseart -->
    <LazyPage load={PAGES.Checks} />
  {:else if page === 'handbook'}
    <!-- Ich › Handbuch (mockup HB2, Noah 14.10.2026 «hb freigeben») -->
    <LazyPage load={PAGES.Handbook} />
  {:else if page === 'miniapps'}
    <!-- Ich › Kleine Apps (mockup HB2) -->
    <LazyPage load={PAGES.MiniApps} />
  {:else if page === 'tools'}
    <!-- Paket L «Werkzeugkasten»: Ich › Werkzeugkasten and its tools (#/me/tools/<key>) -->
    {#key toolKeyOf(hash)}<LazyPage load={PAGES.Tools} tool={toolKeyOf(hash)} />{/key}
  {:else if page === 'weblinks'}
    <!-- Paket L «Werkzeuge und Links» (Noah 19.10.2026 «1b»): links to other apps and pages -->
    <LazyPage load={PAGES.WebLinks} />
  {:else if page === 'offers'}
    <!-- Termine buchen (mockups BU1, BU4, BU5, Noah 14.10.2026 «BU1–BU5 freigegeben»): Ich › Angebote -->
    {#key hash}<LazyPage load={PAGES.Offers} id={decodeURIComponent(hash.split('?')[0].split('/')[3] ?? '')} />{/key}
  {:else if page === 'privacy'}
    <!-- Paket R: Ich › Datenschutz und Nutzung -->
    <LazyPage load={PAGES.Privacy} />
  {:else if page === 'pros'}
    <!-- Paket R (Noah 19.10.2026 «4a»): Ich › Velomech und Guide -->
    <LazyPage load={PAGES.Pros} />
  {:else if page === 'abfragen'}
    <!-- AB1/AB5 «Deine Abfragen»: Ich › Deine Abfragen -->
    <LazyPage load={PAGES.Abfragen} />
  {:else if page === 'history'}
    <!-- AB4: Ich › Daten › Verlauf, all values in one place -->
    <LazyPage load={PAGES.Verlauf} />
  {:else if page === 'analysis'}
    <!-- AB6: Ich › Daten › Auswertung (Noah 4ab: also on «Deine Abfragen») -->
    <LazyPage load={PAGES.Auswertung} />
  {:else if page === 'insights'}
    <!-- Erkenntnisse (Noah 19.10.2026 «4b» + own page): Ich › Erkenntnisse -->
    <LazyPage load={PAGES.Erkenntnisse} />
  {:else if page === 'weight'}
    <!-- TR6/TR6b: Ich › Meine Daten › Gewicht, only on this device -->
    <LazyPage load={PAGES.Weight} />
  {:else if page === 'wohl'}
    <!-- Paket P «Was mir gut tut»: Ich › Was mir gut tut -->
    <LazyPage load={PAGES.Wohl} />
  {:else if page === 'pay'}
    <!-- Ich › Bezahlen (mockups BZ1 + BZ2b, Noah 14.10.2026 «bz freigeben») -->
    <LazyPage load={PAGES.Pay} />
  {:else if page === 'travel'}
    <!-- «Reise-Links» (Noah 19.10.2026 «1b 2b 3a 4a 5b»): Touren › Reise-Links -->
    <LazyPage load={PAGES.TravelLinks} />
  {:else if page === 'inspiration'}
    <!-- «Inspiration» UC2-1, UC2-2, UC2-4: your own links; sidebar on a computer, Ich › Inspiration on a phone -->
    <LazyPage load={PAGES.Inspiration} />
  {:else if page === 'werte'}
    <!-- «Mehr selbst einstellen» (IS 254–258): Ich › Einstellungen › Eigene Werte -->
    <LazyPage load={PAGES.OwnValues} />
  {:else if page === 'lists'}
    <!-- v0.134.0 «Listen und Typen» (LI1–LI4): Ich › Die App › Listen und Typen -->
    {#key hash}<LazyPage load={PAGES.Lists} />{/key}
  {:else if page === 'invoices'}
    <!-- Ich › Bezahlen › Rechnungen (mockups QR2 + QR7, Noah 14.10.2026 04:00 «a») -->
    <LazyPage load={PAGES.Invoices} />
  {:else if page === 'paylink'}
    <!-- the payer page of an invoice link: «Ich habe bezahlt» (mockup QR5, Noah 14.10.2026 04:00 «a») -->
    <LazyPage load={PAGES.PayLink} part={param} />
  {:else if page === 'shop'}
    <!-- Ich › Bezahlen › Shop (mockup SHOP1, Noah 14.10.2026 04:00 «a») -->
    <LazyPage load={PAGES.Shop} />
  {:else if page === 'shoporders'}
    <!-- Ich › Bezahlen › Shop › Bestellungen (mockup SHOP3a) -->
    <LazyPage load={PAGES.ShopOrders} />
  {:else if page === 'shopbuy'}
    <!-- the shop link: buy without app or account (mockups SHOP2a + SHOP2b) -->
    {#key param}<LazyPage load={PAGES.ShopBuy} part={param} />{/key}
  {:else if page === 'bills'}
    <!-- Ich › Bezahlen › Zu zahlen (mockup QR9, Noah 14.10.2026 05:10 «a») -->
    <LazyPage load={PAGES.Bills} />
  {:else if page === 'invoice'}
    <!-- Ich › Bezahlen › Rechnungen › Neue Rechnung or one invoice (mockups QR1 + QR4) -->
    <LazyPage load={PAGES.InvoiceNew} />
  {:else if page === 'reminders'}
    <!-- ER3 (Noah 14.10.2026 «1a 2a 3a 4a 5b er1-er3 freigabe»): Ich › Erinnerungen -->
    <LazyPage load={PAGES.Reminders} />
  {:else if page === 'calendar'}
    <!-- PL3 (Noah 14.10.2026 «PL1-PL3 freigeben», «1a»): Kalender › Merken, the own to-dos -->
    <LazyPage load={PAGES.Merken} />
  {:else if page === 'list'}
    <!-- Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a»): one list in Kalender › Merken -->
    {#key hash}<LazyPage load={PAGES.ListPage} id={hash.split('/')[3] ?? ''} />{/key}
  {:else if page === 'assistent'}
    <!-- «Assistent» (Noah 15.10.2026 «1 beides 2a und b 3 a und b»): Frag die App + Hilf mir planen -->
    <LazyPage load={PAGES.Assistent} {hash} />
  {:else if page === 'helper'}
    <!-- v0.77.0 KI-Helfer (K1a): the helper's settings, Ich › Helfer -->
    <LazyPage load={PAGES.Helper} />
  {:else if page === 'inbox'}
    <LazyPage load={PAGES.Inbox} onnew={() => (noteOpen = true)} />
  {:else if page === 'notes'}
    <!-- v0.48.0: Notes (kept notes) and the inbox side by side -->
    <LazyPage load={PAGES.Notes} />
  {:else if page === 'rides'}
    <!-- v0.41.0 (Noah 1-4): upload a ride; #/debrief/ride/<id> one ride, #/debrief/ride/shared a shared file -->
    {#key sub}<LazyPage load={PAGES.Rides} {sub} />{/key}
  {:else if page === 'chronik'}
    <!-- Paket M #1027 «Chronik»: #/chronik, #/chronik/<YYYY-MM> -->
    {#key hash}<LazyPage load={PAGES.Chronik} month={hash.split('?')[0].split('/')[2] ?? null} />{/key}
  {:else if page === 'gelernt'}
    <!-- Paket M #38 «Was die App gelernt hat»: #/gelernt, #/gelernt/<YYYY-MM>, #/gelernt/<YYYY> -->
    {#key hash}<LazyPage load={PAGES.Gelernt} sub={hash.split('?')[0].split('/')[2] ?? ''} />{/key}
  {:else if page === 'jahr'}
    <!-- Paket M #208 «Dein Jahr als Bildgeschichte»: #/jahr, #/jahr/<YYYY> (full screen) -->
    {#key hash}<LazyPage load={PAGES.JahrStory} {hash} />{/key}
  {:else if page === 'debrief'}
    {#key param}<LazyPage load={PAGES.Debrief} {param} {spot} />{/key}
  {:else if page === 'neuland'}
    <!-- «Neuland» (wish #1007 + #1006): Touren › Rückblick › Neuland; the page and its maps load on their own -->
    <LazyPage load={PAGES.Neuland} />
  {:else if page === 'heatmap'}
    <!-- «Heatmap» (Noah 20.10.2026): all rides on one map, stronger where they overlap -->
    <LazyPage load={PAGES.Heatmap} />
  {:else}
    <Home />
  {/if}
  {/key}
  {#snippet failed(error, reset)}<ErrorPage {error} name={failName} onreset={() => ((failReset = null), reset())} />{/snippet}
  </svelte:boundary>
</main>

{#if !guest}
  <QuickNote {page} bind:open={noteOpen} prefill={notePrefill} prefillBike={noteBike} />
  <NewSheet bind:mode={newMode} onnote={note} />
{/if}
{#if !guest}<SkiTurn />{/if}
<!-- ER1/ER2: «Soll ich dich in Zukunft erinnern?» under what was just saved -->
{#if !guest}<FlowLayer page={page === 'flow' && !/^#\/flow\/?$/.test(hash) ? 'flow-sub' : page} />{/if}
<!-- «Timer» (Z1): a running timer stays in sight on every other page -->
{#if !guest && page !== 'timer'}<TimerFloat />{/if}
<!-- empty AI credit: the sentence once (Noah 18.10.2026 «1a») -->
{#if !guest}<CreditNotice />{/if}
<Keys bind:open={keysOpen} />
<!-- «Rundgang» (Noah 15.10.2026 «1a … 5a»): the choice «example trip or own data» and the running tour -->
{#if !guest}<TourStart /><TourHost />{/if}
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
  .asst-ic {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: var(--ink);
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

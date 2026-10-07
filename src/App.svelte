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
  import Favorites from './pages/Favorites.svelte';
  import DemoBar from './lib/DemoBar.svelte';
  import QuickNote from './lib/QuickNote.svelte';
  import NewSheet from './lib/nav/NewSheet.svelte';
  import Search from './lib/nav/Search.svelte';
  import { parseBikesHash } from './lib/bikes.js';
  import { liveQuery } from 'dexie';
  import { db } from './lib/db.js';
  import { phone } from './lib/media.svelte.js';
  import { UserRound, Sun, Route, Backpack, Bike } from '@lucide/svelte';
  import { PLACES, pageOf, placeOf } from './lib/nav.js';
  import { t, lang, setLang } from './lib/i18n.svelte.js';

  // A tiny "router": the part of the address after # decides which page is shown,
  // e.g. …/packgenerator/#/gear. It works offline and needs no server setup.
  let hash = $state(location.hash);
  $effect(() => {
    const update = () => {
      hash = location.hash;
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
    const quick = (e) => note(e.detail ?? '');
    window.addEventListener('pg:new', open);
    window.addEventListener('pg:note', quick);
    return () => {
      window.removeEventListener('pg:new', open);
      window.removeEventListener('pg:note', quick);
    };
  });
  const note = (prefill) => {
    notePrefill = prefill;
    noteOpen = true;
  };
  // v0.20.0: the page language for screen readers and the browser.
  $effect(() => {
    document.documentElement.lang = lang.v;
  });
  const inboxQ = liveQuery(() => db.notes.where('status').equals('open').count());
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
      {#each places as p (p.key)}<a href={p.href} aria-current={place === p.key ? 'page' : undefined}>{t(p.label)}</a>{/each}
    </nav>
  {/if}
  <div class="tools">
    {#if !phone.matches}
      <!-- v0.20.0: German or English, remembered on this device. -->
      <div class="lang" role="group" aria-label={t('Language')}>
        <button type="button" aria-pressed={lang.v === 'de'} onclick={() => setLang('de')} lang="de" title="Deutsch">DE</button>
        <button type="button" aria-pressed={lang.v === 'en'} onclick={() => setLang('en')} lang="en" title="English">EN</button>
      </div>
    {/if}
    <Search />
    <a class="inbox" href="#/inbox" aria-current={page === 'inbox' ? 'page' : undefined} aria-label={$inboxQ ? t('Inbox, {n} to sort', { n: $inboxQ }) : t('Inbox')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 13l3-8h10l3 8v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></svg>
      {#if $inboxQ}<span class="n num">{$inboxQ}</span>{/if}
    </a>
    {#if !phone.matches && page !== 'share'}
      <button type="button" class="btn hi new" onclick={() => (newMode = 'all')} aria-haspopup="dialog">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>{t('New')}
      </button>
    {/if}
    <details class="profile-menu" bind:open={menuOpen}>
      <summary aria-label={t('Profile and settings')}><UserRound size={24} /></summary>
      <div>
        {#if phone.matches}
          <div class="lang" role="group" aria-label={t('Language')}>
            <button type="button" aria-pressed={lang.v === 'de'} onclick={() => setLang('de')} lang="de">DE</button>
            <button type="button" aria-pressed={lang.v === 'en'} onclick={() => setLang('en')} lang="en">EN</button>
          </div>
        {/if}
        <a href="#/inbox" onclick={() => (menuOpen = false)}>{t('Inbox')}{#if $inboxQ} ({$inboxQ}){/if}</a>
        {#if page !== 'share'}<button type="button" onclick={() => ((menuOpen = false), note(''))}>{t('Quick note')}</button>{/if}
        <a href="#/debrief" onclick={() => (menuOpen = false)}>{t('Debriefs and learnings')}</a>
        <a href="#/pack/templates" onclick={() => (menuOpen = false)}>{t('Templates')}</a>
      </div>
    </details>
  </div>
</header>

<DemoBar />

<main class:calm={page === 'pack'} class:wide={page === 'pack' || page === 'templates' || page === 'gear' || page === 'home'}>
  {#if page === 'gear'}
    <Gear />
  {:else if page === 'pack'}
    <Pack />
  {:else if page === 'bikes' || page === 'care'}
    <!-- v0.21.0 (Noah 6a): Setup and Care are tabs of one page; #/care lands on Care. -->
    <Bikes />
  {:else if page === 'templates'}
    <Templates />
  {:else if page === 'ride'}
    <Ride />
  {:else if page === 'share'}
    {#key param}<Share code={param} />{/key}
  {:else if page === 'favorites'}
    <!-- v0.21.0 (package 5): all my favourite things, by area -->
    <Favorites />
  {:else if page === 'inbox'}
    <Inbox onnew={() => (noteOpen = true)} />
  {:else if page === 'debrief'}
    {#key param}<Debrief {param} />{/key}
  {:else}
    <Home />
  {/if}
</main>

{#if page !== 'share'}
  <QuickNote {page} bind:open={noteOpen} prefill={notePrefill} />
  <NewSheet bind:mode={newMode} onnote={note} />
{/if}
{#if phone.matches}
  <!-- v0.23.0 (AP07): the same four places on every page, also under a shared list (there without +). -->
  <nav class="bottom" aria-label={t('Sections')}>
    {#each places as p, i (p.key)}
      {#if i === 2 && page !== 'share'}<button type="button" class="plus" aria-label={t('New')} aria-haspopup="dialog" onclick={() => (newMode = 'all')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>{/if}
      <a href={p.href} aria-current={place === p.key ? 'page' : undefined}><p.icon size={22} strokeWidth={2} aria-hidden="true" />{t(p.label)}</a>
    {/each}
  </nav>
{/if}

<style>
  /* v0.23.0 (AP07): the menu behind the profile icon (from the calm Pack, PR #32), now on every page. */
  .profile-menu { position: relative; }
  .profile-menu > summary { list-style: none; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; cursor: pointer; }
  .profile-menu > summary::-webkit-details-marker { display: none; }
  .profile-menu[open] > summary { background: rgba(255, 255, 255, 0.12); }
  .profile-menu > div { position: absolute; top: 48px; right: 0; z-index: 7; display: flex; flex-direction: column; width: min(240px, calc(100vw - 32px)); padding: 10px 18px; border-radius: 6px; background: var(--brand); box-shadow: 0 8px 20px #0f2e2726; }
  .profile-menu > div > a, .profile-menu > div > button { display: block; min-height: 44px; padding: 12px 0; border: 0; background: none; color: var(--brand-ink); font: 400 16px var(--font-body); text-align: left; text-decoration: none; cursor: pointer; }
  .profile-menu > div > .lang { align-self: flex-start; margin: 8px 0; }
  main.calm { padding: 0 6.9vw 80px; max-width: none; }
  main.calm:has(:global(.review-mode)) { padding-inline: 9.5vw; }
  @media (max-width: 719px) { main.calm, main.calm:has(:global(.review-mode)) { padding: 0 18px 106px; } }

  .top {
    position: sticky;
    top: 0;
    z-index: 5;
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
  .top .brand {
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
  .inbox {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 8px;
  }
  .top .inbox[aria-current='page'] {
    border-bottom: 0;
    background: rgba(255, 255, 255, 0.12);
  }
  .inbox .n {
    position: absolute;
    top: 2px;
    right: 0;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--hi-bright);
    color: var(--ink);
    font: 700 11px/18px var(--font-body);
    text-align: center;
    box-sizing: border-box;
  }
  .new {
    gap: 6px;
  }
  .lang {
    display: flex;
    border: 1.5px solid #3b5a50;
    border-radius: 8px;
    overflow: hidden;
  }
  .lang button {
    min-width: 36px;
    height: 36px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--brand-ink-2);
    font: 600 14px var(--font-body);
    cursor: pointer;
  }
  .lang button[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
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
  /* v0.23.0 (AP07): the bars never print (a shared list, Print list). */
  @media print {
    .top,
    .bottom {
      display: none !important;
    }
  }
</style>

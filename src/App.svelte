<script>
  import Home from './pages/Home.svelte';
  import Gear from './pages/Gear.svelte';
  import Bikes from './pages/Bikes.svelte';
  import Pack from './pages/Pack.svelte';
  import Care from './pages/Care.svelte';
  import Templates from './pages/Templates.svelte';
  import Debrief from './pages/Debrief.svelte';
  import Share from './pages/Share.svelte';
  import Ride from './pages/Ride.svelte';
  import Inbox from './pages/Inbox.svelte';
  import DemoBar from './lib/DemoBar.svelte';
  import QuickNote from './lib/QuickNote.svelte';
  import NewSheet from './lib/nav/NewSheet.svelte';
  import Search from './lib/nav/Search.svelte';
  import { liveQuery } from 'dexie';
  import { db } from './lib/db.js';
  import { phone } from './lib/media.svelte.js';

  // A tiny "router": the part of the address after # decides which page is shown,
  // e.g. …/packgenerator/#/gear. It works offline and needs no server setup.
  let hash = $state(location.hash);
  $effect(() => {
    const update = () => {
      hash = location.hash;
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  const page = $derived(hash.startsWith('#/gear') ? 'gear' : hash.startsWith('#/bikes') ? 'bikes' : hash.startsWith('#/care') ? 'care' : hash.startsWith('#/pack/templates') ? 'templates' : hash.startsWith('#/pack') ? 'pack' : hash.startsWith('#/debrief') ? 'debrief' : hash.startsWith('#/share/') ? 'share' : hash.startsWith('#/ride') ? 'ride' : hash.startsWith('#/inbox') ? 'inbox' : 'home');
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
     On a phone the places move to a bar at the bottom, with the + in the middle. -->
<header class="top">
  <a class="brand" href="#/" aria-label="Pack Generator, start page"><span class="long">Pack Generator</span><span class="short" aria-hidden="true">PG</span></a>
  {#if !phone.matches}
    <nav class="places" aria-label="Sections">
      <a href="#/" aria-current={page === 'home' ? 'page' : undefined}>Home</a>
      <a href="#/gear" aria-current={page === 'gear' ? 'page' : undefined}>Gear</a>
      <a href="#/pack" aria-current={page === 'pack' || page === 'templates' || page === 'ride' ? 'page' : undefined}>Pack</a>
      <a href="#/bikes" aria-current={page === 'bikes' || page === 'care' ? 'page' : undefined}>Bikes</a>
      <a href="#/debrief" aria-current={page === 'debrief' ? 'page' : undefined}>Debrief</a>
    </nav>
  {:else}
    <a class="deb" href="#/debrief" aria-current={page === 'debrief' ? 'page' : undefined}>Debrief</a>
  {/if}
  <div class="tools">
    <Search />
    <a class="inbox" href="#/inbox" aria-current={page === 'inbox' ? 'page' : undefined} aria-label="Inbox{$inboxQ ? `, ${$inboxQ} ${$inboxQ === 1 ? 'note' : 'notes'} to sort` : ''}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 13l3-8h10l3 8v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></svg>
      {#if $inboxQ}<span class="n num">{$inboxQ}</span>{/if}
    </a>
    {#if !phone.matches && page !== 'share'}
      <button type="button" class="btn hi new" onclick={() => (newMode = 'all')} aria-haspopup="dialog">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>New
      </button>
    {/if}
  </div>
</header>

<DemoBar />

<main class:wide={page === 'pack' || page === 'templates' || page === 'gear' || page === 'home'}>
  {#if page === 'gear'}
    <Gear />
  {:else if page === 'pack'}
    <Pack />
  {:else if page === 'bikes'}
    <Bikes />
  {:else if page === 'care'}
    <Care />
  {:else if page === 'templates'}
    <Templates />
  {:else if page === 'ride'}
    <Ride />
  {:else if page === 'share'}
    {#key param}<Share code={param} />{/key}
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
  {#if phone.matches}
    <nav class="bottom" aria-label="Sections">
      <a href="#/" aria-current={page === 'home' ? 'page' : undefined}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z" /></svg>Home</a>
      <a href="#/gear" aria-current={page === 'gear' ? 'page' : undefined}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6z" /></svg>Gear</a>
      <button type="button" class="plus" aria-label="New" aria-haspopup="dialog" onclick={() => (newMode = 'all')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
      <a href="#/pack" aria-current={page === 'pack' || page === 'templates' || page === 'ride' ? 'page' : undefined}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l1.5 13h-15z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>Pack</a>
      <a href="#/bikes" aria-current={page === 'bikes' || page === 'care' ? 'page' : undefined}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="16" r="4" /><circle cx="18" cy="16" r="4" /><path d="M6 16l4-8h5l3 8M10 8l4 8" /></svg>Bikes</a>
    </nav>
  {/if}
{/if}

<style>
  .top {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 6px 22px;
    padding: calc(8px + env(safe-area-inset-top)) var(--gut) 8px;
    background: var(--ink);
    color: var(--paper);
  }
  .top a {
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--paper);
    text-decoration: none;
  }
  .top .brand {
    color: var(--hi);
    font-size: 24px;
    font-weight: 900;
  }
  .places {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 20px;
  }
  .places a,
  .deb {
    padding: 6px 0 3px;
    border-bottom: 3px solid transparent;
  }
  .top a[aria-current='page'] {
    border-bottom-color: var(--hi);
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
    background: var(--hi);
    color: #fff;
    font: 700 11px/18px var(--font-body);
    text-align: center;
    box-sizing: border-box;
  }
  .new {
    gap: 6px;
  }
  .top .short {
    display: none;
  }
  @media (max-width: 719px) {
    .top {
      gap: 6px 14px;
    }
    .top .long {
      display: none;
    }
    .top .short {
      display: inline;
    }
    .tools {
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
    background: var(--ink);
  }
  .bottom a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 52px;
    justify-content: center;
    color: #a9c2b6;
    font: 700 11px var(--font-body);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    text-decoration: none;
  }
  .bottom a[aria-current='page'] {
    color: var(--paper);
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
    color: #fff;
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
    outline: 3px solid var(--paper);
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
</style>

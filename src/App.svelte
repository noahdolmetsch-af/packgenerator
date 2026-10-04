<script>
  import Home from './pages/Home.svelte';
  import Gear from './pages/Gear.svelte';
  import Bikes from './pages/Bikes.svelte';
  import Pack from './pages/Pack.svelte';
  import Care from './pages/Care.svelte';
  import Templates from './pages/Templates.svelte';
  import Debrief from './pages/Debrief.svelte';
  import Share from './pages/Share.svelte';

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
  const page = $derived(hash.startsWith('#/gear') ? 'gear' : hash.startsWith('#/bikes') ? 'bikes' : hash.startsWith('#/care') ? 'care' : hash.startsWith('#/pack/templates') ? 'templates' : hash.startsWith('#/pack') ? 'pack' : hash.startsWith('#/debrief') ? 'debrief' : hash.startsWith('#/share/') ? 'share' : 'home');
  // #/debrief/<trip id> opens one trip's debrief.
  const param = $derived(hash.split('/')[2] ?? '');
</script>

<nav class="top" aria-label="Sections">
  <a class="brand" href="#/" aria-label="Pack Generator, start page"><span class="long">Pack Generator</span><span class="short" aria-hidden="true">PG</span></a>
  <a href="#/gear" aria-current={page === 'gear' ? 'page' : undefined}>Gear</a>
  <a href="#/pack" aria-current={page === 'pack' || page === 'templates' ? 'page' : undefined}>Pack</a>
  <a href="#/bikes" aria-current={page === 'bikes' || page === 'care' ? 'page' : undefined}>Bikes</a>
  <a href="#/debrief" aria-current={page === 'debrief' ? 'page' : undefined}>Debrief</a>
</nav>

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
  {:else if page === 'share'}
    {#key param}<Share code={param} />{/key}
  {:else if page === 'debrief'}
    {#key param}<Debrief {param} />{/key}
  {:else}
    <Home />
  {/if}
</main>

<style>
  .top {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 4px 18px;
    flex-wrap: wrap;
    padding: calc(8px + env(safe-area-inset-top)) var(--gut) 8px;
    background: var(--ink);
    color: var(--paper);
  }
  .top a,
  .top span {
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
    margin-right: auto;
  }
  .top a[aria-current='page'] {
    border-bottom: 3px solid var(--hi);
  }
  .top .short {
    display: none;
  }
  @media (max-width: 480px) {
    .top .long {
      display: none;
    }
    .top .short {
      display: inline;
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
</style>

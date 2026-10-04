<script>
  import DataPanel from '../lib/DataPanel.svelte';

  // $state makes a variable reactive: when it changes, the page updates by itself.
  let online = $state(navigator.onLine);

  // $effect runs once the component is on screen; the returned function cleans up.
  $effect(() => {
    const update = () => (online = navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  });

  // The three chapters of the app, in build order (decision 5b: Gear and Pack first).
  const chapters = [
    { no: '01', name: 'Gear', text: 'Inventory: what you own and what it weighs. Wishlist apart.', state: 'Open', href: '#/gear' },
    { no: '02', name: 'Pack', text: 'New trip as a copy of the last one, bags on the bike, ready check.', state: 'Next up' },
    { no: '03', name: 'Debrief', text: 'Tap what you did not use, plus weather, comfort and notes.', state: 'Later' },
  ];
</script>

<div class="page">
  <header>
    <p class="kicker">Trail Journal</p>
    <h1>Pack Generator</h1>
    <p class="lead">Never forget anything on a trip again.</p>
  </header>

  <section class="card hi" aria-labelledby="cockpit-title">
    <h2 id="cockpit-title">Pack with the prototype meanwhile</h2>
    <p>The Bike Cockpit prototype works offline and can be installed on its own. Back up its data from the save label in its header.</p>
    <a class="btn" href="cockpit/">Open Bike Cockpit</a>
  </section>

  <section aria-labelledby="chapters-title">
    <h2 id="chapters-title" class="section-title">Chapters</h2>
    <ol class="chapters">
      {#each chapters as ch (ch.no)}
        <li class="card">
          <span class="no">{ch.no}</span>
          <div>
            <h3>{#if ch.href}<a href={ch.href}>{ch.name}</a>{:else}{ch.name}{/if}</h3>
            <p>{ch.text}</p>
          </div>
          {#if ch.href}<a class="state open" href={ch.href}>{ch.state} →</a>{:else}<span class="state">{ch.state}</span>{/if}
        </li>
      {/each}
    </ol>
  </section>

  <DataPanel />

  <footer>
    <span class="dot" class:off={!online}></span>
    {online ? 'Online' : 'Offline'} · v{__APP_VERSION__}
  </footer>
</div>

<style>
  /* Styles in a .svelte file only apply to this component. */
  .page {
    max-width: 880px;
    margin: 0 auto;
  }
  .kicker {
    margin: 0;
    color: var(--hi);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 13px;
  }
  h1,
  h2,
  h3 {
    font-family: var(--font-title);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.01em;
    line-height: 0.95;
    margin: 0;
  }
  h1 {
    font-size: clamp(52px, 13vw, 96px);
  }
  .lead {
    margin: 6px 0 24px;
    color: var(--ink-2);
    font-size: 18px;
  }
  .card {
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
    padding: 16px;
  }
  .card.hi {
    border-color: var(--hi);
    background: var(--hi-soft);
    margin-bottom: 28px;
  }
  .card h2 {
    font-size: 30px;
    margin-bottom: 6px;
  }
  .card p {
    margin: 0 0 14px;
    color: var(--ink-2);
  }
  .btn {
    display: inline-block;
    background: var(--hi);
    color: #fff;
    font-weight: 700;
    text-decoration: none;
    padding: 10px 16px;
    border-radius: 4px;
  }
  .section-title {
    font-size: 26px;
    margin-bottom: 10px;
  }
  .chapters {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .chapters li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 14px;
    align-items: start;
  }
  .chapters .no {
    font-family: var(--font-title);
    font-weight: 900;
    font-size: 40px;
    line-height: 1;
    color: var(--hi);
  }
  .chapters h3 {
    font-size: 28px;
  }
  .chapters p {
    margin: 2px 0 0;
  }
  .state {
    grid-column: 2;
    justify-self: start;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1.5px solid var(--ink-3);
    color: var(--ink-3);
    border-radius: 99px;
    padding: 2px 10px;
  }
  footer {
    margin-top: 28px;
    color: var(--ink-3);
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chapters h3 a {
    color: inherit;
    text-decoration: none;
  }
  .state.open {
    border-color: var(--hi);
    background: var(--hi);
    color: #fff;
    text-decoration: none;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #2f8f5b;
  }
  .dot.off {
    background: var(--hi);
  }
</style>

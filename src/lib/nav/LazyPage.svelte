<script>
  // Tempo «Seiten später laden»: draws a page whose code loads on its first visit (lazy.js).
  import { loadPage, loadedOf } from './lazy.js';
  import Skeleton from '../ui/Skeleton.svelte';
  import { settling } from '../settled.js';
  import { tick } from 'svelte';
  import { between, fadeIn } from './fadein.js';
  import { waitTitle } from './waittitle.js';

  let { load, ...rest } = $props();
  let Page = $state(loadedOf(load));
  let failed = $state(null);
  let slow = $state(false);
  // Etappe 2, 5a: the name of the page stands above the placeholder
  let name = $state('');
  $effect(() => {
    const l = load;
    const ready = loadedOf(l);
    if (ready) {
      Page = ready;
      return;
    }
    Page = null;
    failed = null;
    slow = false;
    name = waitTitle(location.hash);
    // a very short wait shows nothing; after 0.1 s the placeholder comes with the page's name (it fades in softly, so a quick load hardly shows it)
    const timer = setTimeout(() => (slow = true), 100);
    // while a page loads, <html data-ready> is off, as during the data tidy-up (the browser tests wait for it)
    settling(async () => {
      const c = await loadPage(l);
      // «Ruhiges Einblenden»: after a slow load (the placeholders were shown) the page fades in over them instead of blinking in
      const grey = slow ? document.querySelector('[data-page-loading]') : null;
      const edge = grey ? { parent: grey.parentNode, prev: grey.previousSibling, next: grey.nextSibling } : null;
      if (l === load) Page = c;
      await tick(); // the page is drawn before data-ready comes back
      if (edge && l === load) fadeIn(between(edge));
    }).catch((e) => {
        if (l === load) failed = e;
      })
      .finally(() => clearTimeout(timer));
    return () => clearTimeout(timer);
  });
  // a load error goes to the error page of App.svelte (svelte:boundary)
  $effect(() => {
    if (failed) throw failed;
  });
</script>

{#if Page}
  <Page {...rest} />
{:else if slow}
  <div data-page-loading>
    {#if name}<div class="wait-title" data-page-wait-title aria-hidden="true">{name}</div>{/if}
    <Skeleton rows={4} />
  </div>
{/if}

<style>
  /* the name of the page while its code loads: as big as a page title, coming in softly */
  .wait-title {
    margin: 0 0 var(--sp-3, 12px);
    font-family: var(--font-brand);
    font-weight: 700;
    font-size: var(--fs-page);
    line-height: 1.1;
    color: var(--ink);
    animation: wait-in 0.25s ease-out both;
  }
  @keyframes wait-in {
    from {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .wait-title {
      animation: none;
    }
  }
</style>

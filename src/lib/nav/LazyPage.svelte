<script>
  // Tempo «Seiten später laden»: draws a page whose code loads on its first visit (lazy.js).
  import { loadPage, loadedOf } from './lazy.js';
  import Skeleton from '../ui/Skeleton.svelte';
  import { settling } from '../settled.js';
  import { tick } from 'svelte';

  let { load, ...rest } = $props();
  let Page = $state(loadedOf(load));
  let failed = $state(null);
  let slow = $state(false);
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
    // a short wait shows nothing; only a slow load shows the grey placeholder rows
    const timer = setTimeout(() => (slow = true), 300);
    // while a page loads, <html data-ready> is off, as during the data tidy-up (the browser tests wait for it)
    settling(async () => {
      const c = await loadPage(l);
      if (l === load) Page = c;
      await tick(); // the page is drawn before data-ready comes back
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
  <div data-page-loading><Skeleton rows={4} /></div>
{/if}

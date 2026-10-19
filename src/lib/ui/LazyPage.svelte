<script>
  /**
   * Paket H: a page that loads only when it is opened (main.js stays small; the offline start breaks
   * at 6 MB). load: () => import('…/Page.svelte'). While it loads, the usual skeleton shows; when it
   * cannot load (offline and never opened before), one sentence says so.
   */
  import Skeleton from './Skeleton.svelte';
  import { t } from '../i18n.svelte.js';

  let { load, ...rest } = $props();
  const page = $derived(load());
</script>

{#await page}
  <Skeleton />
{:then m}
  <m.default {...rest} />
{:catch}
  <p class="lazyerr" role="alert">{t('This page could not load. Please check the connection and try again.')}</p>
{/await}

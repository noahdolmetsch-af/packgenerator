<script>
  /**
   * One status line for a running fetch of any connection (Noah 03.11.2026 «1a», «Fitbit, Strava, Google, dann
   * Abgleich»): «Fitbit: fetching … 12 s. 30 of 90 days fetched so far.» It counts the seconds itself and adds
   * a hint when it takes unusually long. Shown only while `busy`. The text comes from ui/connstatus.js.
   */
  import { fetchingLine } from './connstatus.js';
  import { t } from '../i18n.svelte.js';

  let { name, busy = false, since = 0, done = 0, total = 0, unit = 'days' } = $props();
  let now = $state(Date.now());
  $effect(() => {
    if (!busy) return;
    now = Date.now();
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });
</script>

{#if busy}
  <p class="connstatus" role="status" data-conn-status>{fetchingLine(t, { name, since: since || now, now, done, total, unit })}</p>
{/if}

<style>
  .connstatus {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>

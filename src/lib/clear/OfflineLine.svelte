<script>
  /**
   * Paket Q #126 «Ruhige Offline-Zeile»: one calm line at the top while the device has no internet.
   * It says why weather, Strava, Google and the exchange with the other device are missing just now,
   * and that everything else works. Back online, it says so for a few seconds and goes away by itself.
   * Nothing to tap, nothing to close.
   */
  import { WifiOff } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  let back = $state(false);
  let timer;
  $effect(() => {
    const off = () => {
      online = false;
      back = false;
      clearTimeout(timer);
    };
    const on = () => {
      online = true;
      back = true;
      clearTimeout(timer);
      timer = setTimeout(() => (back = false), 4000);
    };
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => {
      window.removeEventListener('offline', off);
      window.removeEventListener('online', on);
      clearTimeout(timer);
    };
  });
</script>

{#if !online}
  <p class="offl" role="status" data-offline-line>
    <WifiOff size={16} aria-hidden="true" />
    <span>{t('Offline. Weather, Strava, Google and the exchange come back when you are online; everything else works.')}</span>
  </p>
{:else if back}
  <p class="offl ok" role="status" data-offline-line="back"><span>{t('Online again. Everything is up to date shortly.')}</span></p>
{/if}

<style>
  .offl {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 6px var(--sp-4);
    font-size: var(--fs-small);
    color: var(--ink-2);
    background: var(--paper-2, var(--paper));
    border-bottom: 1px solid var(--line);
  }
  .offl.ok {
    color: var(--ink-2);
  }
</style>

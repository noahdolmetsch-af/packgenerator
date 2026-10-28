<script>
  /**
   * «Neueste Version» in Ich (Noah 27.10.2026 «1-5 a», questions 1 and 2): one row with the version on this
   * device and the one online (version.json, src/lib/behind.js), and a button that always loads the newest
   * version fresh from the internet (src/lib/freshreload.js; the data stays on the device).
   * When a newer one is online, the row asks the browser for it at once (swupdate.js reloads once it is there).
   */
  import { onMount } from 'svelte';
  import { RefreshCw } from '@lucide/svelte';
  import Btn from '../ui/Btn.svelte';
  import { t } from '../i18n.svelte.js';
  import { onlineVersion } from '../behind.js';
  import { versionState } from '../versionline.js';
  import { freshReload, askForUpdate } from '../freshreload.js';

  const running = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  let live = $state(null);
  let asked = $state(false);
  const state = $derived(versionState(running, live));
  const line = $derived(
    !asked
      ? t('Checking the version online …')
      : state === 'unknown'
        ? t('Online version not known right now (offline?)')
        : state === 'newer'
          ? t('Online: {v} · the new version is loading …', { v: live })
          : t('Online: {v} · this device is up to date', { v: live }),
  );

  onMount(async () => {
    live = await onlineVersion();
    asked = true;
    if (versionState(running, live) === 'newer') askForUpdate();
  });
</script>

<div class="ich-row ich-wrap vrow" data-version-row data-version-state={asked ? state : 'checking'}>
  <span class="ich-ib"><RefreshCw size={18} aria-hidden="true" /></span>
  <span class="ich-m"><b>{t('Version {v} on this device', { v: running })}</b><small>{line}</small></span>
  <Btn kind={state === 'newer' ? 'hi' : 'normal'} class="sm" label={t('Load newest|update')} explain={t('Loads the app fresh from the internet. Your data stays on this device.')} onclick={() => freshReload()} data-fresh-reload />
</div>

<style>
  .vrow {
    cursor: default;
  }
</style>

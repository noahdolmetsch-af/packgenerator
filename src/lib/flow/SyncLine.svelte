<script>
  /**
   * «Abgleich sichtbar» (Noah 10.11.2026 «a»): one very quiet grey line under «Heute abhaken» (Aktiv) that says when
   * phone and computer were last in step: «Abgeglichen vor 12 s». While a round runs: «Gleicht ab …». When it
   * stuck or failed: «Abgleich hängt · tippen, um es neu zu versuchen» (a tap starts a round). Only with the sync
   * switched on; nothing is shown otherwise. The setup stays in Ich › Daten und Backup.
   */
  import { sync, runSync, wake } from '../sync/auto.svelte.js';
  import { elapsedText } from '../ui/connstatus.js';
  import { t } from '../i18n.svelte.js';

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 5000);
    return () => clearInterval(id);
  });
  const last = $derived(sync.last ? Date.parse(sync.last) : null);
  const stuck = $derived(!!sync.error || (sync.running && now - sync.since > 90_000));
  const text = $derived(
    stuck
      ? t('Sync is stuck · tap to try again')
      : sync.running
        ? t('Syncing …')
        : last
          ? t('Synced {ago} ago', { ago: elapsedText(t, last, now) })
          : t('Not synced yet'),
  );
</script>

{#if sync.on}
  {#if stuck}
    <button type="button" class="sl warn" data-sync-line="stuck" onclick={() => (wake(), runSync())}>{text}</button>
  {:else}
    <p class="sl" data-sync-line={sync.running ? 'running' : 'ok'} role="status">{text}</p>
  {/if}
{/if}

<style>
  .sl {
    margin: 6px 2px 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--fs-small);
    line-height: 1.3;
    text-align: left;
  }
  .warn {
    color: var(--ink-2);
    text-decoration: underline;
    cursor: pointer;
    min-height: 32px;
  }
</style>

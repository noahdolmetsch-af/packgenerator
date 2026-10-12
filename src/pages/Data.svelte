<script>
  /**
   * Design-Refresh P9 (I2, Noah 12.10.2026 «Runde 16 freigegeben»): «Daten und Backup», its own page
   * under Ich (#/me/data; before it opened as a fold on the Ich page). The path back to Ich, the title,
   * one quiet line; everything else is the data panel (lib/DataPanel.svelte) as before.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import DataPanel from '../lib/DataPanel.svelte';
  import { t } from '../lib/i18n.svelte.js';
</script>

<div class="datapage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Data and backup')} sub={t('Everything is stored in this browser on this device')} />
  <DataPanel />
</div>

<style>
  .datapage {
    max-width: 1100px;
    min-width: 0;
  }
</style>

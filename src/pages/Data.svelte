<script>
  /**
   * Design-Refresh P9 (I2, Noah 12.10.2026 «Runde 16 freigegeben»): «Daten und Backup», its own page
   * under Ich (#/me/data; before it opened as a fold on the Ich page). The path back to Ich, the title,
   * one quiet line; everything else is the data panel (lib/DataPanel.svelte) as before.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import DataPanel from '../lib/DataPanel.svelte';
  import QuickLinks from '../lib/ui/QuickLinks.svelte';
  import { t } from '../lib/i18n.svelte.js';
</script>

<div class="datapage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Data and backup')} sub={t('Everything is stored in this browser on this device')} />
  <!-- «Ich sichtbar» (332 Use Cases, Noah 24.10.2026 «1a 2b»): the rows under «Other data» and «Delete everything»
       stand 4 screens down; chips jump there (a chip shows only while its row is on the page) -->
  <QuickLinks label={t('On this page')} links={[{ key: 'yearcheck', jump: '[data-row="yearcheck"]', label: t('Still right?') }, { key: 'examples', jump: '[data-row="get-examples"]', label: t('Get the examples') }, { key: 'demo', jump: '[data-row="demo-file"]', label: t('Demo from a file') }, { key: 'fresh', jump: '[data-section="start-fresh"]', label: t('Start fresh') }]} />
  <DataPanel />
</div>

<style>
  .datapage {
    max-width: 1100px;
    min-width: 0;
  }
</style>

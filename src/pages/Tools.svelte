<script>
  /**
   * Paket L «Werkzeugkasten» (Noah 19.10.2026 «1 eigene neue Seite»): Ich › Werkzeugkasten (#/me/tools)
   * lists the small helpers; each opens on #/me/tools/<key>. Everything runs on the device.
   */
  import { Calculator, Ruler, Clock, Compass, Languages, FileText, Image, Paperclip, Coins, Wallet, ChevronRight } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { TOOLS, TOOLS_HASH, toolOf } from '../lib/tools/tools.js';
  import Calc from '../lib/tools/Calc.svelte';
  import Units from '../lib/tools/Units.svelte';
  import Zones from '../lib/tools/Zones.svelte';
  import CompassTool from '../lib/tools/Compass.svelte';
  import Phrases from '../lib/tools/Phrases.svelte';
  import PdfTool from '../lib/tools/PdfTool.svelte';
  import PhotoTool from '../lib/tools/PhotoTool.svelte';
  import Ablage from '../lib/tools/Ablage.svelte';
  import Money from '../lib/tools/Money.svelte';
  import Costs from '../lib/tools/Costs.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import '../lib/tools/tools.css';

  let { tool = '' } = $props();
  const ICONS = { calculator: Calculator, ruler: Ruler, clock: Clock, compass: Compass, languages: Languages, file: FileText, image: Image, paperclip: Paperclip, coins: Coins, wallet: Wallet };
  const VIEWS = { calc: Calc, units: Units, zones: Zones, compass: CompassTool, phrases: Phrases, pdf: PdfTool, photo: PhotoTool, ablage: Ablage, money: Money, costs: Costs };
  const cur = $derived(toolOf(tool));
</script>

<div class="ich-page tools-page">
  {#if cur}
    {@const View = VIEWS[cur.key]}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Toolbox'), href: TOOLS_HASH }]} title={t(cur.title)} sub={t(cur.sub)} />
    <div class="tools-view" data-tool={cur.key}><View /></div>
  {:else}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Toolbox')} sub={t('Small helpers for every day and on the way, all on this device')} />
    <ul class="card ich-list tools-list">
      {#each TOOLS as x (x.key)}
        {@const Icon = ICONS[x.icon]}
        <li>
          <a class="ich-row" href={`${TOOLS_HASH}/${x.key}`} data-tool={x.key}>
            <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t(x.title)}</b><small>{t(x.sub)}</small></span>
            <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tools-view {
    display: grid;
    gap: var(--sp-4);
    max-width: 720px;
  }
  .tools-list {
    max-width: 720px;
    margin: 0;
    list-style: none;
  }
</style>

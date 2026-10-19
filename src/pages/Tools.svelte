<script>
  /**
   * Paket L «Werkzeugkasten» (Noah 19.10.2026 «1 eigene neue Seite»): Ich › Werkzeugkasten (#/me/tools)
   * lists the small helpers; each opens on #/me/tools/<key>. Everything runs on the device.
   * On top «Passt gerade» (big idea 1): up to 3 tools that fit the trip now; only here, not on Heute
   * (rule 13). The list can be searched and put in the own order (arrows and drag, rule 12).
   */
  import { Calculator, Ruler, Clock, Compass, Languages, FileText, Image, Paperclip, Coins, Wallet, ChevronRight, Workflow, Images, Film, QrCode, Route, Cog, Crosshair, ScanBarcode, Flashlight, Sparkles, ArrowUpDown } from '@lucide/svelte';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { TOOLS_HASH, toolOf, orderTools, suggestTools } from '../lib/tools/tools.js';
  import { db } from '../lib/db.js';
  import { localDay } from '../lib/localday.js';
  import { fold } from '../lib/gearimport.js';
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
  import Level from '../lib/tools/Level.svelte';
  import Gears from '../lib/tools/Gears.svelte';
  import Barcode from '../lib/tools/Barcode.svelte';
  import QrMake from '../lib/tools/QrMake.svelte';
  import Light from '../lib/tools/Light.svelte';
  import Convert from '../lib/tools/Convert.svelte';
  import Video from '../lib/tools/Video.svelte';
  import MapMeasure from '../lib/tools/MapMeasure.svelte';
  import Chains from '../lib/tools/Chains.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import '../lib/tools/tools.css';

  let { tool = '' } = $props();
  const ICONS = { calculator: Calculator, ruler: Ruler, clock: Clock, compass: Compass, languages: Languages, file: FileText, image: Image, paperclip: Paperclip, coins: Coins, wallet: Wallet, workflow: Workflow, images: Images, film: Film, qr: QrCode, route: Route, cog: Cog, level: Crosshair, scan: ScanBarcode, flashlight: Flashlight };
  const VIEWS = { calc: Calc, units: Units, zones: Zones, compass: CompassTool, phrases: Phrases, pdf: PdfTool, photo: PhotoTool, ablage: Ablage, money: Money, costs: Costs, level: Level, gears: Gears, barcode: Barcode, qr: QrMake, light: Light, convert: Convert, video: Video, map: MapMeasure, chains: Chains };
  const cur = $derived(toolOf(tool));
  const ORDER_KEY = 'tools.order';

  let order = $state([]);
  let fits = $state([]);
  let q = $state('');
  let sorting = $state(false);
  db.settings.get(ORDER_KEY).then((r) => (order = r?.value ?? [])).catch(() => {});
  db.trips.toArray().then((trips) => (fits = suggestTools(trips, localDay()))).catch(() => {});
  const list = $derived(orderTools(order));
  const shown = $derived(q.trim() ? list.filter((x) => fold(`${t(x.title)} ${t(x.sub)} ${x.title}`).includes(fold(q.trim()))) : list);
  function move(from, to) {
    const keys = list.map((x) => x.key);
    const [k] = keys.splice(from, 1);
    keys.splice(to, 0, k);
    order = keys;
    db.settings.put({ key: ORDER_KEY, value: keys }).catch(() => {});
  }
</script>

<div class="ich-page tools-page">
  {#if cur}
    {@const View = VIEWS[cur.key]}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Toolbox'), href: TOOLS_HASH }]} title={t(cur.title)} sub={t(cur.sub)} />
    <div class="tools-view" data-tool={cur.key}><View /></div>
  {:else}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Toolbox')} sub={t('Small helpers for every day and on the way, all on this device')} />
    <AreaIntro place="toolbox" />
    {#if fits.length && !q.trim() && !sorting}
      <section class="tools-fit" aria-labelledby="tools-fit-h">
        <h2 id="tools-fit-h"><Sparkles size={16} aria-hidden="true" /> {t('Fits right now')}</h2>
        <ul class="card ich-list tools-list">
          {#each fits as f (f.key)}
            {@const x = toolOf(f.key)}
            {@const Icon = ICONS[x.icon]}
            <li>
              <a class="ich-row" href={`${TOOLS_HASH}/${x.key}`} data-fit={x.key}>
                <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{t(x.title)}</b><small>{t(f.why)}</small></span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    <div class="tool-row tools-bar">
      <input class="tool-input tools-q" type="search" placeholder={t('Search tools')} aria-label={t('Search tools')} bind:value={q} disabled={sorting} />
      <button type="button" class="btn" aria-pressed={sorting} onclick={() => ((sorting = !sorting), (q = ''))}><ArrowUpDown size={16} aria-hidden="true" />{sorting ? t('Done') : t('Order|sort')}</button>
    </div>
    {#if sorting}
      <p class="tool-help">{t('Drag a tool by its handle, or use the arrows. The order stays.')}</p>
      <ul class="card ich-list tools-list tools-sort" use:sortable={{ onmove: move }}>
        {#each list as x, i (x.key)}
          <li data-sort-id={x.key} class="tools-srow">
            <SortGrip name={t(x.title)} onstep={(d) => move(i, i + d)} />
            <span class="ich-m"><b>{t(x.title)}</b></span>
            <SortArrows name={t(x.title)} {i} n={list.length} onstep={(d) => move(i, i + d)} />
          </li>
        {/each}
      </ul>
    {:else}
      <ul class="card ich-list tools-list">
        {#each shown as x (x.key)}
          {@const Icon = ICONS[x.icon]}
          <li>
            <a class="ich-row" href={`${TOOLS_HASH}/${x.key}`} data-tool={x.key}>
              <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t(x.title)}</b><small>{t(x.sub)}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        {:else}
          <li class="tools-none tool-muted">{t('No tool with this word.')}</li>
        {/each}
      </ul>
    {/if}
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
  .tools-fit {
    display: grid;
    gap: var(--sp-2);
    max-width: 720px;
    margin-bottom: var(--sp-4);
  }
  .tools-fit h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-section);
  }
  .tools-bar {
    max-width: 720px;
    margin-bottom: var(--sp-3);
    flex-wrap: nowrap;
  }
  .tools-q {
    flex: 1 1 auto;
  }
  .tools-srow {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 48px;
    padding: 4px var(--sp-3);
  }
  .tools-srow .ich-m {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tools-none {
    padding: var(--sp-3);
  }
</style>

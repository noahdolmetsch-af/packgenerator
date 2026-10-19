<script>
  /**
   * Paket L «Werkzeugkasten» (Übersetzungs-Rechner, Noah 19.10.2026): chainrings and cassette → every
   * gear with its metres per crank turn and the speed at a cadence. The last input is kept.
   */
  import { WHEELS, circumference, teethOf, gearTable, rangePct } from './gears.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let rings = $state('40');
  let cogs = $state('11-13-15-17-19-21-24-28-32-37-42');
  let wheel = $state('700x40');
  let rpm = $state(90);
  let show = $state('kmh'); // kmh | dev | ratio
  loadTool('gears', null).then((g) => {
    if (!g) return;
    rings = g.rings ?? rings;
    cogs = g.cogs ?? cogs;
    wheel = g.wheel ?? wheel;
    rpm = g.rpm ?? rpm;
  });
  const save = () => saveTool('gears', { rings, cogs, wheel, rpm }).catch(() => {});
  const w = $derived(WHEELS.find((x) => x.key === wheel) ?? WHEELS[0]);
  const circ = $derived(circumference(w.bead, w.width));
  const R = $derived(teethOf(rings));
  const C = $derived(teethOf(cogs));
  const table = $derived(gearTable(R, C, circ, Number(rpm) || 90));
  const fmt = (g) => (show === 'kmh' ? g.kmh : show === 'dev' ? g.dev.toFixed(2) : g.ratio.toFixed(2));
</script>

<section class="tool-card gears">
  <div class="tool-row">
    <label class="tool-field g-f"><span>{t('Chainrings (teeth)')}</span><input class="tool-input" inputmode="numeric" bind:value={rings} onchange={save} placeholder="50-34" /></label>
    <label class="tool-field g-w"><span>{t('Cassette (teeth)')}</span><input class="tool-input" inputmode="numeric" bind:value={cogs} onchange={save} placeholder="11-34" /></label>
  </div>
  <div class="tool-row">
    <label class="tool-field g-f"><span>{t('Wheel and tyre')}</span>
      <select class="tool-input" bind:value={wheel} onchange={save}>{#each WHEELS as x (x.key)}<option value={x.key}>{x.label}</option>{/each}</select>
    </label>
    <label class="tool-field g-n"><span>{t('Cadence (rpm)')}</span><input class="tool-input" type="number" min="30" max="150" bind:value={rpm} onchange={save} /></label>
  </div>
  <div class="tool-row" role="radiogroup" aria-label={t('Show')}>
    {#each [['kmh', 'km/h'], ['dev', t('Metres per turn')], ['ratio', t('Ratio|gear')]] as [k, l] (k)}
      <label class="tool-chip"><input type="radio" name="g-show" value={k} bind:group={show} /> {l}</label>
    {/each}
  </div>
  {#if R.length && C.length}
    <div class="g-scroll">
      <table class="g-table">
        <thead><tr><th scope="col">{t('Cog|gear')}</th>{#each R as r (r)}<th scope="col">{r}</th>{/each}</tr></thead>
        <tbody>
          {#each C as c, j (c)}
            <tr><th scope="row">{c}</th>{#each table as row (row.ring)}<td>{fmt(row.gears[j])}</td>{/each}</tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="tool-muted">{t('Wheel {mm} mm around. Range of the cassette: {pct} %.', { mm: circ, pct: rangePct(C) ?? '–' })}</p>
  {:else}
    <p class="tool-status">{t('Type the teeth, e.g. 50-34 and 11-13-15-17.')}</p>
  {/if}
</section>

<style>
  .g-f {
    flex: 1 1 140px;
  }
  .g-w {
    flex: 2 1 220px;
  }
  .g-n {
    flex: 0 1 120px;
  }
  .g-scroll {
    overflow-x: auto;
    max-width: 100%;
  }
  .g-table {
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
  }
  .g-table th,
  .g-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--line);
    text-align: right;
  }
  .g-table thead th {
    color: var(--ink-2);
  }
</style>

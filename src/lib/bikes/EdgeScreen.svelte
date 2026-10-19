<script>
  /**
   * «Garmin-Seiten» (GA-A1–A3, Noah 14.10.2026): one data page drawn as on a Garmin Edge, with sample
   * values. The 1040 is tall (3:5), the 850 a little smaller (it replaced the 540, Noah 18.10.2026). The screen keeps its own
   * light colours in dark mode too: it is a picture of the device. Graphic fields as the Edge draws them:
   * line (last ~100 s), bars now/avg/max, zone gauge, elevation, stamina, time in zones (Connect IQ).
   */
  import { fieldsOf, layout, hiddenOf } from '../garmin.js';
  import { t } from '../i18n.svelte.js';

  let { pageId, device = '1040', g, width = 210, idx = 0, total = 1, label = '' } = $props();

  const fields = $derived(fieldsOf(pageId, device, g.sensors, hiddenOf(g, pageId, device)));
  const rows = $derived(layout(fields));
  // drawn at one size (260 px wide, the type-scale tokens fit it) and zoomed to the width asked for
  const DESIGN = 260;
  const zoom = $derived(((device === '850' ? 0.82 : 1) * width) / DESIGN);
  const size = (cols) => (cols === 1 ? (fields.length <= 2 ? 'v-xl' : 'v-l') : cols === 2 ? 'v-m' : 'v-s');
  const Z = ['#9aa4ae', '#2f80c8', '#36a456', '#e2b422', '#ea7a22', '#d8402f', '#8d3fb0'];
  function line(seed) {
    const p = [];
    let v = 30;
    for (let i = 0; i <= 40; i++) {
      v = Math.max(8, Math.min(52, v + Math.sin(i * seed) * 6 + Math.cos(i * 1.7 * seed) * 4));
      p.push(`${i * 5},${60 - v}`);
    }
    return p.join(' ');
  }
  const ELEV = [50, 46, 40, 34, 30, 26, 20, 16, 14, 18, 26, 34, 38, 30, 22, 14, 10, 12, 20, 30, 38, 44, 48].map((y, i) => `${(i * 200) / 22},${y}`).join(' ');
</script>

<div class="edge" class:d850={device === '850'} style:zoom={zoom} role="img" aria-label={label || t('Edge {device}: {page}', { device, page: pageId })}>
  <div class="scr">
    <div class="top num"><span>14:18</span><span>{pageId}</span><span>64 %</span></div>
    <div class="grid">
      {#each rows as row, r (r)}
        <div class="row" style:flex={row[0].gfx ? 1.25 : 1} style:grid-template-columns="repeat({row.length}, minmax(0, 1fr))">
          {#each row as x (x.k)}
            {#if x.gfx}
              <div class="cell g">
                <span class="lab">{t(x.label)}{x.sample ? ` · ${x.sample} ${x.unit}` : ''}{#if x.ciq}<em>CIQ</em>{/if}</span>
                {#if x.gfx === 'line'}
                  <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="200" y1="30" y2="30" class="avg" stroke-dasharray="3 3" /><polyline points={line(x.k === 'pline' ? 0.9 : 0.55)} fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" /></svg>
                {:else if x.gfx === 'bar3'}
                  <svg viewBox="0 0 200 60" aria-hidden="true">
                    {#each [[4, 62, Z[2], t('now')], [24, 72, Z[1], 'Ø'], [44, 100, Z[0], t('max')]] as [y, v, c, l] (y)}<rect x="34" {y} width={v * 1.6} height="12" fill={c} /><text x="0" y={y + 10} font-size="10" class="mut">{l}</text>{/each}
                  </svg>
                {:else if x.gfx === 'gauge'}
                  <svg viewBox="0 0 200 60" aria-hidden="true">
                    {#each Z as c, i (i)}<rect x={i * 28.6} y="20" width="27" height="18" fill={c} />{/each}
                    <polygon points="73,6 87,6 80,18" fill="currentColor" /><text x="100" y="54" font-size="12" text-anchor="middle" fill="currentColor" font-weight="700">{t('Zone {n}', { n: 3 })}</text>
                  </svg>
                {:else if x.gfx === 'elev'}
                  <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,60 {ELEV} 200,60" class="area" /><polyline points={ELEV} fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" /><line x1="72.7" x2="72.7" y1="0" y2="60" class="pos" stroke-width="1.5" vector-effect="non-scaling-stroke" /></svg>
                {:else if x.gfx === 'stam'}
                  <svg viewBox="0 0 200 60" aria-hidden="true">
                    <rect y="8" width="200" height="16" class="trk" /><rect y="8" width="136" height="16" fill={Z[2]} /><text x="4" y="20" font-size="11" fill="#fff" font-weight="700">{t('now')} 68 %</text>
                    <rect y="34" width="200" height="16" class="trk" /><rect y="34" width="148" height="16" fill={Z[1]} /><text x="4" y="46" font-size="11" fill="#fff" font-weight="700">{t('possible')} 74 %</text>
                  </svg>
                {:else if x.gfx === 'zones'}
                  <svg viewBox="0 0 200 60" aria-hidden="true">
                    {#each [6, 30, 44, 26, 12, 5, 2] as v, i (i)}<rect x={i * 28.6 + 3} y={52 - v} width="22" height={v} fill={Z[i]} /><text x={i * 28.6 + 14} y="60" font-size="8" text-anchor="middle" class="mut">{i + 1}</text>{/each}
                  </svg>
                {/if}
              </div>
            {:else}
              <div class="cell">
                <span class="lab">{t(x.label)}</span>
                <span class="val num {size(row.length)}">{x.sample}{#if x.unit}<small>{x.unit === 'rpm' ? t('rpm') : x.unit}</small>{/if}</span>
              </div>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
    <div class="dots" aria-hidden="true">{#each Array.from({ length: total }) as _, j (j)}<i class:on={j === idx}></i>{/each}</div>
  </div>
</div>

<style>
  /* The Edge in the app's tokens: a dark frame (--brand stays dark in both themes), the screen on paper. */
  .edge {
    flex: none;
    width: 260px;
    background: var(--brand);
    border-radius: 22px;
    padding: 14px 10px 21px;
    box-shadow: var(--card-shadow);
  }
  .scr {
    background: var(--paper);
    color: var(--ink);
    border-radius: 4px;
    aspect-ratio: 3 / 5;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .d850 .scr {
    aspect-ratio: 3 / 3.9;
  }
  .top {
    display: flex;
    justify-content: space-between;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
    padding: 3px 8px;
    border-bottom: 1px solid var(--line);
  }
  .grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .row {
    display: grid;
    border-bottom: 1px solid var(--line);
    min-height: 0;
  }
  .row:last-child {
    border-bottom: 0;
  }
  .cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2px 5px;
    border-right: 1px solid var(--line);
    min-width: 0;
    min-height: 0;
  }
  .cell:last-child {
    border-right: 0;
  }
  .cell.g {
    align-items: stretch;
  }
  .lab {
    font-size: var(--fs-tiny);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--ink-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    text-align: center;
  }
  .lab em {
    font-style: normal;
    background: var(--ink);
    color: var(--paper);
    border-radius: 4px;
    padding: 0 4px;
    margin-left: 4px;
  }
  .val {
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    letter-spacing: -0.02em;
  }
  .v-xl {
    font-size: var(--fs-display);
  }
  .v-l {
    font-size: var(--fs-page);
  }
  .v-m {
    font-size: var(--fs-title);
  }
  .v-s {
    font-size: var(--fs-section);
  }
  .val small {
    font-size: var(--fs-tiny);
    font-weight: 600;
    margin-left: 2px;
    color: var(--ink-3);
  }
  .cell svg {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: block;
  }
  .avg {
    stroke: var(--ink-3);
  }
  .mut {
    fill: var(--ink-3);
  }
  .area {
    fill: var(--info-soft);
  }
  .pos {
    stroke: var(--bad);
  }
  .trk {
    fill: var(--line);
  }
  .dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding: 4px 0 3px;
  }
  .dots i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--line);
  }
  .dots i.on {
    background: var(--ok);
  }
</style>

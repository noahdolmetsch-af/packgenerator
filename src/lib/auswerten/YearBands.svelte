<script>
  /**
   * «Dein Normal über die Jahre» (Noah 24.11.2026 «über die jahre verteilt»): one row per year, the same band as «Dein Normal»
   * on a shared scale, so you see how your usual range moved. Light = nearly all days (10 %–90 %), dark = middle half, tick = middle.
   * No judgement: a higher or lower year is only a different year.
   */
  import { num } from '../i18n.svelte.js';
  let { rows = [], all = null, fmt = (v) => num(Math.round(v)), label = '' } = $props();
  const list = $derived(all ? [...rows, { year: '', all: true, ...all }] : rows);
  const lo = $derived(Math.min(...list.map((r) => r.p10)));
  const hi = $derived(Math.max(...list.map((r) => r.p90)));
  const span = $derived(hi - lo || 1);
  const at = (v) => `${(((v - lo) / span) * 94 + 3).toFixed(2)}%`;
  const w = (a, b) => `${(((b - a) / span) * 94).toFixed(2)}%`;
</script>

<ul class="yb" aria-label={label} data-year-bands>
  {#each list as r (r.all ? 'all' : r.year)}
    <li class:all={r.all} data-year={r.all ? 'all' : r.year}>
      <b class="yr num">{r.all ? '' : r.year}</b>
      <span class="trk" aria-hidden="true">
        <span class="lt" style="left:{at(r.p10)};width:{w(r.p10, r.p90)}"></span>
        <span class="dk" style="left:{at(r.q1)};width:{w(r.q1, r.q3)}"></span>
        <span class="md" style="left:{at(r.median)}"></span>
      </span>
      <span class="v num">{fmt(r.median)}</span>
      <small class="n num">{r.all ? '' : r.n}</small>
    </li>
  {/each}
</ul>

<style>
  .yb {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .yb li {
    display: grid;
    grid-template-columns: 3em minmax(0, 1fr) 4.5em 2.4em;
    align-items: center;
    gap: 8px;
    min-height: 26px;
  }
  .yr {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .trk {
    position: relative;
    height: 16px;
  }
  .lt,
  .dk {
    position: absolute;
    top: 3px;
    height: 10px;
    border-radius: 5px;
  }
  .lt {
    background: var(--accent-soft);
  }
  .dk {
    background: color-mix(in srgb, var(--accent) 38%, var(--accent-soft));
  }
  .md {
    position: absolute;
    top: 1px;
    width: 2px;
    height: 14px;
    margin-left: -1px;
    background: var(--ink-3);
  }
  .v {
    text-align: right;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .n {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    text-align: right;
  }
  .all {
    border-top: 1px solid var(--line);
    padding-top: 4px;
  }
</style>

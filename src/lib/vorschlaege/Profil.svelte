<script>
  /**
   * «Tourenvorschläge»: the height profile of a tour with the ground strip under it (single trail, gravel/path, asphalt,
   * one letter per 100 m: s, u, p). A slider moves a dot on the map (onpick(index 0..1)). Drawn as plain SVG, no library.
   */
  import { t, num } from '../i18n.svelte.js';

  /** ele: heights per 100 m; cls: the ground string; km: length; onpick(fraction 0..1) */
  let { ele = [], cls = '', km = 0, onpick = null } = $props();
  const W = 600;
  const H = 120;
  const lo = $derived(Math.min(...ele));
  const hi = $derived(Math.max(...ele));
  const x = (i) => (ele.length < 2 ? 0 : (i / (ele.length - 1)) * W);
  const y = (v) => H - 8 - ((v - lo) / Math.max(1, hi - lo)) * (H - 24);
  const path = $derived(ele.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' '));
  const area = $derived(`${path} L${W} ${H} L0 ${H} Z`);
  /** Runs of the same ground: [{ c, from, to }] in index units. */
  const runs = $derived.by(() => {
    const out = [];
    for (let i = 0; i < cls.length; i++) {
      const last = out[out.length - 1];
      if (last && last.c === cls[i]) last.to = i + 1;
      else out.push({ c: cls[i], from: i, to: i + 1 });
    }
    return out;
  });
  let pos = $state(0);
  const pick = (e) => {
    pos = Number(e.currentTarget.value);
    onpick?.(pos / 1000);
  };
  const at = $derived(Math.round((pos / 1000) * Math.max(0, ele.length - 1)));
  const GROUND = { s: 'Single trail|tour', u: 'Gravel or path|tour', p: 'Asphalt|tour' };
</script>

<figure class="pf" data-profile>
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Height profile: from {lo} m to {hi} m', { lo: num(Math.round(lo)), hi: num(Math.round(hi)) })} preserveAspectRatio="none">
    <path d={area} class="fill" />
    <path d={path} class="line" fill="none" vector-effect="non-scaling-stroke" />
    <line x1={x(at)} x2={x(at)} y1="0" y2={H} class="cur" vector-effect="non-scaling-stroke" />
  </svg>
  <svg class="strip" viewBox="0 0 {Math.max(1, cls.length)} 1" preserveAspectRatio="none" role="img" aria-label={t('Ground along the tour: single trail, gravel or path, asphalt')}>
    {#each runs as r (r.from)}<rect x={r.from} y="0" width={r.to - r.from} height="1" class={`g-${r.c}`} />{/each}
  </svg>
  <div class="ax"><span class="num">{num(Math.round(lo))} m</span><span class="num">{num(Math.round(hi))} m</span></div>
  <label class="sl"><span class="sr">{t('Place on the tour')}</span><input type="range" min="0" max="1000" value={pos} oninput={pick} /></label>
  <p class="here num">{t('{km} km from the start, {m} m high', { km: num(Math.round(((at * 100) / 1000) * 10) / 10), m: num(Math.round(ele[at] ?? 0)) })}</p>
  <ul class="key">
    {#each Object.keys(GROUND) as k (k)}<li><i class={`g-${k}`}></i>{t(GROUND[k])}</li>{/each}
  </ul>
</figure>

<style>
  .pf { margin: 0; display: grid; gap: 6px; }
  svg { display: block; width: 100%; }
  svg:first-child { height: 130px; background: var(--paper); border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .fill { fill: var(--accent-soft); }
  .line { stroke: var(--accent); stroke-width: 2; }
  .cur { stroke: var(--ink); stroke-width: 1.5; }
  .strip { height: 12px; border-radius: 4px; overflow: hidden; }
  .g-s { fill: var(--ok); background: var(--ok); }
  .g-u { fill: var(--warn, var(--accent)); background: var(--warn, var(--accent)); }
  .g-p { fill: var(--ink-3); background: var(--ink-3); }
  .ax { display: flex; justify-content: space-between; font-size: var(--fs-small); color: var(--ink-3); }
  .sl input { width: 100%; min-height: 44px; margin: 0; }
  .here { margin: 0; font-size: var(--fs-small); color: var(--ink-2); }
  .key { display: flex; flex-wrap: wrap; gap: 4px 14px; list-style: none; margin: 0; padding: 0; font-size: var(--fs-small); color: var(--ink-2); }
  .key li { display: flex; align-items: center; gap: 6px; }
  .key i { width: 14px; height: 10px; border-radius: 3px; display: inline-block; }
</style>

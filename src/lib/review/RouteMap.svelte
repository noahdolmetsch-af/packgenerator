<script>
  /**
   * SN4+ V7 «Karte» (mockup SN4f-a, approved 13.10.2026): all routes of the rows as one drawing, without a
   * real map. Stretches ridden more often are stronger (1× / 2–3× / 4× and more). A tap on a stretch says
   * which trips run there. map: inzahlen.js routeMap().
   */
  import { t } from '../i18n.svelte.js';
  import { levelOf, routesOn } from './inzahlen.js';

  let { map } = $props();
  const W = 600;
  const H = 300;
  const PAD = 18;
  const view = $derived.by(() => {
    const b = map.box;
    const k = Math.cos((((b.s + b.n) / 2) * Math.PI) / 180) || 1;
    const spanX = Math.max(1e-6, (b.e - b.w) * k);
    const spanY = Math.max(1e-6, b.n - b.s);
    const sc = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);
    const ox = (W - spanX * sc) / 2;
    const oy = (H - spanY * sc) / 2;
    return (p) => [Math.round((ox + (p[1] - b.w) * k * sc) * 10) / 10, Math.round((oy + (b.n - p[0]) * sc) * 10) / 10];
  });
  const segs = $derived(
    map.routes
      .flatMap((r) => r.segs.map((g) => ({ ...g, lv: levelOf(g.n) })))
      .sort((a, b) => a.lv - b.lv)
      .map((g) => {
        const [x1, y1] = view(g.a);
        const [x2, y2] = view(g.b);
        return { x1, y1, x2, y2, lv: g.lv, key: g.key };
      }),
  );
  // a label at the point of each route farthest from the middle (only while there are few routes)
  const labels = $derived.by(() => {
    if (map.routes.length > 8) return [];
    const out = [];
    for (const r of map.routes) {
      let best = null;
      let far = -1;
      for (const g of r.segs) {
        const [x, y] = view(g.b);
        const d = (x - W / 2) ** 2 + (y - H / 2) ** 2;
        if (d > far) (far = d), (best = [x, y]);
      }
      const [x, y] = best ?? [W / 2, H / 2];
      const l = { id: r.id, title: r.title, x: Math.min(W - 6, Math.max(6, x)), y: Math.min(H - 6, Math.max(14, y - 6)), end: x > W * 0.6 };
      // two routes ending at the same place: one label is enough (no names on top of each other)
      if (!out.some((o) => Math.abs(o.x - l.x) < 90 && Math.abs(o.y - l.y) < 16)) out.push(l);
    }
    return out;
  });
  let picked = $state(null);
  const names = $derived(picked ? routesOn(map, picked) : []);
</script>

<div class="rmap" data-map>
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Map of {n} routes', { n: map.routes.length })}>
    {#each segs as s, i (i)}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <line class="lv{s.lv}" class:on={picked === s.key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} onclick={() => (picked = picked === s.key ? null : s.key)} />
    {/each}
    {#each labels as l (l.id)}
      <text x={l.x} y={l.y} text-anchor={l.end ? 'end' : 'start'}>{l.title}</text>
    {/each}
  </svg>
</div>
<ul class="lg" aria-label={t('How often ridden')}>
  <li><i class="k lv1"></i>1×</li>
  <li><i class="k lv2"></i>2–3×</li>
  <li><i class="k lv3"></i>{t('4× and more')}</li>
</ul>
<p class="cap" aria-live="polite">{names.length ? t('Here: {names}', { names: names.join(', ') }) : t('Tap a stretch to see which trips run there.')}</p>

<style>
  .rmap {
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    overflow: hidden;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  line {
    stroke-linecap: round;
    cursor: pointer;
  }
  .lv1 {
    stroke: color-mix(in srgb, var(--accent) 45%, var(--paper));
    stroke-width: 1.6;
  }
  .lv2 {
    stroke: color-mix(in srgb, var(--accent) 72%, var(--paper));
    stroke-width: 3;
  }
  .lv3 {
    stroke: var(--accent);
    stroke-width: 4.6;
  }
  line.on {
    stroke: var(--ink);
  }
  text {
    fill: var(--ink-2);
    font-size: var(--fs-tiny);
    paint-order: stroke;
    stroke: var(--paper-2);
    stroke-width: 3px;
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 18px;
    border-radius: 2px;
  }
  .k.lv1 {
    height: 2px;
    background: color-mix(in srgb, var(--accent) 45%, var(--paper));
  }
  .k.lv2 {
    height: 3px;
    background: color-mix(in srgb, var(--accent) 72%, var(--paper));
  }
  .k.lv3 {
    height: 5px;
    background: var(--accent);
  }
  .cap {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>

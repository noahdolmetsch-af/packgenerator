<script>
  /**
   * «Neuland»: the map of one collection, drawn as SVG from the bundled shapes (no map service, works
   * offline). Areas (cantons, municipalities, countries) are filled when reached; points (passes, huts,
   * peaks, lakes, own places) are dots on the Swiss cantons or the Alps. Your routes show as thin lines.
   * view: 'ch' | 'alps' | 'europe'; areas: [{ id, rings, st }]; points: [{ id, lat, lon, st }];
   * st: 'year' (new in the chosen year), 'old' (reached before), '' (not yet); bg: { cantons, countries,
   * lakes } background shapes; labels: [{ lon, lat, text, st }]; lines: [[[lat, lon], …], …];
   * onpick(id): a tap on an area or a dot. The list below the map does the same for the keyboard.
   */
  import { t } from '../i18n.svelte.js';

  let { view = 'ch', areas = [], points = [], bg = {}, labels = [], lines = [], title = '', onpick = null } = $props();

  const S = 100; // 1° = 100 units
  const BOX = { ch: [5.9, 45.78, 10.55, 47.84, 46.8], alps: [5.4, 43.85, 14.4, 48.0, 46.2], europe: [-11, 35, 33, 66, 50] };

  // the box: the view's own, widened for countries reached outside Europe
  const box = $derived.by(() => {
    const b = [...BOX[view]];
    if (view === 'europe') {
      for (const a of areas) {
        if (!a.st || !a.bbox) continue;
        b[0] = Math.min(b[0], a.bbox[0]);
        b[1] = Math.min(b[1], a.bbox[1]);
        b[2] = Math.max(b[2], a.bbox[2]);
        b[3] = Math.max(b[3], a.bbox[3]);
      }
      b[0] = Math.max(-180, b[0]);
      b[2] = Math.min(180, b[2]);
      b[1] = Math.max(-58, b[1]);
      b[3] = Math.min(78, b[3]);
    }
    if (view === 'alps') {
      for (const p of points) {
        b[0] = Math.min(b[0], p.lon - 0.2);
        b[1] = Math.min(b[1], p.lat - 0.2);
        b[2] = Math.max(b[2], p.lon + 0.2);
        b[3] = Math.max(b[3], p.lat + 0.2);
      }
    }
    return b;
  });
  const k = $derived(Math.cos((box[4] * Math.PI) / 180));
  const vb = $derived(`${(box[0] * k * S).toFixed(1)} ${(-box[3] * S).toFixed(1)} ${((box[2] - box[0]) * k * S).toFixed(1)} ${((box[3] - box[1]) * S).toFixed(1)}`);
  const unit = $derived(((box[2] - box[0]) * k * S) / 100); // 1 % of the width

  const visible = (bb) => bb && !(bb[2] < box[0] || bb[0] > box[2] || bb[3] < box[1] || bb[1] > box[3]);
  function path(rings) {
    let s = '';
    for (const r of rings) {
      for (let i = 0; i < r.length; i += 2) s += `${i ? 'L' : 'M'}${(r[i] * k * S).toFixed(1)} ${(-r[i + 1] * S).toFixed(1)}`;
      s += 'Z';
    }
    return s;
  }
  const xy = (lon, lat) => [+(lon * k * S).toFixed(1), +(-lat * S).toFixed(1)];

  const bgCountries = $derived((bg.countries ?? []).filter((c) => visible(c.bbox)).map((c) => ({ id: c.id, d: path(c.rings) })));
  const bgCantons = $derived((bg.cantons ?? []).map((c) => ({ id: c.id, d: path(c.rings) })));
  const bgLakes = $derived((bg.lakes ?? []).filter((l) => l.rings).map((l) => ({ id: l.id, d: path(l.rings) })));
  const shapes = $derived(areas.filter((a) => a.rings && visible(a.bbox)).map((a) => ({ id: a.id, st: a.st, d: path(a.rings) })));
  const dots = $derived(points.map((p) => ({ id: p.id, st: p.st, xy: xy(p.lon, p.lat) })));
  const routes = $derived(lines.map((l) => l.map(([lat, lon]) => xy(lon, lat).join(',')).join(' ')));

  function pick(e) {
    const id = e.target?.closest?.('[data-id]')?.dataset.id;
    if (id) onpick?.(id);
  }
</script>

<!-- the list under the map is the way for the keyboard and the screen reader; the map is a picture with taps -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<svg class="nmap {view}" viewBox={vb} role="img" aria-label={title || t('Map')} onclick={pick} preserveAspectRatio="xMidYMid meet">
  {#each bgCountries as c (c.id)}<path class="bgc" d={c.d} />{/each}
  {#each bgCantons as c (c.id)}<path class="bgk" d={c.d} />{/each}
  {#each shapes as a (a.id)}<path class="area {a.st || 'no'}" data-id={a.id} d={a.d} />{/each}
  {#each bgLakes as l (l.id)}<path class="lake" d={l.d} />{/each}
  {#each routes as r, i (i)}<polyline class="route" points={r} />{/each}
  {#each dots as p (p.id)}
    <circle class="dot {p.st || 'no'}" data-id={p.id} cx={p.xy[0]} cy={p.xy[1]} r={p.st ? unit * 1.1 : unit * 0.75} />
  {/each}
  {#each labels as l (l.text)}
    {@const [x, y] = xy(l.lon, l.lat)}
    <text class="nl-lbl {l.st || 'no'}" {x} {y} font-size={unit * 1.8} text-anchor="middle" dominant-baseline="central">{l.text}</text>
  {/each}
</svg>

<style>
  .nmap {
    display: block;
    width: 100%;
    height: auto;
    max-height: 62vh;
    border-radius: var(--r-ctl);
    background: var(--paper);
    touch-action: manipulation;
  }
  .nmap.europe {
    background: var(--info-soft);
  }
  path,
  polyline,
  circle {
    vector-effect: non-scaling-stroke;
  }
  .bgc {
    fill: var(--paper-2);
    stroke: var(--line);
    stroke-width: 0.6;
  }
  .europe .bgc {
    fill: var(--paper);
  }
  .bgk {
    fill: var(--paper-2);
    stroke: var(--line);
    stroke-width: 0.6;
  }
  .area {
    stroke: var(--line-strong);
    stroke-width: 0.5;
    cursor: pointer;
  }
  .area.no {
    fill: var(--paper-2);
  }
  .europe .area.no {
    fill: var(--paper);
  }
  .area.old {
    fill: var(--accent);
    fill-opacity: 0.55;
  }
  .area.year {
    fill: var(--accent);
  }
  .lake {
    fill: var(--info-soft);
    stroke: var(--line);
    stroke-width: 0.4;
    pointer-events: none;
  }
  .route {
    fill: none;
    stroke: var(--hi);
    stroke-width: 1.4;
    stroke-opacity: 0.75;
    stroke-linejoin: round;
    pointer-events: none;
  }
  .dot {
    stroke: var(--paper);
    stroke-width: 1;
    cursor: pointer;
  }
  .dot.no {
    fill: var(--ink-3);
    fill-opacity: 0.55;
  }
  .dot.old {
    fill: var(--accent);
    fill-opacity: 0.7;
  }
  .dot.year {
    fill: var(--accent);
  }
  .nl-lbl {
    fill: var(--ink-2);
    font-family: var(--font-body);
    font-weight: 600;
    pointer-events: none;
  }
  .nl-lbl.old,
  .nl-lbl.year {
    fill: var(--paper);
  }
</style>

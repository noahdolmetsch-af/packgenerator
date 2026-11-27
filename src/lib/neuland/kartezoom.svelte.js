/**
 * The zoom of a map as state and handlers (Noah 27.11.2026 «karte zoombar», «Weisse Flecken in der Nähe»): the same behaviour as
 * the Neuland map (NeulandMap.svelte), for a map drawn by another component. The rules are in kartezoom.js (pure, tested).
 *   const zoom = createZoom({ base: () => [x, y, w, h], max: () => 40 });
 *   <svg viewBox={zoom.vb} use:zoom.attach {...zoom.events} onclick={zoom.tap(fn)}> … </svg>
 * zoom.z is the zoom now (1 = the whole map); draw strokes and dots with 1 / zoom.z so they keep their size on the screen.
 * Buttons, the hint and the full screen come with ZoomBox.svelte.
 */
import { zoomAt, clampView, pinch, MAX_ZOOM, visibleBox, tipOf } from './kartezoom.js';

export function createZoom({ base, max = () => MAX_ZOOM }) {
  let view = $state({ z: 1, cx: null, cy: null });
  let svg = null;
  let hint = $state(false);
  let tip = $state(null);
  let hintTimer;
  let moved = false;
  let last = null;
  let lastTap = 0;
  const pts = new Map();

  const box = $derived(visibleBox(base(), view));
  const vb = $derived(box.map((n) => +n.toFixed(5)).join(' '));
  const frame = $derived(base().map((n) => n.toFixed(4)).join(' '));
  let seen = '';
  $effect.pre(() => {
    // another map (another radius) starts with the whole picture
    if (frame !== seen) {
      seen = frame;
      view = { z: 1, cx: null, cy: null };
    }
  });

  const toSvg = (cx, cy) => {
    const m = svg?.getScreenCTM?.();
    if (!m) return [box[0] + box[2] / 2, box[1] + box[3] / 2];
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return [p.x, p.y];
  };
  const perPx = () => {
    const m = svg?.getScreenCTM?.();
    return m ? 1 / m.a : box[2] / (svg?.clientWidth || 400);
  };
  const mid = () => [box[0] + box[2] / 2, box[1] + box[3] / 2];
  const set = (v) => (view = clampView(base(), v, max()));
  const zoomBy = (f, at) => {
    const [px, py] = at ?? mid();
    set(zoomAt(base(), view, px, py, view.z * f));
  };
  const centre = () => ({ cx: view.cx ?? box[0] + box[2] / 2, cy: view.cy ?? box[1] + box[3] / 2 });

  const events = {
    onwheel(e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomBy(Math.exp(-e.deltaY * 0.01), toSvg(e.clientX, e.clientY));
      } else {
        hint = true;
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => (hint = false), 1400);
      }
    },
    onpointerdown(e) {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      last = null;
    },
    onpointermove(e) {
      tip = pts.size ? null : tipOf(e, svg?.parentElement);
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId);
      const now = { x: e.clientX, y: e.clientY };
      if (pts.size === 1) {
        const dx = now.x - prev.x;
        const dy = now.y - prev.y;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        if (view.z <= 1.001 && e.pointerType === 'touch') return; // the whole map: a finger scrolls the page
        moved = true;
        try {
          svg.setPointerCapture(e.pointerId);
        } catch {}
        const u = perPx();
        pts.set(e.pointerId, now);
        const c = centre();
        set({ ...view, cx: c.cx - dx * u, cy: c.cy - dy * u });
      } else if (pts.size === 2) {
        pts.set(e.pointerId, now);
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (last && last.dist > 0) {
          moved = true;
          const [px, py] = toSvg(m.x, m.y);
          const u = perPx();
          view = pinch(base(), view, { px, py, ratio: dist / last.dist, dx: (m.x - last.mid.x) * u, dy: (m.y - last.mid.y) * u }, max());
        }
        last = { dist, mid: m };
      }
    },
    onpointerup(e) {
      pts.delete(e.pointerId);
      last = null;
      if (!pts.size && !moved && e.pointerType === 'touch') {
        const now = Date.now();
        if (now - lastTap < 320 && !e.target?.closest?.('[data-zoom-keep]')) zoomBy(2.2, toSvg(e.clientX, e.clientY));
        lastTap = now;
      }
    },
    onpointerleave() {
      tip = null;
    },
    onpointercancel(e) {
      pts.delete(e.pointerId);
      last = null;
    },
    onkeydown(e) {
      if (e.target !== e.currentTarget) return;
      const step = box[2] * 0.2;
      const c = centre();
      if (e.key === '+' || e.key === '=') zoomBy(1.6);
      else if (e.key === '-' || e.key === '_') zoomBy(1 / 1.6);
      else if (e.key === '0') api.reset();
      else if (view.z > 1.001 && e.key === 'ArrowLeft') set({ ...view, cx: c.cx - step, cy: c.cy });
      else if (view.z > 1.001 && e.key === 'ArrowRight') set({ ...view, cx: c.cx + step, cy: c.cy });
      else if (view.z > 1.001 && e.key === 'ArrowUp') set({ ...view, cx: c.cx, cy: c.cy - step });
      else if (view.z > 1.001 && e.key === 'ArrowDown') set({ ...view, cx: c.cx, cy: c.cy + step });
      else return;
      e.preventDefault();
    },
  };

  const api = {
    events,
    get z() {
      return view.z;
    },
    get zoomed() {
      return view.z > 1.001;
    },
    get max() {
      return max();
    },
    get vb() {
      return vb;
    },
    get box() {
      return box;
    },
    get hint() {
      return hint;
    },
    get tip() {
      return tip;
    },
    zoomBy,
    reset() {
      view = { z: 1, cx: null, cy: null };
    },
    /** zoom to a place: [x, y] in the drawing units */
    to(x, y, z = 6) {
      set({ z: Math.max(view.z, z), cx: x, cy: y });
    },
    /** use:zoom.attach on the svg */
    attach(node) {
      svg = node;
      return { destroy: () => (svg = null) };
    },
    /** a click handler that ignores the click that ends a drag */
    tap(fn) {
      return (e) => {
        if (moved) {
          moved = false;
          return;
        }
        fn?.(e);
      };
    },
  };
  return api;
}

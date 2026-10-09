/**
 * v0.45.0 (acceptance follow-up 4, Noah): the places on the bike drawing are 16–28 px on a phone.
 * Each gets an invisible tap area of at least 44 × 44 px around its centre, but two tap areas never
 * overlap: where two would, the space between them is split in the middle (never cutting into a
 * place itself). Pure, tested in tests/wardrobe045.test.js.
 *
 * boxes: [{ x, y, w, h }] in drawing units; scale: px per unit (drawing width / 720); min: px.
 * → [{ l, t, r, b }]: how many px the tap area reaches beyond the place on each side (≥ 0).
 */
export function tapAreas(boxes = [], scale = 1, min = 44) {
  const orig = boxes.map((b) => ({ x1: b.x * scale, y1: b.y * scale, x2: (b.x + b.w) * scale, y2: (b.y + b.h) * scale }));
  const grow = (a, b, n) => {
    const d = Math.max(0, (n - (b - a)) / 2);
    return [a - d, b + d];
  };
  const big = orig.map((o) => {
    const [x1, x2] = grow(o.x1, o.x2, min);
    const [y1, y2] = grow(o.y1, o.y2, min);
    return { x1, y1, x2, y2 };
  });
  for (let i = 0; i < big.length; i++) {
    for (let j = i + 1; j < big.length; j++) {
      const a = big[i];
      const b = big[j];
      const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
      const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
      if (ox <= 0 || oy <= 0) continue;
      // Split along the axis where they overlap less, at the middle between the two places.
      if (ox <= oy) {
        const [l, r, ol, or] = (orig[i].x1 + orig[i].x2) <= (orig[j].x1 + orig[j].x2) ? [a, b, orig[i], orig[j]] : [b, a, orig[j], orig[i]];
        const m = (ol.x2 + or.x1) / 2;
        l.x2 = Math.max(ol.x2, Math.min(l.x2, m));
        r.x1 = Math.min(or.x1, Math.max(r.x1, m));
      } else {
        const [u, d, ou, od] = (orig[i].y1 + orig[i].y2) <= (orig[j].y1 + orig[j].y2) ? [a, b, orig[i], orig[j]] : [b, a, orig[j], orig[i]];
        const m = (ou.y2 + od.y1) / 2;
        u.y2 = Math.max(ou.y2, Math.min(u.y2, m));
        d.y1 = Math.min(od.y1, Math.max(d.y1, m));
      }
    }
  }
  // rounded down, so two areas that meet never overlap by a rounding step
  const r1 = (n) => Math.max(0, Math.floor(n * 10 + 1e-9) / 10);
  return orig.map((o, i) => ({ l: r1(o.x1 - big[i].x1), t: r1(o.y1 - big[i].y1), r: r1(big[i].x2 - o.x2), b: r1(big[i].y2 - o.y2) }));
}

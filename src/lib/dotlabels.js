/**
 * Names beside the dots of a map (Gipfel-Karte, Noah 24.11.2026 «karte besser»): each name goes right of its dot, else left, below or
 * above, at the first place where it does not cover another dot or another name and stays inside the map. Pure, tested.
 * dots: [{ id, x, y, r, name? }] (all dots; only the ones with a name get a label); fs: the font size in the same units as x, y;
 * bounds: { x0, y0, x1, y1 }. → [{ id, name, x, y, anchor: 'start' | 'end' | 'middle', b }] (b: the box the name covers).
 */
export function placeLabels(dots, fs, bounds) {
  const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const inside = (b) => b.x0 >= bounds.x0 && b.x1 <= bounds.x1 && b.y0 >= bounds.y0 && b.y1 <= bounds.y1;
  const boxOf = (d) => ({ id: d.id, x0: d.x - d.r, x1: d.x + d.r, y0: d.y - d.r, y1: d.y + d.r });
  const boxes = dots.map(boxOf);
  const out = [];
  for (const d of dots) {
    if (!d.name) continue;
    const w = d.name.length * fs * 0.56;
    const g = fs * 0.3;
    const { x, y, r } = d;
    const opts = [
      { x: x + r + g, y, anchor: 'start', b: { x0: x + r, x1: x + r + g + w, y0: y - fs / 2, y1: y + fs / 2 } },
      { x: x - r - g, y, anchor: 'end', b: { x0: x - r - g - w, x1: x - r, y0: y - fs / 2, y1: y + fs / 2 } },
      { x, y: y + r + fs * 0.75, anchor: 'middle', b: { x0: x - w / 2, x1: x + w / 2, y0: y + r, y1: y + r + fs * 1.3 } },
      { x, y: y - r - fs * 0.75, anchor: 'middle', b: { x0: x - w / 2, x1: x + w / 2, y0: y - r - fs * 1.3, y1: y - r } },
    ];
    const free = opts.find((o) => inside(o.b) && !boxes.some((b) => b.id !== d.id && hit(o.b, b)) && !out.some((l) => hit(o.b, l.b)));
    const o = free ?? opts.find((q) => inside(q.b)) ?? opts[0];
    out.push({ id: d.id, name: d.name, x: o.x, y: o.y, anchor: o.anchor, b: o.b });
  }
  return out;
}

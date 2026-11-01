/**
 * Velo-Idee 71 «Quittung in Arbeiten aufteilen» (996 Ideen, Noah 26.10.2026 «1a 2a»): every line of a
 * workshop receipt (visit.parts) gets a part, a job and, where it belongs, a row of the bike's order
 * («Auftrag für den Velomech», care/orders.js). A line can be split in two («Zeile teilen»). Then the
 * part counters start anew (workshop.js withVisits reads the lines), the order shows what is done, and
 * each part has its cost. Stored on the visit lines, so every backup carries it.
 * Line: { what, chf, part, action, model?, order? }. part '' = not assigned yet, 'other' = no part.
 * Pure functions, tested in tests/veloideen.test.js.
 */

/** The jobs a line can be. */
export const JOBS = [
  { key: 'replace', name: 'replaced' },
  { key: 'service', name: 'serviced' },
  { key: 'check', name: 'checked' },
];

/** A new empty line. */
export const blankLine = () => ({ what: '', chf: null, part: '', action: 'replace', order: null });

/** Has the line a part (or «no part»)? */
export const assigned = (line) => !!line?.part;

/** Round to 5 Rappen, as on a Swiss receipt. */
const r05 = (n) => Math.round(n * 20) / 20;

/**
 * Suggest a part from the words of a line: names = [{ key, words: ['Chain', 'Kette'] }].
 * The longest word that is in the text wins («Bremsbeläge hinten» before «Bremse»); null when none.
 */
export function guessPart(text, names = []) {
  const low = `${text ?? ''}`.toLowerCase();
  if (!low.trim()) return null;
  let best = null;
  for (const n of names) {
    for (const w of n.words ?? []) {
      const word = `${w ?? ''}`.toLowerCase().trim();
      if (word.length >= 3 && low.includes(word) && (!best || word.length > best.len)) best = { key: n.key, len: word.length };
    }
  }
  return best?.key ?? null;
}

/** The lines of a visit for the window: a copy, unassigned lines with a suggested part (marked `guess`). */
export function linesOf(visit, names = []) {
  return (visit?.parts ?? []).map((l) => {
    const line = { ...blankLine(), ...l, what: l.what ?? l.model ?? '', order: l.order ?? null };
    if (assigned(line)) return line;
    const g = guessPart(line.what, names);
    return g ? { ...line, part: g, guess: true } : line;
  });
}

/** «Zeile teilen»: the line at i becomes two, the price split in half (rounded to 5 Rappen). */
export function splitLine(lines, i) {
  const l = lines[i];
  if (!l) return lines;
  const half = typeof l.chf === 'number' ? r05(l.chf / 2) : null;
  const a = { ...l, chf: half };
  const b = { ...l, chf: half == null ? null : r05(l.chf - half), part: '', order: null, guess: false };
  return [...lines.slice(0, i), a, b, ...lines.slice(i + 1)];
}

/** The lines as they are stored: without the marks of the window, numbers as numbers. */
export function storeLines(lines) {
  return lines.map(({ guess: _g, ...l }) => {
    const chf = l.chf === '' || l.chf == null ? null : Number(String(l.chf).replace(',', '.'));
    const out = { ...l, what: `${l.what ?? ''}`.trim(), chf: Number.isFinite(chf) ? chf : null, order: l.order || null };
    if (!out.order) delete out.order;
    return out;
  });
}

/**
 * What the assignment does: { assigned, total, starts: [part keys replaced], order: { done, all, open:
 * [names] } | null, costs: [{ part, chf }], sum }. orderRows: the rows of the bike's order before the visit.
 */
export function splitSummary(lines, orderRows = []) {
  const real = lines.filter((l) => l.part && l.part !== 'other');
  const starts = [...new Set(real.filter((l) => l.action === 'replace').map((l) => l.part))];
  const costs = Object.values(
    real.reduce((m, l) => {
      const chf = Number(l.chf);
      if (!Number.isFinite(chf)) return m;
      m[l.part] = { part: l.part, chf: r05((m[l.part]?.chf ?? 0) + chf) };
      return m;
    }, {}),
  );
  const keys = new Set(lines.map((l) => l.order).filter(Boolean));
  const order = orderRows.length ? { done: orderRows.filter((r) => keys.has(r.key)).length, all: orderRows.length, open: orderRows.filter((r) => !keys.has(r.key)).map((r) => r.name) } : null;
  const sum = r05(lines.reduce((s, l) => s + (Number.isFinite(Number(l.chf)) && l.chf !== '' && l.chf != null ? Number(l.chf) : 0), 0));
  return { assigned: lines.filter(assigned).length, total: lines.length, starts, order, costs, sum };
}

/**
 * Merges the files of src/lib/featreg/ (one per new function, see README.md) for the five lists of the catalogue.
 * PARTS comes from index.gen.js, written by scripts/news.mjs (not in git). Pure; tested in tests/featreg.test.js.
 */
import { PARTS } from './index.gen.js';

/** Merge parts into { features, moments: { moment: [ids] }, howto, handbook, home, gaps }. */
export function mergeParts(parts) {
  const out = { features: [], moments: {}, howto: {}, handbook: {}, home: {}, gaps: {} };
  for (const p of parts) {
    for (const f of p.features ?? []) {
      const { moment, ...own } = f;
      out.features.push(own);
      (out.moments[moment ?? 'app'] ??= []).push(f.id);
    }
    for (const k of ['howto', 'handbook', 'home', 'gaps']) Object.assign(out[k], p[k] ?? {});
  }
  return out;
}

export const FEATREG = mergeParts(PARTS);

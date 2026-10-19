/**
 * Big idea 2 «Werkzeug-Ketten» (Noah 19.10.2026 «1-3 freigabe»): a saved order of steps that runs with
 * one tap, e.g. «choose photos → make smaller → one PDF → make the PDF smaller → share». Chains can be
 * added, renamed, deleted, and their steps moved (rules 12, 18). Saved in the settings «tools.chains»
 * (backup and sync). The model and the runner are pure, tested in tests/werkzeugkasten.test.js; the
 * real work (canvas, pdf-lib, share) is handed in as `ops` by Chains.svelte.
 */

/** The steps. in: what it takes ('img' pictures, 'pdf', 'any'); out: what comes out ('same' = as in). */
export const STEPS = [
  { kind: 'resize', label: 'Make photos smaller', in: 'img', out: 'img' },
  { kind: 'pdf', label: 'Make one PDF', in: 'any', out: 'pdf' },
  { kind: 'shrink', label: 'Make the PDF smaller', in: 'pdf', out: 'pdf' },
  { kind: 'ablage', label: 'Keep in «Links and files»', in: 'any', out: 'same' },
  { kind: 'share', label: 'Share or save', in: 'any', out: 'same' },
];
export const stepOf = (kind) => STEPS.find((s) => s.kind === kind) ?? null;
export const RESIZE_PX = [2048, 1600, 1280, 800];

export const DEFAULT_CHAINS = [
  { id: 'c-belege', name: 'Receipts as one PDF', builtin: true, steps: [{ id: 's1', kind: 'resize', px: 1600 }, { id: 's2', kind: 'pdf' }, { id: 's3', kind: 'shrink' }, { id: 's4', kind: 'share' }] },
  { id: 'c-nachricht', name: 'Photos for a message', builtin: true, steps: [{ id: 's1', kind: 'resize', px: 1280 }, { id: 's2', kind: 'share' }] },
];

/** What the chosen files are: 'img' (all pictures), 'pdf' (all PDF) or 'any' (mixed); '' for none. */
export function kindOfFiles(files) {
  const k = (files ?? []).map((f) => (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name) ? 'pdf' : /^image\//.test(f.type) ? 'img' : 'other'));
  if (!k.length) return '';
  if (k.includes('other')) return 'other';
  return k.every((x) => x === 'img') ? 'img' : k.every((x) => x === 'pdf') ? 'pdf' : 'any';
}

/**
 * The first step that does not fit what comes to it, starting from `start` ('img' when photos are
 * chosen). → index, or -1 when every step fits.
 */
export function brokenStep(steps, start = 'img') {
  let cur = start;
  for (let i = 0; i < (steps ?? []).length; i++) {
    const s = stepOf(steps[i].kind);
    if (!s) return i;
    if (s.in !== 'any' && s.in !== cur) return i;
    if (s.out !== 'same') cur = s.out;
  }
  return -1;
}

/** A chain as read from the settings: known steps only, a name, ids. */
export function cleanChains(list) {
  if (!Array.isArray(list)) return DEFAULT_CHAINS.map((c) => structuredClone(c));
  return list
    .filter((c) => c && typeof c.name === 'string' && Array.isArray(c.steps))
    .map((c) => ({ id: String(c.id), name: c.name.slice(0, 60), builtin: !!c.builtin, steps: c.steps.filter((s) => stepOf(s?.kind)).map((s) => ({ ...s, id: String(s.id) })) }));
}

/** The chain's name to show: the built-in ones are English keys for t(), typed names stay as typed. */
export const chainName = (c, t) => (c.builtin ? t(c.name) : c.name);

/**
 * Runs the steps on the files ([{ name, type, blob }]). ops: { resize(file, px), pdf(files), shrink(file),
 * ablage(file), share(files) }, each async; resize and shrink give one file back, pdf one file for all.
 * onstep(i) before each step. → the files at the end.
 */
export async function runChain(chain, files, ops, onstep = () => {}) {
  let cur = [...files];
  for (let i = 0; i < chain.steps.length; i++) {
    const s = chain.steps[i];
    onstep(i);
    if (s.kind === 'resize') cur = await Promise.all(cur.map((f) => ops.resize(f, s.px || 1600)));
    else if (s.kind === 'pdf') cur = [await ops.pdf(cur)];
    else if (s.kind === 'shrink') cur = await Promise.all(cur.map((f) => ops.shrink(f)));
    else if (s.kind === 'ablage') for (const f of cur) await ops.ablage(f);
    else if (s.kind === 'share') await ops.share(cur);
  }
  onstep(chain.steps.length);
  return cur;
}

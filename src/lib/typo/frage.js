/**
 * «Tippfehler-Frage» (Warteliste 6, Noah 22.11.2026 «1-5 a»): a number that looks like a slip («700 kg» for 70 kg) is asked about, never blocked.
 * One pure rule for every kind of number field; the page shows the answer as a quiet line under the field (TypoZeile.svelte).
 * The rule compares with the person's own values (when there are at least three) and with rough outer limits; a shifted comma
 * (÷10, ÷100, ×10, ×100) that lands in the usual range is offered as the suggestion. «It is right» is remembered per value
 * (setting `typo.ok`, in the backup, not in the sync) and the value is not asked about again. Rules, no AI, all on the device.
 */
export const OK_KEY = 'typo.ok';
const MAX_OK = 200;

/** The kinds: the rough outer limits, a typical value (the target of a suggestion without own values), the decimals and the unit. */
export const KINDS = {
  bodyKg: { min: 35, max: 200, typical: 70, digits: 1, unit: 'kg' },
  gearG: { min: 1, max: 20000, typical: 300, digits: 0, unit: 'g' },
  km: { min: 0.5, max: 600, typical: 60, digits: 1, unit: 'km' },
  minutes: { min: 1, max: 1440, typical: 90, digits: 0, unit: 'min' },
};

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

/** The number in a field's text («70,5» → 70.5), or null when it is no number. */
export function numberOf(text) {
  const n = Number(String(text ?? '').trim().replace(',', '.'));
  return String(text ?? '').trim() !== '' && Number.isFinite(n) ? n : null;
}

/** The key under which «It is right» is remembered. */
export const okKey = (kind, value) => `${kind}:${value}`;

/** The remembered keys of the stored value. */
export const okOf = (value) => (Array.isArray(value?.list) ? value.list.filter((x) => typeof x === 'string') : []);

/** The stored value with one more remembered value (the newest 200 stay). */
export const withOk = (value, kind, v) => ({ list: [...okOf(value).filter((k) => k !== okKey(kind, v)), okKey(kind, v)].slice(-MAX_OK) });

/**
 * Is this value unusual? → null (normal, or remembered as right, or no number) or { value, suggest, why }.
 * why: 'range' (outside the rough limits), 'own' (far from your own values). suggest: a number or null.
 * own: the person's earlier values of the same kind (numbers); ok: the remembered keys.
 */
export function askTypo({ kind, value, own = [], ok = [] } = {}) {
  const k = KINDS[kind];
  const v = Number(value);
  if (!k || !Number.isFinite(v) || v <= 0) return null;
  if (ok.includes(okKey(kind, v))) return null;
  const mine = own.map(Number).filter((x) => Number.isFinite(x) && x > 0);
  const m = mine.length >= 3 ? median(mine) : null;
  const outside = v < k.min || v > k.max;
  const far = m != null && (v < m * 0.5 || v > m * 1.6);
  if (!outside && !far) return null;
  const fits = (c) => c >= k.min && c <= k.max && (m == null || (c >= m * 0.7 && c <= m * 1.4));
  const target = m ?? k.typical;
  const options = [v / 10, v / 100, v * 10, v * 100].map((c) => round(c, k.digits)).filter(fits);
  options.sort((a, b) => Math.abs(Math.log(a / target)) - Math.abs(Math.log(b / target)));
  return { value: v, suggest: options[0] ?? null, why: outside ? 'range' : 'own' };
}

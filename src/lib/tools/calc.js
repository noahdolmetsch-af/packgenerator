/**
 * Paket L «Werkzeugkasten» (#6 Rechner): a small calculator. The line is read by hand (no eval):
 * numbers with a dot or a comma, + − × ÷ (also * / x :), brackets, and % (50 % = 0.5; 80 + 10 % = 88).
 * Pure (no database, no screen), tested in tests/werkzeugkasten.test.js.
 */

/** Splits a line into numbers, operators and brackets; null when a sign is not understood. */
export function tokens(line) {
  const s = String(line ?? '')
    .replace(/[×xX*]/g, '*')
    .replace(/[÷:/]/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/[’'\s]/g, '');
  const out = [];
  for (let i = 0; i < s.length; ) {
    const c = s[i];
    const num = /^(\d+(?:[.,]\d*)?|[.,]\d+)/.exec(s.slice(i));
    if (num) {
      out.push({ n: Number(num[1].replace(',', '.')) });
      i += num[1].length;
    } else if ('+-*/()%'.includes(c)) {
      out.push({ op: c });
      i += 1;
    } else return null;
  }
  return out;
}

/** The value of a line, or null when it cannot be computed (empty, unclosed, divided by 0). */
export function evaluate(line) {
  const tk = tokens(line);
  if (!tk || !tk.length) return null;
  let i = 0;
  const peek = () => tk[i];
  const isOp = (o) => peek()?.op === o;
  // a term followed by «%»: on its own it is a share (50 % = 0.5)
  function factor() {
    if (isOp('-')) {
      i++;
      const v = factor();
      return v == null ? null : -v;
    }
    if (isOp('+')) {
      i++;
      return factor();
    }
    let v;
    if (isOp('(')) {
      i++;
      v = sum();
      if (!isOp(')')) return null;
      i++;
    } else if (peek()?.n != null) {
      v = tk[i++].n;
    } else return null;
    return v;
  }
  function pct() {
    const v = factor();
    if (v == null) return null;
    if (isOp('%')) {
      i++;
      return { v: v / 100, pct: true };
    }
    return { v, pct: false };
  }
  function product() {
    let a = pct();
    if (!a) return null;
    let v = a.v;
    let wasPct = a.pct;
    while (isOp('*') || isOp('/')) {
      const op = tk[i++].op;
      const b = pct();
      if (!b) return null;
      if (op === '/' && b.v === 0) return null;
      v = op === '*' ? v * b.v : v / b.v;
      wasPct = false;
    }
    return { v, pct: wasPct };
  }
  function sum() {
    const a = product();
    if (!a) return null;
    let v = a.v;
    while (isOp('+') || isOp('-')) {
      const op = tk[i++].op;
      const b = product();
      if (!b) return null;
      // 80 + 10 % = 88: a share after + or − counts of the value before
      const d = b.pct ? v * b.v : b.v;
      v = op === '+' ? v + d : v - d;
    }
    return v;
  }
  const v = sum();
  if (v == null || i !== tk.length || !Number.isFinite(v)) return null;
  return Math.round(v * 1e10) / 1e10;
}

/** The result for the screen: at most 10 digits after the point, Swiss style with the given locale. */
export function showNumber(v, loc = 'de-CH') {
  if (v == null) return '';
  return new Intl.NumberFormat(loc, { maximumFractionDigits: 10 }).format(v);
}

/** The history: the newest first, at most 10, no repeats of the same line. */
export function pushHistory(list, line, result) {
  const rest = (list ?? []).filter((h) => h.line !== line);
  return [{ line, result }, ...rest].slice(0, 10);
}

/**
 * Einheitliche Formulare (Noah 19.10.2026 «1b 2a 3a 4b 5a», report notes/formulare-2026-10-19): the shared
 * checks of a form field. One rule per kind, one sentence per rule (texts from the thread «Rückmeldungen
 * beim Speichern»). The form shows them at the field, only after «Save» was pressed (4b); after that a
 * message goes away as soon as the field is right.
 *
 * A field is described by a spec:
 *   { field, example, kind, required, min, max, maxLen }
 *   field    what is asked, as a phrase that fits the sentence («a name», «a bike»), already translated
 *   example  an example value, already translated (optional; without it «, for example …» is left out)
 *   kind     'text' (default) | 'choice' | 'int' | 'number' | 'email' | 'date'
 *   required true for a field that must be filled; an optional one may stay empty
 *   min, max the range of 'int' and 'number'; maxLen the most characters of a text
 * checkField(value, spec, t) → the message or '' · checkAll({ name: [value, spec] }, t) → { name: message }
 */

/** A number as people type it: «1,5», «1.5», «1'200», «1 200». NaN when it is none, null when empty. */
export function readNumber(v) {
  const s = String(v ?? '')
    .trim()
    .replace(/['’\s]/g, '')
    .replace(',', '.');
  if (s === '') return null;
  return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : NaN;
}

const empty = (v) => (Array.isArray(v) ? v.length === 0 : v == null || String(v).trim() === '');
const withEx = (t, key, keyEx, vars) => (vars.example ? t(keyEx, vars) : t(key, vars));

export function checkField(value, spec = {}, t = (s, v) => s.replace(/\|[a-z]+$/, '').replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '')) {
  const { field = '', example = '', kind = 'text', required = false, min = null, max = null, maxLen = null } = spec;
  const vars = { field, example, min, max };
  const leave = required ? '' : ` ${t('Or leave it empty.|form')}`;
  if (empty(value)) {
    if (!required) return '';
    return kind === 'choice' ? withEx(t, 'Choose {field}.|form', 'Choose {field}, for example {example}.|form', vars) : withEx(t, 'Enter {field}.|form', 'Enter {field}, for example {example}.|form', vars);
  }
  if (kind === 'int' || kind === 'number') {
    const n = readNumber(value);
    const whole = kind === 'int';
    const bad = Number.isNaN(n) || (whole && !Number.isInteger(n)) || (min != null && n < min) || (max != null && n > max);
    if (!bad) return '';
    if (min != null && max != null) {
      return (whole ? withEx(t, '{field}: a whole number from {min} to {max}.|form', '{field}: a whole number from {min} to {max}, for example {example}.|form', vars) : withEx(t, '{field}: from {min} to {max}.|form', '{field}: from {min} to {max}, for example {example}.|form', vars)) + leave;
    }
    return withEx(t, '{field}: a number only.|form', '{field}: a number only, for example {example}.|form', vars) + leave;
  }
  if (kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) return t('{field}: an e-mail address like name@example.com.|form', vars);
  if (kind === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return t('{field}: a date like 21.10.2026.|form', vars);
  if (maxLen != null && String(value).trim().length > maxLen) return t('{field}: at most {max} characters.|form', { field, max: maxLen });
  return '';
}

/** All fields of a form at once: { name: [value, spec] } → { name: message } with only the wrong ones. */
export function checkAll(fields = {}, t) {
  const out = {};
  for (const [name, [value, spec]] of Object.entries(fields)) {
    const msg = checkField(value, spec, t);
    if (msg) out[name] = msg;
  }
  return out;
}

/** The end of a range lies before its start (both YYYY-MM-DD); empty values never clash. */
export const endBeforeStart = (start, end) => !!start && !!end && end < start;

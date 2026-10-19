/**
 * SN3+ «Bausteine je nach Lage»: the words of the rules and their suggestions (situation.js), the same
 * on Bausteine («kommt mit: unter 5 °C»), in the rule sheet and in Packen («Vorschlag: tiefste 3 °C»).
 */
import { t, num, locale } from './i18n.svelte.js';
import { METRICS, DEFAULT_RULES, NEED, OR, ALT, MORE_BLOCKS, STAGE_BLOCKS } from './situation.js';

const CMP_WORD = { lt: 'below|rule', gt: 'above|rule', gte: 'from|rule' };
/** The unit after the limit: «°C», «% Regen», «Hm pro Tag», «Std. Fahrzeit pro Tag». */
const UNIT_WORD = { minC: '°C', maxC: '°C', rainPct: '% rain', gainM: 'm climbing a day', hours: 'h riding a day', nights: 'nights|rule', lossM: 'm descent a day' };
/** v0.154.0: the words of a fixed «und …» (situation.js NEED) and «oder …» (OR). */
const NEED_WORD = { night: 'with a night', lake: 'and at a lake or river', cook: 'when you cook', outdoor: 'with nights in a tent or bivouac' };
const OR_WORD = { pass: 'or a pass', snow: 'or snow' };
/** v0.154.0: the second condition of a block in words («und am See oder Fluss»), '' when it has none. */
export const needLine = (key) => (NEED[key] ? t(NEED_WORD[NEED[key]]) : '');
/** Is the second condition of a block known only by hand in Planen («noch von Hand»)? */
export const byHand = (key) => NEED[key] === 'lake' || key === 'sauna' || key === 'coldwater';

/** The comparison as a word: «unter», «über», «ab». */
export const cmpWord = (cmp) => t(CMP_WORD[cmp] ?? CMP_WORD.gte);
/** The unit of a value as shown next to the limit field. */
export const unitOf = (metric) => METRICS[metric]?.unit ?? '';

/** When a block comes, in a few words: «unter 5 °C», «ab 1’200 Hm pro Tag oder ein Pass», «Tour im Ausland». */
export function ruleLine(key, rule) {
  if (!rule) return '';
  if (METRICS[rule.metric]?.bool) return t(METRICS[rule.metric].name);
  const unit = UNIT_WORD[rule.metric] === '°C' ? '°C' : t(UNIT_WORD[rule.metric]);
  const line = `${cmpWord(rule.cmp)} ${num(rule.limit)}\u00a0${unit}`; // the number keeps its unit on one line
  if (key === 'climb') return `${line} ${t('or a pass')}`;
  // v0.154.0: «oder ein Pass», «oder Schnee», «oder ab 1’500 Hm pro Tag», «mit Nacht», «und am See oder Fluss»
  const more = [OR[key] ? t(OR_WORD[OR[key]]) : '', key === 'recovery' && ALT.recovery && rule.alt != null ? t('or from {m} m climbing a day', { m: num(rule.alt) }) : '', needLine(key)].filter(Boolean);
  return [line, ...more].join(' ');
}

/** A country's name in the app's language (the browser knows them), else its code. */
export function countryName(code) {
  try {
    return new Intl.DisplayNames([locale()], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The small label of a suggestion in Packen («Vorschlag: tiefste 3 °C»); '' for other kinds. */
export function hitBadge(reason) {
  if (!reason) return '';
  const k = reason.kind;
  if (reason.metric && reason.metric !== DEFAULT_RULES[k]?.metric) {
    const unit = UNIT_WORD[reason.metric] === '°C' ? '°C' : unitOf(reason.metric);
    return t('Suggestion: {what}', { what: `${t(METRICS[reason.metric]?.name ?? '')} ${num(reason.value)} ${unit}` });
  }
  if (k === 'cold') return t('Suggestion: lowest {c} °C', { c: num(reason.c) });
  if (k === 'heat') return t('Suggestion: highest {c} °C', { c: num(reason.c) });
  if (k === 'climb') return reason.by === 'pass' ? t('Suggestion: a pass') : reason.by === 'top' ? t('Suggestion: up to {m} m', { m: num(reason.m) }) : t('Suggestion: ↑ {m} m a day', { m: num(reason.m) });
  if (k === 'long') return t('Suggestion: about {h} h riding a day', { h: num(reason.h) });
  if (k === 'abroad') return t('Suggestion: trip in {country}', { country: countryName(reason.country) });
  if (k === 'train') return t('Suggestion: travel by train');
  // v0.154.0 «Bausteine mehr» (mockup SN3j: «Vorschlag: Fr.–So., 2 Nächte», «Vorschlag: Pass, ↓ 1’594 m»)
  if (MORE_BLOCKS.includes(k) || STAGE_BLOCKS.includes(k)) return moreBadge(reason);
  return '';
}

/** «Fr.–So.»: the first and the last weekday of a trip, short, in the app's language ('' when unknown). */
export function dayRange(from, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(from ?? ''))) return '';
  try {
    const f = new Intl.DateTimeFormat(locale(), { weekday: 'short', timeZone: 'UTC' });
    const a = new Date(`${from}T12:00:00Z`);
    const b = new Date(a);
    b.setUTCDate(b.getUTCDate() + Math.max(1, Number(days) || 1) - 1);
    return `${f.format(a)}–${f.format(b)}`;
  } catch {
    return '';
  }
}

function moreBadge(r) {
  if (r.by === 'pass') return r.m != null ? t('Suggestion: pass, ↓ {m} m', { m: num(r.m) }) : t('Suggestion: a pass');
  if (r.by === 'snow') return t('Suggestion: snow possible');
  if (r.by === 'gain') return t('Suggestion: ↑ {m} m a day', { m: num(r.m) });
  if (r.metric === 'minC') return t('Suggestion: lowest {c} °C', { c: num(r.value) });
  if (r.metric === 'maxC') return t('Suggestion: highest {c} °C', { c: num(r.value) });
  if (r.metric === 'hours') return t('Suggestion: about {h} h riding a day', { h: num(r.value) });
  if (r.metric === 'lossM') return t('Suggestion: ↓ {m} m a day', { m: num(r.value) });
  if (r.metric === 'nights') {
    const range = dayRange(r.from, r.days);
    return range ? t('Suggestion: {range}, {n} nights', { range, n: num(r.value) }) : t('Suggestion: {n} nights', { n: num(r.value) });
  }
  if (r.kind === 'sleepwell') return t('Suggestion: a night outdoors');
  if (r.kind === 'sauna') return t('Suggestion: sauna or bath');
  if (r.kind === 'coldwater') return t('Suggestion: cold water');
  if (r.kind === 'drybag') return t('Suggestion: with bathing');
  return '';
}

/** Where the value of a rule comes from (the rule sheet, «aus der Prognose in Planen …»). */
export function sourceLine(metric) {
  if (metric === 'minC' || metric === 'maxC') return t('from the forecast in Plan, over all days of the trip');
  if (metric === 'rainPct') return t('from the forecast in Plan, the highest chance on the riding hours');
  if (metric === 'gainM') return t('from the route (GPX), per day; or the button «Pass» in Plan');
  if (metric === 'hours') return t('from the riding hours in Plan, else from the route');
  if (metric === 'abroad') return t('from the country in Plan');
  // v0.154.0 «Bausteine mehr»
  if (metric === 'nights') return t('from the days and the night of the trip in Plan');
  if (metric === 'lossM') return t('from the route (GPX), per day; or the button «Pass» in Plan');
  if (metric === 'outdoor') return t('from the night in Plan');
  if (metric === 'sauna' || metric === 'coldWater') return t('by hand in Plan: «Bathing»');
  if (metric === 'bathing') return t('follows the other bathing blocks');
  return t('from «Getting there» in Plan');
}

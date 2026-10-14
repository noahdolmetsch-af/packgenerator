/**
 * SN3+ «Bausteine je nach Lage»: the words of the rules and their suggestions (situation.js), the same
 * on Bausteine («kommt mit: unter 5 °C»), in the rule sheet and in Packen («Vorschlag: tiefste 3 °C»).
 */
import { t, num, locale } from './i18n.svelte.js';
import { METRICS, DEFAULT_RULES } from './situation.js';

const CMP_WORD = { lt: 'below|rule', gt: 'above|rule', gte: 'from|rule' };
/** The unit after the limit: «°C», «% Regen», «Hm pro Tag», «Std. Fahrzeit pro Tag». */
const UNIT_WORD = { minC: '°C', maxC: '°C', rainPct: '% rain', gainM: 'm climbing a day', hours: 'h riding a day' };

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
  return key === 'climb' ? `${line} ${t('or a pass')}` : line;
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
  return '';
}

/** Where the value of a rule comes from (the rule sheet, «aus der Prognose in Planen …»). */
export function sourceLine(metric) {
  if (metric === 'minC' || metric === 'maxC') return t('from the forecast in Plan, over all days of the trip');
  if (metric === 'rainPct') return t('from the forecast in Plan, the highest chance on the riding hours');
  if (metric === 'gainM') return t('from the route (GPX), per day; or the button «Pass» in Plan');
  if (metric === 'hours') return t('from the riding hours in Plan, else from the route');
  if (metric === 'abroad') return t('from the country in Plan');
  return t('from «Getting there» in Plan');
}

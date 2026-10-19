/**
 * Paket Q Zusatz 2 «Hilfe-Suche in Alltagssprache» (Noah 19.10.2026 «1-3 alle a»): a question like
 * «Wo stelle ich das Backup-Passwort ein?» finds the function that answers it. The search's own rule
 * (every word must fit) finds nothing for a whole question; here the small words are left out and each
 * function counts how many of the other words fit its title, text, words and «So geht's» steps (English
 * and the shown language). The best three, with their first step as the line under the title.
 * Pure (tr is t()), tested in tests/help.test.js.
 */
import { FEATURES, FEATURE_GROUPS } from '../features.js';
import { HOWTO } from '../know/howto.js';

const fold = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ');

/** Small words of a question (German and English, folded) that say nothing about the topic. */
export const STOP = new Set(
  (
    'wo wie was wann warum wer welche welcher welches kann koennen ich du man mein meine meinen mir mich dich dein deine ' +
    'das der die den dem des ein eine einen einem einer und oder mit fuer von zu zum zur im in an am auf aus bei ist sind ' +
    'wird werden gibt es sich ein ein mal noch auch nicht kein keine bitte so da dort hier finde finden stelle stellen ' +
    'mache machen tue tun geht gehen sehe sehen will moechte soll muss brauche einstellen ein aendern ' +
    'where how what when why who which can could i you my me the a an and or with for of to in on at is are it do does ' +
    'find set change make see want need please'
  ).split(' '),
);

/** The words of a question that carry its topic (folded, without the small words, at least 3 letters). */
export const topicWords = (q) => [...new Set(fold(q).split(' ').filter((w) => w.length >= 3 && !STOP.has(w)))];

/** Does a question look like a question (a «?», or four words or more)? */
export const isQuestion = (q) => /\?\s*$/.test(String(q ?? '')) || String(q ?? '').trim().split(/\s+/).length >= 4;

/** A word fits the text: as it is, or its start (5 letters) for longer words («passworts», «sicherungen»). */
const fits = (hay, w) => hay.includes(w) || (w.length >= 7 && hay.includes(w.slice(0, 5)));

/**
 * The functions that answer a question, best first: [{ id, featureId, title, sub, score }].
 * At least half of the topic words (one at least) must fit.
 */
export function helpAnswers(q, tr = (s) => s, max = 3) {
  const words = topicWords(q);
  if (!words.length) return [];
  const need = Math.max(1, Math.ceil(words.length / 2));
  return FEATURES.map((f) => {
    const steps = HOWTO[f.id] ?? [];
    const head = fold([f.title, tr(f.title), f.words].join(' '));
    const body = fold([f.text, tr(f.text), ...steps, ...steps.map((s) => tr(s))].join(' '));
    let score = 0;
    let n = 0;
    for (const w of words) {
      if (fits(` ${head} `, w)) (score += 2), n++;
      else if (fits(` ${body} `, w)) (score += 1), n++;
    }
    return { f, steps, score, n };
  })
    .filter((x) => x.n >= need)
    .sort((a, b) => b.score - a.score || b.n - a.n)
    .slice(0, max)
    .map(({ f, steps, score }) => ({
      id: `help-${f.id}`,
      featureId: f.id,
      title: tr(f.title),
      sub: steps[0] ? tr(steps[0]) : tr(FEATURE_GROUPS.find((g) => g.key === f.group)?.label ?? ''),
      score,
    }));
}

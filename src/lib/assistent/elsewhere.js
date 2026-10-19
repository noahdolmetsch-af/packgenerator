/**
 * «Weiter fragen bei …» (Noah 19.10.2026 «a und b»): under the app's answer, one tap opens another
 * free AI or search with the question already filled in. The answer comes there, not in the app.
 * With the tick «Send my gear and learnings along» (off each time, Noah «2a») a short text with the
 * gear and learnings that fit the question goes along; else only the question.
 *
 * The services are free with a normal account (or without one). Which ones show is your choice
 * (Ich › Darstellung › Bedienung › Diktat und Fragen).
 */
import { fold } from '../search.js';

const enc = encodeURIComponent;
/** Every service: key, name, what it is, the address with the question in it. */
export const SERVICES = [
  { key: 'claude', name: 'Claude', what: 'Free with a Claude account', url: (q) => `https://claude.ai/new?q=${enc(q)}` },
  { key: 'chatgpt', name: 'ChatGPT', what: 'Free, also without an account', url: (q) => `https://chatgpt.com/?q=${enc(q)}` },
  { key: 'perplexity', name: 'Perplexity', what: 'Free, answers with sources', url: (q) => `https://www.perplexity.ai/search?q=${enc(q)}` },
  { key: 'google', name: 'Google AI Mode', what: 'Free, Google search with an AI answer', url: (q) => `https://www.google.com/search?udm=50&q=${enc(q)}` },
  { key: 'copilot', name: 'Copilot', what: 'Free, from Microsoft', url: (q) => `https://copilot.microsoft.com/?q=${enc(q)}` },
  { key: 'lechat', name: 'Le Chat', what: 'Free, from Mistral (Europe)', url: (q) => `https://chat.mistral.ai/chat?q=${enc(q)}` },
  { key: 'duckduckgo', name: 'DuckDuckGo', what: 'Free and private, search with a short AI answer', url: (q) => `https://duckduckgo.com/?q=${enc(q)}` },
];
export const SERVICE_KEYS = SERVICES.map((s) => s.key);

/** The stored choice ('claude,chatgpt') as a list of known keys; nothing stored = all. */
export function shownServices(stored) {
  if (stored == null) return SERVICE_KEYS;
  return String(stored)
    .split(',')
    .filter((k) => SERVICE_KEYS.includes(k));
}

const MAX = 1500; // characters of context: an address stays short enough for every browser
const STOP = new Set('was wie wann welche welcher welches wieviel viele viel ich mir mich mein meine habe hab bin ist sind soll muss brauche gibt fuer mit und oder der die das den dem des ein eine einen bei auf von zum zur nach noch auch nicht what how when which much many for and the with have need should does did are was can'.split(' '));
const words = (s) => fold(String(s ?? '')).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));

/** How well a text fits the question: the number of question words it holds. */
function fits(text, qw) {
  const tw = new Set(words(text));
  return qw.filter((w) => tw.has(w) || [...tw].some((x) => x.startsWith(w) || w.startsWith(x))).length;
}

/**
 * The short text that goes along with the tick: the gear and learnings that fit the question (at most
 * 20 items and 8 learnings), each on one line. '' when nothing fits. `name(item)` gives an item's name.
 */
export function contextFor(q, { items = [], learnings = [], name = (i) => i?.name ?? '', de = true } = {}) {
  const qw = words(q);
  if (!qw.length) return '';
  const its = items
    .filter((i) => i && !i.gone && !i.archived)
    .map((i) => ({ i, n: fits(`${name(i)} ${i.category ?? ''}`, qw) }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)
    .slice(0, 20)
    .map(({ i }) => `- ${name(i)}${Number(i.weightG) > 0 ? `, ${Math.round(i.weightG)} g` : ''}`);
  const ls = learnings
    .filter((l) => l?.rule)
    .map((l) => ({ l, n: fits(`${l.rule} ${l.action ?? ''} ${l.topic ?? ''}`, qw) }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
    .map(({ l }) => `- ${l.rule}${l.action ? ` → ${l.action}` : ''}`);
  const parts = [];
  if (its.length) parts.push(`${de ? 'Meine Ausrüstung dazu' : 'My gear for this'}:\n${its.join('\n')}`);
  if (ls.length) parts.push(`${de ? 'Meine Erkenntnisse dazu' : 'My learnings for this'}:\n${ls.join('\n')}`);
  const s = parts.join('\n\n');
  return s.length > MAX ? `${s.slice(0, MAX - 1)}…` : s;
}

/** The text a service gets: the question, and the context below it when there is one. */
export const askText = (q, ctx = '') => (ctx ? `${String(q).trim()}\n\n${ctx}` : String(q).trim());

const PAGE_MAX = 3000;
/** «Mit Claude besprechen»: the claude.ai address with a question and (ticked) the page's lines. */
export function claudeUrl(ask, lines = []) {
  const body = lines.filter(Boolean).map((l) => `- ${String(l).replace(/\s+/g, ' ').trim()}`).join('\n');
  const text = body ? `${String(ask).trim()}\n\n${body.length > PAGE_MAX ? `${body.slice(0, PAGE_MAX - 1)}…` : body}` : String(ask).trim();
  return SERVICES[0].url(text);
}

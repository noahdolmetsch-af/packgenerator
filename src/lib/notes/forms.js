/**
 * Vorlagen mit Feldern (Noah 27.10.2026 «1a 2a 3b 4a 5a», 19:18 «ca. 20 zur Auswahl, im Frontend wählen»):
 * note templates with real fields (number, 1–5, choice, checklist, date, text). About twenty are ready; you choose
 * which ones you use («Vorlagen auswählen»), change their names and fields, delete them or add your own.
 * A chosen template shows in Notizen («Start from») and in the input bar of the places it fits (answer 4a).
 * Filled in, it becomes the text of the note (or goes under the page's text); a note also keeps the values
 * (note.form = { key, name, values }) so they can be read later. Pure functions, tested in tests/vorlagen-felder.test.js.
 * Names, labels and options are English keys for t(); what you type yourself is kept as typed (raw).
 * Settings 'noteForms' = { list?: [form], on?: [key] }: no list = the Standard; no on = DEFAULT_ON.
 */

export const FORMS_KEY = 'noteForms';
/** The kinds of field, in the order the editor offers them. */
export const FIELD_TYPES = ['text', 'long', 'number', 'scale', 'choice', 'check', 'date'];
export const TYPE_NAME = { text: 'Short text', long: 'Long text', number: 'Number', scale: 'Scale 1 to 5', choice: 'Choice', check: 'Checklist', date: 'Date' };
/** The groups of the selection, in their order. */
export const FORM_GROUPS = [
  { key: 'tour', name: 'Tours and on the way' },
  { key: 'bike', name: 'Bike|forms' },
  { key: 'body', name: 'Training and body' },
  { key: 'goals', name: 'Goals and thinking' },
  { key: 'daily', name: 'Everyday life' },
];

const f = (key, label, type = 'long', more = {}) => ({ key, label, type, ...more });
const STATE = ['good', 'due soon', 'replace now'];

/** The Standard templates (Noah's six from the proposal first, then the general ones). */
export const FORMS = [
  { key: 'report', name: 'Tour report', group: 'tour', places: ['debrief', 'notes'], fields: [f('route', 'Route and day', 'text'), f('best', 'Best moment'), f('hard', 'What was hard'), f('weather', 'Weather and track', 'choice', { options: ['sunny', 'cloudy', 'rain', 'wind', 'cold', 'hot'] }), f('feel', 'How it felt', 'scale'), f('next', 'Next time')] },
  { key: 'gearlearn', name: 'Gear learnings', group: 'tour', places: ['debrief', 'gear', 'notes'], fields: [f('proven', 'Proved itself'), f('missing', 'Was missing'), f('unused', 'Not needed'), f('broken', 'Broken or to replace')] },
  { key: 'race', name: 'Race note', group: 'tour', places: ['ride', 'debrief', 'notes'], fields: [f('race', 'Race', 'text'), f('goal', 'Goal', 'text'), f('result', 'Result (time, place)', 'text'), f('pace', 'Pace and pauses'), f('food', 'Food and drink'), f('sleep', 'Sleep|form', 'number', { unit: 'h' }), f('change', 'What I change')] },
  { key: 'bikestate', name: 'Bike condition', group: 'bike', places: ['care', 'notes'], fields: [f('km', 'Odometer', 'number', { unit: 'km' }), f('noise', 'Noises or play'), f('chain', 'Chain', 'choice', { options: STATE }), f('brakes', 'Brakes', 'choice', { options: STATE }), f('tyres', 'Tyres', 'choice', { options: STATE }), f('done', 'What I did'), f('due', 'Next service', 'date')] },
  { key: 'daynote', name: 'Day note', group: 'body', places: ['check', 'diary', 'notes'], fields: [f('energy', 'Energy', 'scale'), f('mood', 'Mood', 'scale'), f('good', 'What did me good'), f('heavy', 'What weighed on me'), f('tomorrow', 'Tomorrow')] },
  { key: 'idea', name: 'Idea|form', group: 'goals', places: ['inbox', 'notes'], fields: [f('what', 'What', 'text'), f('why', 'Why'), f('for', 'For which tour or goal', 'text'), f('step', 'Next step', 'text')] },
  { key: 'todo', name: 'To-do', group: 'daily', places: ['inbox', 'notes'], fields: [f('task', 'Task', 'text'), f('until', 'Until when', 'date'), f('prio', 'Priority', 'choice', { options: ['high', 'medium', 'low'] }), f('steps', 'Steps', 'check'), f('note', 'Note')] },
  { key: 'vision', name: 'Vision', group: 'goals', places: ['dreams', 'diary', 'notes'], fields: [f('where', 'Where I want to go'), f('why', 'Why'), f('feels', 'How it feels when I am there'), f('horizon', 'Time frame', 'choice', { options: ['1 year', '3 years', '5 years', '10 years'] })] },
  { key: 'challenge', name: 'Challenge', group: 'goals', places: ['dreams', 'notes'], fields: [f('what', 'The challenge', 'text'), f('why', 'Why it appeals to me'), f('needs', 'What it takes'), f('first', 'First step', 'text'), f('until', 'Until when', 'date')] },
  { key: 'strategy', name: 'Strategy', group: 'goals', places: ['dreams', 'notes'], fields: [f('goal', 'Goal', 'text'), f('now', 'Where I stand'), f('options', 'Options'), f('choice', 'What I choose'), f('steps', 'Next steps', 'check')] },
  { key: 'goal', name: 'Goal|form', group: 'goals', places: ['dreams', 'notes'], fields: [f('goal', 'Goal', 'text'), f('measure', 'I see it reached when', 'text'), f('until', 'Until when', 'date'), f('steps', 'Steps on the way', 'check'), f('help', 'Who or what helps')] },
  { key: 'decision', name: 'Decision', group: 'goals', places: ['notes'], fields: [f('question', 'Question', 'text'), f('options', 'Options'), f('pro', 'For it'), f('contra', 'Against it'), f('decided', 'Decided', 'text'), f('on', 'On|date', 'date')] },
  { key: 'learning', name: 'Lesson|form', group: 'goals', places: ['debrief', 'diary', 'notes'], fields: [f('what', 'What happened'), f('learned', 'What I learned'), f('now', 'What I do differently from now on')] },
  { key: 'training', name: 'Training|form', group: 'body', places: ['check', 'notes'], fields: [f('kind', 'Kind', 'choice', { options: ['endurance', 'intervals', 'strength', 'technique', 'recovery'] }), f('min', 'Duration', 'number', { unit: 'min' }), f('hard', 'Effort', 'scale'), f('how', 'How it went'), f('next', 'Next time')] },
  { key: 'week', name: 'Week review', group: 'body', places: ['diary', 'notes'], fields: [f('good', 'What went well'), f('bad', 'What did not'), f('learned', 'What I learned'), f('focus', 'Focus next week', 'text')] },
  { key: 'place', name: 'Cool place', group: 'tour', places: ['spur', 'dreams', 'notes'], fields: [f('name', 'Name', 'text'), f('where', 'Where', 'text'), f('special', 'What is special'), f('season', 'Best season', 'choice', { options: ['spring', 'summer', 'autumn', 'winter'] }), f('again', 'Go again?', 'choice', { options: ['yes', 'maybe', 'no'] })] },
  { key: 'sleep', name: 'Sleeping spot', group: 'tour', places: ['spur', 'ride', 'notes'], fields: [f('where', 'Where', 'text'), f('kind', 'Kind', 'choice', { options: ['tent', 'bivouac', 'hut', 'hotel', 'friends'] }), f('has', 'There is', 'check'), f('rating', 'Rating', 'scale'), f('tip', 'Tip')] },
  { key: 'tourid', name: 'Tour idea', group: 'tour', places: ['dreams', 'notes'], fields: [f('region', 'Region or goal', 'text'), f('days', 'Days', 'number'), f('km', 'Distance', 'number', { unit: 'km' }), f('season', 'Best season', 'choice', { options: ['spring', 'summer', 'autumn', 'winter'] }), f('need', 'What I need for it')] },
  { key: 'repair', name: 'Breakdown and repair', group: 'bike', places: ['care', 'ride', 'notes'], fields: [f('what', 'What happened'), f('where', 'Where', 'text'), f('fix', 'How I fixed it'), f('missing', 'What was missing'), f('min', 'Time lost', 'number', { unit: 'min' })] },
  { key: 'thanks', name: 'Gratitude', group: 'daily', places: ['diary', 'check', 'notes'], fields: [f('three', 'Three good things'), f('helped', 'Who helped me', 'text'), f('joy', 'A small joy', 'text')] },
  { key: 'tip', name: 'Recommendation', group: 'daily', places: ['inbox', 'notes'], fields: [f('title', 'Title', 'text'), f('kind', 'Kind', 'choice', { options: ['book', 'film', 'podcast', 'article', 'product'] }), f('from', 'Recommended by', 'text'), f('why', 'Why'), f('rating', 'Rating', 'scale')] },
  { key: 'meeting', name: 'Meeting', group: 'daily', places: ['inbox', 'notes'], fields: [f('topic', 'Topic', 'text'), f('on', 'On|date', 'date'), f('talked', 'What we talked about'), f('agreed', 'What we agreed', 'check')] },
];
/** On at the start: the six of the proposal (answer 5a) and the to-do; the rest waits in «Choose templates». */
export const DEFAULT_ON = ['report', 'gearlearn', 'race', 'bikestate', 'daynote', 'idea', 'todo'];

const str = (x) => (typeof x === 'string' ? x : '');
const clone = (x) => JSON.parse(JSON.stringify(x));
const newKey = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function cleanField(x) {
  if (!x || !str(x.key) || !str(x.label).trim() || !FIELD_TYPES.includes(x.type)) return null;
  const out = { key: x.key, label: x.label.trim(), type: x.type };
  if (x.type === 'choice') out.options = (Array.isArray(x.options) ? x.options : []).map((o) => str(o).trim()).filter(Boolean);
  if (x.type === 'number' && str(x.unit).trim()) out.unit = x.unit.trim();
  if (x.raw) out.raw = true;
  return out;
}
function cleanForm(x) {
  if (!x || !str(x.key) || !str(x.name).trim()) return null;
  return { key: x.key, name: x.name.trim(), group: FORM_GROUPS.some((g) => g.key === x.group) ? x.group : 'daily', places: (Array.isArray(x.places) ? x.places : ['notes']).filter((p) => typeof p === 'string'), fields: (Array.isArray(x.fields) ? x.fields : []).map(cleanField).filter(Boolean), ...(x.raw ? { raw: true } : {}) };
}

/** All templates: your list when you changed something, else the Standard. */
export function formsOf(stored) {
  const list = stored && Array.isArray(stored.list) ? stored.list : null;
  return (list ?? clone(FORMS)).map(cleanForm).filter(Boolean);
}
/** The keys you chose. */
export function onOf(stored) {
  return stored && Array.isArray(stored.on) ? stored.on.filter((k) => typeof k === 'string') : [...DEFAULT_ON];
}
/** The chosen templates, in list order; with a place only those that fit it (Notizen shows all chosen ones). */
export function chosenForms(stored, place = null) {
  const on = new Set(onOf(stored));
  return formsOf(stored).filter((x) => on.has(x.key) && (!place || place === 'notes' || x.places.includes(place)));
}

/* ---------- shown words: Standard ones through t(), typed ones as they are ---------- */
export const formName = (x, tr = (s) => s) => (x.raw ? x.name : tr(x.name));
export const fieldLabel = (x, tr = (s) => s) => (x.raw ? x.label : tr(x.label));
export const optionName = (field, o, tr = (s) => s) => (field.raw ? o : tr(o));

/* ---------- filling in ---------- */

/** Empty values of a template: '' for text, null for number/scale, [] for choice? one value '' , [] for a checklist. */
export function emptyValues(form) {
  return Object.fromEntries((form?.fields ?? []).map((x) => [x.key, x.type === 'check' ? [] : x.type === 'number' || x.type === 'scale' ? null : '']));
}
/** Is anything filled in? */
export function filled(form, values = {}) {
  return (form?.fields ?? []).some((x) => {
    const v = values[x.key];
    return Array.isArray(v) ? v.some((i) => str(i?.text).trim()) : v != null && String(v).trim() !== '';
  });
}
/**
 * The filled-in template as note text: its name as the first line, then each filled field
 * («Label: value», long text and checklists under their label). Empty fields are left out.
 * fmtDate(iso) writes a date the way the app does.
 */
export function formText(form, values = {}, tr = (s) => s, fmtDate = (d) => d) {
  const lines = [formName(form, tr)];
  for (const x of form?.fields ?? []) {
    const v = values[x.key];
    const label = fieldLabel(x, tr);
    if (x.type === 'check') {
      const items = (Array.isArray(v) ? v : []).filter((i) => str(i?.text).trim());
      if (items.length) lines.push(`${label}:`, ...items.map((i) => `- [${i.done ? 'x' : ' '}] ${i.text.trim()}`));
    } else if (x.type === 'long') {
      if (str(v).trim()) lines.push(`${label}:`, str(v).trim());
    } else if (x.type === 'scale') {
      if (Number.isFinite(v)) lines.push(`${label}: ${v}/5`);
    } else if (x.type === 'number') {
      if (Number.isFinite(v)) lines.push(`${label}: ${v}${x.unit ? ` ${x.unit}` : ''}`);
    } else if (x.type === 'choice') {
      if (str(v)) lines.push(`${label}: ${optionName(x, v, tr)}`);
    } else if (x.type === 'date') {
      if (str(v)) lines.push(`${label}: ${fmtDate(v)}`);
    } else if (str(v).trim()) lines.push(`${label}: ${str(v).trim()}`);
  }
  return lines.join('\n');
}
/** What a note keeps of the filled-in template: { key, name, values } with only the filled values. */
export function formRecord(form, values = {}, tr = (s) => s) {
  const kept = {};
  for (const x of form.fields) {
    const v = values[x.key];
    if (Array.isArray(v) ? v.some((i) => str(i?.text).trim()) : v != null && String(v).trim() !== '') kept[x.key] = Array.isArray(v) ? v.filter((i) => str(i?.text).trim()) : v;
  }
  return { key: form.key, name: formName(form, tr), values: kept };
}

/* ---------- choosing and changing (everything changeable, Noah's rule 11) ---------- */

/** The stored value with the list made your own (Standard words turned into your language, tr). */
function own(stored, tr) {
  const list = formsOf(stored).map((x) => (x.raw ? x : { ...x, raw: true, name: tr(x.name), fields: x.fields.map((y) => (y.raw ? y : { ...y, raw: true, label: tr(y.label), ...(y.options ? { options: y.options.map((o) => tr(o)) } : {}) })) }));
  return { list, on: onOf(stored) };
}
export function setOn(stored, key, yes) {
  const on = onOf(stored).filter((k) => k !== key);
  if (yes) on.push(key);
  return { ...(stored ?? {}), on };
}
/** The list with one template changed by fn(form) (made your own first, so its words stay as you see them). */
export function changeForm(stored, key, fn, tr = (s) => s) {
  const s = own(stored, tr);
  return { ...s, list: s.list.map((x) => (x.key === key ? cleanForm(fn(clone(x))) ?? x : x)) };
}
export const renameForm = (stored, key, name, tr) => (str(name).trim() ? changeForm(stored, key, (x) => ({ ...x, name: name.trim() }), tr) : stored);
export function removeForm(stored, key, tr = (s) => s) {
  const s = own(stored, tr);
  return { list: s.list.filter((x) => x.key !== key), on: s.on.filter((k) => k !== key) };
}
/** A new template of your own, chosen at once, with one long text field. → { stored, key } */
export function addForm(stored, name, tr = (s) => s, key = newKey('form')) {
  const n = str(name).trim();
  if (!n) return { stored, key: null };
  const s = own(stored, tr);
  return { stored: { list: [...s.list, { key, name: n, group: 'daily', places: ['notes'], raw: true, fields: [{ key: 'note', label: tr('Note'), type: 'long', raw: true }] }], on: [...s.on, key] }, key };
}
/** Move a template in the list from index to index. */
export function moveForm(stored, from, to, tr = (s) => s) {
  const s = own(stored, tr);
  if (from < 0 || from >= s.list.length || to < 0 || to >= s.list.length) return s;
  const list = [...s.list];
  const [x] = list.splice(from, 1);
  list.splice(to, 0, x);
  return { ...s, list };
}
export const backToStandard = () => ({ on: [...DEFAULT_ON] });

/* fields of one template */
export function addField(form, label, type = 'long', key = newKey('f')) {
  const l = str(label).trim();
  if (!l || !FIELD_TYPES.includes(type)) return form;
  return { ...form, fields: [...form.fields, { key, label: l, type, raw: true, ...(type === 'choice' ? { options: [] } : {}) }] };
}
export const renameField = (form, key, label) => (str(label).trim() ? { ...form, fields: form.fields.map((x) => (x.key === key ? { ...x, label: label.trim(), raw: true } : x)) } : form);
export const removeField = (form, key) => ({ ...form, fields: form.fields.filter((x) => x.key !== key) });
export function moveField(form, from, to) {
  if (from < 0 || from >= form.fields.length || to < 0 || to >= form.fields.length) return form;
  const fields = [...form.fields];
  const [x] = fields.splice(from, 1);
  fields.splice(to, 0, x);
  return { ...form, fields };
}
/** A choice field's options from a comma list. */
export const setOptions = (form, key, text) => ({ ...form, fields: form.fields.map((x) => (x.key === key ? { ...x, options: str(text).split(',').map((o) => o.trim()).filter(Boolean), raw: true } : x)) });

/** Move a template inside its group (the selection shows the groups): from/to are places in that group. */
export function moveInGroup(stored, group, from, to, tr = (s) => s) {
  const s = own(stored, tr);
  const idx = s.list.map((x, i) => (x.group === group ? i : -1)).filter((i) => i >= 0);
  if (from < 0 || from >= idx.length || to < 0 || to >= idx.length) return s;
  const keys = idx.map((i) => s.list[i].key);
  const [k] = keys.splice(from, 1);
  keys.splice(to, 0, k);
  const byKey = Object.fromEntries(s.list.map((x) => [x.key, x]));
  const list = [...s.list];
  idx.forEach((i, j) => (list[i] = byKey[keys[j]]));
  return { ...s, list };
}

/**
 * «Suche als Alleskönner» (Noah 21.10.2026 «1-8 alle»): what a spoken (or typed) sentence does in the app.
 * actionOf() reads one part (say.js rules + the search commands), runActions() writes them all and gives
 * back one Undo for everything. Ideas 1 (say → entry), 7 (several in one sentence), 8 (remind).
 */
import { db } from '../db.js';
import { t, num } from '../i18n.svelte.js';
import { commandActions } from '../search.js';
import { recordCare, undoCare } from '../home/care-tap.js';
import { newNote, guessBike, rideContext } from '../notes.js';
import { QUESTION, answerRow, stampOf } from '../abfragen.js';
import { saveAnswers, deleteAnswer } from '../abdb.js';
import { WEIGHT_KEY as BODY_KEY } from '../review/actdata.js';
import { WEIGHT_KEY as ENTRIES_KEY } from '../weight.js';
import { addTodo } from '../merkendb.js';
import { dayLabel } from '../merken/when.js';
import { valueOf, remindOf, planOf, weatherOf } from './say.js';
import { WRITES } from './logic.js';

/** One part of a sentence → an action, or null. writes: it changes data (and can run together with others). */
export function actionOf(text, { today, bikes = [] } = {}) {
  const v = valueOf(text);
  if (v) return { ...v, writes: true };
  const r = remindOf(text, today);
  if (r) return { ...r, writes: true };
  const p = planOf(text, today);
  if (p) return { ...p, writes: false };
  const w = weatherOf(text);
  if (w) return { ...w, writes: false };
  const cmds = commandActions(text, { bikes });
  if (cmds.length === 1 && WRITES.includes(cmds[0].cmd.kind) && (cmds[0].cmd.kind !== 'note' || String(cmds[0].cmd.text ?? '').trim())) return { kind: 'cmd', cmd: cmds[0].cmd, title: cmds[0].title, writes: true };
  return null;
}

/** The short line for an action («Gewicht 72 kg», «Erinnerung Fr.: Reifen pumpen»). */
export function actionLabel(a, today) {
  if (a.kind === 'value' && a.qid === 'koerper.waage') return t('Weight {v} kg', { v: num(a.value) });
  if (a.kind === 'value' && a.qid === 'koerper.ruhepuls') return t('Resting heart rate {v}', { v: a.value });
  if (a.kind === 'value') return t('Sleep {v} of 10', { v: a.value });
  if (a.kind === 'remind') return t('Reminder {day}: {text}', { day: dayLabel(a.due, today), text: a.text });
  if (a.kind === 'weather') return a.place ? t('Weather in {place}', { place: a.place }) : t('Weather|page');
  if (a.kind === 'plan') return a.title ? t('Plan «{name}»', { name: a.title }) : t('Help me plan');
  if (a.cmd?.kind === 'note') return t('Note saved in the Inbox: «{text}»', { text: String(a.cmd.text).trim() });
  return a.title ?? '';
}

/** Several things in one sentence (7): every part must be something that writes, else null. */
export function actionsOf(text, parts, opts) {
  if (parts.length < 2) return null;
  const acts = parts.map((p) => actionOf(p, opts));
  return acts.every((a) => a?.writes) ? acts : null;
}

const plain = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

async function writeOne(a, { today, bikes = [], trips = [] }) {
  if (a.kind === 'value') {
    const q = QUESTION[a.qid];
    const before = await Promise.all([db.settings.get(BODY_KEY), db.settings.get(ENTRIES_KEY), db.flowChecks.get(today)]).then((x) => x.map(plain));
    const row = answerRow(q, a.value, { at: stampOf() });
    if (!row) return null;
    await saveAnswers([row]);
    return async () => {
      await deleteAnswer(row.id);
      const [body, entries, check] = before;
      await (body ? db.settings.put(body) : db.settings.delete(BODY_KEY));
      await (entries ? db.settings.put(entries) : db.settings.delete(ENTRIES_KEY));
      await (check ? db.flowChecks.put(check) : db.flowChecks.delete(today));
    };
  }
  if (a.kind === 'remind') {
    const r = await addTodo(db, { text: a.text, due: a.due, remind: { at: '08:00' }, src: 'search' });
    return r?.undo ?? null;
  }
  if (a.kind === 'cmd' && a.cmd.kind === 'note') {
    const id = `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const text = String(a.cmd.text).trim();
    const riding = rideContext(trips, today);
    await db.notes.put(newNote({ text, page: 'search', tripId: riding?.tripId ?? null, bikeId: guessBike(text, bikes), day: riding?.day ?? null }, { id }));
    return () => db.notes.delete(id);
  }
  if (a.kind === 'cmd') {
    const r = await recordCare(a.cmd.bikeId, a.cmd.kind, today);
    return r ? () => undoCare(r.undo) : null;
  }
  return null;
}

/** Writes every action; → { lines, undo } (undo takes all of them back, the last first). */
export async function runActions(acts, ctx) {
  const undos = [];
  const lines = [];
  for (const a of acts) {
    const u = await writeOne(a, ctx);
    if (!u) continue;
    undos.push(u);
    lines.push(actionLabel(a, ctx.today));
  }
  return {
    lines,
    undo: async () => {
      for (const u of undos.reverse()) await u();
    },
  };
}

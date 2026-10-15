/**
 * «Timer» (Z1–Z5): the one timer that runs, shared by the tile on Heute (Z1), the timer page (Z2, Z4)
 * and its small floating version (TimerFloat.svelte in App.svelte), so it keeps running when the page
 * changes. It is kept on this device (localStorage) and survives a reload; the time is computed from
 * the start (timer.js), so a locked screen does not make it wrong.
 *
 * At the end (Noah 13.10.2026 «1-5a»): the singing bowl (or the sound chosen on Z3), and the log fills
 * itself: the entry is written at once, a note can be added afterwards (Z4 «Ins Log», «Ohne Notiz»).
 */
import { db } from '../db.js';
import { localDay } from '../localday.js';
import { RUN_KEY, PREFS_KEY, prefsOf, startRun, pauseRun, resumeRun, addMinute, position, dueCue, isOpen, logEntry, END_SOUNDS } from '../timer.js';
import { playSound, vibrate, wakeSounds } from '../flowsounds.js';

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(RUN_KEY) ?? 'null');
    return v && v.setup && Number.isFinite(v.startedAt) ? v : null;
  } catch {
    return null;
  }
};

/** run: the running timer or null; now: the clock (ms); done: the log entry just written (Z4 «Fertig»); big: the full view. */
export const timer = $state({ run: typeof window === 'undefined' ? null : load(), now: Date.now(), done: null, big: false, prefs: prefsOf(null) });

const keep = () => {
  try {
    if (timer.run) localStorage.setItem(RUN_KEY, JSON.stringify(timer.run));
    else localStorage.removeItem(RUN_KEY);
  } catch {
    /* private mode: the timer lives only in this page */
  }
};

/** The prefs (Z3) from the settings; call once from a page that shows the timer. */
export async function loadPrefs() {
  try {
    const rec = await db.settings.get(PREFS_KEY);
    timer.prefs = prefsOf(rec?.value);
  } catch {
    /* no database: the defaults */
  }
  return timer.prefs;
}
/** Save the prefs (merged). */
export async function savePrefs(patch) {
  timer.prefs = prefsOf({ ...timer.prefs, ...patch });
  await db.settings.put({ key: PREFS_KEY, value: $state.snapshot(timer.prefs) });
}

const endSound = () => END_SOUNDS.find((e) => e.id === timer.prefs.end)?.sound ?? 'bowlLow';

let loop = null;
async function step() {
  timer.now = Date.now();
  const run = timer.run;
  if (!run) return stopLoop();
  const { cue, run: next } = dueCue(run, timer.now);
  if (next !== run) {
    timer.run = next;
    keep();
  }
  if (cue === 'seg') {
    const s = endSound();
    if (s === 'vibrate') vibrate();
    else playSound('wood', 0, 0.35);
  }
  if (cue === 'end') await finish();
}
function startLoop() {
  if (loop || typeof window === 'undefined') return;
  loop = setInterval(step, 250);
}
function stopLoop() {
  clearInterval(loop);
  loop = null;
}
if (typeof window !== 'undefined' && timer.run) startLoop();

/** Start a timer (a setup of timer.js); a running one is replaced. */
export function start(setup, label = '') {
  wakeSounds();
  timer.done = null;
  timer.run = startRun(setup, Date.now(), label);
  timer.now = Date.now();
  keep();
  startLoop();
  savePrefs({ last: setup }).catch(() => {});
  return timer.run;
}
export function togglePause() {
  if (!timer.run) return;
  const now = Date.now();
  timer.run = timer.run.pausedAt ? resumeRun(timer.run, now) : pauseRun(timer.run, now);
  timer.now = now;
  keep();
}
export function plusMinute() {
  timer.run = addMinute(timer.run);
  keep();
}
/** Back to the start, not running (Z2 «Zurücksetzen»): nothing is logged. */
export function reset() {
  timer.run = null;
  timer.big = false;
  keep();
  stopLoop();
}

/** The end: sound, write the log, show «Fertig» (Z4). Stopping early (or a «Timer» that counts up) logs what ran. */
export async function finish(early = false) {
  if (!timer.run) return null;
  const run = $state.snapshot(timer.run); // a plain object: IndexedDB cannot keep a state proxy
  const now = Date.now();
  const p = position(run, now);
  timer.run = null;
  keep();
  stopLoop();
  if (!early && !isOpen(run)) {
    const s = endSound();
    if (s === 'vibrate') vibrate();
    else playSound(s, 0, 0.45);
  }
  if ((p?.elapsed ?? 0) < 1) return null;
  const e = logEntry(run, now, localDay(new Date(run.startedAt)));
  try {
    await db.timerLog.put(e);
  } catch {
    /* no database: nothing to keep */
  }
  timer.done = e;
  return e;
}
/** A note on the entry just written (Z4 «Ins Log»), or on any row of the log (Z5). */
export async function setNote(id, note) {
  await db.timerLog.update(id, { note: String(note ?? '').trim().slice(0, 300) });
  if (timer.done?.id === id) timer.done = { ...timer.done, note };
}
export async function removeRow(id) {
  await db.timerLog.delete(id);
}
/** Close «Fertig». */
export const closeDone = () => (timer.done = null);

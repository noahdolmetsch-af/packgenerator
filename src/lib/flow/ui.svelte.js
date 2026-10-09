/**
 * v0.51.0 «Im Flow»: what the flow windows share across pages: the tick sheet (long press), the
 * countdown sheet and its small floating version, the daily check and the «Rückgängig» toast.
 * FlowLayer.svelte (in App.svelte) draws them, so the countdown keeps running when the page changes.
 */
import { db } from '../db.js';
import { lang, t } from '../i18n.svelte.js';
import { localDay } from '../localday.js';
import { tick, removeEntry, putEntry } from '../flowdb.js';
import { lastEntryOn, tapSub } from '../flow.js';
import { TIMER_KEY, timerOf, startTimer, pauseTimer, resumeTimer, dueBowls, isDone, loggedMinutes } from '../flowtimer.js';
import { strike, wakeAudio } from '../flowbowl.js';

export const ui = $state({ tick: null, timerOpen: false, checkOpen: false, toast: null });

/* ---------- names in the current language ---------- */
export const actName = (a) => (a ? (lang.v === 'de' && a.nameDe ? a.nameDe : a.name) || t('Activity') : '');
export const goalName = (q) => (q ? (lang.v === 'de' && q.labelDe ? q.labelDe : q.label) || '' : '');
export const qText = (q, f = 'text') => (q ? (lang.v === 'de' && q[`${f}De`] ? q[`${f}De`] : q[f]) || '' : '');

/* ---------- the toast with «Rückgängig» (8 s) ---------- */
let toastTimer = null;
export function toast(text, undo = null) {
  clearTimeout(toastTimer);
  ui.toast = { text, undo, id: Date.now() };
  toastTimer = setTimeout(() => (ui.toast = null), 8000);
}
export async function runUndo() {
  const u = ui.toast?.undo;
  ui.toast = null;
  clearTimeout(toastTimer);
  if (u) await u();
}

/* ---------- one tap ---------- */
/**
 * A tap on an activity button: ticks it (the amount of the goal, the sub-goal still open); a second
 * tap on the same day takes the last tick of today back. Both with «Rückgängig».
 */
export async function tapAct(state, today = localDay()) {
  const a = state.act;
  if (state.todayDone) {
    const log = await db.flowLog.where('actId').equals(a.id).toArray();
    const last = lastEntryOn(log, a.id, today);
    if (last) {
      await removeEntry(db, last.id);
      toast(t('{name} · taken back', { name: actName(a) }), () => putEntry(db, last));
      return;
    }
  }
  await tickWith(a, { day: today, sub: tapSub(state) });
}
/** Tick with choices (the sheet): amount, place, minutes, a commute. */
export async function tickWith(a, opts) {
  const e = await tick(db, a, { day: localDay(), ...opts });
  const what = opts.via === 'commute' ? t('{name} · commute ticked', { name: actName(a) }) : a.perTap > 1 || e.n > 1 ? t('{name} · {n} ticked', { name: actName(a), n: e.n }) : t('{name} ticked', { name: actName(a) });
  toast(what, () => removeEntry(db, e.id));
  return e;
}

/* ---------- the countdown ---------- */
const load = () => {
  try {
    return timerOf(JSON.parse(localStorage.getItem(TIMER_KEY) ?? 'null'));
  } catch {
    return null;
  }
};
export const clockState = $state({ tm: typeof window === 'undefined' ? null : load(), now: Date.now(), pick: null, sub: null });
const keep = () => {
  try {
    if (clockState.tm) localStorage.setItem(TIMER_KEY, JSON.stringify(clockState.tm));
    else localStorage.removeItem(TIMER_KEY);
  } catch {
    /* private mode: the countdown lives only in this page */
  }
};

let wake = null;
async function holdScreen(on) {
  try {
    if (on && !wake && navigator.wakeLock) {
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener?.('release', () => (wake = null));
    } else if (!on && wake) {
      await wake.release();
      wake = null;
    }
  } catch {
    wake = null; // no wake lock: the time is still right, it is computed from the start
  }
}

let loop = null;
function step() {
  clockState.now = Date.now();
  const tm = clockState.tm;
  if (!tm) return;
  const { play, timer } = dueBowls(tm, clockState.now);
  if (timer !== tm) {
    clockState.tm = timer;
    keep();
  }
  if (play != null) strike({ f0: play === 0 || play === tm.targetSec ? 196 : 262, gain: 0.32 });
  if (isDone(tm, clockState.now) || tm.pausedAt) holdScreen(false);
}
function run() {
  if (loop) return;
  loop = setInterval(step, 250);
  step();
}
if (typeof window !== 'undefined') {
  if (clockState.tm) run();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    step(); // after the screen lock: the time is computed again from the start
    if (clockState.tm && !clockState.tm.pausedAt && !isDone(clockState.tm, Date.now())) holdScreen(true);
  });
}

export function openTimer(actId = null) {
  if (actId && !clockState.tm) clockState.pick = actId;
  ui.timerOpen = true;
}
/** Start (from a tap: the audio may start now). */
export function startClock(actId, minutes, bowl, sub = null) {
  wakeAudio();
  clockState.tm = { ...startTimer({ actId, minutes, bowl, now: Date.now() }), ...(sub ? { sub } : {}) };
  keep();
  holdScreen(true);
  run();
}
export function togglePause() {
  wakeAudio();
  const now = Date.now();
  clockState.tm = clockState.tm?.pausedAt ? resumeTimer(clockState.tm, now) : pauseTimer(clockState.tm, now);
  keep();
  holdScreen(!clockState.tm?.pausedAt);
  step();
}
export function stopClock() {
  clockState.tm = null;
  keep();
  holdScreen(false);
  clearInterval(loop);
  loop = null;
}
/** «Fertig · abhaken»: the activity ticked with the minutes that ran, the countdown ends. */
export async function finishClock(states = []) {
  const tm = clockState.tm;
  if (!tm) return;
  const s = states.find((x) => x.act.id === tm.actId);
  const min = loggedMinutes(tm, Date.now());
  stopClock();
  ui.timerOpen = false;
  if (s) await tickWith(s.act, { min, via: 'timer', sub: tm.sub ?? tapSub(s) });
}

/**
 * v0.51.0 «Im Flow»: what the flow windows share across pages: the tick sheet (long press), the
 * countdown sheet and its small floating version, the daily check and the «Rückgängig» toast.
 * FlowLayer.svelte (in App.svelte) draws them, so the countdown keeps running when the page changes.
 */
import { db } from '../db.js';
import { lang, t } from '../i18n.svelte.js';
import { localDay } from '../localday.js';
import { tick, removeEntry, dayEntries, removeEntries, putEntries } from '../flowdb.js';
import { tapSub } from '../flow.js';
import { TIMER_KEY, timerOf, startTimer, pauseTimer, resumeTimer, dueBowls, isDone, loggedMinutes, elapsedSec } from '../flowtimer.js';
import { strike, wakeAudio } from '../flowbowl.js';
import { strokesOf, soundAt, playSound, vibrate, schedulePlan, cancelPlan, playedByPlan, setVolume, wakeSounds } from '../flowsounds.js';
import { sessionRecords } from '../flowmed.js';
import { saveSession } from '../flowdb.js';

// sessionOpen: hobby pages 2, the running session in full (B7)
export const ui = $state({ tick: null, timerOpen: false, checkOpen: false, toast: null, sessionOpen: false });

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
 * tap on the same day takes today's ticks back. Both with «Rückgängig».
 * Fix 14.10.: the shown state lags a moment behind the database, so a quick second tap ticked a second
 * time; the next tap took only one back and the tile stayed ticked (and «Rückgängig» seemed to do
 * nothing). Now a tap waits for the one before, decides from the saved ticks and takes all of today's back.
 */
const tapping = new Set();
export async function tapAct(state, today = localDay()) {
  const a = state.act;
  if (tapping.has(a.id)) return;
  tapping.add(a.id);
  try {
    const mine = await dayEntries(db, a.id, today);
    if (mine.length) {
      await removeEntries(db, mine);
      toast(t('{name} · taken back', { name: actName(a) }), () => putEntries(db, mine));
      return;
    }
    await tickWith(a, { day: today, sub: tapSub(state) });
  } finally {
    tapping.delete(a.id);
  }
}
/** Fix 14.10.: the commute on Today can be taken back too (never only one way), with «Rückgängig». */
export async function untickCommute(a, today = localDay()) {
  const mine = await dayEntries(db, a.id, today, (e) => e.via === 'commute');
  if (!mine.length) return;
  await removeEntries(db, mine);
  toast(t('{name} · taken back', { name: actName(a) }), () => putEntries(db, mine));
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
/** Whether the screen is held on (B7 «Bildschirm bleibt an»). */
export const screen = $state({ held: false });
async function holdScreen(on) {
  try {
    if (on && !wake && navigator.wakeLock) {
      wake = await navigator.wakeLock.request('screen');
      screen.held = true;
      wake.addEventListener?.('release', () => ((wake = null), (screen.held = false)));
    } else if (!on && wake) {
      await wake.release();
      wake = null;
      screen.held = false;
    }
  } catch {
    wake = null; // no wake lock: the time is still right, it is computed from the start
    screen.held = false;
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
  if (play != null && tm.session) {
    // a session (B7): the stroke was planned on the audio clock; play it now only when the clock missed it
    const sound = soundAt(tm, play);
    if (sound === 'vibrate') vibrate();
    else if (!playedByPlan(play)) playSound(sound, 0, play === tm.targetSec ? 0.45 : 0.38);
  } else if (play != null) strike({ f0: play === 0 || play === tm.targetSec ? 196 : 262, gain: 0.32 });
  if (isDone(tm, clockState.now) || tm.pausedAt) holdScreen(false);
  if (tm.session && !tm.saved && isDone(tm, clockState.now)) saveDone();
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
    if (clockState.tm && !clockState.tm.pausedAt && !isDone(clockState.tm, Date.now())) {
      holdScreen(true);
      if (clockState.tm.session) planAhead(); // the audio clock may have slept: plan the rest again
    }
  });
}

export function openTimer(actId = null) {
  if (actId && !clockState.tm) clockState.pick = actId;
  ui.timerOpen = true;
}
/** Start (from a tap: the audio may start now). */
export function startClock(actId, minutes, bowl, sub = null, extra = null) {
  wakeAudio();
  clockState.tm = { ...startTimer({ actId, minutes, bowl, now: Date.now() }), ...(sub ? { sub } : {}), ...(extra ?? {}) };
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
  if (clockState.tm?.session) {
    if (clockState.tm.pausedAt) cancelPlan();
    else planAhead();
  }
  step();
}
export function stopClock() {
  clockState.tm = null;
  keep();
  holdScreen(false);
  cancelPlan();
  ui.sessionOpen = false;
  clearInterval(loop);
  loop = null;
}
/** «Fertig · abhaken»: the activity ticked with the minutes that ran, the countdown ends. */
export async function finishClock(states = []) {
  const tm = clockState.tm;
  if (!tm) return;
  if (tm.session) return endSession();
  const s = states.find((x) => x.act.id === tm.actId);
  const min = loggedMinutes(tm, Date.now());
  stopClock();
  ui.timerOpen = false;
  if (s) await tickWith(s.act, { min, via: 'timer', sub: tm.sub ?? tapSub(s) });
}

/* ---------- hobby pages 2 «Kissenzeit»: a meditation session (B7) ---------- */
/** Plan every coming stroke on the audio clock (start, «Weiter», back from the lock screen). */
function planAhead() {
  const tm = clockState.tm;
  if (!tm?.session || tm.pausedAt) return;
  const el = elapsedSec(tm, Date.now());
  schedulePlan(strokesOf(tm, el), el);
}
/**
 * Start a session (from a tap: the audio may start now). plan: flowmed.js sessionPlan. The full view
 * (B7) opens; on a phone the navigation steps back (H26a).
 */
export function startSession(actId, plan) {
  wakeSounds();
  setVolume(plan.extra.vol ?? 0.8);
  startClock(actId, plan.minutes, plan.bowl, null, { ...plan.extra, vol: plan.extra.vol ?? 0.8 });
  planAhead();
  ui.timerOpen = false;
  ui.sessionOpen = true;
}
/** The volume of the gong (B7): 0…1, also for the strokes already planned. */
export function sessionVolume(v) {
  if (!clockState.tm) return;
  clockState.tm = { ...clockState.tm, vol: Math.max(0, Math.min(1, v)) };
  setVolume(clockState.tm.vol);
  keep();
}
let saving = false;
/** The session's time is up: save it once (the same rows when saved twice), tell the locked phone. */
async function saveDone() {
  const tm = clockState.tm;
  if (!tm || saving) return;
  saving = true;
  try {
    const rec = sessionRecords(tm, tm.targetSec, Date.now(), (ms) => localDay(new Date(ms)));
    if (rec) await saveSession(db, rec);
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') notifyEnd(rec?.entry.min ?? 0);
    if (clockState.tm && clockState.tm.startedAt === tm.startedAt) {
      if (rec) {
        // hobby pages 3 (H11a): after the gong the evaluation opens (B3); the end gong rings out
        leaveSession();
        openDone(tm.actId, rec.entry.id);
      } else {
        clockState.tm = { ...clockState.tm, saved: 'none', savedMin: 0 };
        keep();
      }
    }
  } finally {
    saving = false;
  }
}
/**
 * «Beenden»: save what ran (from one minute on) and close. When the time was up the session is saved
 * already. Returns the minutes saved (0: under a minute, nothing saved).
 */
export async function endSession() {
  const tm = clockState.tm;
  if (!tm) return 0;
  let min = tm.savedMin ?? 0;
  let id = tm.saved && tm.saved !== 'none' ? tm.saved : null;
  if (!tm.saved) {
    const rec = sessionRecords(tm, elapsedSec(tm, Date.now()), Date.now(), (ms) => localDay(new Date(ms)));
    if (rec) await saveSession(db, rec);
    min = rec?.entry.min ?? 0;
    id = rec?.entry.id ?? null;
  }
  stopClock();
  ui.timerOpen = false;
  // hobby pages 3 (H11a): a saved session opens its evaluation (B3); under a minute only a short line
  if (min && id) openDone(tm.actId, id);
  else toast(t('Under a minute: not saved'));
  return min;
}
/** The address of a session's evaluation after the gong (B3). */
export const doneHref = (actId, id) => `#/flow/act/${encodeURIComponent(actId)}/done/${encodeURIComponent(id)}`;
function openDone(actId, id) {
  if (typeof location !== 'undefined') location.hash = doneHref(actId, id);
}
/** The session is over and saved: close the full view, but let the end gong ring out (no cancelPlan). */
function leaveSession() {
  clockState.tm = null;
  keep();
  holdScreen(false);
  ui.sessionOpen = false;
  ui.timerOpen = false;
  clearInterval(loop);
  loop = null;
}

/* the end gong as a notification when the phone was locked (H27a): only where the browser can and allowed it */
export const NOTIFY_KEY = 'flow.notifyEnd';
export const notifyState = () => (typeof Notification === 'undefined' ? 'none' : Notification.permission);
export function notifyWanted() {
  try {
    return localStorage.getItem(NOTIFY_KEY) === '1';
  } catch {
    return false;
  }
}
/** Ask once (from a tap); keeps the wish on this device. Returns the permission. */
export async function askNotify(on) {
  try {
    localStorage.setItem(NOTIFY_KEY, on ? '1' : '0');
  } catch {
    /* private mode */
  }
  if (!on || typeof Notification === 'undefined') return notifyState();
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      /* an older browser */
    }
  }
  return notifyState();
}
function notifyEnd(min) {
  if (notifyState() !== 'granted' || !notifyWanted()) return;
  const title = t('Meditation ended');
  const body = min ? t('Meditation saved · {n} min', { n: min }) : t('Time is up ✓');
  try {
    const sw = navigator.serviceWorker;
    if (sw?.controller) sw.ready.then((r) => r.showNotification(title, { body, tag: 'flow-end', silent: false }));
    else new Notification(title, { body, tag: 'flow-end' });
  } catch {
    /* no notification: the gong sounds when the page wakes up */
  }
}

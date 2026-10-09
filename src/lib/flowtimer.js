/**
 * v0.51.0 «Im Flow»: the countdown (Noah 7: a countdown to the target time, then it ends). Pure
 * time arithmetic from timestamps, so the time stays right when the screen was locked and the
 * browser slept: the remaining time is always computed from the start, never counted in steps.
 *
 * A running timer: { actId, targetSec, startedAt (ms), pausedAt (ms|null), pausedMs, bowls: [sec],
 *                    played: [sec], seed }
 */
import { bowlTimes } from './flowbowl.js';

export const TIMER_KEY = 'flow.timer';
/** Offered target times (minutes). */
export const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

export function startTimer({ actId, minutes = 10, bowl, now = Date.now(), seed = now }) {
  const targetSec = Math.max(1, Math.round(Number(minutes) * 60));
  return { actId, targetSec, startedAt: now, pausedAt: null, pausedMs: 0, bowls: bowlTimes(targetSec, bowl, seed), played: [], seed };
}

/** Seconds run (pauses left out), never more than the target. */
export function elapsedSec(tm, now = Date.now()) {
  if (!tm) return 0;
  const ms = (tm.pausedAt ?? now) - tm.startedAt - (tm.pausedMs || 0);
  return Math.max(0, Math.min(tm.targetSec, ms / 1000));
}
export const remainingSec = (tm, now = Date.now()) => (tm ? Math.max(0, tm.targetSec - elapsedSec(tm, now)) : 0);
export const isDone = (tm, now = Date.now()) => !!tm && elapsedSec(tm, now) >= tm.targetSec;
export const isPaused = (tm) => !!tm?.pausedAt;

export const pauseTimer = (tm, now = Date.now()) => (tm && !tm.pausedAt && !isDone(tm, now) ? { ...tm, pausedAt: now } : tm);
export const resumeTimer = (tm, now = Date.now()) => (tm?.pausedAt ? { ...tm, pausedMs: (tm.pausedMs || 0) + (now - tm.pausedAt), pausedAt: null } : tm);

/**
 * The bowls due now: { play: the one bowl to sound now or null, timer: with every passed bowl marked }.
 * A bowl that passed more than `late` seconds ago (the screen was locked) is skipped quietly; the end
 * bowl still sounds when the countdown ended while the page slept, so the end is never silent.
 */
export function dueBowls(tm, now = Date.now(), late = 5) {
  if (!tm) return { play: null, timer: tm };
  const el = elapsedSec(tm, now);
  const passed = tm.bowls.filter((s) => s <= el + 0.05 && !tm.played.includes(s));
  if (!passed.length) return { play: null, timer: tm };
  const last = passed.at(-1);
  const play = el - last <= late || last === tm.targetSec ? last : null;
  return { play, timer: { ...tm, played: [...tm.played, ...passed] } };
}

/** 8:42, 1:05:00 */
export function clock(sec) {
  const s = Math.max(0, Math.ceil(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

/** Minutes to log when the timer is ticked off: what ran, at least 1. */
export const loggedMinutes = (tm, now = Date.now()) => Math.max(1, Math.round(elapsedSec(tm, now) / 60));

/** A stored timer made safe (a broken record gives null). */
export function timerOf(v) {
  if (!v || typeof v !== 'object' || !v.actId || !(v.targetSec > 0) || !Number.isFinite(v.startedAt)) return null;
  return { ...v, pausedAt: Number.isFinite(v.pausedAt) ? v.pausedAt : null, pausedMs: Number(v.pausedMs) || 0, bowls: Array.isArray(v.bowls) ? v.bowls : [], played: Array.isArray(v.played) ? v.played : [] };
}

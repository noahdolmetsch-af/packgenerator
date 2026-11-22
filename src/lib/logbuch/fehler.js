/**
 * «Verbesserungs-Logbuch» L1b (Noah 21.11.2026 «a»): the errors the app noted quietly (src/lib/fehler/felog.js, only on this device, in
 * localStorage) become entries of the kind «Error» in the log. The same error on the same page counts up instead of making a new entry;
 * at most 50 such entries stay. Nothing is sent. Called when the log opens and when the button «Verbessern» loads.
 */
import { takeErrors } from '../fehler/felog.js';
import { addAutoError } from './logbuchdb.js';
import { deviceOf } from './logbuch.js';
import { db } from '../db.js';

/** Move the noted errors into the log. Returns how many were taken. A failure puts nothing at risk: the errors go back. */
export async function takeIntoLog(database = db, taker = takeErrors, width = globalThis.innerWidth ?? 390) {
  const got = taker();
  let done = 0;
  try {
    for (const e of got) {
      await addAutoError({ message: e.message, page: e.page, device: deviceOf(width), width, now: new Date(e.at) }, database);
      done++;
    }
  } catch {
    // the database is what broke: keep the rest where it was, so it is tried again later
    try {
      const store = globalThis.localStorage;
      const rest = got.slice(done);
      const old = JSON.parse(store.getItem('pg.errors') || '[]');
      store.setItem('pg.errors', JSON.stringify([...rest, ...old].slice(-30)));
    } catch {
      /* private mode: the notes are lost, the app goes on */
    }
  }
  return done;
}

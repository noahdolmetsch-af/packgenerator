// «Heute lädt nicht» (Noah 19.10.2026): after an update, the new version may have to widen the database
// (a new Dexie version). The browser waits with that until every other tab or window of the app lets go.
// A tab the browser has frozen (energy saving, many tabs) or an old installed-app window may never let go:
// then every read waits and the pages stay grey for ever. This watcher notices it, so the app can say what
// to do instead of showing grey bars. Once the other window closes, the database opens and all fills in.
// The other side: an old tab that is awake gives way by itself (Dexie closes its database on «versionchange»)
// and says that a newer version is open, with «Reload».

/** After this long without an open database, the app says it is waiting (ms). */
export const DB_WAIT_MS = 6000;

/**
 * Watches the opening of `db`. Calls `onchange({ blocked, slow })`: `blocked` when the browser reports that
 * another connection holds an older version, `slow` when the database is not open after `waitMs`.
 * Both go back to false once it is open. `newer` when another tab opened a newer version: Dexie then closes
 * the database here (its default), so the other tab is never held up, and this tab should reload.
 * Returns a stop function.
 */
export function watchDbOpen(db, onchange, { waitMs = DB_WAIT_MS, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let state = { blocked: false, slow: false, newer: false };
  let done = false;
  const set = (next) => {
    if (done) return;
    state = { ...state, ...next };
    onchange(state);
  };
  const onBlocked = () => set({ blocked: true });
  db.on('blocked', onBlocked);
  const onNewer = (ev) => {
    if (ev?.newVersion) set({ newer: true }); // null: the database is being deleted (reset, import), not newer
  };
  db.on('versionchange', onNewer);
  const timer = setTimer(() => {
    if (!db.isOpen()) set({ slow: true });
  }, waitMs);
  const opened = () => {
    clearTimer(timer);
    if (state.blocked || state.slow) set({ blocked: false, slow: false });
  };
  Promise.resolve(db.isOpen() ? null : db.open()).then(opened, opened);
  return () => {
    done = true;
    clearTimer(timer);
    db.on('blocked').unsubscribe(onBlocked);
    db.on('versionchange').unsubscribe(onNewer);
  };
}

// Design-Refresh P8 «Aktiv»: fictional flow data for the Aktiv pages (a meditation history with notes,
// yoga, push-ups and bike ticks over 13 weeks), written straight into the app's IndexedDB. The clock
// stands on Friday 9 October 2026, 09:00 in Europe/Zurich. Fictional data only.
export const TODAY = '2026-10-09';
export const D0 = `${TODAY}T09:00:00+02:00`;

/** Calendar-day arithmetic on YYYY-MM-DD (never «now + n × 24 h»). */
export const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The rows: 13 weeks of meditation (most days, a few gaps), sessions with depth and what helped. */
export function aktivRows() {
  const flowLog = [];
  const flowSessions = [];
  const arts = ['omahhung', 'bodyscan', 'count'];
  for (let i = 90; i >= 0; i--) {
    const day = addDays(TODAY, -i);
    if (i % 9 === 4 || i % 13 === 7) continue; // a few days without
    const evening = i % 5 === 0;
    const hh = evening ? '21' : '07';
    const min = [20, 15, 30, 20, 10, 45][i % 6];
    const id = `test_med_${day}`;
    const at = `${day}T${hh}:05:00+02:00`;
    flowLog.push({ id, actId: 'meditation', day, at, min });
    if (i % 2 === 0) {
      flowSessions.push({
        id, actId: 'meditation', day, at, min, marks: [], art: arts[i % 3],
        depth: evening ? 3 : 4 + (i % 4 === 0 ? 1 : 0),
        helped: i % 4 === 0 ? ['early'] : i % 6 === 0 ? ['candle'] : [],
        note: i === 2 ? 'Fictional: calm after the second gong' : '',
      });
    }
    if (i % 3 === 0) flowLog.push({ id: `test_yoga_${day}`, actId: 'yoga', day, at: `${day}T18:00:00+02:00`, min: 45, sub: 'studio' });
    if (i % 2 === 1) flowLog.push({ id: `test_push_${day}`, actId: 'pushups', day, at: `${day}T08:00:00+02:00`, n: 20 });
    if (i % 4 === 1) flowLog.push({ id: `test_bike_${day}`, actId: 'bike', day, at: `${day}T17:30:00+02:00`, via: 'commute', n: 1 });
  }
  return { flowLog, flowSessions };
}

/** Write rows straight into the app's IndexedDB (reload afterwards, so the app reads them). */
export const put = (page, rows) =>
  page.evaluate(async (rows) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, rows);

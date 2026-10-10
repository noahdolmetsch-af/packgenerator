// v0.67.0 «KI-Helfer»: the fictional v048 data set (all names start with test_data_gtp_; receipts,
// workshop costs and shop names included on purpose, so the privacy check can see they never leave)
// plus a finished trip three days ago with two notes on the way, for the Rückblick draft.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { v048Data, P, SPARK, SCALE, GRAVEL, GOAT, RECEIPT, day } from './v048-fixture.js';

export { P, SPARK, SCALE, GRAVEL, GOAT, RECEIPT, day };
export const JURA = `${P}kh-jura`;
export const EVENT = `${P}event`;
export const CODE = 'test-helfer-code-not-real-0000';

export function v0670Data() {
  const fix = v048Data();
  const T = fix.tables;
  const spark = T.bikes.find((b) => b.id === SPARK);
  T.trips.push({
    id: JURA, domain: 'bikepacking', title: `${P} Jura-Biwak`, startDate: day(-4), days: 2, bikeId: SPARK, bike: spark.name, setup: {}, overnight: 'outdoor', cook: true, wx: { min: 4, max: 12, rain: 'rain' },
    entries: [`${P}KL05`, `${P}SL02`, `${P}SL03`, `${P}CO01`].map((itemId) => ({ itemId, slot: 'seat', qty: 1, packed: true })),
    ready: [], status: 'done', finished: day(-3), createdAt: `${day(-10)}T08:00:00.000Z`,
  });
  T.notes.push(
    { id: `${P}w1`, text: `${P} Finger kalt beim Kochen am Abend`, status: 'open', at: `${day(-4)}T19:40:00.000Z`, tripId: JURA, day: 0, page: 'ride' },
    { id: `${P}w2`, text: `${P} Matte zu dünn, nachts kalt`, status: 'open', at: `${day(-3)}T06:10:00.000Z`, tripId: JURA, day: 1, page: 'ride', photo: RECEIPT },
  );
  return fix;
}

export function v0670File(info) {
  // An ASCII path: the titles of these tests hold «» and umlauts, which the file chooser trips over.
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = join(info.project.outputDir, `v0670-fixture-${info.testId}-${info.project.name}.json`);
  writeFileSync(path, JSON.stringify(v0670Data()));
  return path;
}

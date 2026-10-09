// v0.62.0 «Velo-Masse»: the fictional v048 data set (all names start with test_data_gtp_) plus fit
// values: the Spark with saddle height, target pressures, bar width and a measured pressure; the
// Scale with an old geometry.seatHeight (moved to fit on import); a planned ride on the Spark today.
import { writeFileSync } from 'node:fs';
import { v048Data, P, SPARK, SCALE, GRAVEL, GOAT, day } from './v048-fixture.js';

export { P, SPARK, SCALE, GRAVEL, GOAT, day };

export function v0620Data() {
  const fix = v048Data();
  const T = fix.tables;
  const spark = T.bikes.find((b) => b.id === SPARK);
  spark.fit = { seatHeight: 742, pressureF: 1.5, pressureR: 1.6, barWidth: 760, frameSize: 'M', stemLength: 50, forkPressure: 85, shockSag: 28 };
  const tyres = spark.parts.find((p) => p.key === 'tyres');
  tyres.history = [...tyres.history, { date: day(-5), km: 4980, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', pressureF: 1.4, pressureR: 1.55 }];
  const scale = T.bikes.find((b) => b.id === SCALE);
  scale.geometry = { ...(scale.geometry ?? {}), seatHeight: 735 };
  T.trips.push({
    id: `${P}masse-ride`, domain: 'bikepacking', title: `${P} Feierabendrunde`, startDate: day(0), days: 1, bikeId: SPARK, bike: spark.name, setup: {}, entries: [],
    ready: [{ id: 'bottle', label: 'Bottle filled', done: false }, { id: 'tyres', label: 'Tyre pressure checked', done: false }], status: 'planned', createdAt: `${day(-1)}T08:00:00.000Z`,
  });
  return fix;
}

export function v0620File(info) {
  const path = info.outputPath('v0620-fixture.json');
  writeFileSync(path, JSON.stringify(v0620Data()));
  return path;
}

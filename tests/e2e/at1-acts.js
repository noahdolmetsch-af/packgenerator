// AT1 «Abgeschlossene Touren aus Strava»: fictional Strava activities as the store keeps them (training.js
// actRecord, plus the detail fields hist and w20), for the specs that show Touren. day(n): the calendar day
// n days from the test's today (YYYY-MM-DD, Europe/Zurich).
import { actRecord } from '../../src/lib/training.js';

const act = (id, date, o) => ({
  ...actRecord({ id, startLocal: `${date}T${o.time ?? '08:00'}:00`, km: 40, hm: 500, movingS: 7200, elapsedS: 8000, hrAvg: 130, hrMax: 165, cad: 85, spdAvg: 20, spdMax: 50, ...o }),
  ...(o.hist ? { hist: o.hist } : {}),
  ...(o.w20 ? { w20: o.w20 } : {}),
});

/** Seven activities: rides with and without a power meter, a commute, a run, a hike and yoga. */
export function at1Acts(day, P = 'test_at1_') {
  return [
    act(`${P}1`, day(-2), { name: `${P} Abendrunde mit Wattmesser`, type: 'Ride', km: 62.4, hm: 820, movingS: 9000, elapsedS: 9900, hrAvg: 138, hrMax: 172, cad: 88, spdAvg: 25, spdMax: 61.2, wAvg: 182, wMax: 640, wDevice: true, wNorm: 205, w20: 236, hist: { 100: 900, 125: 3600, 145: 2700, 160: 1200, 178: 600 } }),
    act(`${P}2`, day(-3), { name: `${P} Arbeitsweg`, type: 'Ride', time: '07:10', km: 9.8, hm: 60, movingS: 1800, elapsedS: 2100, hrAvg: 118, hrMax: 141, commute: true }),
    act(`${P}3`, day(-5), { name: `${P} Lauf am See`, type: 'Run', km: 10.2, hm: 90, movingS: 3300, elapsedS: 3400, hrAvg: 151, hrMax: 176, cad: 84, spdAvg: 11.1, spdMax: 15.8 }),
    act(`${P}4`, day(-9), { name: `${P} Wanderung Grat`, type: 'Hike', km: 14.5, hm: 1100, movingS: 18000, elapsedS: 21600, hrAvg: 112, hrMax: 150, spdAvg: 2.9, spdMax: 6.5 }),
    act(`${P}5`, day(-12), { name: `${P} Yoga`, type: 'Yoga', km: 0, hm: null, movingS: 3600, elapsedS: 3600, hrAvg: 92, hrMax: 120, cad: null, spdAvg: null, spdMax: null }),
    act(`${P}6`, day(-20), { name: `${P} Gravel-Runde`, type: 'GravelRide', km: 71, hm: 950, movingS: 12600, elapsedS: 14400, hrAvg: 132, hrMax: 168, wAvg: 150 }),
    act(`${P}7`, day(-400), { name: `${P} Alte Fahrt`, type: 'Ride', km: 30, hm: 300 }),
  ];
}

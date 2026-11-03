// «Alle Werte» (Noah 27.10.2026): the further Google Health values → day rows. Fictional values only.
import { describe, it, expect } from 'vitest';
import { daysFrom, hourBody, minutesOf, localHour, exerciseOf, rollUpBody, listFilter } from '../api/_lib/googledays.js';

const d = (day, month = 10) => ({ year: 2026, month, day });
const at = (day) => ({ civilStartTime: { date: d(day) } });

describe('googledays: alle Werte', () => {
  it('reads VO2max, distance, floors, climb, weight, body fat and the pulse of the day', () => {
    const rows = daysFrom(
      {
        vo2: [{ dailyVo2Max: { date: d(3), vo2Max: 55.94, cardioFitnessLevel: 'EXCELLENT' } }, { dailyVo2Max: { date: d(4), vo2Max: 150 } }],
        dist: [{ ...at(3), distance: { millimetersSum: '7523000' } }],
        floors: [{ ...at(3), floors: { countSum: '12' } }],
        alt: [{ ...at(3), altitude: { gainMillimetersSum: '36400' } }],
        kg: [{ ...at(3), weight: { weightGramsAvg: 66250 } }],
        fat: [{ ...at(3), bodyFat: { bodyFatPercentageAvg: 14.26 } }],
        hr: [{ ...at(3), heartRate: { beatsPerMinuteMax: 151, beatsPerMinuteMin: 44.2, beatsPerMinuteAvg: 66.7 } }],
      },
      '2026-10-01',
      '2026-10-05',
    );
    expect(rows).toEqual([{ date: '2026-10-03', vo2max: 55.9, vo2level: 'EXCELLENT', distKm: 7.52, floors: 12, climbM: 36, fitKg: 66.3, bodyFat: 14.3, hrMax: 151, hrMin: 44, hrAvg: 67 }]);
  });

  it('keeps minutes per activity level and per pulse zone', () => {
    const rows = daysFrom(
      {
        levels: [{ ...at(2), activityLevel: { activityLevelRollupsByActivityLevelType: [{ activityLevelType: 'SEDENTARY', totalDuration: '36000s' }, { activityLevelType: 'VERY_ACTIVE', totalDuration: '1800s' }] } }],
        zones: [{ ...at(2), timeInHeartRateZone: { timeInHeartRateZones: [{ heartRateZone: 'LIGHT', duration: '3600s' }, { heartRateZone: 'PEAK', duration: '120s' }] } }],
      },
      '2026-10-01',
      '2026-10-05',
    );
    expect(rows[0].levels).toEqual({ sed: 600, very: 30 });
    expect(rows[0].hrZones).toEqual({ light: 60, peak: 2 });
  });

  it('keeps the Fitbit workouts of a day, by start', () => {
    const ex = (h, name, extra = {}) => ({
      exercise: {
        exerciseType: 'WALKING',
        displayName: name,
        interval: { civilStartTime: { date: d(4), time: { hours: h, minutes: 5 } }, civilEndTime: { date: d(4), time: { hours: h, minutes: 50 } } },
        activeDuration: '2700s',
        metricsSummary: { caloriesKcal: 210.4, distanceMillimeters: 3456000, averageHeartRateBeatsPerMinute: '101', ...extra },
      },
    });
    const rows = daysFrom({ exercise: [ex(18, 'Gehen am Abend'), ex(7, 'Gehen')] }, '2026-10-01', '2026-10-05');
    expect(rows[0].exercises.map((e) => e.start)).toEqual(['07:05', '18:05']);
    expect(rows[0].exercises[0]).toEqual({ type: 'WALKING', name: 'Gehen', start: '07:05', end: '07:50', min: 45, kcal: 210, km: 3.46, hr: 101 });
    expect(exerciseOf({})).toBeNull();
  });

  it('puts the hourly steps and pulse on the local hour', () => {
    // 05:00Z is 06:00 in Zurich in October (summer time until 25 Oct), 07:00 after
    const rows = daysFrom(
      {
        stepHours: [{ startTime: '2026-10-20T05:00:00Z', steps: { countSum: '812' } }, { startTime: '2026-10-19T22:00:00Z', steps: { countSum: '3' } }],
        hrHours: [{ startTime: '2026-10-27T06:00:00Z', heartRate: { beatsPerMinuteAvg: 72.4 } }],
      },
      '2026-10-20',
      '2026-10-27',
    );
    const day20 = rows.find((r) => r.date === '2026-10-20');
    expect(day20.stepH[7]).toBe(812);
    expect(day20.stepH[0]).toBe(3);
    expect(day20.stepH).toHaveLength(24);
    expect(rows.find((r) => r.date === '2026-10-27').hrH[7]).toBe(72);
    expect(localHour('nonsense')).toBeNull();
  });

  it('builds the requests', () => {
    expect(hourBody('2026-10-20', '2026-10-21')).toMatchObject({ range: { startTime: '2026-10-19T22:00:00Z', endTime: '2026-10-22T00:00:00Z' }, windowSize: '3600s' });
    expect(rollUpBody('2026-10-01', '2026-10-02', { all: true }).dataSourceFamily).toBeUndefined();
    expect(rollUpBody('2026-10-01', '2026-10-02').dataSourceFamily).toContain('google-wearables');
    expect(listFilter('exercise', '2026-10-01', '2026-10-01')).toBe('exercise.interval.civil_start_time >= "2026-10-01T00:00:00" AND exercise.interval.civil_start_time < "2026-10-02T00:00:00"');
    expect(minutesOf('5400s')).toBe(90);
    expect(minutesOf(undefined)).toBeNull();
  });
});

/** A tiny, fictional Apple Health export.xml (two days, iPhone + Watch), for tests/applehealth.test.js and the e2e spec. */
const rec = (type, start, end, value, { unit = '', src = 'Testuhr' } = {}) =>
  ` <Record type="${type}" sourceName="${src}" unit="${unit}" creationDate="${end}" startDate="${start}" endDate="${end}" value="${value}"/>`;
const HK = 'HKQuantityTypeIdentifier';
const S = 'HKCategoryTypeIdentifierSleepAnalysis';
export function appleXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<HealthData locale="de_CH">',
    rec(`${HK}RestingHeartRate`, '2026-06-14 07:00:00 +0200', '2026-06-14 07:00:00 +0200', '52', { unit: 'count/min' }),
    rec(`${HK}RestingHeartRate`, '2026-06-14 19:00:00 +0200', '2026-06-14 19:00:00 +0200', '54', { unit: 'count/min' }),
    rec(`${HK}HeartRateVariabilitySDNN`, '2026-06-14 03:00:00 +0200', '2026-06-14 03:01:00 +0200', '48.6', { unit: 'ms' }),
    rec(`${HK}StepCount`, '2026-06-14 08:00:00 +0200', '2026-06-14 09:00:00 +0200', '4000', { unit: 'count', src: 'Testphone' }),
    rec(`${HK}StepCount`, '2026-06-14 08:00:00 +0200', '2026-06-14 09:00:00 +0200', '4200', { unit: 'count' }),
    rec(`${HK}StepCount`, '2026-06-14 17:00:00 +0200', '2026-06-14 18:00:00 +0200', '3000', { unit: 'count' }),
    rec(`${HK}ActiveEnergyBurned`, '2026-06-14 08:00:00 +0200', '2026-06-14 09:00:00 +0200', '1046', { unit: 'kJ' }),
    rec(`${HK}VO2Max`, '2026-06-14 10:00:00 +0200', '2026-06-14 10:00:00 +0200', '47.3', { unit: 'mL/min·kg' }),
    rec(`${HK}BodyMass`, '2026-06-15 07:10:00 +0200', '2026-06-15 07:10:00 +0200', '72.4', { unit: 'kg' }),
    ` <Record type="${S}" sourceName="Testuhr" startDate="2026-06-14 23:10:00 +0200" endDate="2026-06-15 02:10:00 +0200" value="HKCategoryValueSleepAnalysisAsleepCore">`,
    '  <MetadataEntry key="HKTimeZone" value="Europe/Zurich"/>',
    ' </Record>',
    rec(S, '2026-06-15 02:10:00 +0200', '2026-06-15 03:40:00 +0200', 'HKCategoryValueSleepAnalysisAsleepDeep'),
    rec(S, '2026-06-15 03:40:00 +0200', '2026-06-15 03:55:00 +0200', 'HKCategoryValueSleepAnalysisAwake'),
    rec(S, '2026-06-15 03:55:00 +0200', '2026-06-15 06:25:00 +0200', 'HKCategoryValueSleepAnalysisAsleepREM'),
    rec(S, '2026-06-15 15:00:00 +0200', '2026-06-15 15:40:00 +0200', 'HKCategoryValueSleepAnalysisAsleepCore'),
    rec(S, '2026-06-14 23:00:00 +0200', '2026-06-15 06:40:00 +0200', 'HKCategoryValueSleepAnalysisInBed', { src: 'Testphone' }),
    ' <Workout workoutActivityType="HKWorkoutActivityTypeTennis" duration="60" durationUnit="min" sourceName="Testuhr" startDate="2026-06-15 18:00:00 +0200" endDate="2026-06-15 19:00:00 +0200">',
    ' </Workout>',
    '</HealthData>',
    '',
  ].join('\n');
}

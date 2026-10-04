import { describe, it, expect } from 'vitest';
import { parseRideFile, parseActivitiesCsv, ridesOnTrip, toIsoDate } from '../src/lib/activities.js';

const trip = { startDate: '2026-10-15', days: 3 };

describe('ride import from Strava and Garmin files (answer 6)', () => {
  it('reads the Strava activities.csv', () => {
    const csv = [
      'Activity ID,Activity Date,Activity Name,Activity Type,Activity Description,Elapsed Time,Distance,Max Heart Rate,Distance',
      '1,"Oct 15, 2026, 7:12:33 AM",303 day 1,Ride,,30000,"112.40",160,112400.0',
      '2,"Oct 16, 2026, 8:00:00 AM",Evening run,Run,,3000,"8.10",170,8100.0',
      '3,"Oct 17, 2026, 7:00:00 AM",303 day 3,Gravel Ride,,28000,"95.75",150,95750.0',
      '4,"Oct 18, 2026, 7:00:00 AM",Home,Ride,,2000,"12.00",120,12000.0',
    ].join('\n');
    const acts = parseActivitiesCsv(csv);
    expect(acts[0]).toEqual({ date: '2026-10-15', km: 112.4, name: '303 day 1', type: 'Ride' });
    expect(ridesOnTrip(acts, trip)).toMatchObject({ km: 208 });
    expect(ridesOnTrip(acts, trip).rides).toHaveLength(2);
  });
  it('reads the Garmin Connect CSV with thousands', () => {
    const csv = 'Activity Type,Date,Favorite,Title,Distance,Calories\nCycling,2026-10-15 07:12:33,false,Jura,"1,012.5",900\nGravel Cycling,2026-10-16 07:00:00,false,Jura 2,88.2,800\n';
    expect(ridesOnTrip(parseActivitiesCsv(csv), trip).km).toBe(1101);
    expect(() => parseActivitiesCsv('a,b\n1,2')).toThrow(/column not found/);
  });
  it('reads one ride as GPX or TCX', () => {
    const gpx = '<gpx><metadata><time>2026-10-15T07:00:00Z</time></metadata><trk><trkseg><trkpt lat="47" lon="7"><ele>400</ele></trkpt><trkpt lat="47.1" lon="7"><ele>420</ele></trkpt></trkseg></trk></gpx>';
    expect(parseRideFile(gpx, 'day1.gpx')).toMatchObject({ date: '2026-10-15', km: 11.1, gainM: 20, name: 'day1' });
    const tcx = '<TrainingCenterDatabase><Activities><Activity Sport="Biking"><Id>2026-10-16T07:00:00Z</Id><Lap><DistanceMeters>40000</DistanceMeters></Lap><Lap><DistanceMeters>25500</DistanceMeters></Lap></Activity></Activities></TrainingCenterDatabase>';
    expect(parseRideFile(tcx, 'day2.tcx')).toMatchObject({ date: '2026-10-16', km: 65.5 });
  });
  it('understands the usual date formats', () => {
    expect(toIsoDate('Oct 5, 2026, 7:12:33 AM')).toBe('2026-10-05');
    expect(toIsoDate('2026-10-05 07:12')).toBe('2026-10-05');
    expect(toIsoDate('5.10.2026')).toBe('2026-10-05');
    expect(toIsoDate('soon')).toBeNull();
  });
});

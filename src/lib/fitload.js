/**
 * «TSS vom Gerät zählt in der Form» (Noah 28.10.2026 «1a»): the training stress (TSS) a bike computer wrote
 * into a FIT file (ride.device.tss, src/lib/fit.js) is the load of that ride in «Form und Erholung».
 * - A FIT ride that is also a Strava activity (same day, about the same km, start within 45 min) counts once:
 *   the activity keeps everything and gets `tssDevice`, which form.js loadOf takes first.
 * - A FIT ride without a Strava twin adds its TSS to its day (`extra`), so it counts too.
 * Pure; tests/fitload.test.js.
 */
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Is the Strava activity the same ride as the FIT ride? */
export function sameRide(a, ride) {
  if (!a || a.kind !== 'bike' || a.day !== String(ride?.date ?? '').slice(0, 10)) return false;
  const km = fin(Number(ride.km)) ?? 0;
  if (km && Math.abs((fin(Number(a.km)) ?? 0) - km) > Math.max(2, km * 0.1)) return false;
  const s = ride.startAt ? Date.parse(ride.startAt) : NaN;
  const t = a.start ? Date.parse(a.start) : NaN;
  return !Number.isFinite(s) || !Number.isFinite(t) || Math.abs(t - s) <= 45 * 60 * 1000;
}

/**
 * acts: Strava activities; rides: db.rides. → { acts, extra: [{ day, tss, rideId }] }. acts is a new list
 * where a matched activity is a copy with tssDevice; the others stay the same objects.
 */
export function withFitLoad(acts = [], rides = []) {
  const out = [...(acts ?? [])];
  const extra = [];
  for (const r of rides ?? []) {
    const tss = fin(r?.device?.tss);
    if (r?.source !== 'fit' || !(tss > 0) || !r.date) continue;
    const i = out.findIndex((a) => !a?.hidden && fin(a?.tssDevice) == null && sameRide(a, r));
    if (i >= 0) out[i] = { ...out[i], tssDevice: tss };
    else extra.push({ day: String(r.date).slice(0, 10), tss, rideId: r.id });
  }
  return { acts: out, extra };
}

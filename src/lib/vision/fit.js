/**
 * Paket L2 «Velo-Einstellung per Kamera» (Noah 19.10.2026 «3 a und b möglich 4a»): from the body points
 * of a side photo (pedal at the bottom) or of a short video while pedalling, the app measures the knee,
 * hip and back angles. The result is kept with the bike as «Sitzposition» with its history.
 * Only suggestions from a picture: no medical rating, no professional bike fit.
 * Tested in tests/bilderkennung.test.js.
 */

/** MediaPipe's body points (index): shoulder, elbow, wrist, hip, knee, ankle per side. */
export const POINTS = {
  left: { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 },
  right: { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 },
};

/** The inner angle at b in degrees (180 = straight), points in pixels { x, y }. */
export function angleAt(a, b, c) {
  const v1 = [a.x - b.x, a.y - b.y];
  const v2 = [c.x - b.x, c.y - b.y];
  const n = Math.hypot(...v1) * Math.hypot(...v2);
  if (!n) return null;
  const cos = Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / n));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** The back against the ground: the line hip → shoulder, 0° = flat, 90° = upright. */
export function backAngle(hip, shoulder) {
  const dx = Math.abs(shoulder.x - hip.x);
  const dy = Math.abs(shoulder.y - hip.y);
  if (!dx && !dy) return null;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

const seen = (p) => (typeof p?.visibility === 'number' ? p.visibility : 1);

/** The side that faces the camera (the one whose points the model sees best). */
export function sideOf(lm) {
  const sum = (s) => Object.values(POINTS[s]).reduce((n, i) => n + seen(lm?.[i]), 0);
  return sum('left') >= sum('right') ? 'left' : 'right';
}

const r1 = (v) => (v == null ? null : Math.round(v));

/**
 * The angles of one picture. lm: 33 points (x, y from 0 to 1); w, h: the picture's size (the points are
 * scaled to pixels so a tall or wide picture does not bend the angles).
 * → { side, knee, hip, back, elbow, sure } | null   (sure: the model saw the points well)
 */
export function anglesOf(lm, w = 1, h = 1) {
  if (!Array.isArray(lm) || lm.length < 29) return null;
  const side = sideOf(lm);
  const P = POINTS[side];
  const at = (k) => ({ x: lm[P[k]].x * w, y: lm[P[k]].y * h });
  const vis = ['shoulder', 'hip', 'knee', 'ankle'].map((k) => seen(lm[P[k]]));
  const sure = Math.min(...vis) >= 0.5;
  return {
    side,
    knee: r1(angleAt(at('hip'), at('knee'), at('ankle'))),
    hip: r1(angleAt(at('shoulder'), at('hip'), at('knee'))),
    back: r1(backAngle(at('hip'), at('shoulder'))),
    elbow: r1(angleAt(at('shoulder'), at('elbow'), at('wrist'))),
    sure,
  };
}

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/**
 * A video over at least one crank turn: the angles of many frames → the knee at its straightest
 * (pedal at the bottom) and at its most bent (pedal at the top), the back and hip as the middle value.
 * Frames the model did not see well are left out. → { side, knee, kneeTop, hip, hipTop, back, elbow, frames, sure } | null
 */
export function videoSummary(frames) {
  const ok = (frames ?? []).filter((f) => f && f.knee != null && f.sure);
  if (ok.length < 5) return null;
  // the 95th / 5th percentile instead of max / min, so one wrong frame does not decide
  const knees = ok.map((f) => f.knee).sort((a, b) => a - b);
  const pick = (q) => knees[Math.min(knees.length - 1, Math.max(0, Math.round(q * (knees.length - 1))))];
  const hips = ok.map((f) => f.hip).filter((x) => x != null).sort((a, b) => a - b);
  const sides = ok.filter((f) => f.side === 'left').length;
  return {
    side: sides >= ok.length / 2 ? 'left' : 'right',
    knee: pick(0.95),
    kneeTop: pick(0.05),
    hip: median(ok.map((f) => f.hip)),
    hipTop: hips.length ? hips[Math.round(0.05 * (hips.length - 1))] : null,
    back: median(ok.map((f) => f.back)),
    elbow: median(ok.map((f) => f.elbow)),
    frames: ok.length,
    sure: true,
  };
}

/** The usual range of the knee at the bottom of the pedal stroke (inner angle), as many bike-fit guides give it. */
export const KNEE_RANGE = [140, 155];

/**
 * Suggestions for one measurement (English keys for t() with their values), compared with the last one.
 * Never a medical rating: a suggestion to try in small steps.
 */
export function fitHints(m, prev = null) {
  const out = [];
  if (!m) return out;
  if (m.sure === false) out.push({ key: 'The camera did not see your leg or back well. Try again from the side, the whole body in the picture, in good light.' });
  if (m.knee != null) {
    if (m.knee > KNEE_RANGE[1]) out.push({ key: 'Your leg is almost straight at the bottom ({n}°). Many riders sit a few millimetres lower so the knee stays a little bent.', n: m.knee, kind: 'lower' });
    else if (m.knee < KNEE_RANGE[0]) out.push({ key: 'Your knee is quite bent at the bottom ({n}°). Many riders try the saddle a few millimetres higher.', n: m.knee, kind: 'higher' });
    else out.push({ key: 'Your knee at the bottom ({n}°) is in the usual range of about {a}–{b}°.', n: m.knee, a: KNEE_RANGE[0], b: KNEE_RANGE[1], kind: 'ok' });
  }
  if (m.back != null) out.push({ key: 'Back {n}° to the ground: lower is sportier, higher is more upright.', n: m.back });
  if (prev && m.knee != null && prev.knee != null && Math.abs(m.knee - prev.knee) >= 3) out.push({ key: 'Knee {d}° compared with your last measurement.', d: `${m.knee > prev.knee ? '+' : '−'}${Math.abs(m.knee - prev.knee)}` });
  if (prev && m.back != null && prev.back != null && Math.abs(m.back - prev.back) >= 3) out.push({ key: 'Back {d}° compared with your last measurement.', d: `${m.back > prev.back ? '+' : '−'}${Math.abs(m.back - prev.back)}` });
  return out;
}

/* ---------- kept with the bike: bike.sitPos = [{ id, date, source, side, knee, kneeTop, hip, back, elbow, seatHeight, note }] ---------- */

/** The bike's measurements, the newest first. */
export const sitPosOf = (bike) => [...(Array.isArray(bike?.sitPos) ? bike.sitPos : [])].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));

/** The change that adds one measurement to a bike (for db.bikes.update). */
export function addSitPos(bike, m, { date, id = `sp${Date.now().toString(36)}` } = {}) {
  const keep = ['source', 'side', 'knee', 'kneeTop', 'hip', 'back', 'elbow', 'seatHeight', 'note'];
  const row = { id, date, ...Object.fromEntries(keep.filter((k) => m[k] != null && m[k] !== '').map((k) => [k, m[k]])) };
  return { sitPos: [row, ...(Array.isArray(bike?.sitPos) ? bike.sitPos : [])] };
}

/** The change that removes one measurement. */
export const removeSitPos = (bike, id) => ({ sitPos: (Array.isArray(bike?.sitPos) ? bike.sitPos : []).filter((r) => r.id !== id) });

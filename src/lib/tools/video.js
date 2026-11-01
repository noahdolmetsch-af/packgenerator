/**
 * Paket L «Werkzeugkasten» (Video verkleinern, Noah 19.10.2026): a video is played once on the device
 * into a smaller picture and recorded again by the browser (MediaRecorder), with its sound. It takes as
 * long as the video runs; nothing is downloaded or sent. Pure parts tested in tests/werkzeugkasten.test.js.
 */
export const VIDEO_SIZES = [
  { key: '720', h: 720, bps: 2_500_000, label: 'Medium|video' },
  { key: '480', h: 480, bps: 1_200_000, label: 'Small|video' },
  { key: '360', h: 360, bps: 600_000, label: 'Very small|video' },
];

/** The new size: the short side becomes `h` (never bigger), both even; and the bits per second. */
export function videoPlan(w, h, size) {
  const short = Math.min(w, h);
  const s = short > size.h ? size.h / short : 1;
  const even = (n) => Math.max(2, Math.round((n * s) / 2) * 2);
  return { w: even(w), h: even(h), bps: size.bps };
}

/** About how big the result gets, in bytes (picture + 128 kbit/s sound). */
export const videoGuess = (seconds, bps) => Math.round(((bps + 128_000) * seconds) / 8);

/** The recording type the browser can make: MP4 where possible, else WebM. */
export function recType(isSupported = (x) => globalThis.MediaRecorder?.isTypeSupported?.(x)) {
  for (const x of ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']) if (isSupported(x)) return x;
  return '';
}

/** The seconds of the test piece (Noah 28.10.2026 «Video-Probe»). */
export const PROBE_SECONDS = 5;

/** Where the test piece starts: the middle of the video, but never so late that it is cut short. */
export const probeStart = (duration, seconds = PROBE_SECONDS) => (duration > seconds ? Math.max(0, Math.min(duration / 2 - seconds / 2, duration - seconds)) : 0);

/**
 * Browser only: the length of a video element in seconds. A video recorded by a browser (WebM) often says
 * «Infinity» until the end was seen once; then the element is sent to the end and back. 0 when unknown.
 */
export async function lengthOf(v) {
  if (Number.isFinite(v.duration)) return v.duration;
  await new Promise((ok) => {
    v.ontimeupdate = () => {
      v.ontimeupdate = null;
      ok();
    };
    v.currentTime = 1e7;
    setTimeout(ok, 3000);
  });
  const d = Number.isFinite(v.duration) ? v.duration : 0;
  v.currentTime = 0;
  return d;
}

/**
 * Browser only: plays the file (or a part of it) into a canvas and records it. onprogress(0–1). → Blob.
 * start / seconds: only this piece (the test piece); audio: false leaves the sound out (notes).
 * Used by the tool «Video verkleinern» and by videos in notes, so both make the same pictures.
 */
export async function shrinkVideo(file, size, { onprogress = () => {}, start = 0, seconds = Infinity, audio = true } = {}) {
  const type = recType();
  if (!type) throw new Error('no recorder');
  const v = document.createElement('video');
  v.src = URL.createObjectURL(file);
  v.playsInline = true;
  v.muted = false;
  v.volume = 0;
  await new Promise((ok, no) => ((v.onloadedmetadata = ok), (v.onerror = () => no(new Error('video')))));
  const plan = videoPlan(v.videoWidth, v.videoHeight, size);
  const c = document.createElement('canvas');
  c.width = plan.w;
  c.height = plan.h;
  const g = c.getContext('2d');
  const out = c.captureStream(30);
  const src = audio ? (v.captureStream?.() ?? v.mozCaptureStream?.()) : null;
  src?.getAudioTracks().forEach((a) => out.addTrack(a));
  const rec = new MediaRecorder(out, { mimeType: type, videoBitsPerSecond: plan.bps, ...(audio ? { audioBitsPerSecond: 128_000 } : {}) });
  const parts = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const done = new Promise((ok) => (rec.onstop = ok));
  const len = await lengthOf(v);
  const from = Math.max(0, Math.min(start, len));
  const to = Math.min(len || Infinity, from + seconds);
  if (from > 0) {
    await new Promise((ok) => ((v.onseeked = ok), (v.currentTime = from)));
  }
  let raf = 0;
  const finished = () => v.ended || v.currentTime >= to - 0.05;
  const draw = () => {
    g.drawImage(v, 0, 0, plan.w, plan.h);
    onprogress(to > from && Number.isFinite(to) ? Math.min(1, (v.currentTime - from) / (to - from)) : 0);
    if (!finished()) raf = requestAnimationFrame(draw);
  };
  rec.start(1000);
  await v.play();
  draw();
  await new Promise((ok) => {
    v.onended = ok;
    const watch = () => (finished() ? ok() : requestAnimationFrame(watch));
    watch();
  });
  v.pause();
  cancelAnimationFrame(raf);
  rec.stop();
  await done;
  URL.revokeObjectURL(v.src);
  onprogress(1);
  return new Blob(parts, { type: type.split(';')[0] });
}

/** The size of a still picture taken from a video: the long side at most `max`, both whole numbers. */
export function stillSize(w, h, max = 1200) {
  const k = Math.min(1, max / Math.max(w, h, 1));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** Browser only: the picture on screen in a video element as a JPEG data URL (null while nothing is drawn). */
export function stillOf(v, max = 1200, quality = 0.82) {
  if (!v?.videoWidth) return null;
  const { w, h } = stillSize(v.videoWidth, v.videoHeight, max);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(v, 0, 0, w, h);
  return c.toDataURL('image/jpeg', quality);
}

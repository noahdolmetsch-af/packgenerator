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

/** Browser only: plays the file into a canvas and records it. onprogress(0–1). → Blob. */
export async function shrinkVideo(file, size, { onprogress = () => {} } = {}) {
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
  const src = v.captureStream?.() ?? v.mozCaptureStream?.();
  src?.getAudioTracks().forEach((a) => out.addTrack(a));
  const rec = new MediaRecorder(out, { mimeType: type, videoBitsPerSecond: plan.bps, audioBitsPerSecond: 128_000 });
  const parts = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const done = new Promise((ok) => (rec.onstop = ok));
  let raf = 0;
  const draw = () => {
    g.drawImage(v, 0, 0, plan.w, plan.h);
    onprogress(v.duration ? v.currentTime / v.duration : 0);
    if (!v.ended) raf = requestAnimationFrame(draw);
  };
  rec.start(1000);
  await v.play();
  draw();
  await new Promise((ok) => (v.onended = ok));
  cancelAnimationFrame(raf);
  rec.stop();
  await done;
  URL.revokeObjectURL(v.src);
  onprogress(1);
  return new Blob(parts, { type: type.split(';')[0] });
}

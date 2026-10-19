/**
 * Paket L «Werkzeugkasten»: the back camera for Lupe, Taschenlampe and the bar code scanner. Everything
 * stays on the device; nothing is recorded or sent. Browser only.
 */

/** The back camera as a stream, or throws (no camera, not allowed). */
export async function backCamera({ width = 1280 } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('no camera'), { name: 'NotFoundError' });
  return await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: width } }, audio: false });
}

/** Stops every track of the stream. */
export const stopStream = (s) => s?.getTracks().forEach((x) => x.stop());

/** What the camera can: { torch, zoom: {min, max, step} | null }. */
export function abilities(stream) {
  const track = stream?.getVideoTracks()[0];
  const c = track?.getCapabilities?.() ?? {};
  return { torch: !!c.torch, zoom: c.zoom ? { min: c.zoom.min, max: c.zoom.max, step: c.zoom.step || 0.1 } : null };
}

/** Sets torch and/or zoom; false when the camera says no. */
export async function tune(stream, wish) {
  const track = stream?.getVideoTracks()[0];
  if (!track?.applyConstraints) return false;
  try {
    await track.applyConstraints({ advanced: [wish] });
    return true;
  } catch {
    return false;
  }
}

/** The words for a camera that did not start. */
export const cameraError = (err) => (err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? 'denied' : 'none');

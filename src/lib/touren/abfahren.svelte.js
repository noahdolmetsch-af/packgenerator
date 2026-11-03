/**
 * «Höhenprofil wird abgefahren» (Paket E, Idee 13): the share (0…1) of the ride along a profile, once, when it
 * appears. Still (share 1 at once) with «Bewegung aus» in the app or «reduce motion» on the device, and when
 * `on` is false. `stop()` ends it at once (a touch on the profile).
 */
import { motionStill } from '../theme.svelte.js';
import { rideShare } from './abfahren.js';

export function createRide(on = true) {
  let p = $state(on && !motionStill() ? 0 : 1);
  let raf = 0;
  const stop = () => {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = 0;
    p = 1;
  };
  function start() {
    if (p >= 1 || typeof requestAnimationFrame !== 'function') return stop;
    const t0 = performance.now();
    const tick = (now) => {
      p = rideShare(now - t0);
      raf = p < 1 ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);
    return stop;
  }
  return {
    get p() {
      return p;
    },
    get running() {
      return p < 1;
    },
    start,
    stop,
  };
}

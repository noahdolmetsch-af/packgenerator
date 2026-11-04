/**
 * «Höhenprofil wird abgefahren» (Paket E, Idee 13): the share (0…1) of the ride along a profile, once, when it
 * first comes on screen. Still (share 1 at once) with «Bewegung aus» in the app or «reduce motion» on the device, and when
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
  /** Starts the ride when `el` is first on screen (at once without IntersectionObserver); returns the cleanup. */
  function whenSeen(el) {
    if (p >= 1) return () => {};
    if (!el || typeof IntersectionObserver !== 'function') {
      start();
      return stop;
    }
    const io = new IntersectionObserver((list) => {
      if (list.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
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
    whenSeen,
  };
}

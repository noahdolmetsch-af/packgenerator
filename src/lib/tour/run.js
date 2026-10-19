/**
 * «Rundgang»: starting a tour. With the example trip it starts the playground first (the same start as
 * Me › Try it out: a weekend trip, your data kept aside, the app reloads); the tour carries over that
 * reload in localStorage and TourHost.svelte picks it up. With your own data it starts on the spot.
 * askTour(id) opens the small choice «example trip or own data» (TourStart.svelte via the event
 * 'pg:tour-ask'); a running playground skips the choice.
 */
import { db } from '../db.js';
import { startDemo, setClock, demoState } from '../demo.js';
import { tidyData } from '../tidy.js';
import { settling } from '../settled.js';
import { playFile, playDay } from '../play.js';
import { localDay } from '../localday.js';
import { openTrip } from '../nav.js';
import { writeRun } from '../tour.js';

export const TOUR_EVENT = 'pg:tour';
export const ASK_EVENT = 'pg:tour-ask';

/** Start the playground with the weekend trip and reload the app on `hash` (PlaySheet uses the same steps). */
export async function startPlayground(kind = 'weekend', day = 'today', hash = '#/') {
  const today = localDay();
  await settling(async () => {
    await startDemo(db, playFile(kind, today));
    await tidyData(db);
  });
  setClock(playDay(kind, day, today));
  if (kind !== 'empty') openTrip('play-trip');
  location.hash = hash;
  location.reload();
}

/** Start tour `id`; play: with the example trip in the playground (reloads when it is not running yet). */
export async function startTour(id, { play = false } = {}) {
  const running = !!(await demoState(db));
  writeRun({ id, step: 0, play: play || running });
  if (play && !running) return startPlayground('weekend', 'today', '#/');
  window.dispatchEvent(new Event(TOUR_EVENT));
}

/** Ask first «example trip or own data», unless the playground already runs (then it just starts). */
export async function askTour(id) {
  if (await demoState(db)) return startTour(id, { play: true });
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: { id } }));
}

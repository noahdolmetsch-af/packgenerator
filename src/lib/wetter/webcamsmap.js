/**
 * Webcams on the live map (Paket Wetter): the device's webcams, live, as map points. Live.svelte reads
 * camsQuery() and spreads camsOnMap() into its points; a tap opens LiveWebcam.svelte.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { WEBCAMS_KEY, camsOf, camsOnMap } from './webcams.js';

export { camsOnMap };
/** The stored webcam value, live (the raw value: camsOnMap and camsOf make it safe). */
export const camsQuery = () => liveQuery(async () => (await db.settings.get(WEBCAMS_KEY))?.value ?? []);
/** The cam behind a map point id ('cam-…'), or null. */
export const camOfPoint = (value, id) => camsOf(value).find((c) => c.id === id || `cam-${c.id}` === id) ?? null;

/** /api/google/callback: Google sends the browser back here after the login. Logic in api/_lib/google.js.
 * The app's service worker must never answer this address (vite.config.js navigateFallbackDenylist, 19.10.2026). */
import { makeHandler } from '../_lib/google.js';

const { callback } = makeHandler();
export const GET = callback;

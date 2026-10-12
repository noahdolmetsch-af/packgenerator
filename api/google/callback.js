/** /api/google/callback: Google sends the browser back here after the login. Logic in api/_lib/google.js. */
import { makeHandler } from '../_lib/google.js';

const { callback } = makeHandler();
export const GET = callback;

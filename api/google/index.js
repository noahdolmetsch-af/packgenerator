/** /api/google: Google Health connection (start, status, data, disconnect). Logic in api/_lib/google.js. */
import { makeHandler } from '../_lib/google.js';

const { main } = makeHandler();
export const GET = main;
export const POST = main;
export const OPTIONS = main;

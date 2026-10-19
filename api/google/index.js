/** /api/google: Google Health connection (start, status, data, disconnect). Logic in api/_lib/google.js.
 * Trello (19.10.2026) rides along as ?svc=trello (logic in api/_lib/trello.js): the server project «packgen»
 * is at Vercel's Hobby limit of 12 functions, so Trello has no file of its own. */
import { makeHandler } from '../_lib/google.js';
import { makeHandler as makeTrello } from '../_lib/trello.js';

const { main: google } = makeHandler();
const { main: trello } = makeTrello();
const main = (request) => (new URL(request.url).searchParams.get('svc') === 'trello' ? trello(request) : google(request));
export const GET = main;
export const POST = main;
export const OPTIONS = main;

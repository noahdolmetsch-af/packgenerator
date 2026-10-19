/** /api/trello: Merken and own lists with Noah's Trello board «Packgenerator». Logic in api/_lib/trello.js.
 * One file for every step (the login's return page too), so the server stays within Vercel's function count. */
import { makeHandler } from './_lib/trello.js';

const { main } = makeHandler();
export const GET = main;
export const POST = main;
export const OPTIONS = main;

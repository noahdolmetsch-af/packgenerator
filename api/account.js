/** /api/account: Paket R «Mit Google anmelden» for the sync between devices. Logic in api/_lib/account.js. */
import { makeAccount } from './_lib/account.js';

const { main } = makeAccount();
export const POST = main;
export const OPTIONS = main;

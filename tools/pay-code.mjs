#!/usr/bin/env node
/**
 * Bezahlfunktion: make unlock codes (4b «Code freischalten»). Only Noah runs this, on his own
 * computer, with the same PAY_SIGNING_SECRET as in Vercel. The secret is read from the
 * environment, never from a file in the repo; the codes are printed, never saved.
 *
 *   PAY_SIGNING_SECRET=… node tools/pay-code.mjs app_once 3
 */
import { randomBytes } from 'node:crypto';
import { makeCode, PLANS } from '../api/_lib/pay.js';

const [plan = 'app_once', n = '1'] = process.argv.slice(2);
const secret = process.env.PAY_SIGNING_SECRET?.trim();
if (!secret) {
  console.error('PAY_SIGNING_SECRET is not set.');
  process.exit(1);
}
if (!PLANS[plan]) {
  console.error(`Unknown plan. Use one of: ${Object.keys(PLANS).join(', ')}`);
  process.exit(1);
}
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
for (let i = 0; i < Math.min(Number(n) || 1, 100); i++) {
  const id = [...randomBytes(10)].map((b) => ALPHA[b % ALPHA.length]).join('');
  console.log(makeCode(secret, plan, id));
}

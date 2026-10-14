/**
 * Ich › Bezahlen (mockups BZ1 + BZ2b, Noah 14.10.2026 01:31 «1a 2b», «bz freigeben»): what the
 * page shows, in English (German in src/lib/i18n/de/bezahlen.js). Nothing here switches anything on:
 * the payment parts are prepared and invisible elsewhere (LOCKED in licence.js stays false).
 */
export const PAY_HREF = '#/me/pay';

/** The ideas, as cards on top (BZ2b). icon: a key of ICONS in Pay.svelte. */
export const USE_CASES = [
  { icon: 'star', title: 'Pro version', text: 'The app stays free; «Pro» unlocks extras such as Strava, Fitbit and the Garmin pages.', example: 'Example: CHF 29 once' },
  { icon: 'tennis', title: 'Tennis lessons', text: 'Your students see free times and book them directly.', example: 'Example: 60 minutes, CHF 80' },
  { icon: 'route', title: 'Guided tours', text: 'Offer a bikepacking tour with places and let people book them.', example: 'Example: 2 days, 6 places' },
  { icon: 'wrench', title: 'Bike service', text: 'Let people book service times with you or a bike mechanic.', example: 'Example: 10 % share' },
  { icon: 'file', title: 'Sell templates', text: 'Packing lists or tour plans as templates to buy.', example: 'Example: CHF 5 per template' },
  { icon: 'gift', title: 'Free for friends', text: 'Friends get a code and use the app for free.', example: 'Example: 10 codes' },
];

/** What is already prepared on the server. */
export const PREPARED = [
  { icon: 'card', title: 'Buy the app', text: 'Once, or as a subscription per month or year.' },
  { icon: 'key', title: 'Unlock codes', text: 'A code unlocks the app without paying.' },
  { icon: 'bag', title: 'Shop', text: 'Sell products and templates, paid through Stripe.' },
  { icon: 'cal', title: 'Book times', text: 'Times with a limited number of places, each place only once.' },
  { icon: 'users', title: 'Other sellers', text: 'Their money goes straight to them, you keep a share.' },
];

/** What it costs. later: from real money on. */
export const COSTS = [
  { label: 'Test mode', value: 'CHF 0' },
  { label: 'Stripe account, base fee', value: 'CHF 0' },
  { label: 'Per card payment', value: '2.9 % + CHF 0.30', later: true },
  { label: 'Other sellers (per month)', value: 'about CHF 2', later: true },
];

export const MISSING = ['Buttons to pay in the app', 'Real prices and products', 'Real money (live mode)', 'Restore a purchase on a new device by e-mail'];

/**
 * «Weg zum Ziel» › kind of step «Weather window» (Noah 05.11.2026 «4a»): one suggestion, a week before the start:
 * «Check the weather window». The card with the days and their rain chance (lib/weg/wetter.js) shows on the page
 * from that day on; the step is the reminder in the timeline. Nothing ticks by itself (the weather is a hint, you
 * decide): `auto` is always null. Texts are English keys for t(); the German is in i18n/de/weg-wetter.js.
 */
export default {
  type: 'wetter',
  label: 'Weather window for the start',
  icon: 'cloud-sun',
  defaults: () => [{ key: 'window', title: 'Check the weather window', offset: 7, note: 'From a week before, the forecast shows which days stay dry. A hint only: you decide.' }],
  auto: () => null,
  link: () => '',
};

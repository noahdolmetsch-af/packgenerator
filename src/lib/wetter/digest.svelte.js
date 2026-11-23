/**
 * «Wetter heute» (Wetter-Ausbau D, Noah 22.11.2026 «a»): the calm weather lines of Heute (snow line, fog line, night)
 * stand under one closed line. Each of them tells its short phrase here, so the closed line can say the most
 * important in one sentence («Fog to 850 m, sun above · Night 1 °C»). A line that has nothing to show tells null.
 */
export const digest = $state({});
export const ORDER = ['fog', 'snow', 'night'];
export const setDigest = (key, text) => {
  digest[key] = text || null;
};
/** The phrases that have a value, in the order of ORDER. */
export const phrases = () => ORDER.map((k) => digest[k]).filter(Boolean);

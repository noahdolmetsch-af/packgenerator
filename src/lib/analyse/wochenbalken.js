/**
 * «Cardio-Belastung» Idee B (Noah 07.11.2026 «alle A–F»): values that add up (cardio load, minutes, km) show one bar
 * per week from 3 months on, because 90 day bars are hard to read; the days stay behind a tap. Other values keep
 * their daily points up to 120 days. Pure.
 */

/** Up to this many days a chart shows one point per day; longer ranges show one per week (see bucketsOf). */
export const dailyLimit = (sum) => (sum ? 60 : 120);

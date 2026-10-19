/**
 * «Abgleich aus» (Noah 19.10.2026 «1a»): while the automatic sync is off, Ich › «Waiting for you» shows
 * a line with «Switch on». It opens «Data and backup» at «Phone and computer» (the wish SYNC_WISH).
 * «Only one device» hides the line on this device (meta NUDGE_KEY; meta never syncs or goes in a backup).
 */
export const SYNC_WISH = 'me.sync';
export const NUDGE_KEY = 'syncNudge';

/** Show the line? Only with own data, not in the demo, sync off and not hidden. */
export const needsNudge = ({ items = 0, demo = false, cfg = null, nudge = null } = {}) => items > 0 && !demo && !cfg?.on && !nudge?.off;

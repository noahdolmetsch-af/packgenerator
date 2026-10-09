/**
 * v0.46.0 «Startseite neu» (Noah 4b, 5a + menu): the colour world and light or dark.
 *
 * Three colour worlds (app.css): Gletscher, Sandstein and Klassisch (the green and orange of before).
 * Light or dark: "System" follows the phone or computer (prefers-color-scheme), or always light or
 * always dark. Both are chosen in "More" and remembered on this device (localStorage). The page gets
 * data-palette and data-theme (always the resolved 'light' or 'dark') on <html>; app.css does the rest.
 */

/** Noah may still switch the default colour world: one line. */
export const DEFAULT_PALETTE = 'gletscher';
export const DEFAULT_MODE = 'system';

export const PALETTES = [
  { key: 'gletscher', name: 'Glacier|palette' },
  { key: 'sandstein', name: 'Sandstone|palette' },
  { key: 'klassisch', name: 'Classic|palette' },
];
export const MODES = [
  { key: 'system', name: 'System|theme' },
  { key: 'light', name: 'Light|theme' },
  { key: 'dark', name: 'Dark|theme' },
];
export const PALETTE_KEY = 'theme.palette';
export const MODE_KEY = 'theme.mode';

/** A stored value or the default. */
export const paletteOf = (v) => (PALETTES.some((p) => p.key === v) ? v : DEFAULT_PALETTE);
export const modeOf = (v) => (MODES.some((m) => m.key === v) ? v : DEFAULT_MODE);
/** 'light' or 'dark' for a mode and whether the system is dark. */
export const resolveMode = (mode, systemDark = false) => (modeOf(mode) === 'system' ? (systemDark ? 'dark' : 'light') : modeOf(mode));

const get = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null; // private mode: the defaults
  }
};
const put = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: only this visit */
  }
};
const darkQuery = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

/** The current choice: { palette, mode, dark } (dark: what shows now). */
export const theme = $state({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE, dark: false });

function apply() {
  if (typeof document === 'undefined') return;
  theme.dark = resolveMode(theme.mode, !!darkQuery()?.matches) === 'dark';
  const root = document.documentElement;
  root.dataset.palette = theme.palette;
  root.dataset.theme = theme.dark ? 'dark' : 'light';
  // the browser bar on a phone takes the brand colour of the world shown
  const brand = getComputedStyle(root).getPropertyValue('--brand').trim();
  if (brand) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand);
}

/** Read the stored choice, set it on <html> and follow the system while "System" is chosen. */
export function initTheme() {
  theme.palette = paletteOf(get(PALETTE_KEY));
  theme.mode = modeOf(get(MODE_KEY));
  apply();
  darkQuery()?.addEventListener?.('change', () => theme.mode === 'system' && apply());
}

export function setPalette(key) {
  theme.palette = paletteOf(key);
  put(PALETTE_KEY, theme.palette);
  apply();
}
export function setMode(key) {
  theme.mode = modeOf(key);
  put(MODE_KEY, theme.mode);
  apply();
}

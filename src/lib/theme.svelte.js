/**
 * v0.46.0 «Startseite neu» (Noah 4b, 5a + menu): the colour world and light or dark.
 *
 * Three colour worlds (app.css): Gletscher, Sandstein and Klassisch (the green and orange of before).
 * Light or dark: "System" follows the phone or computer (prefers-color-scheme), or always light or
 * always dark. Both are chosen in "More" and remembered on this device (localStorage). The page gets
 * data-palette and data-theme (always the resolved 'light' or 'dark') on <html>; app.css does the rest.
 *
 * v0.97.0 Design-Refresh R1 (G1 neu, Noah 11.10 23:10 «Runde 1 alles ★ und G1–G12 freigegeben»; 12.10
 * «1a 2a»): Ich › Darstellung chooses the font (8, Inter by default), the colour world (Salbei by default,
 * four calm new ones, the three old ones stay) and the text size (small, normal, large); light or dark
 * stays. Everything only on this device. <html> also gets data-font and data-size.
 */

/** Noah may still switch the default colour world: one line. */
export const DEFAULT_PALETTE = 'salbei';
export const DEFAULT_MODE = 'system';
export const DEFAULT_FONT = 'inter';
export const DEFAULT_SIZE = 'normal';

/**
 * The colour worlds: the five of the mockup first (Salbei ★), then the two older ones (Noah 2a).
 * swatches: ground, main colour, calm accent, ink (the four dots on Ich › Darstellung).
 */
export const PALETTES = [
  { key: 'salbei', name: 'Sage|palette', swatches: ['#f4f5f1', '#4a7360', '#3d6b56', '#1f2a24'] },
  { key: 'fels', name: 'Rock|palette', swatches: ['#f3f4f5', '#3e5c74', '#3d7461', '#1e252b'] },
  { key: 'sand', name: 'Sand|palette', swatches: ['#f6f3ec', '#9a5b3e', '#4f7a5a', '#2b2622'] },
  { key: 'gletscher-sanft', name: 'Soft glacier|palette', swatches: ['#f2f5f6', '#2f6b70', '#2f6b70', '#16242c'] },
  { key: 'gletscher', name: 'Glacier|palette', swatches: ['#eef2f4', '#c2441b', '#0b6f6b', '#14232d'] },
  { key: 'sandstein', name: 'Sandstone|palette', swatches: ['#f4efe6', '#b5461c', '#4f6b2e', '#2b2420'] },
  { key: 'klassisch', name: 'Classic|palette', swatches: ['#eceee8', '#b83e08', '#276a43', '#0f2e27'] },
];
/** The fonts (G1 neu: 8 to choose, all free and offline, in the order of the mockup; main.js loads them, app.css data-font). */
export const FONTS = [
  { key: 'fira', name: 'Fira Sans', family: "'Fira Sans'" },
  { key: 'inter', name: 'Inter', family: "'Inter'" },
  { key: 'source', name: 'Source Sans 3', family: "'Source Sans 3'" },
  { key: 'nunito', name: 'Nunito Sans', family: "'Nunito Sans'" },
  { key: 'plex', name: 'IBM Plex Sans', family: "'IBM Plex Sans'" },
  { key: 'dm', name: 'DM Sans', family: "'DM Sans'" },
  { key: 'manrope', name: 'Manrope', family: "'Manrope'" },
  { key: 'atkinson', name: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible'" },
];
export const SIZES = [
  { key: 'small', name: 'Small|size' },
  { key: 'normal', name: 'Normal|size' },
  { key: 'large', name: 'Large|size' },
];
export const MODES = [
  { key: 'system', name: 'System|theme' },
  { key: 'light', name: 'Light|theme' },
  { key: 'dark', name: 'Dark|theme' },
];
export const PALETTE_KEY = 'theme.palette';
export const MODE_KEY = 'theme.mode';
export const FONT_KEY = 'theme.font';
export const SIZE_KEY = 'theme.size';
/** v0.97.0: set once when Salbei became the default (see refreshPalette). */
export const REFRESH_KEY = 'theme.refresh97';

/** A stored value or the default. */
export const paletteOf = (v) => (PALETTES.some((p) => p.key === v) ? v : DEFAULT_PALETTE);
export const modeOf = (v) => (MODES.some((m) => m.key === v) ? v : DEFAULT_MODE);
export const fontOf = (v) => (FONTS.some((f) => f.key === v) ? v : DEFAULT_FONT);
export const sizeOf = (v) => (SIZES.some((z) => z.key === v) ? v : DEFAULT_SIZE);
/**
 * The colour world after the update to the new look: Gletscher was the default until 0.96, so a stored
 * Gletscher becomes Salbei once (Noah approved Salbei as the new default); any other choice stays, and
 * Gletscher can be chosen again at any time. done: the move happened before.
 */
export const refreshPalette = (stored, done) => (!done && stored === 'gletscher' ? DEFAULT_PALETTE : paletteOf(stored));
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
export const theme = $state({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE, font: DEFAULT_FONT, size: DEFAULT_SIZE, dark: false });

function apply() {
  if (typeof document === 'undefined') return;
  theme.dark = resolveMode(theme.mode, !!darkQuery()?.matches) === 'dark';
  const root = document.documentElement;
  root.dataset.palette = theme.palette;
  root.dataset.theme = theme.dark ? 'dark' : 'light';
  root.dataset.font = theme.font;
  root.dataset.size = theme.size;
  // the browser bar on a phone takes the brand colour of the world shown
  const brand = getComputedStyle(root).getPropertyValue('--brand').trim();
  if (brand) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand);
}

/** Read the stored choice, set it on <html> and follow the system while "System" is chosen. */
export function initTheme() {
  const done = get(REFRESH_KEY) === '1';
  theme.palette = refreshPalette(get(PALETTE_KEY), done);
  if (!done) {
    if (get(PALETTE_KEY)) put(PALETTE_KEY, theme.palette);
    put(REFRESH_KEY, '1');
  }
  theme.mode = modeOf(get(MODE_KEY));
  theme.font = fontOf(get(FONT_KEY));
  theme.size = sizeOf(get(SIZE_KEY));
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
export function setFont(key) {
  theme.font = fontOf(key);
  put(FONT_KEY, theme.font);
  apply();
}
export function setSize(key) {
  theme.size = sizeOf(key);
  put(SIZE_KEY, theme.size);
  apply();
}
/** The short line of the row «Darstellung» on Ich: font · colour world · size. tr is t(). */
export function lookLine(tr = (x) => x) {
  const font = FONTS.find((f) => f.key === theme.font)?.name;
  const pal = PALETTES.find((p) => p.key === theme.palette)?.name;
  const size = SIZES.find((z) => z.key === theme.size)?.name;
  return [font, pal && tr(pal), size && tr(size)].filter(Boolean).join(' · ');
}

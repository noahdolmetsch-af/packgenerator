// «Sofort ein Bild» (Noah 23.11.2026 «Mach die App 5 mal schneller»): index.html shows a quiet frame (logo, bars, tabs) in the
// colours of the chosen world while the app loads, so the first picture comes after the HTML, not after 187 script files.
// The frame's colours are not typed a second time: this plugin reads them from src/app.css at build time (the one source)
// and puts them, with the frame's layout (scripts/boot-frame.css), inline into index.html, so the frame costs no extra request.
import { readFileSync } from 'node:fs';

/** The tokens the frame uses. */
export const TOKENS = ['ground', 'paper', 'paper-2', 'line', 'ink', 'brand', 'brand-ink', 'hi'];
/** The colour worlds of app.css (the keys of PALETTES in src/lib/theme.svelte.js); klassisch is the base :root. */
export const PALETTES = ['klassisch', 'gletscher', 'sandstein', 'salbei', 'fels', 'sand', 'gletscher-sanft'];

/** { selector: { token: value } } for the root rules of app.css that set colour tokens (selector without «:root»). */
export function rootBlocks(css) {
  const out = {};
  for (const m of css.matchAll(/(^|\n):root((?:\[[^\]]+\])*)\s*\{([^}]*)\}/g)) {
    const vars = {};
    for (const v of m[3].matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) if (TOKENS.includes(v[1])) vars[v[1]] = v[2].trim();
    if (Object.keys(vars).length) out[m[2]] = { ...(out[m[2]] ?? {}), ...vars };
  }
  return out;
}

/** The colours of one world, light or dark: the base, then the world, then its dark rule. */
export function resolve(blocks, palette, dark) {
  const out = { ...(blocks[''] ?? {}) };
  if (palette !== 'klassisch') Object.assign(out, blocks[`[data-palette='${palette}']`] ?? {});
  if (dark) Object.assign(out, blocks[`[data-palette='${palette}'][data-theme='dark']`] ?? {});
  return out;
}

/** One line per world and mode: the --b-… colours of the frame. */
export function colorCss(css) {
  const blocks = rootBlocks(css);
  const rows = [];
  for (const p of PALETTES) {
    for (const dark of [false, true]) {
      const v = resolve(blocks, p, dark);
      rows.push(`html[data-palette='${p}']${dark ? "[data-theme='dark']" : ''}{${TOKENS.map((t) => `--b-${t}:${v[t]}`).join(';')}}`);
    }
  }
  return rows.join('\n');
}

/** The Vite plugin: replaces <!--boot-css--> in index.html with the inline <style> of the frame. */
export function bootShell({ appCss = new URL('../src/app.css', import.meta.url), layout = new URL('./boot-frame.css', import.meta.url) } = {}) {
  return {
    name: 'boot-shell',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes('<!--boot-css-->')) return html;
        const style = `<style id="boot-css">\n${colorCss(readFileSync(appCss, 'utf8'))}\n${readFileSync(layout, 'utf8').trim()}\n</style>`;
        return html.replace('<!--boot-css-->', style);
      },
    },
  };
}

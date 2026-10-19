// «Grösse» (Noah 19.10.2026 «1b 2b»): the whole app is zoomed with `zoom: var(--ui-zoom)` on <html>.
// Inside a zoomed page the browser zooms 100vh and 100vw too, so a sheet with max-height: 88vh would
// reach under the screen at 120 %. This PostCSS step turns every vh/vw/dvh/svh/lvh in the app's CSS
// (app.css and every Svelte <style>) into calc(… / var(--ui-zoom, 1)) when it is built, so nobody has to
// remember it. At 100 % the value stays the same.
const UNIT = /(^|[^\w.#-])(\d+(?:\.\d+)?)([dsl]?v[hw])\b/g;

export const unzoomUnits = (value) => value.replace(UNIT, (m, pre, n, u) => `${pre}calc(${n}${u} / var(--ui-zoom, 1))`);

export function viewportZoom() {
  return {
    postcssPlugin: 'viewport-zoom',
    Declaration(decl) {
      if (decl.prop.startsWith('--ui-zoom') || !/\dv[hw]|\d[dsl]v[hw]/.test(decl.value) || decl.value.includes('--ui-zoom')) return;
      decl.value = unzoomUnits(decl.value);
    },
  };
}
viewportZoom.postcss = true;

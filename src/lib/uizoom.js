/**
 * «Grösse» (Noah 19.10.2026 «1b 2b»): the whole app is zoomed by --ui-zoom on <html> (theme.svelte.js).
 * Inside a zoomed page the browser gives getBoundingClientRect, clientX/Y and innerWidth/innerHeight in
 * screen pixels, but a style in px is zoomed once more. So code that puts something where the finger or
 * an element is divides by uiZoom() first. At 100 % nothing changes.
 */
export function uiZoom() {
  if (typeof document === 'undefined') return 1;
  const z = parseFloat(document.documentElement.style.getPropertyValue('--ui-zoom'));
  return z > 0 ? z : 1;
}
/** A box from getBoundingClientRect in the page's own pixels. */
export function unzoomRect(r, z = uiZoom()) {
  return { x: r.x / z, y: r.y / z, left: r.left / z, top: r.top / z, right: r.right / z, bottom: r.bottom / z, width: r.width / z, height: r.height / z };
}

/**
 * The app-wide zoom («Grösse», CSS zoom on <html>) for the pointer maths of the profile and the live map.
 * Pointer positions (clientX) and getBoundingClientRect are compared as a ratio, which needs no factor;
 * pixel distances (drag thresholds, the bottom sheet height) are divided by this factor.
 * Until Paket 5 «Grösse» is merged it is 1. After the merge, this ONE line becomes:
 *   export { uiZoom as zoomFactor } from '../uizoom.js';
 */
export const zoomFactor = () => 1;

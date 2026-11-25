/**
 * «Karte der App» als Mindmap (Noah 24.11.2026 «beide» on the two drafts, then 25.11.2026 «kreislauf fallen lassen»): besides the list of places
 * (the tree) the map can be drawn as a mind map: the app on the left, its places as branches, their tabs as twigs, the pages under a twig.
 * It reads the places, tabs and pages from the map (appmap.js), never from a hand-kept list (tests/appskizze.test.js). Pure function, no screen.
 */
import { buildTree } from './appmap.js';

/** The mind map: one branch per place of the map, with its tabs (twigs) and the pages of each: [{ key, label, points, tabs }]. */
export function buildMind(map) {
  return map.map((g) => ({ key: g.key, label: g.label, points: g.points, tabs: buildTree(g) }));
}

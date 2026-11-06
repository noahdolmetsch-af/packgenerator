/**
 * Durchklick Etappe 2, Frage 2a (Noah 05.11.2026): the path line adds the page's own title as its last step only when that
 * title is new. «Touren › Übersicht › Touren» and «Material › Alles › Material» said the place twice; now the title is left
 * out when ANY step of the path already has that name (the last step is then the page, not a link). Pure; PathLine.svelte uses it.
 * steps: [{ label, href }], title: the h1 the page draws. Returns the title to add, or ''.
 */
export function pathLast(steps, title) {
  const name = (title ?? '').trim();
  if (!name) return '';
  return steps.some((s) => (s.label ?? '').trim() === name) ? '' : name;
}

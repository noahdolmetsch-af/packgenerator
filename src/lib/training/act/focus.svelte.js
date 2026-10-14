/**
 * TR7a: «Abschnitt antippen zeigt ihn im Verlauf»: the section tapped in «Abschnitte» (activity id and
 * index into secs5), read by «Verlauf» to shade its minutes. Tapping it again clears it.
 */
export const focus = $state({ id: null, i: null });

export function toggleFocus(id, i) {
  const same = focus.id === id && focus.i === i;
  focus.id = same ? null : id;
  focus.i = same ? null : i;
}

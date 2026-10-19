/**
 * TR7a: «Abschnitt antippen zeigt ihn im Verlauf»: the section tapped in «Abschnitte» (activity id and
 * index into secs5), read by «Verlauf» to shade its minutes. Tapping it again clears it.
 * «Mehr Inhalt» T2: a hard piece tapped in «Harte Stücke» uses the same place with a key of its own
 * (i: 'int0', 'int1' …) and its course minutes r: [from, to].
 */
export const focus = $state({ id: null, i: null, r: null });

export function toggleFocus(id, i, r = null) {
  const same = focus.id === id && focus.i === i;
  focus.id = same ? null : id;
  focus.i = same ? null : i;
  focus.r = same ? null : r;
}

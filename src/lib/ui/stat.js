/**
 * Split a counted sentence into its number and the rest: «2 of 3 sessions done» → ['2', 'of 3 sessions done'].
 * A text that does not start with a number keeps its words as the rest and has no number (value '').
 */
export function statParts(text) {
  const m = /^(\d+(?:[.,']\d+)*)\s+(.*)$/s.exec(String(text ?? '').trim());
  return m ? [m[1], m[2]] : ['', String(text ?? '').trim()];
}

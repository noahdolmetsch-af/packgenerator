/**
 * A row of radio buttons with one tab stop (the ARIA radio group): the arrow keys move the choice, Tab
 * leaves the group. → the id to pick, or null for another key.
 */
export function radioStep(key, ids, cur) {
  const i = ids.indexOf(cur);
  if (key === 'ArrowRight' || key === 'ArrowDown') return ids[(i + 1) % ids.length];
  if (key === 'ArrowLeft' || key === 'ArrowUp') return ids[(i - 1 + ids.length) % ids.length];
  if (key === 'Home') return ids[0];
  if (key === 'End') return ids.at(-1);
  return null;
}

/**
 * «Mein Tag» (Noah 24.11.2026, point 4): two nearly equal trainings on one day, one of them the app's own suggestion.
 * The training plan can hold a suggestion of the app (id «sug-…») and a session imported from TrainingPeaks («tp-…») of the same kind
 * on the same day, e.g. an «Intervall-Einheit» of 85 min next to «Drift Intervals» of 65 min. The imported one is the real plan;
 * the suggestion only looks like a second session. It is not deleted: it moves out of the list into one closed line.
 * Pure; the page is src/pages/Tag.svelte. Only untouched suggestions (not ticked) are folded.
 * → { entries: the day without the folded ones, folded: [{ e, like }] }  (`like` = the imported entry it looks like)
 */
const isSug = (e) => e.kind === 'sport' && String(e.id).startsWith('tr:sug-') && !e.done;
const isImport = (e) => e.kind === 'sport' && String(e.id).startsWith('tr:tp-');

export function foldSimilar(entries = []) {
  const folded = [];
  const keep = [];
  for (const e of entries) {
    const like = isSug(e) ? entries.find((x) => isImport(x) && x.sessionKind === e.sessionKind) : null;
    if (like) folded.push({ e, like });
    else keep.push(e);
  }
  return { entries: keep, folded };
}

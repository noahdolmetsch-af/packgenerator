/** The page a calm view leads to: the words you wrote, the whole phrase first, then each word (longest first). */
export async function guessHref(what, t) {
  const { FEATURE, findFeatures, featureHref } = await import('../features.js');
  const tries = [what, ...String(what).split(/\s+/).filter((w) => w.length > 2).sort((x, y) => y.length - x.length)];
  for (const q of tries) {
    const hit = findFeatures(q, t).find((h) => featureHref(FEATURE[h.featureId]));
    if (hit) return featureHref(FEATURE[hit.featureId]);
  }
  return '';
}

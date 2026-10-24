/**
 * «Alles finden 2» (Noah 22.10.2026 «3a»): the help of the page you are on lives behind the «?» at the top
 * (nav/HelpButton), no longer in folds on the page. The page's help card (HintCard: hint, intro) and its page
 * end (PageMore: can, name, base) say here which page this is; the «?» reads it.
 */
export const helpHere = $state({ hint: null, intro: null, can: null, name: '', base: '' });

/** A page part says what it is; returns the function that forgets it again (when the part goes). */
export function sayHere(info) {
  const keys = Object.keys(info).filter((k) => info[k] != null && info[k] !== '');
  for (const k of keys) helpHere[k] = info[k];
  return () => {
    for (const k of keys) if (helpHere[k] === info[k]) helpHere[k] = k === 'name' || k === 'base' ? '' : null;
  };
}

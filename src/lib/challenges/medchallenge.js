/**
 * Which own daily goal is the meditation challenge: the idea «30 days of meditation» (SUGGESTIONS of tagesziel.js) under its
 * English name or its name in the app language (the user may have renamed it; then it is simply no meditation challenge
 * here, and nothing breaks). `tr` is `t`, so the German name is found too.
 */
import { SUGGESTIONS } from '../tagesziel.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();
export const isMedGoal = (c, tr = (s) => s) => {
  const en = SUGGESTIONS[0].name;
  return !!c && [norm(en), norm(tr(en))].includes(norm(c.name));
};

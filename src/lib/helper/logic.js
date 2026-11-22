/**
 * v0.77.0 «KI-Helfer»: what the app does with the helper's answers. Pure functions, no database.
 */
/* ---------- 2 Suche: only a question gets an answer (Noah 2a) ---------- */
const QUESTION_WORDS = /^(was|wie|welche[rsmn]?|wieviel|wie viel|wo|wann|warum|wieso|brauche|brauch|soll|sollte|kann|könnte|muss|nehme|reicht|lohnt|what|how|which|where|when|why|should|do i|can i|is it|does|will|shall)\b/i;
/** A question: ends with «?», or (on Enter) starts like one ("Was nehme ich …"). */
const endsAsQuestion = (text) => /\?\s*$/.test(String(text ?? '')) && String(text).trim().length >= 8;
export const looksLikeQuestion = (text) => {
  const s = String(text ?? '').trim();
  return s.length >= 8 && (endsAsQuestion(s) || (QUESTION_WORDS.test(s) && s.split(/\s+/).length >= 3));
};

import { t } from '../i18n.svelte.js';

/**
 * The shown name of a learning's topic (v0.30.2, test R6.12): topics typed in small letters («sleep») are shown like the
 * others, and an English topic is translated. Used by «Gelernt» and by the search, so both show the same word.
 */
export function topicName(topic) {
  const s = String(topic ?? '');
  if (!s) return t('No topic');
  return t(s) !== s ? t(s) : t(s.charAt(0).toUpperCase() + s.slice(1));
}

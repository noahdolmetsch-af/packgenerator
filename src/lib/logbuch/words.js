/** «Verbesserungs-Logbuch»: the words of the kinds, groups and states. Every text goes through t() (German in i18n/de/logbuch.js). */
import { t } from '../i18n.svelte.js';
import { DEFAULT_KINDS, artName, groupName } from './kinds.js';

const ART = {
  fehler: () => t('Error|logbuch'),
  zahl: () => t('Number wrong'),
  langsam: () => t('Too slow'),
  text: () => t('Change text'),
  erklaerung: () => t('Explanation'),
  hinweis: () => t('Hint missing'),
  finde: () => t("Can't find it"),
  anordnung: () => t('Order|logbuch'),
  layout: () => t('Layout|logbuch'),
  bedienung: () => t('Handling'),
  wegdamit: () => t('Away with it'),
  idee: () => t('Missing / idea'),
  gutso: () => t('Good as it is'),
};
const GROUP = { wrong: () => t('Wrong'), clear: () => t('Understandable'), build: () => t('Structure'), new: () => t('New|logbuch') };
const STATE = { open: () => t('Open|logbuch'), draft: () => t('Draft made'), done: () => t('Done|logbuch'), noted: () => t('Noted|logbuch') };

/** What the user typed (L5, kinds.js) wins and never goes through t(); else the built-in word. cfg: the user's list, none = the first version. */
export const artLabel = (a, cfg = DEFAULT_KINDS) => artName(cfg, a) ?? ART[a]?.() ?? '';
export const groupLabel = (g, cfg = DEFAULT_KINDS) => groupName(cfg, g) ?? GROUP[g]?.() ?? '';
export const stateLabel = (s) => STATE[s]?.() ?? '';

/** What happens with a kind (Noah 21.11.2026 «3a»). */
export const ROUTE_TEXT = {
  direct: () => t('A small change: one small step with a before and after picture.'),
  draft: () => t('First a picture of how it could look, then the change.'),
  note: () => t('Only a note. Nothing changes.'),
};

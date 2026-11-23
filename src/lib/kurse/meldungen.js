/** «Kursblick» (K-C): the words for what a form refuses (the codes of bestand.js and ziele.js). */
import { t } from '../i18n.svelte.js';

const MELDUNG = {
  symbol: () => t('Write the symbol as the price service does, for example NESN.SW.'),
  menge: () => t('Write how many you own: a number above zero.'),
  wert: () => t('Write the value as a number.'),
  einstand: () => t('Write what it cost in francs as a number, or leave it empty.'),
  name: () => t('Give it a name, for example «My savings account».'),
  tag: () => t('Choose a date.'),
  betrag: () => t('Write the amount received in francs: a number above zero.'),
  titel: () => t('Write «gold» or a symbol as the price service does, for example NESN.SW.'),
  preis: () => t('Write the price of one piece in francs: a number above zero.'),
  gebuehr: () => t('Write the fee in francs as a number, or leave it empty.'),
  faktor: () => t('Write the factor: 2 for a split of 2 to 1, 0.1 for a reverse split of 10 to 1.'),
};
export const meldung = (code) => MELDUNG[code]?.() ?? t('This did not work. Check what you typed.');

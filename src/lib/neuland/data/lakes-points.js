/*
 * «Neuland»: smaller Swiss lakes (good for a swim or a stop) that are not in the lake shapes of
 * swiss-maps (lakes-shapes.js holds the 22 large lakes). Source: own compilation (eigene
 * Zusammenstellung), the middle of the lake rounded to about 0.005° and a rough radius in km.
 * A route that passes within that radius plus 300 m counts as «passed by»; a swim is ticked by hand.
 * Format: [name, lat, lon, radius km, canton].
 * The id is 'lk-' + the name in small letters (neuland.js slug); keep the names stable.
 */
export default [
  ['Pfäffikersee', 47.353, 8.786, 1.0, 'ZH'],
  ['Türlersee', 47.273, 8.499, 0.5, 'ZH'],
  ['Lützelsee', 47.256, 8.768, 0.3, 'ZH'],
  ['Katzensee', 47.433, 8.497, 0.3, 'ZH'],
  ['Hüttwilersee', 47.611, 8.844, 0.5, 'TG'],
  ['Nussbaumersee', 47.62, 8.824, 0.4, 'TG'],
  ['Rotsee', 47.071, 8.32, 0.6, 'LU'],
  ['Mauensee', 47.169, 8.063, 0.4, 'LU'],
  ['Lauerzersee', 47.035, 8.597, 1.0, 'SZ'],
  ['Wägitalersee', 47.087, 8.92, 1.2, 'SZ'],
  ['Klöntalersee', 47.027, 8.98, 1.2, 'GL'],
  ['Seealpsee', 47.269, 9.4, 0.3, 'AI'],
  ['Lungerersee', 46.799, 8.166, 1.0, 'OW'],
  ['Melchsee', 46.774, 8.27, 0.4, 'OW'],
  ['Trübsee', 46.79, 8.395, 0.3, 'OW'],
  ['Oeschinensee', 46.498, 7.727, 0.5, 'BE'],
  ['Gerzensee', 46.838, 7.543, 0.4, 'BE'],
  ['Amsoldingersee', 46.726, 7.576, 0.4, 'BE'],
  ['Moossee', 47.022, 7.48, 0.4, 'BE'],
  ['Burgäschisee', 47.169, 7.668, 0.4, 'BE'],
  ['Inkwilersee', 47.201, 7.66, 0.3, 'SO'],
  ['Schwarzsee', 46.671, 7.283, 0.4, 'FR'],
  ['Lac de Bret', 46.513, 6.771, 0.5, 'VD'],
  ['Lac des Brenets', 47.068, 6.709, 1.0, 'NE'],
  ['Lac de Champex', 46.03, 7.115, 0.3, 'VS'],
  ['Lac de Géronde', 46.287, 7.533, 0.3, 'VS'],
  ['Caumasee', 46.82, 9.297, 0.2, 'GR'],
  ['Crestasee', 46.831, 9.316, 0.15, 'GR'],
  ['Davosersee', 46.813, 9.838, 0.6, 'GR'],
  ['Silsersee', 46.421, 9.74, 1.8, 'GR'],
  ['Silvaplanersee', 46.452, 9.79, 1.2, 'GR'],
  ['St. Moritzersee', 46.493, 9.846, 0.5, 'GR'],
  ['Lej da Staz', 46.5, 9.867, 0.2, 'GR'],
  ['Lago Bianco', 46.415, 10.03, 1.0, 'GR'],
  ['Lago di Poschiavo', 46.283, 10.087, 1.0, 'GR'],
  ['Lago Ritom', 46.533, 8.687, 1.0, 'TI'],
  ['Lago di Vogorno', 46.244, 8.854, 1.5, 'TI'],
  ['Lago di Muzzano', 46.009, 8.927, 0.3, 'TI'],
  ["Lago d'Origlio", 46.056, 8.945, 0.2, 'TI'],
];

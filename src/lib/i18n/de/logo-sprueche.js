// «Geheimmenü» H6 «Velo-Weisheit» (Noah 03.11.2026): the sayings (pairs in logo/sayings.js) and their place in «Listen und Typen»
import { SAYINGS } from '../../logo/sayings.js';

export default {
  ...Object.fromEntries(SAYINGS),
  'Sayings in the logo': 'Sprüche im Logo',
  'Little surprises': 'Kleine Überraschungen',
  'The sayings the logo can say after five taps. Add your own, change or delete any of them.': 'Die Sprüche, die das Logo nach fünf Tipps sagen kann. Schreib eigene dazu, ändere oder lösche jeden.',
  'Own saying': 'Eigener Spruch',
};

// «Heute ruhiger» (Noah 26.10.2026 «1a 2a 3a 4a 5a», mockup H3): areas with a heading, the small tiles as one list
// «Deine Gewohnheiten» (Noah 27.10.2026) comes along from here, so de/index.js needs no new line
import gewohnheiten from './gewohnheiten.js';

export default {
  ...gewohnheiten,
  'Now|home': 'Jetzt',
  'What is up today': 'Was heute ansteht',
  'Your body|home': 'Dein Körper',
  'Only to look at, no rating': 'Nur zum Anschauen, keine Wertung',
  'Your week|home': 'Deine Woche',
  'On the road and bikes': 'Unterwegs und Velos',
  'Open quickly': 'Schnell öffnen',
  'Discover|home': 'Entdecken',
  'New in the app and a tip each week': 'Neues in der App und ein Tipp pro Woche',
  'Today shows the tiles in areas with a heading. Here you set their order inside an area.': 'Heute zeigt die Kacheln in Bereichen mit Überschrift. Hier ordnest du sie innerhalb eines Bereichs.',
  'Show the tiles in areas with a heading (Now, Your body, Your week …)': 'Kacheln in Bereichen mit Überschrift zeigen (Jetzt, Dein Körper, Deine Woche …)',
};

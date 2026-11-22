// «Träume und Neuland» N12 (Noah 07.11.2026 «ok N12»): einmal im Monat ein kleines Abenteuer, eine ruhige Zeile auf Heute
export default {
  title: 'One adventure a month',
  lead: 'Once a month the app suggests one small adventure, and «Not this month» always works.',
  points: [
    { text: 'Trips › Dreams: «One adventure a month» with «Show me», «Not this month» and your own kinds', href: '#/trips/dreams', go: 'f.monthadv' },
    { text: 'Today: a quiet line «Adventure of the month» (after-work bivouac, train there and bike home, a round through new ground, or your own idea)', href: '#/', go: 'f.monthadv' },
  ],
  small: [{ box: 'new', text: 'Hide a kind, add your own, or switch the line on Today off', go: 'f.monthadv' }],
  test: [
    'Open Trips › Dreams: «One adventure a month» names this month\'s adventure; tap «Show me».',
    'Tap «Not this month»: the line on Today is gone until next month. On Dreams, «Show again» gets it back.',
  ],
  since: ['f.monthadv'],
  de: {
    'One adventure a month': 'Ein Abenteuer im Monat',
    'Once a month the app suggests one small adventure, and «Not this month» always works.': 'Einmal im Monat schlägt die App ein kleines Abenteuer vor, und «Diesen Monat nicht» geht immer.',
    'Today: a quiet line «Adventure of the month» (after-work bivouac, train there and bike home, a round through new ground, or your own idea)': 'Heute: eine ruhige Zeile «Abenteuer im Monat» (Feierabend-Biwak, Zug hin und Velo heim, eine Runde durch Neuland oder eine eigene Idee)',
    'Trips › Dreams: «One adventure a month» with «Show me», «Not this month» and your own kinds': 'Touren › Träume: «Ein Abenteuer im Monat» mit «Zeig mir», «Diesen Monat nicht» und eigenen Arten',
    'Hide a kind, add your own, or switch the line on Today off': 'Eine Art ausblenden, eine eigene hinzufügen oder die Zeile auf Heute ausschalten',
    'Open Trips › Dreams: «One adventure a month» names this month\'s adventure; tap «Show me».': 'Öffne Touren › Träume: «Ein Abenteuer im Monat» nennt das Abenteuer dieses Monats; tippe «Zeig mir».',
    'Tap «Not this month»: the line on Today is gone until next month. On Dreams, «Show again» gets it back.': 'Tippe «Diesen Monat nicht»: die Zeile auf Heute ist bis nächsten Monat weg. Auf Träume holt «Wieder zeigen» sie zurück.',
  },
};

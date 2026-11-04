// «Schneefallgrenze» (Noah 04.11.2026 «1b 2a 3a 4a 5a»): the snow line in m above sea level on the weather page and on Today
export default {
  title: 'Snow line every day',
  lead: 'The snow line in metres above sea level shows on the weather page and on Today.',
  points: [
    { text: 'The weather page shows the snow line now, its low and high of the day and six times from 6 to 21 h', go: { href: '#/wetter', where: 'Weather › the card «Today», under the temperature line (needs a home place).' } },
    { text: 'Today has one calm line for your home place', go: { href: '#/', where: 'Today, under the weather line (needs a home place and the internet once).' } },
    { text: 'A hint when the line goes down to your height', go: { href: '#/wetter', where: 'Weather › «Set snow line»: your height and the switch for Today.' } },
  ],
  small: [{ box: 'new', text: 'Offline the last kept value shows with its time' }],
  test: [
    'Open the weather page (Today › the snow line): in the card «Today» you see the snow line and six times.',
    'Under «Set snow line» type your own height: below it you get a hint, and you can switch the line on Today off.',
  ],
  since: [],
  de: {
    'Snow line every day': 'Schneefallgrenze jeden Tag',
    'The snow line in metres above sea level shows on the weather page and on Today.': 'Die Schneefallgrenze in Metern über Meer steht auf der Wetterseite und auf Heute.',
    'The weather page shows the snow line now, its low and high of the day and six times from 6 to 21 h': 'Die Wetterseite zeigt die Schneefallgrenze jetzt, ihren Tiefst- und Höchstwert und sechs Zeitpunkte von 6 bis 21 Uhr',
    'Weather › the card «Today», under the temperature line (needs a home place).': 'Wetter › Karte «Heute», unter der Temperaturzeile (braucht einen Wohnort).',
    'Today has one calm line for your home place': 'Heute hat eine ruhige Zeile für deinen Wohnort',
    'Today, under the weather line (needs a home place and the internet once).': 'Heute, unter der Wetterzeile (braucht einen Wohnort und einmal Internet).',
    'A hint when the line goes down to your height': 'Ein Hinweis, wenn die Grenze bis in deine Höhe sinkt',
    'Weather › «Set snow line»: your height and the switch for Today.': 'Wetter › «Schneefallgrenze einstellen»: deine Höhe und der Schalter für Heute.',
    'Offline the last kept value shows with its time': 'Ohne Netz erscheint der letzte gemerkte Wert mit Uhrzeit',
    'Open the weather page (Today › the snow line): in the card «Today» you see the snow line and six times.': 'Öffne die Wetterseite (Heute › die Schneefallgrenze): In der Karte «Heute» siehst du die Schneefallgrenze und sechs Zeitpunkte.',
    'Under «Set snow line» type your own height: below it you get a hint, and you can switch the line on Today off.': 'Unter «Schneefallgrenze einstellen» gibst du deine Höhe ein: Darunter bekommst du einen Hinweis, und du kannst die Zeile auf Heute ausschalten.',
  },
};

// «Touren-Liste aufräumen» (Noah 23.11.2026 «was fällt dir hier auf», «ja»): Doppelte, Beispiele, leere Werte, ein Rückblick, kompakte Zeilen
export default {
  title: 'A calmer trip list',
  lead: 'Trips › Overview is shorter: one compact line per trip, doubled trips are suggested for joining, and the made-up examples step aside.',
  points: [
    { text: 'Every trip is one line; tap the arrow for the values, a value without data is left out and times read «9 h 58 min»', go: { href: '#/trips', where: 'Under «With packing list»: tap the arrow on the right of a trip.' } },
    { text: 'Trips that look the same (same name, day, length, bike) are suggested for joining: you pick the one that stays, the others are hidden, not deleted', go: { href: '#/trips', where: 'Shows under «With packing list» when two trips look the same: «Check doubles».' } },
    { text: 'Open debriefs stand once at the top; the button on every row is gone', go: { href: '#/trips', where: 'At the top of the page: «n are waiting for your debrief».' } },
  ],
  small: [
    { box: 'new', text: 'Joined trips can be taken apart again at any time' },
    { box: 'new', text: 'The made-up examples of the first start stay out of the list once there are real trips', go: { href: '#/trips', where: 'A quiet line under «With packing list» shows them again.' } },
  ],
  test: [
    'Open Trips: the list under «With packing list» is one line per trip. Tap the arrow on the right of a trip: its values open, only those with data.',
    'If a line says «n trips look doubled», tap «Check doubles»: pick which one stays and tap «Join». The others are hidden, «Take doubles apart» brings them back.',
    'Open debriefs: on a computer the tile «Offene Rückblicke» at the top is the one place; the buttons on the rows are gone.',
  ],
  since: [],
  de: {
    'A calmer trip list': 'Eine ruhigere Tourenliste',
    'Trips › Overview is shorter: one compact line per trip, doubled trips are suggested for joining, and the made-up examples step aside.': 'Touren › Übersicht ist kürzer: eine kompakte Zeile pro Tour, doppelte Touren werden zum Zusammenlegen vorgeschlagen, und die erfundenen Beispiele treten zur Seite.',
    'Every trip is one line; tap the arrow for the values, a value without data is left out and times read «9 h 58 min»': 'Jede Tour ist eine Zeile; der Pfeil öffnet die Werte, ein Wert ohne Daten fehlt einfach, und Zeiten lesen sich «9 h 58 min»',
    'Trips that look the same (same name, day, length, bike) are suggested for joining: you pick the one that stays, the others are hidden, not deleted': 'Touren, die gleich aussehen (Name, Tag, Länge, Velo), werden zum Zusammenlegen vorgeschlagen: Du wählst, welche bleibt, die anderen werden ausgeblendet, nicht gelöscht',
    'Shows under «With packing list» when two trips look the same: «Check doubles».': 'Erscheint unter «Mit Packliste», wenn zwei Touren gleich aussehen: «Doppelte prüfen».',
    'The made-up examples of the first start stay out of the list once there are real trips': 'Die erfundenen Beispiele vom ersten Start bleiben aus der Liste, sobald es echte Touren gibt',
    'A quiet line under «With packing list» shows them again.': 'Eine ruhige Zeile unter «Mit Packliste» zeigt sie wieder.',
    'Under «With packing list»: tap the arrow on the right of a trip.': 'Unter «Mit Packliste»: Tippe rechts auf den Pfeil einer Tour.',
    'At the top of the page: «n are waiting for your debrief».': 'Oben auf der Seite: «n warten auf deinen Rückblick».',
    'Open debriefs stand once at the top; the button on every row is gone': 'Offene Rückblicke stehen einmal oben; der Knopf auf jeder Zeile ist weg',
    'Joined trips can be taken apart again at any time': 'Zusammengelegte Touren lassen sich jederzeit wieder trennen',
    'Open Trips: the list under «With packing list» is one line per trip. Tap the arrow on the right of a trip: its values open, only those with data.': 'Öffne Touren: Die Liste unter «Mit Packliste» ist eine Zeile pro Tour. Tippe rechts auf den Pfeil einer Tour: Ihre Werte öffnen sich, nur die mit Daten.',
    'If a line says «n trips look doubled», tap «Check doubles»: pick which one stays and tap «Join». The others are hidden, «Take doubles apart» brings them back.': 'Steht dort «n Touren sehen doppelt aus», tippe «Doppelte prüfen»: Wähle, welche bleibt, und tippe «Zusammenlegen». Die anderen sind ausgeblendet, «Wieder trennen» holt sie zurück.',
    'Open debriefs: on a computer the tile «Offene Rückblicke» at the top is the one place; the buttons on the rows are gone.': 'Offene Rückblicke: Am Computer ist die Kachel «Offene Rückblicke» oben der eine Ort; die Knöpfe auf den Zeilen sind weg.',
  },
};

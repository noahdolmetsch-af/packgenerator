// «Lichter» (Noah 26.11.2026 «1a 2b 3 4a»): any number of lights, each with modes and charging as «% in minutes»
export default {
  title: 'Your lights',
  lead: 'Add every light you ride with, tell the app how fast each mode and the charging go, and it says whether they last through the dark.',
  points: [
    { text: 'Live map › Your lights › Change lamp: add lights, and for every mode and for charging type «% in minutes», for example 7 % in 60 min or 20 % in 23 min', go: { href: '#/live', where: 'Shows on the live map in the card «Your lights».' } },
    { text: 'The card says per light how many hours are left, how long charging takes and which mode lasts to the end of the dark', go: { href: '#/live', where: 'Shows on the live map in the card «Your lights».' } },
    { text: 'Before the start «Ready for the ride?» says how long each light needs to charge; on the way a warning comes at dusk, and at a rest the app says what 30 minutes of charging give', go: { href: '#/live', where: 'Shows on the live map before the start, at dusk and in «Find a rest».' } },
  ],
  small: [{ box: 'new', text: 'The arrival report says how much of a full charge each light used in the dark', go: { href: '#/live', where: 'Shows on the live map at the end of a route.' } }],
  test: ['On the live map open «Change lamp», type 25 % in 60 min for a mode and 20 % in 23 min for charging.', 'The card says about 4 h of light on a full charge and 1:55 h from empty.', 'Add a second light with «Add a light»; the bin deletes it again, «Undo» brings it back.'],
  since: [],
  de: {
    'Your lights': 'Deine Lichter',
    'Add every light you ride with, tell the app how fast each mode and the charging go, and it says whether they last through the dark.': 'Trag jedes Licht ein, mit dem du fährst, sag der App, wie schnell jeder Modus und das Laden gehen, dann sagt sie, ob sie durch die Dunkelheit reichen.',
    'Live map › Your lights › Change lamp: add lights, and for every mode and for charging type «% in minutes», for example 7 % in 60 min or 20 % in 23 min': 'Live-Karte › Deine Lichter › Licht ändern: Lichter hinzufügen und für jeden Modus und fürs Laden «% in Minuten» eintragen, zum Beispiel 7 % in 60 min oder 20 % in 23 min',
    'Shows on the live map in the card «Your lights».': 'Zeigt sich auf der Live-Karte in der Karte «Deine Lichter».',
    'The card says per light how many hours are left, how long charging takes and which mode lasts to the end of the dark': 'Die Karte sagt pro Licht, wie viele Stunden bleiben, wie lange das Laden dauert und welcher Modus bis zum Ende der Dunkelheit reicht',
    'Before the start «Ready for the ride?» says how long each light needs to charge; on the way a warning comes at dusk, and at a rest the app says what 30 minutes of charging give': 'Vor dem Start sagt «Bereit für unterwegs?», wie lange jedes Licht zum Laden braucht; unterwegs kommt in der Dämmerung eine Warnung, und bei einer Rast sagt die App, was 30 Minuten Laden geben',
    'Shows on the live map before the start, at dusk and in «Find a rest».': 'Zeigt sich auf der Live-Karte vor dem Start, in der Dämmerung und in «Rast suchen».',
    'The arrival report says how much of a full charge each light used in the dark': 'Der Ankunfts-Bericht sagt, wie viel einer vollen Ladung jedes Licht im Dunkeln gebraucht hat',
    'Shows on the live map at the end of a route.': 'Zeigt sich auf der Live-Karte am Ende einer Strecke.',
    'On the live map open «Change lamp», type 25 % in 60 min for a mode and 20 % in 23 min for charging.': 'Öffne auf der Live-Karte «Licht ändern» und trag bei einem Modus 25 % in 60 min ein, beim Laden 20 % in 23 min.',
    'The card says about 4 h of light on a full charge and 1:55 h from empty.': 'Die Karte sagt etwa 4 h Licht mit voller Ladung und 1:55 h Laden von leer.',
    'Add a second light with «Add a light»; the bin deletes it again, «Undo» brings it back.': 'Füge mit «Licht hinzufügen» ein zweites Licht hinzu; der Papierkorb löscht es wieder, «Rückgängig» bringt es zurück.',
  },
};

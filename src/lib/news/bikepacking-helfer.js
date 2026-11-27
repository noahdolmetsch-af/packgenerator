// «Bikepacking-Helfer» (Noah 26./27.11.2026 «1a 2a 3a 4a», «1a 2b 3 4a», «a»): Rast suchen, Lichter, Ankunfts-Bericht auf der Live-Karte
export default {
  title: 'Bikepacking helpers on the live map',
  lead: 'Find a rest, any number of lights with their modes and charging, and a report when you arrive.',
  points: [
    { text: 'Live map › «Find a rest»: up to three shops, cafes, fuel stops or water points in the next 20 km, the shortest detour first', go: { href: '#/live', where: 'Shows on the live map during a ride on a route.' } },
    { text: 'Live map › Your lights › Change lamp: add lights, and for every mode and for charging type «% in minutes», for example 7 % in 60 min or 20 % in 23 min', go: { href: '#/live', where: 'Shows on the live map in the card «Your lights».' } },
    { text: 'The card says per light how many hours are left, how long charging takes and which mode lasts to the end of the dark; before the start «Ready for the ride?» names the charging times, at dusk a warning comes, and at a rest the app says what 30 minutes of charging give', go: { href: '#/live', where: 'Shows on the live map in the card «Your lights», before the start, at dusk and in «Find a rest».' } },
  ],
  small: [{ box: 'new', text: 'At the goal an arrival report shows time, rest against the plan, phone battery, the time in the dark and how much of a charge each light used; «Later» folds it away', go: { href: '#/live', where: 'Shows on the live map when you reach the end of a route you rode.' } }],
  test: [
    'On the live map of a route tap «Find a rest»: up to three places ahead, each with its detour in km.',
    'Open «Change lamp», type 25 % in 60 min for a mode and 20 % in 23 min for charging: the card says about 4 h of light on a full charge and 1:55 h from empty.',
    'Add a second light with «Add a light»; the bin deletes it again, «Undo» brings it back.',
    'Ride a route to its end: the arrival report appears by itself, «Later» folds it away.',
  ],
  since: [],
  de: {
    'Bikepacking helpers on the live map': 'Bikepacking-Helfer auf der Live-Karte',
    'Find a rest, any number of lights with their modes and charging, and a report when you arrive.': 'Rast suchen, beliebig viele Lichter mit Modi und Laden, und ein Bericht bei der Ankunft.',
    'Live map › «Find a rest»: up to three shops, cafes, fuel stops or water points in the next 20 km, the shortest detour first': 'Live-Karte › «Rast suchen»: bis zu drei Läden, Cafés, Tankstellen oder Wasserstellen in den nächsten 20 km, der kürzeste Umweg zuerst',
    'Shows on the live map during a ride on a route.': 'Zeigt sich auf der Live-Karte während einer Fahrt auf einer Strecke.',
    'Live map › Your lights › Change lamp: add lights, and for every mode and for charging type «% in minutes», for example 7 % in 60 min or 20 % in 23 min': 'Live-Karte › Deine Lichter › Licht ändern: Lichter hinzufügen und für jeden Modus und fürs Laden «% in Minuten» eintragen, zum Beispiel 7 % in 60 min oder 20 % in 23 min',
    'Shows on the live map in the card «Your lights».': 'Zeigt sich auf der Live-Karte in der Karte «Deine Lichter».',
    'The card says per light how many hours are left, how long charging takes and which mode lasts to the end of the dark; before the start «Ready for the ride?» names the charging times, at dusk a warning comes, and at a rest the app says what 30 minutes of charging give': 'Die Karte sagt pro Licht, wie viele Stunden bleiben, wie lange das Laden dauert und welcher Modus bis zum Ende der Dunkelheit reicht; vor dem Start nennt «Bereit für unterwegs?» die Ladezeiten, in der Dämmerung kommt eine Warnung, und bei einer Rast sagt die App, was 30 Minuten Laden geben',
    'Shows on the live map in the card «Your lights», before the start, at dusk and in «Find a rest».': 'Zeigt sich auf der Live-Karte in der Karte «Deine Lichter», vor dem Start, in der Dämmerung und in «Rast suchen».',
    'At the goal an arrival report shows time, rest against the plan, phone battery, the time in the dark and how much of a charge each light used; «Later» folds it away': 'Am Ziel zeigt ein Ankunfts-Bericht Zeit, Pause gegen Plan, Handy-Akku, die Zeit im Dunkeln und wie viel einer Ladung jedes Licht gebraucht hat; «Später» klappt ihn zu',
    'Shows on the live map when you reach the end of a route you rode.': 'Zeigt sich auf der Live-Karte, wenn du das Ende einer gefahrenen Strecke erreichst.',
    'On the live map of a route tap «Find a rest»: up to three places ahead, each with its detour in km.': 'Tippe auf der Live-Karte einer Strecke «Rast suchen»: bis zu drei Orte voraus, jeder mit seinem Umweg in km.',
    'Open «Change lamp», type 25 % in 60 min for a mode and 20 % in 23 min for charging: the card says about 4 h of light on a full charge and 1:55 h from empty.': 'Öffne «Licht ändern», trag bei einem Modus 25 % in 60 min ein und beim Laden 20 % in 23 min: Die Karte sagt etwa 4 h Licht mit voller Ladung und 1:55 h Laden von leer.',
    'Add a second light with «Add a light»; the bin deletes it again, «Undo» brings it back.': 'Füge mit «Licht hinzufügen» ein zweites Licht hinzu; der Papierkorb löscht es wieder, «Rückgängig» bringt es zurück.',
    'Ride a route to its end: the arrival report appears by itself, «Later» folds it away.': 'Fahre eine Strecke bis zum Ende: Der Ankunfts-Bericht erscheint von selbst, «Später» klappt ihn zu.',
  },
};

/** «Neue Quellen» (Noah 20.10.2026): Ride with GPS per Link, ÖV in der Nähe, Ladestationen (src/lib/sources/). */
export default {
  // Ride with GPS (sources/RwgpsLink.svelte, sources/rwgps.js)
  'Link from Ride with GPS': 'Link von Ride with GPS',
  'Other route from Ride with GPS': 'Andere Route von Ride with GPS',
  'Load|rwgps': 'Laden',
  'Paste the link of a public route or ride (Share › Copy link). The route and its points (water, food, controls) come in as from a GPX file.':
    'Füg den Link einer öffentlichen Route oder Fahrt ein (Teilen › Link kopieren). Die Route und ihre Punkte (Wasser, Essen, Kontrollen) kommen wie aus einer GPX-Datei.',
  'No connection. Loading from Ride with GPS needs the internet.': 'Keine Verbindung. Das Laden von Ride with GPS braucht Internet.',
  'This is not a Ride with GPS link. Paste a link like ridewithgps.com/routes/12345.': 'Das ist kein Link von Ride with GPS. Füg einen Link wie ridewithgps.com/routes/12345 ein.',
  'Ride with GPS does not know this route. Check the link.': 'Ride with GPS kennt diese Route nicht. Prüf den Link.',
  'This route is private on Ride with GPS. Make it public or share it with a link, or download the GPX there and add it as a file.':
    'Diese Route ist bei Ride with GPS privat. Mach sie öffentlich oder teile sie per Link, oder lade dort die GPX-Datei herunter und füg sie als Datei hinzu.',
  'This route is too big to load.': 'Diese Route ist zu gross zum Laden.',
  'The server has done enough for today. Download the GPX on Ride with GPS and add it as a file.': 'Der Server hat heute genug gearbeitet. Lade die GPX-Datei bei Ride with GPS herunter und füg sie als Datei hinzu.',
  'Ride with GPS is not answering right now. Try again later, or add the GPX as a file.': 'Ride with GPS antwortet gerade nicht. Versuch es später nochmals, oder füg die GPX-Datei als Datei hinzu.',

  // ÖV in der Nähe (sources/OvNearby.svelte)
  'Public transport nearby': 'ÖV in der Nähe',
  'Stops near the map position and their next departures, from the Swiss timetable.': 'Haltestellen bei der Kartenposition und ihre nächsten Abfahrten, aus dem Schweizer Fahrplan.',
  'Find stops': 'Haltestellen suchen',
  'Waiting for your position.': 'Wartet auf deine Position.',
  'All stops': 'Alle Haltestellen',
  'Next departures from {stop}': 'Nächste Abfahrten ab {stop}',
  'Pl. {p}': 'Gl. {p}',
  'Pl. {p} (changed)': 'Gl. {p} (geändert)',
  'in {n} min': 'in {n} Min.',
  'Timetable: transport.opendata.ch': 'Fahrplan: transport.opendata.ch',
  'No connection. The timetable needs the internet.': 'Keine Verbindung. Der Fahrplan braucht Internet.',
  'The timetable is not answering right now. Try again later.': 'Der Fahrplan antwortet gerade nicht. Versuch es später nochmals.',
  'No stops found nearby.': 'Keine Haltestellen in der Nähe gefunden.',
  'No departures in the next hours.': 'Keine Abfahrten in den nächsten Stunden.',

  // Ladestationen und GPX-Punkte (sources/charge.js, route/fromgpx.js), for the places panel
  'Charging station|poi': 'Ladestation',
  'E-bike charging|poi': 'E-Bike laden',
  'Checkpoint|poi': 'Kontrollpunkt',
  'From the GPX|poi': 'Aus der GPX-Datei',
};

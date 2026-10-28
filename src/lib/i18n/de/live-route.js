// Paket U: «Wetter entlang der Strecke als Zeitleiste» (map/WxTimeline.svelte, map/wxline.js) and
// «GPX auf der Live-Karte öffnen» (live/LiveRouteBox.svelte, live/liveroute.js). Keys reused from other
// files (e.g. «Weather along the route», «Refresh», «Remove», «Other GPX») keep their German there.
export default {
  // weather timeline
  'You are offline. This is the weather of {at}.': 'Du bist offline. Das ist das Wetter von {at}.',
  'Rain from km {km} ({at})': 'Regen ab km {km} ({at})',
  'No rain expected': 'Kein Regen erwartet',
  'Headwind up to {kmh} km/h at km {km}': 'Gegenwind bis {kmh} km/h bei km {km}',
  'Load weather': 'Wetter laden',
  'As of {at}': 'Stand {at}',
  'Older than 3 hours': 'Älter als 3 Stunden',
  'For the hour of your plan at each point.': 'Für die Stunde, in der du laut Plan an jedem Punkt bist.',
  'For the hour you get there at your pace.': 'Für die Stunde, in der du mit deinem Tempo dort bist.',
  'No plan: the weather of now at each point.': 'Ohne Plan: das Wetter von jetzt an jedem Punkt.',
  'Rain chance {p} %': 'Regenrisiko {p} %',
  'Not in the forecast yet': 'Noch nicht in der Vorhersage',
  'The arrow shows where the wind blows as you ride: up pushes you, down is against you. Swipe the strip for more points.':
    'Der Pfeil zeigt, wohin der Wind in deiner Fahrtrichtung bläst: nach oben schiebt er dich, nach unten kommt er von vorn. Wische über den Streifen für weitere Punkte.',
  'The forecast reaches about 16 days ahead. Load again closer to the start.': 'Die Vorhersage reicht etwa 16 Tage voraus. Lade näher am Start nochmals.',
  'About every 25 km: rain, temperature and wind for the hour you are there, with headwind or tailwind. Loads once from Open-Meteo (free) and stays on this device.':
    'Etwa alle 25 km: Regen, Temperatur und Wind für die Stunde, in der du dort bist, mit Gegen- oder Rückenwind. Lädt einmal von Open-Meteo (gratis) und bleibt auf diesem Gerät.',
  Headwind: 'Gegenwind',
  Tailwind: 'Rückenwind',
  Crosswind: 'Seitenwind',
  'Hardly any wind': 'Kaum Wind',

  // GPX on the live map
  'Ride along a GPX route': 'Einer GPX-Route nachfahren',
  'Export the route as a GPX file from komoot, Ride with GPS or Garmin and open it here. The map then shows km along the route, how far to the end, arrival and the climbs. The file stays on this device.':
    'Exportiere die Route als GPX-Datei aus komoot, Ride with GPS oder Garmin und öffne sie hier. Die Karte zeigt dann die km entlang der Route, wie weit es noch ist, die Ankunft und die Anstiege. Die Datei bleibt auf diesem Gerät.',
  'Open GPX file': 'GPX-Datei öffnen',
  'loaded {day}': 'geladen am {day}',
  'Route «{name}» opened: {km} km.': 'Route «{name}» geöffnet: {km} km.',
  'Remove «{name}» from the live map?': '«{name}» von der Live-Karte entfernen?',
  'Only the route on this map goes. The GPX file on your phone and your rides stay.': 'Nur die Route auf dieser Karte geht weg. Die GPX-Datei auf deinem Handy und deine Fahrten bleiben.',
  'Route saved to «{trip}».': 'Route bei «{trip}» gespeichert.',
  "Saving didn't work. Try again.": 'Speichern hat nicht geklappt. Versuch es nochmals.',
  '«{trip}» has no route yet. Keep this one with the trip too (plan, packing list, review)?': '«{trip}» hat noch keine Route. Diese auch bei der Tour speichern (Plan, Packliste, Rückblick)?',
  'Save route to the trip': 'Route zur Tour speichern',
  'GPX route': 'GPX-Route',
  'Rename route': 'Route umbenennen',
  'Only the name on the live map changes.': 'Nur der Name auf der Live-Karte ändert sich.',
  // Noah 28.10.2026: only the GPX of this ride counts, the last one is offered
  'This ride starts without a route. Your last GPX «{name}» ({km} km) is still here.': 'Diese Fahrt startet ohne Route. Deine letzte GPX «{name}» ({km} km) ist noch da.',
  'Your last GPX «{name}» ({km} km) is still here.': 'Deine letzte GPX «{name}» ({km} km) ist noch da.',
  'Load for this ride': 'Für diese Fahrt laden',
};

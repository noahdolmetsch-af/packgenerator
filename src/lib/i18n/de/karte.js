// Paket U2 «Karte» (Noah 19.10.2026): die Karte eines Rennens mit Profil, Wetter-Layern und eigenen Punkten
// (src/lib/race/RaceMap.svelte, src/lib/map/*), die Kartengründe (src/lib/map/sources.js).
export default {
  'Map|race': 'Karte',
  'The route with its sectors, stops, your own points, the weather and the profile below': 'Die Strecke mit Sektoren, Stopps, deinen eigenen Punkten, dem Wetter und dem Profil darunter',

  // the grounds (sources.js)
  Automatic: 'Automatisch',
  'swisstopo in Switzerland, the free vector map elsewhere': 'In der Schweiz swisstopo, sonst die freie Vektorkarte',
  'swisstopo, summer': 'swisstopo, Sommer',
  'swisstopo, with ski routes': 'swisstopo, mit Skirouten',
  'Aerial photo': 'Luftbild',
  'swisstopo SWISSIMAGE': 'swisstopo SWISSIMAGE',
  'Free map': 'Freie Karte',
  'OpenFreeMap, all countries, can be kept offline': 'OpenFreeMap, alle Länder, offline speicherbar',
  OpenStreetMap: 'OpenStreetMap',
  'Only with the internet': 'Nur mit Internet',
  OpenTopoMap: 'OpenTopoMap',
  'Contour lines; only with the internet': 'Mit Höhenlinien; nur mit Internet',

  // MapView
  'Zoom in': 'Hineinzoomen',
  'Zoom out': 'Herauszoomen',
  'Sources of the map': 'Quellen der Karte',
  'Use two fingers to move the map': 'Mit zwei Fingern verschiebst du die Karte',
  'Use Ctrl + scroll to zoom the map': 'Mit Ctrl und Scrollen zoomst du die Karte',
  'Use ⌘ + scroll to zoom the map': 'Mit ⌘ und Scrollen zoomst du die Karte',
  'This device or browser cannot draw the map (WebGL is missing). Everything below still works: the profile, the points and the lists.':
    'Dieses Gerät oder dieser Browser kann die Karte nicht zeichnen (WebGL fehlt). Alles darunter geht trotzdem: das Profil, die Punkte und die Listen.',
  'The map could not start. Everything below still works: the profile, the points and the lists.': 'Die Karte konnte nicht starten. Alles darunter geht trotzdem: das Profil, die Punkte und die Listen.',
  'Loading the map…': 'Karte lädt…',
  'Tap the map where the point should go.': 'Tippe auf die Karte, wo der Punkt hinkommt.',
  'Whole route': 'Ganze Strecke',
  'Map ground': 'Kartengrund',
  'Layers on the map': 'Ebenen auf der Karte',

  // ProfileStrip
  'Elevation profile: move along the route': 'Höhenprofil: entlang der Strecke bewegen',
  'km {km}, {m} m': 'km {km}, {m} m',
  'No point chosen': 'Kein Punkt gewählt',
  'there {when}': 'dort {when}',
  'Tap or drag on the profile: the map shows the place.': 'Tippe oder zieh auf dem Profil: Die Karte zeigt die Stelle.',
  'in the dark (your plan)': 'im Dunkeln (dein Plan)',
  'snow or above the snow line': 'Schnee oder über der Schneefallgrenze',

  // own points
  'Note|point': 'Notiz',
  'Food|point': 'Essen',
  Danger: 'Gefahr',
  'View|point': 'Aussicht',
  'Your points show on every map, for every trip.': 'Deine Punkte erscheinen auf jeder Karte, bei jeder Tour.',
  'e.g. Fountain at the church': 'z. B. Brunnen bei der Kirche',
  'Place: {where}': 'Ort: {where}',
  'Move: tap the new spot on the map': 'Verschieben: neue Stelle auf der Karte antippen',
  'The point goes from every map. The trips stay as they are.': 'Der Punkt verschwindet von allen Karten. Die Touren bleiben, wie sie sind.',
  'Tap the new spot of «{name}» on the map.': 'Tippe auf der Karte die neue Stelle von «{name}» an.',
  'Cancel adding': 'Hinzufügen abbrechen',
  'Add point on the map': 'Punkt auf der Karte setzen',
  'Add point at km {km}': 'Punkt bei km {km} setzen',
  'Add point at the start': 'Punkt beim Start setzen',
  'Tap «Add point on the map» and then the spot, or press long on the map. Without a map: choose a spot on the profile and add the point there.':
    'Tippe «Punkt auf der Karte setzen» und dann auf die Stelle, oder drück lange auf die Karte. Ohne Karte: Wähl eine Stelle im Profil und setz den Punkt dort.',
  'km {km} of this route': 'km {km} dieser Strecke',
  'Show {name} on the map': '{name} auf der Karte zeigen',

  // RaceMap
  'Your bed (plan)': 'Dein Bett (Plan)',
  'My point': 'Mein Punkt',
  Sectors: 'Sektoren',
  'Beds of the plan': 'Betten im Plan',
  'My points': 'Meine Punkte',
  'Night|map': 'Nacht',
  'No route yet: load it under «Prepare». The map then shows it here.': 'Noch keine Strecke: Lade sie unter «Vorbereiten». Die Karte zeigt sie dann hier.',
  'Which stops: tap to hide or show a kind.': 'Welche Stopps: Tippe auf eine Art, um sie aus- oder einzublenden.',
  'Kinds of stops': 'Arten von Stopps',
  'So that a long route stays readable, small stops appear when you zoom in: shops, food and water from zoom 10, the rest from zoom 12. The depot, start, finish, the beds of your plan and your own points always show. Names appear from zoom 13.':
    'Damit eine lange Strecke lesbar bleibt, erscheinen kleine Stopps erst beim Hineinzoomen: Läden, Essen und Wasser ab Zoom 10, der Rest ab Zoom 12. Depot, Start, Ziel, die Betten deines Plans und deine eigenen Punkte siehst du immer. Namen erscheinen ab Zoom 13.',
  'Tap a stop for its km and when you are there. Tap the route: the profile below jumps there. Press long on the map (or right-click) to set your own point.':
    'Tippe auf einen Stopp: Du siehst km und wann du dort bist. Tippe auf die Strecke: Das Profil darunter springt dorthin. Drück lange auf die Karte (oder Rechtsklick), um einen eigenen Punkt zu setzen.',
  'No heights yet: a route file with heights (GPX) brings the profile.': 'Noch keine Höhen: Eine Streckendatei mit Höhen (GPX) bringt das Profil.',
  'Weather on the map': 'Wetter auf der Karte',
  'Weather layers': 'Wetter-Ebenen',
  'Rain radar': 'Regenradar',
  'Radar again': 'Radar neu laden',
  'Load rain radar': 'Regenradar laden',
  'Wind and snow again': 'Wind und Schnee neu laden',
  'Load wind and snow': 'Wind und Schnee laden',
  'Radar picture of {when}; it shows now, not your race day.': 'Radarbild von {when}; es zeigt jetzt, nicht deinen Renntag.',
  'Not loaded yet.': 'Noch nicht geladen.',
  'Wind and snow': 'Wind und Schnee',
  'for the hour your plan has you there': 'für die Stunde, in der du laut Plan dort bist',
  'for now: the race is beyond the forecast': 'für jetzt: Das Rennen liegt hinter der Vorhersage',
  'Strongest wind: {v} km/h from {dir} at km {km}': 'Stärkster Wind: {v} km/h aus {dir} bei km {km}',
  'The arrows on the map point where the wind blows; the number is km/h.': 'Die Pfeile auf der Karte zeigen, wohin der Wind bläst; die Zahl ist km/h.',
  'Snow line about {a}–{b} m': 'Schneefallgrenze etwa {a}–{b} m',
  'About 300 m below the freezing level: above it rain can fall as snow.': 'Etwa 300 m unter der Nullgradgrenze: Darüber kann Regen als Schnee fallen.',
  'Snow lies there': 'Dort liegt Schnee',
  'Above the snow line: snow can fall': 'Über der Schneefallgrenze: Schnee möglich',
  'No snow on the route': 'Kein Schnee auf der Strecke',
  'Neither lying snow nor a part above the snow line.': 'Weder liegender Schnee noch ein Stück über der Schneefallgrenze.',

  // the boxes: what, why, from
  'Shows the route in the colours of its sectors, the stops along it, the beds of your plan, the depot and your own points, on the map ground you choose.':
    'Zeigt die Strecke in den Farben ihrer Sektoren, die Stopps daran, die Betten deines Plans, das Depot und deine eigenen Punkte, auf dem Kartengrund, den du wählst.',
  'You see where everything is at a glance and plan where to eat, drink and sleep.': 'Du siehst auf einen Blick, wo alles liegt, und planst, wo du isst, trinkst und schläfst.',
  'Map grounds: swisstopo, OpenFreeMap, OpenStreetMap or OpenTopoMap. Stops: your stop file and OpenStreetMap (Along the route). Beds and nights: your plan.':
    'Kartengründe: swisstopo, OpenFreeMap, OpenStreetMap oder OpenTopoMap. Stopps: deine Stopp-Datei und OpenStreetMap (Entlang der Strecke). Betten und Nächte: dein Plan.',
  'The height along the whole route, with the sectors, the stretches you ride in the dark and snow on the route.': 'Die Höhe entlang der ganzen Strecke, mit den Sektoren, den Stücken im Dunkeln und Schnee auf der Strecke.',
  'Tap a spot: you see how high it is, how steep, and when your plan has you there; the map shows the place.': 'Tippe auf eine Stelle: Du siehst, wie hoch und wie steil es ist und wann du laut Plan dort bist; die Karte zeigt den Ort.',
  'The heights of your route file; dark from sunrise and sunset and your plan; snow from the weather layer.': 'Die Höhen deiner Streckendatei; dunkel aus Sonnenauf- und -untergang und deinem Plan; Schnee aus der Wetter-Ebene.',
  'Puts the rain radar, the wind and the snow on the map: wind and snow for the hour your plan has you at each point (today when the race is too far ahead).':
    'Legt Regenradar, Wind und Schnee auf die Karte: Wind und Schnee für die Stunde, in der du laut Plan an jedem Punkt bist (heute, wenn das Rennen zu weit weg ist).',
  'You see showers coming, where the wind is against you and where snow could lie or fall on high passes.': 'Du siehst Schauer kommen, wo der Wind gegen dich bläst und wo auf hohen Pässen Schnee liegen oder fallen könnte.',
  'RainViewer (radar, the last minutes, free) and Open-Meteo (forecast of wind, freezing level and snow depth at 12 points, free). Only on a tap; kept on this device.':
    'RainViewer (Radar der letzten Minuten, gratis) und Open-Meteo (Vorhersage von Wind, Nullgradgrenze und Schneehöhe an 12 Punkten, gratis). Nur auf Tippen; auf diesem Gerät gespeichert.',
  'Places you mark yourself: a fountain, a dangerous descent, a view, a note. They show on every map, for every trip.': 'Orte, die du selbst markierst: ein Brunnen, eine gefährliche Abfahrt, eine Aussicht, eine Notiz. Sie erscheinen auf jeder Karte, bei jeder Tour.',
  'What you learn on one tour is there on the next one.': 'Was du auf einer Tour lernst, ist bei der nächsten da.',
  'Your input; kept with your data and in every backup.': 'Deine Eingabe; gespeichert bei deinen Daten und in jedem Backup.',
};

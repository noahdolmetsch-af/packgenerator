// Live Navigation (Noah 28.10.2026, Handy-Test: «Timer mit Sekunden», «Distanz in m, dann km mit 2 Stellen»).
export default {
  title: 'Clear numbers on the live map',
  lead: 'Distance in metres, from 1 km with 2 decimals. The time since the start counts like a timer.',
  points: [
    { text: 'Without a route the band shows distance, time elapsed and speed', href: '#/live', go: 'f.live' },
    { text: 'The timer runs in seconds: 0:05, 12:34, 1:02:03', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'nicer', text: 'New names: Distance, Time elapsed, Speed', go: 'f.live' }],
  test: ['Start a ride without a route: at the top you see «Distanz», «Zeit verstrichen» and «Geschwindigkeit».', 'Ride a few metres: the distance counts in m, from 1 km as 1.00 km; the time counts every second.'],
  since: [],
  de: {
    'Clear numbers on the live map': 'Klare Zahlen auf der Live-Karte',
    'Distance in metres, from 1 km with 2 decimals. The time since the start counts like a timer.': 'Distanz in Metern, ab 1 km mit 2 Stellen. Die Zeit seit dem Start läuft wie ein Timer.',
    'Without a route the band shows distance, time elapsed and speed': 'Ohne Route zeigt das Band Distanz, Zeit verstrichen und Geschwindigkeit',
    'The timer runs in seconds: 0:05, 12:34, 1:02:03': 'Der Timer läuft in Sekunden: 0:05, 12:34, 1:02:03',
    'New names: Distance, Time elapsed, Speed': 'Neue Namen: Distanz, Zeit verstrichen, Geschwindigkeit',
    'Start a ride without a route: at the top you see «Distanz», «Zeit verstrichen» and «Geschwindigkeit».': 'Eine Fahrt ohne Route starten: oben stehen «Distanz», «Zeit verstrichen» und «Geschwindigkeit».',
    'Ride a few metres: the distance counts in m, from 1 km as 1.00 km; the time counts every second.': 'Ein paar Meter fahren: die Distanz zählt in m, ab 1 km als 1.00 km; die Zeit zählt jede Sekunde.',
  },
};

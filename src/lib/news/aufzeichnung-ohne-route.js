// Fix «Aufzeichnung ohne Route» (Noah 01.11.2026 «1a 2a 3a 4a 5a»): screen stays on, a GPS gap is not standing, a start without a route forgets old routes, ride log
export default {
  title: 'Recording without a route works',
  lead: 'The screen stays on while you record, a GPS gap no longer counts as standing, and a ride without a route starts clean.',
  points: [
    { text: 'The screen stays on during the recording; the app asks for the lock again if the phone takes it away', href: '#/live', go: 'f.live' },
    { text: 'A gap in the GPS is no longer counted as standing, so no false «stood for 25 min» question', href: '#/live', go: 'f.live' },
    { text: 'A ride started without a route forgets every old route, so the distance is only your own', href: '#/live', go: 'f.live' },
    { text: 'New «Ride log» on the live map: GPS points, gaps, restarts, with a button to send it', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'The log lists when the app was hidden and when the screen lock was lost', go: 'f.live' }],
  test: ['Start a ride on the live map without a route: only the distance, the time and the speed show, no old route.', 'Open «Ride log» in the panel: the points and gaps are listed; «Send the log» shares or copies the text.'],
  since: [],
  de: {
    'Recording without a route works': 'Die Aufzeichnung ohne Route funktioniert',
    'The screen stays on while you record, a GPS gap no longer counts as standing, and a ride without a route starts clean.': 'Der Bildschirm bleibt beim Aufzeichnen an, eine GPS-Lücke zählt nicht mehr als Stillstand, und eine Fahrt ohne Route startet sauber.',
    'The screen stays on during the recording; the app asks for the lock again if the phone takes it away': 'Der Bildschirm bleibt beim Aufzeichnen an; nimmt das Handy die Sperre weg, holt die App sie wieder',
    'A gap in the GPS is no longer counted as standing, so no false «stood for 25 min» question': 'Eine GPS-Lücke zählt nicht mehr als Stillstand, darum keine falsche Frage «25 Min. gestanden»',
    'A ride started without a route forgets every old route, so the distance is only your own': 'Eine Fahrt ohne Route vergisst jede alte Route, die Distanz ist nur deine eigene',
    'New «Ride log» on the live map: GPS points, gaps, restarts, with a button to send it': 'Neu «Fahrt-Protokoll» auf der Live-Karte: GPS-Punkte, Lücken, Neustarts, mit Knopf zum Schicken',
    'The log lists when the app was hidden and when the screen lock was lost': 'Das Protokoll zeigt, wann die App im Hintergrund war und wann die Bildschirmsperre verloren ging',
    'Start a ride on the live map without a route: only the distance, the time and the speed show, no old route.': 'Auf der Live-Karte eine Fahrt ohne Route starten: Es erscheinen nur Distanz, Zeit und Tempo, keine alte Route.',
    'Open «Ride log» in the panel: the points and gaps are listed; «Send the log» shares or copies the text.': 'Im Panel «Fahrt-Protokoll» öffnen: Die Punkte und Lücken stehen da; «Protokoll schicken» teilt oder kopiert den Text.',
  },
};

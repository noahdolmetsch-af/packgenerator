// «Ruhige Ansicht» Schritt 1 (Noah 02.11.2026 «bauen alles»): the calm view really lets things rest
export default {
  title: 'The calm view really rests',
  lead: 'While the calm view is on, suggestions, the «New» tile, stars and count badges are hidden.',
  points: [{ text: 'Start the calm view: suggestions and stars rest on all pages except Today', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  small: [{ box: 'new', text: 'The description now says exactly what rests', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  test: [
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «clean the bike», tap «Calm view».',
    'Open Trips: suggestions, stars and the «New» tile are gone. Tap «Done»: they are back.',
  ],
  since: [],
  de: {
    'The calm view really rests': 'Die Ruhige Ansicht ruht wirklich',
    'While the calm view is on, suggestions, the «New» tile, stars and count badges are hidden.': 'Solange die Ruhige Ansicht läuft, sind Vorschläge, die «Neu»-Kachel, Sterne und Zahlenpunkte versteckt.',
    'Start the calm view: suggestions and stars rest on all pages except Today': 'Starte die Ruhige Ansicht: Vorschläge und Sterne ruhen auf allen Seiten ausser Heute',
    'The description now says exactly what rests': 'Die Beschreibung sagt jetzt genau, was ruht',
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «clean the bike», tap «Calm view».': 'Öffne Ich › Ruhig und persönlich › Weniger App für den Moment › Ruhige Ansicht, schreib «Velo putzen», tippe «Ruhige Ansicht».',
    'Open Trips: suggestions, stars and the «New» tile are gone. Tap «Done»: they are back.': 'Öffne Touren: Vorschläge, Sterne und die «Neu»-Kachel sind weg. Tippe «Fertig»: sie sind wieder da.',
  },
};

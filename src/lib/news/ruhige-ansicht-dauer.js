// «Ruhige Ansicht» Schritt 3 (Noah 02.11.2026 «bauen alles»): a time for the calm view, with a soft end
export default {
  title: 'The calm view has a time',
  lead: 'Choose 15, 30 or 60 minutes, or no end. When the time is up, the app tells you gently.',
  points: [{ text: 'Pick how long the calm view runs; the strip says «Time is up» and offers 15 more minutes', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  small: [{ box: 'new', text: 'When the time is up, suggestions and stars come back by themselves', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  test: [
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «pack calmly», choose «15 min», tap «Calm view».',
    'The card says how many minutes are left. Choose «Until I tap «Done»» next time for no end.',
  ],
  since: [],
  de: {
    'The calm view has a time': 'Die Ruhige Ansicht hat eine Zeit',
    'Choose 15, 30 or 60 minutes, or no end. When the time is up, the app tells you gently.': 'Wähle 15, 30 oder 60 Minuten oder kein Ende. Ist die Zeit um, sagt dir die App es sanft.',
    'Pick how long the calm view runs; the strip says «Time is up» and offers 15 more minutes': 'Wähle, wie lange die Ruhige Ansicht läuft; die Leiste sagt «Zeit ist um» und bietet noch 15 Minuten an',
    'When the time is up, suggestions and stars come back by themselves': 'Ist die Zeit um, kommen Vorschläge und Sterne von selbst zurück',
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «pack calmly», choose «15 min», tap «Calm view».': 'Öffne Ich › Ruhig und persönlich › Weniger App für den Moment › Ruhige Ansicht, schreib «in Ruhe packen», wähle «15 Min.», tippe «Ruhige Ansicht».',
    'The card says how many minutes are left. Choose «Until I tap «Done»» next time for no end.': 'Die Karte sagt, wie viele Minuten noch bleiben. Wähle nächstes Mal «Bis ich «Fertig» tippe» für kein Ende.',
  },
};

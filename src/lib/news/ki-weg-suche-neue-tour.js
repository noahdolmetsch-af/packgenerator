// «KI entfernen, Schritt 1» (Noah 20.11.2026 «a»): keine Claude-Antwort mehr in Suche und Assistent, kein «Frag den Helfer» in Neue Tour
export default {
  title: 'No more Claude answers in search and New trip',
  lead: 'Search and the Assistant answer from the app itself. «Ask the helper» in New trip is gone.',
  points: [
    { text: 'Search and Assistant answer from your own data, free and on this device', go: { href: '#/assistent', where: 'Assistant: ask a question, the answer comes from the app.' } },
    { text: 'New trip starts without a Claude suggestion; the own start with templates and «Help me plan» stays', go: null },
  ],
  small: [{ box: 'fixed', text: '«Ask the helper» is no longer a function of its own in the catalogue' }],
  test: [
    'Open the Assistant, type «How many km this month?» and tap Ask: the answer comes from the app, with a link to the right place.',
    'Open Tours › New trip: there is no «Ask the helper» field, the rest works as before.',
    'Type a question with «?» in the search: no Claude answer appears above the hits.',
  ],
  since: [],
  de: {
    'No more Claude answers in search and New trip': 'Keine Claude-Antworten mehr in Suche und Neue Tour',
    'Search and the Assistant answer from the app itself. «Ask the helper» in New trip is gone.': 'Suche und Assistent antworten aus der App selbst. «Frag den Helfer» in Neue Tour gibt es nicht mehr.',
    'Search and Assistant answer from your own data, free and on this device': 'Suche und Assistent antworten aus deinen eigenen Daten, gratis und auf diesem Gerät',
    'Assistant: ask a question, the answer comes from the app.': 'Assistent: eine Frage stellen, die Antwort kommt aus der App.',
    'New trip starts without a Claude suggestion; the own start with templates and «Help me plan» stays': 'Neue Tour startet ohne Claude-Vorschlag; der eigene Start mit Vorlagen und «Hilf mir planen» bleibt',
    '«Ask the helper» is no longer a function of its own in the catalogue': '«Frag den Helfer» ist keine eigene Funktion im Katalog mehr',
    'Open the Assistant, type «How many km this month?» and tap Ask: the answer comes from the app, with a link to the right place.': 'Öffne den Assistenten, tippe «Wie viele km diesen Monat?» und tippe Fragen: die Antwort kommt aus der App, mit Link zur richtigen Stelle.',
    'Open Tours › New trip: there is no «Ask the helper» field, the rest works as before.': 'Öffne Touren › Neue Tour: es gibt kein Feld «Frag den Helfer», der Rest geht wie bisher.',
    'Type a question with «?» in the search: no Claude answer appears above the hits.': 'Tippe in der Suche eine Frage mit «?»: über den Treffern erscheint keine Claude-Antwort.',
  },
};

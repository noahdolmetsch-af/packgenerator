// «Marker» (Noah 21.11.2026, Klügere Auswertungen K1): krank, verletzt, Stress, Ferien pro Zeitraum
export default {
  title: 'Markers for sick, injured, stress and holiday',
  lead: 'Mark the days you were sick, injured, stressed or on holiday. Later evaluations can leave them out of comparisons.',
  points: [
    { text: 'New card «Markers» on «Form and recovery»: set a marker for a day or a stretch, change it or delete it, with Undo', go: { href: '#/flow/form', steps: [{ sel: '[data-marker-card]' }] } },
  ],
  small: [],
  test: ['Open Active › Form and recovery, scroll to «Markers» and tap «Set a marker»: pick «Injured» and a first and last day, then «Save».', 'The marker is in the list. Tap the bin and «Delete», then «Undo» within a few seconds: it is back.'],
  since: [],
  de: {
    'Markers for sick, injured, stress and holiday': 'Marker für krank, verletzt, Stress und Ferien',
    'Mark the days you were sick, injured, stressed or on holiday. Later evaluations can leave them out of comparisons.': 'Markiere die Tage, an denen du krank, verletzt, gestresst oder in den Ferien warst. Spätere Auswertungen können sie bei Vergleichen weglassen.',
    'New card «Markers» on «Form and recovery»: set a marker for a day or a stretch, change it or delete it, with Undo': 'Neue Karte «Marker» bei «Form und Erholung»: einen Marker für einen Tag oder einen Zeitraum setzen, ändern oder löschen, mit Rückgängig',
    'Open Active › Form and recovery, scroll to «Markers» and tap «Set a marker»: pick «Injured» and a first and last day, then «Save».': 'Öffne Aktiv › Form und Erholung, scrolle zu «Marker» und tippe «Marker setzen»: wähle «Verletzt» und einen ersten und letzten Tag, dann «Speichern».',
    'The marker is in the list. Tap the bin and «Delete», then «Undo» within a few seconds: it is back.': 'Der Marker steht in der Liste. Tippe auf den Papierkorb und «Löschen», dann in ein paar Sekunden auf «Rückgängig»: er ist zurück.',
  },
};

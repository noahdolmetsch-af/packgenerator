// v0.125.0 TZ-1 «Zustand sichtbar» (mockups TZ1–TZ2, Noah 13.10.2026 «1-5 a», «TZ1–TZ3 freigegeben»):
// the three trip states Geplant, Abgeschlossen, Bewertet (tripstate.js, ui/TripState.svelte), on Touren,
// in the trip header and on Heute.
export default {
  // the words of the states and the legend «Drei Zustände»
  'Planned|state': 'Geplant',
  'Completed|state': 'Abgeschlossen',
  'Rated|state': 'Bewertet',
  'Three states': 'Drei Zustände',
  'What do the three states mean?': 'Was heissen die drei Zustände?',
  'Still ahead of you. Packing list, date and bike can be changed any time. Templates come from here.':
    'Noch vor dir. Packliste, Datum und Velo sind jederzeit änderbar. Daraus machst du Vorlagen.',
  'Ridden: ended in the app or uploaded as a ride. The list stays as you rode it.': 'Gefahren: in der App beendet oder als Fahrt hochgeladen. Die Liste bleibt, wie du gefahren bist.',
  'Debrief saved. Its learnings help the next trip.': 'Rückblick gespeichert. Die Learnings wirken auf die nächste Tour.',
  // the small extra of the pill
  'on the way|state': 'unterwegs',
  'date passed': 'Datum vorbei',
  'debrief started': 'Rückblick angefangen',
  'debrief missing': 'Rückblick fehlt',
  // «What the app can do» (features.js f.tripstate)
  'Trip states': 'Tour-Zustände',
  'Every trip shows its state: Planned, Completed or Rated, on Touren, in the trip header and on Today.':
    'Jede Tour zeigt ihren Zustand: Geplant, Abgeschlossen oder Bewertet, unter Touren, im Tour-Kopf und auf Heute.',
  // Touren: the count line, the filter chips, «All …»
  '{n} planned': '{n} geplant',
  '{n} completed': '{n} abgeschlossen',
  '{n} rated': '{n} bewertet',
  'Show trips': 'Touren zeigen',
  'All|trips': 'Alle',
  'All {n} completed trips': 'Alle {n} abgeschlossenen Touren',
  'All {n} rated trips': 'Alle {n} bewerteten Touren',
};

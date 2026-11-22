// «Was auffällt» (Noah 21.11.2026, Klügere Auswertungen K3): Ruhepuls der letzten Tage gegen das Normal, als Beobachtung und Frage
export default {
  title: 'What stands out',
  lead: 'When your resting pulse of the last days is clearly above your normal, the app says so and asks whether you want to set a marker.',
  points: [
    { text: 'New card «What stands out» on «Form and recovery»: only an observation and a question, never a cause or advice', go: { href: '#/flow/form', steps: [{ sel: '[data-auffaellt]' }] } },
  ],
  small: [{ box: 'new', text: 'Marked days do not count into your normal' }],
  test: ['Open Active › Form and recovery and scroll to «What stands out»: it says either that nothing stands out or how many beats above your normal your resting pulse is.', 'Open «How it is counted» and change «Beats above the normal»: the card may react. «Back to the usual values» undoes it.'],
  since: [],
  de: {
    'What stands out': 'Was auffällt',
    'When your resting pulse of the last days is clearly above your normal, the app says so and asks whether you want to set a marker.': 'Wenn dein Ruhepuls der letzten Tage deutlich über deinem Normal liegt, sagt die App es und fragt, ob du einen Marker setzen möchtest.',
    'New card «What stands out» on «Form and recovery»: only an observation and a question, never a cause or advice': 'Neue Karte «Was auffällt» bei «Form und Erholung»: nur eine Beobachtung und eine Frage, nie eine Ursache oder ein Ratschlag',
    'Marked days do not count into your normal': 'Markierte Tage zählen nicht zu deinem Normal',
    'Open Active › Form and recovery and scroll to «What stands out»: it says either that nothing stands out or how many beats above your normal your resting pulse is.': 'Öffne Aktiv › Form und Erholung und scrolle zu «Was auffällt»: Dort steht entweder, dass nichts auffällt, oder wie viele Schläge dein Ruhepuls über deinem Normal liegt.',
    'Open «How it is counted» and change «Beats above the normal»: the card may react. «Back to the usual values» undoes it.': 'Öffne «So gerechnet» und ändere «Schläge über dem Normal»: Die Karte kann reagieren. «Zurück zu den üblichen Werten» macht es rückgängig.',
  },
};

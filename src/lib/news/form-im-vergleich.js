// «Form im Vergleich zu früher» (Noah 21.11.2026, Klügere Auswertungen K2): dieselben Monate jedes Jahres nebeneinander
export default {
  title: 'Form compared with earlier',
  lead: 'Watt per heartbeat, resting pulse and hours of the same months, year against year, with the note how sure the statement is.',
  points: [
    { text: 'New card «Form compared with earlier» on «Form and recovery»: May to October of this year against the years before', go: { href: '#/flow/form', steps: [{ sel: '[data-vergleich]' }] } },
  ],
  small: [{ box: 'new', text: 'Under «How it is counted» the two limits can be changed' }],
  test: ['Open Active › Form and recovery and scroll to «Form compared with earlier»: you see a label (Sure, Tendency or Too little data), a sentence and a row per year.', 'Open «How it is counted» and change «Fewest rides per year»: the label may change. «Back to the usual values» undoes it.'],
  since: [],
  de: {
    'Form compared with earlier': 'Form im Vergleich zu früher',
    'Watt per heartbeat, resting pulse and hours of the same months, year against year, with the note how sure the statement is.': 'Watt je Herzschlag, Ruhepuls und Stunden derselben Monate, Jahr gegen Jahr, mit dem Hinweis, wie sicher die Aussage ist.',
    'New card «Form compared with earlier» on «Form and recovery»: May to October of this year against the years before': 'Neue Karte «Form im Vergleich zu früher» bei «Form und Erholung»: Mai bis Oktober dieses Jahres gegen die Jahre davor',
    'Under «How it is counted» the two limits can be changed': 'Unter «So gerechnet» lassen sich die zwei Grenzen ändern',
    'Open Active › Form and recovery and scroll to «Form compared with earlier»: you see a label (Sure, Tendency or Too little data), a sentence and a row per year.': 'Öffne Aktiv › Form und Erholung und scrolle zu «Form im Vergleich zu früher»: Du siehst ein Etikett (Sicher, Tendenz oder Zu wenig Daten), einen Satz und eine Zeile pro Jahr.',
    'Open «How it is counted» and change «Fewest rides per year»: the label may change. «Back to the usual values» undoes it.': 'Öffne «So gerechnet» und ändere «Mindestens Fahrten pro Jahr»: Das Etikett kann sich ändern. «Zurück zu den üblichen Werten» macht es rückgängig.',
  },
};

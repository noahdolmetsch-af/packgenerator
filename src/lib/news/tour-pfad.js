// «Tour-Pfad» (Noah 08.11.2026 «1 go A», Tour von A bis Z, Schritt 1): eine Tour als Pfad in vier Phasen
export default {
  title: 'Tour path',
  lead: 'Where your tour stands, in four phases from the idea to the debrief.',
  points: [
    { text: 'Planning, preparing, on the way, afterwards: every row opens the page where you do it', go: { href: '#/trips', where: 'Open a tour and tap «Tour path» under the steps.' } },
    { text: 'One big button leads to the next open row of the current phase', go: { href: '#/trips', where: 'Open a tour and tap «Tour path» under the steps.' } },
  ],
  small: [{ box: 'new', text: 'Every tour page has a link «Tour path» under the steps' }],
  test: [
    'Open a tour and tap «Tour path» under the steps: the path of the tour opens.',
    'Read the four phases; the current one is open, tap another to look into it.',
    'Tap the big button: you land on the first open row, for example Packing.',
  ],
  since: ['f.tourpfad'],
  de: {
    'Tour path': 'Tour-Pfad',
    'Where your tour stands, in four phases from the idea to the debrief.': 'Wo deine Tour steht, in vier Phasen von der Idee bis zum Rückblick.',
    'Planning, preparing, on the way, afterwards: every row opens the page where you do it': 'Planen, Vorbereiten, Unterwegs, Danach: Jede Zeile öffnet die Seite, auf der du es machst',
    'Open a tour and tap «Tour path» under the steps.': 'Öffne eine Tour und tippe unter den Schritten auf «Tour-Pfad».',
    'One big button leads to the next open row of the current phase': 'Ein grosser Knopf führt zur nächsten offenen Zeile der laufenden Phase',
    'Every tour page has a link «Tour path» under the steps': 'Jede Tour-Seite hat unter den Schritten einen Link «Tour-Pfad»',
    'Open a tour and tap «Tour path» under the steps: the path of the tour opens.': 'Öffne eine Tour und tippe unter den Schritten auf «Tour-Pfad»: Der Pfad der Tour öffnet sich.',
    'Read the four phases; the current one is open, tap another to look into it.': 'Lies die vier Phasen; die laufende ist offen, tippe eine andere an, um hineinzusehen.',
    'Tap the big button: you land on the first open row, for example Packing.': 'Tippe den grossen Knopf: Du landest bei der ersten offenen Zeile, zum Beispiel Packen.',
  },
};

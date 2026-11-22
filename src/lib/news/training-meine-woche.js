// «Meine Woche» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 3): the card of Training that plans the week by hand has its own name
export default {
  title: 'Training: «My week» and the way to the Wochenplan',
  lead: 'The card for planning your training week by hand is now called «My week». «Plan the week» stays the place Planen › Woche. The «Wochenplan» is one tap away on the card.',
  points: [
    { text: 'On Training the card «My week» has the link «Weekly plan» next to «Training plans»', go: { href: '#/flow/training', steps: [{ sel: '#plan-h' }], where: 'Training, the card above the look back.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training: the card with the days is called «My week».',
    'At the top right of the card tap «Wochenplan»: the page with the hours per week opens.',
  ],
  since: [],
  de: {
    'Training: «My week» and the way to the Wochenplan': 'Training: «Meine Woche» und der Weg zum Wochenplan',
    'The card for planning your training week by hand is now called «My week». «Plan the week» stays the place Planen › Woche. The «Wochenplan» is one tap away on the card.': 'Die Karte, in der du deine Trainingswoche von Hand planst, heisst jetzt «Meine Woche». «Woche planen» bleibt der Ort Planen › Woche. Der «Wochenplan» ist auf der Karte einen Tipp entfernt.',
    'On Training the card «My week» has the link «Weekly plan» next to «Training plans»': 'Auf Training hat die Karte «Meine Woche» den Link «Wochenplan» neben «Trainingspläne»',
    'Training, the card above the look back.': 'Training, die Karte über dem Rückblick.',
    'Open Aktiv › Training: the card with the days is called «My week».': 'Öffne Aktiv › Training: Die Karte mit den Tagen heisst «Meine Woche».',
    'At the top right of the card tap «Wochenplan»: the page with the hours per week opens.': 'Tippe oben rechts an der Karte auf «Wochenplan»: Die Seite mit den Stunden pro Woche öffnet sich.',
  },
};

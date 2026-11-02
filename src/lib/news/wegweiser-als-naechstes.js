// «Wegweiser statt Katalog» PR 9 (Noah 01.11.2026 «1a 2a 3a 4a 5a», answer 3a): «As next» right after an action
export default {
  title: 'What comes next, right after',
  lead: 'After a saved ride, «All packed» and a care job, one line shows what fits next.',
  points: [
    {
      text: 'Ride saved: «As next» with wear of the parts and the logbook',
      go: { href: '#/debrief/ride', where: 'Shows in the card «Ride saved» right after you upload a ride.' },
    },
    {
      text: '«All packed» and a care job done: «As next» with weather, the tour day sheet, setup log and spare parts',
      go: { href: '#/pack', where: 'Shows in the message after «All packed» and after a care job is saved as done.' },
    },
  ],
  small: [],
  test: [
    'Upload a ride (GPX): the card «Ride saved» has the line «As next» with Wear and Logbook.',
    'In Bike care mark a job as done: the message at the bottom has «As next» with Setup log and Spare parts at home.',
  ],
  since: [],
  de: {
    'What comes next, right after': 'Was als Nächstes passt, gleich danach',
    'After a saved ride, «All packed» and a care job, one line shows what fits next.': 'Nach einer gespeicherten Fahrt, nach «Alles gepackt» und nach einer Pflege zeigt eine Zeile, was als Nächstes passt.',
    'Ride saved: «As next» with wear of the parts and the logbook': 'Fahrt gespeichert: «Als Nächstes» mit Verschleiss der Teile und dem Logbuch',
    'Shows in the card «Ride saved» right after you upload a ride.': 'Erscheint in der Karte «Fahrt gespeichert», gleich nachdem du eine Fahrt hochgeladen hast.',
    '«All packed» and a care job done: «As next» with weather, the tour day sheet, setup log and spare parts': '«Alles gepackt» und Pflege erledigt: «Als Nächstes» mit Wetter, Tourtag-Blatt, Setup-Logbuch und Ersatzteilen',
    'Shows in the message after «All packed» and after a care job is saved as done.': 'Erscheint in der Meldung nach «Alles gepackt» und nachdem eine Pflege als erledigt gespeichert ist.',
    'Upload a ride (GPX): the card «Ride saved» has the line «As next» with Wear and Logbook.': 'Lade eine Fahrt hoch (GPX): die Karte «Fahrt gespeichert» hat die Zeile «Als Nächstes» mit Verschleiss und Logbuch.',
    'In Bike care mark a job as done: the message at the bottom has «As next» with Setup log and Spare parts at home.': 'Markiere in der Velopflege eine Arbeit als erledigt: die Meldung unten hat «Als Nächstes» mit Setup-Logbuch und Ersatzteile zu Hause.',
  },
};

// «Träume und Neuland» N11 (Noah 27.10.2026 «1-5 a»): Heute, eine ruhige Zeile nach einer Fahrt
export default {
  title: 'New since yesterday',
  lead: 'After a ride, Today says what you reached for the first time.',
  points: [{ text: 'Today: one quiet line «New since yesterday: 3 municipalities, 1 lake»; a tap opens New ground', href: '#/neuland', go: 'f.newtoday' }, { text: 'New ground shows the same line on top, with one button per collection', href: '#/neuland', go: 'f.newtoday' }],
  small: [{ box: 'new', text: 'Only on the day of a ride and the day after; × closes it until something new comes', go: 'f.newtoday' }],
  test: [
    'Ride somewhere you have never been (or tick a place in New ground).',
    'Today shows «New since yesterday: …»; tap it: New ground opens.',
    'In New ground the same line is on top; a button in it opens that collection.',
    'Back on Today, tap ×: the line goes and stays away after a reload.',
  ],
  since: ['f.newtoday'],
  de: {
    'New since yesterday': 'Neu seit gestern',
    'After a ride, Today says what you reached for the first time.': 'Nach einer Fahrt sagt Heute, was du zum ersten Mal erreicht hast.',
    'Today: one quiet line «New since yesterday: 3 municipalities, 1 lake»; a tap opens New ground': 'Heute: eine ruhige Zeile «Neu seit gestern: 3 Gemeinden, 1 See»; ein Tipp öffnet Neuland',
    'Only on the day of a ride and the day after; × closes it until something new comes': 'Nur am Tag einer Fahrt und am Tag danach; × schliesst sie, bis wieder etwas neu ist',
    'Ride somewhere you have never been (or tick a place in New ground).': 'Fahr irgendwohin, wo du noch nie warst (oder hake in Neuland einen Ort ab).',
    'Today shows «New since yesterday: …»; tap it: New ground opens.': 'Heute zeigt «Neu seit gestern: …»; antippen: Neuland öffnet sich.',
    'Back on Today, tap ×: the line goes and stays away after a reload.': 'Zurück auf Heute ×: die Zeile geht und bleibt auch nach dem Neuladen weg.',
    'New ground shows the same line on top, with one button per collection': 'Neuland zeigt dieselbe Zeile oben, mit einem Knopf pro Sammlung',
    'In New ground the same line is on top; a button in it opens that collection.': 'In Neuland steht oben dieselbe Zeile; ein Knopf darin öffnet die Sammlung.',
  },
};

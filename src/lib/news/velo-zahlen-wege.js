// «Velo-Zahlen als Wege» (UI-Prüfung 07.11.2026, Noah «alle Vorschläge», V1): km, costs, care and the next trip lead somewhere
export default {
  title: 'Bike numbers lead somewhere',
  lead: 'On Bikes, the kilometres, the costs, the care status and the next trip are now ways: tap them.',
  points: [
    { text: 'The kilometres of a bike open the part «Bikes» of Analyse', go: { href: '#/bikes', steps: [{ sel: '[data-bike-km-link]' }] } },
    { text: 'The costs under the bike’s name open the year of that bike', go: { href: '#/bikes', steps: [{ sel: '[data-bike-cost-link]' }] } },
    { text: '«Nothing due» or «n due» on a bike card opens its care, and «next trip» opens that trip’s packing list', go: { href: '#/bikes', steps: [{ sel: '[data-card-status]' }] } },
  ],
  small: [],
  test: ['Open Bikes and tap the kilometres of a bike: Analyse opens on «Bikes».', 'Go back, tap «nothing due» (or «n due») on a bike card: the care of that bike opens.', 'Go back, tap «next trip: …» under the title: the packing list of that trip opens.'],
  since: [],
  de: {
    'Bike numbers lead somewhere': 'Velo-Zahlen führen weiter',
    'On Bikes, the kilometres, the costs, the care status and the next trip are now ways: tap them.': 'Bei Velos sind Kilometer, Kosten, Pflegestand und nächste Tour jetzt Wege: tippe sie an.',
    'The kilometres of a bike open the part «Bikes» of Analyse': 'Die Kilometer eines Velos öffnen den Teil «Velos» der Analyse',
    'The costs under the bike’s name open the year of that bike': 'Die Kosten unter dem Namen des Velos öffnen das Jahr dieses Velos',
    '«Nothing due» or «n due» on a bike card opens its care, and «next trip» opens that trip’s packing list': '«Nichts fällig» oder «n fällig» auf einer Velo-Karte öffnet die Pflege, und «nächste Tour» öffnet die Packliste dieser Tour',
    'Open Bikes and tap the kilometres of a bike: Analyse opens on «Bikes».': 'Öffne Velos und tippe auf die Kilometer eines Velos: die Analyse öffnet sich bei «Velos».',
    'Go back, tap «nothing due» (or «n due») on a bike card: the care of that bike opens.': 'Geh zurück, tippe auf einer Velo-Karte «nichts fällig» (oder «n fällig»): die Pflege dieses Velos öffnet sich.',
    'Go back, tap «next trip: …» under the title: the packing list of that trip opens.': 'Geh zurück, tippe unter dem Titel auf «nächste Tour: …»: die Packliste dieser Tour öffnet sich.',
  },
};

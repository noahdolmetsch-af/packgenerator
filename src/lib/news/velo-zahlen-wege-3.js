// «Velo-Zahlen als Wege» Teil 3 (Noah 08.11.2026, Durchsicht der Bilder): a shorter trip line, «n due» said once, the km open the whole year
export default {
  title: 'Bike numbers: clearer',
  lead: 'The trip line under the title is shorter, «3 due» is said once, and the kilometres of a bike open the whole year.',
  points: [
    { text: 'The line «next trip» no longer repeats the bike you are looking at, and «n due» is not said twice', go: { href: '#/bikes', steps: [{ sel: '[data-bike-ride]' }], where: 'Shows under the title of Bikes when a trip is planned with a bike.' } },
    { text: 'The kilometres of a bike open Analyse for the whole year, and an empty page says where the number comes from', go: { href: '#/bikes', steps: [{ sel: '[data-bike-km-link]' }] } },
    { text: 'A part on the shopping list says which bike it is for', go: { href: '#/bikes?tab=care&view=wear', steps: [{ sel: '[data-wear-shop]' }], where: 'Shows on the page Wear at a part that is due or soon, when you have several bikes.' } },
  ],
  small: [],
  test: ['Open Bikes: the line «next trip: …» under the title has no bike name when the trip is on this bike; on another bike it names it and shows «fits» or «n due».', 'Tap the kilometres of a bike: Analyse shows the whole year; with no counted rides it says that the number comes from the bike itself.', 'Open Bikes › Care › Wear, tap «On the shopping list» at a part: the entry says «Part (Bike)».'],
  since: [],
  de: {
    'Bike numbers: clearer': 'Velo-Zahlen: klarer',
    'The trip line under the title is shorter, «3 due» is said once, and the kilometres of a bike open the whole year.': 'Die Tour-Zeile unter dem Titel ist kürzer, «3 fällig» steht nur einmal, und die Kilometer eines Velos öffnen das ganze Jahr.',
    'The line «next trip» no longer repeats the bike you are looking at, and «n due» is not said twice': 'Die Zeile «nächste Tour» wiederholt das Velo nicht mehr, das du gerade ansiehst, und «n fällig» steht nicht doppelt',
    'The kilometres of a bike open Analyse for the whole year, and an empty page says where the number comes from': 'Die Kilometer eines Velos öffnen die Analyse für das ganze Jahr, und eine leere Seite sagt, woher die Zahl kommt',
    'A part on the shopping list says which bike it is for': 'Ein Teil auf der Einkaufsliste sagt, für welches Velo es ist',
    'Shows on the page Wear at a part that is due or soon, when you have several bikes.': 'Steht auf der Seite Verschleiss bei einem Teil, das fällig oder bald dran ist, wenn du mehrere Velos hast.',
    'Open Bikes: the line «next trip: …» under the title has no bike name when the trip is on this bike; on another bike it names it and shows «fits» or «n due».': 'Öffne Velos: Die Zeile «nächste Tour: …» unter dem Titel hat keinen Velo-Namen, wenn die Tour mit diesem Velo ist; bei einem anderen Velo nennt sie es und zeigt «passt» oder «n fällig».',
    'Tap the kilometres of a bike: Analyse shows the whole year; with no counted rides it says that the number comes from the bike itself.': 'Tippe auf die Kilometer eines Velos: Die Analyse zeigt das ganze Jahr; ohne gezählte Fahrten steht dort, dass die Zahl vom Velo selbst kommt.',
    'Open Bikes › Care › Wear, tap «On the shopping list» at a part: the entry says «Part (Bike)».': 'Öffne Velos › Pflege › Verschleiss und tippe bei einem Teil «Auf die Einkaufsliste»: Der Eintrag heisst «Teil (Velo)».',
  },
};

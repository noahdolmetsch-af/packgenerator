// «Velo-Zahlen als Wege» Teil 2 (UI-Prüfung 07.11.2026, Noah «alles in einem PR»): one bike in Analyse, «fits», weight, bags, shopping list
export default {
  title: 'Bike numbers lead further',
  lead: 'The kilometres open only that bike in Analyse, the next trip says whether the bike fits it, and a worn part goes on the shopping list.',
  points: [
    { text: 'The kilometres of a bike open Analyse › Bikes with only that bike, and «All bikes» brings the rest back', go: { href: '#/bikes', steps: [{ sel: '[data-bike-km-link]' }] } },
    { text: 'Under the title the next trip says whether the bike fits it (care due before the trip); weight and bags lead to their pages', go: { href: '#/bikes', steps: [{ sel: '[data-bike-ride-fit]' }], where: 'Shows under the title of Bikes when a trip is planned with a bike.' } },
    { text: 'On the page «Wear» a part that is due or soon goes on the shopping list in one tap, with Undo', go: { href: '#/bikes?tab=care&view=wear', steps: [{ sel: '[data-wear-shop]' }], where: 'Shows on the page Wear at a part that is due or soon.' } },
  ],
  small: [{ box: 'new', text: 'The line «7 points without data» on a bike card opens its care' }],
  test: ['Open Bikes and tap the kilometres of a bike: Analyse opens on «Bikes» with only that bike; «All bikes» shows all of them.', 'Under the title tap the mark after «next trip: …»: the care of that bike opens.', 'Open Bikes › Care › Wear and tap «On the shopping list» at a part that is due: it is on the list, and Undo takes it off.'],
  since: [],
  de: {
    'Bike numbers lead further': 'Velo-Zahlen führen weiter',
    'The kilometres open only that bike in Analyse, the next trip says whether the bike fits it, and a worn part goes on the shopping list.': 'Die Kilometer öffnen in der Analyse nur dieses Velo, die nächste Tour sagt, ob das Velo passt, und ein abgenutztes Teil kommt auf die Einkaufsliste.',
    'The kilometres of a bike open Analyse › Bikes with only that bike, and «All bikes» brings the rest back': 'Die Kilometer eines Velos öffnen Analyse › Velos nur mit diesem Velo, und «Alle Velos» holt die anderen zurück',
    'Under the title the next trip says whether the bike fits it (care due before the trip); weight and bags lead to their pages': 'Unter dem Titel sagt die nächste Tour, ob das Velo passt (Pflege vor der Tour fällig); Gewicht und Taschen führen zu ihren Seiten',
    'On the page «Wear» a part that is due or soon goes on the shopping list in one tap, with Undo': 'Auf der Seite «Verschleiss» kommt ein Teil, das fällig oder bald dran ist, mit einem Tipp auf die Einkaufsliste, mit Rückgängig',
    'Shows under the title of Bikes when a trip is planned with a bike.': 'Steht bei Velos unter dem Titel, wenn eine Tour mit einem Velo geplant ist.',
    'Shows on the page Wear at a part that is due or soon.': 'Steht auf der Seite Verschleiss bei einem Teil, das fällig oder bald dran ist.',
    'The line «7 points without data» on a bike card opens its care': 'Die Zeile «7 Punkte ohne Daten» auf einer Velo-Karte öffnet die Pflege',
    'Open Bikes and tap the kilometres of a bike: Analyse opens on «Bikes» with only that bike; «All bikes» shows all of them.': 'Öffne Velos und tippe auf die Kilometer eines Velos: die Analyse öffnet sich bei «Velos» nur mit diesem Velo; «Alle Velos» zeigt alle.',
    'Under the title tap the mark after «next trip: …»: the care of that bike opens.': 'Tippe unter dem Titel auf die Marke nach «nächste Tour: …»: die Pflege dieses Velos öffnet sich.',
    'Open Bikes › Care › Wear and tap «On the shopping list» at a part that is due: it is on the list, and Undo takes it off.': 'Öffne Velos › Pflege › Verschleiss und tippe bei einem fälligen Teil «Auf die Einkaufsliste»: es steht auf der Liste, und Rückgängig nimmt es wieder weg.',
  },
};

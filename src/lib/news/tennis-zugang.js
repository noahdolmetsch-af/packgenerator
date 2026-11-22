// «Tennis erreichen» (Noah 08.11.2026 «a»): the offers page had no way in from the app
export default {
  title: 'Tennis offers are easy to find',
  lead: 'Your tennis offers and requests had no entry in the app. Now there is one on Me and one on the Tennis page.',
  points: [
    { text: 'Me has a «Tennis» row: «Offers and requests»', go: { href: '#/me', steps: [{ sel: '[data-me-row="tennis"]' }] } },
    { text: 'The Tennis page has a card «Offer lessons» with the same button', go: { href: '#/flow/sport/act%3Atennis', steps: [{ sel: '[data-tennis-offers]' }] } },
  ],
  small: [{ box: 'fixed', text: 'Clearer field names in an offer: places per kind and the single place', go: null }],
  test: [
    'Open Me: the section «Tennis» has the row «Offers and requests». Tap it: the page «Tennis» with its tabs opens.',
    'Open Active › Tennis: halfway down the card «Offer lessons» has the button «Offers and requests». Tap it: same page.',
    'In an offer tap «Change» next to «How booking works»: each kind has «Places» (the number of children), the single place field is separate from «Places to choose from».',
  ],
  since: [],
  de: {
    'Tennis offers are easy to find': 'Tennis-Angebote sind leicht zu finden',
    'Your tennis offers and requests had no entry in the app. Now there is one on Me and one on the Tennis page.': 'Deine Tennis-Angebote und Anfragen hatten in der App keinen Zugang. Jetzt gibt es einen auf Ich und einen auf der Tennis-Seite.',
    'Me has a «Tennis» row: «Offers and requests»': 'Ich hat eine Zeile «Tennis»: «Angebote und Anfragen»',
    'The Tennis page has a card «Offer lessons» with the same button': 'Die Tennis-Seite hat eine Karte «Stunden anbieten» mit demselben Knopf',
    'Clearer field names in an offer: places per kind and the single place': 'Klarere Feldnamen im Angebot: Plätze pro Art und das einzelne Ort-Feld',
    'Open Me: the section «Tennis» has the row «Offers and requests». Tap it: the page «Tennis» with its tabs opens.': 'Öffne Ich: der Abschnitt «Tennis» hat die Zeile «Angebote und Anfragen». Tippe darauf: die Seite «Tennis» mit ihren Tabs öffnet sich.',
    'Open Active › Tennis: halfway down the card «Offer lessons» has the button «Offers and requests». Tap it: same page.': 'Öffne Aktiv › Tennis: in der Mitte hat die Karte «Stunden anbieten» den Knopf «Angebote und Anfragen». Tippe darauf: dieselbe Seite.',
    'In an offer tap «Change» next to «How booking works»: each kind has «Places» (the number of children), the single place field is separate from «Places to choose from».': 'Tippe in einem Angebot bei «So wird gebucht» auf «Ändern»: jede Art hat «Plätze» (Anzahl Kinder), das einzelne Feld «Ort» steht getrennt von «Orte zur Auswahl».',
  },
};

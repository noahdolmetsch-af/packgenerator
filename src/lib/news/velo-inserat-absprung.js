// «Velos-Pflege einbauen» (Noah 03.11.2026 «3a»): the sale listing where you need it, and the way back to retiring
export default {
  title: 'Sale listing when you retire a bike',
  lead: 'When you retire a bike as sold, the sale listing is one tap away, and after copying it «Retire this bike now» follows.',
  points: [
    { text: 'In «Retire bike» with the reason «Sold»: «Write the sale listing»', go: { href: '#/bikes', steps: [{ sel: '.bmenu button' }] } },
    { text: 'On the listing page, after «Copy»: «Retire this bike now»', go: { href: '#/bikes?tab=care&view=sell', steps: [{ sel: '[data-sell-copy]' }] } },
  ],
  small: [],
  test: [
    'Open Bikes, tap the «…» menu of a bike, choose «Retire bike»: with «Sold» the card «Write the sale listing» shows.',
    'Tap it, then «Copy»: below the text «Retire this bike now» appears and opens the same window.',
  ],
  since: [],
  de: {
    'Sale listing when you retire a bike': 'Inserat beim Ausmustern eines Velos',
    'When you retire a bike as sold, the sale listing is one tap away, and after copying it «Retire this bike now» follows.': 'Musterst du ein Velo als verkauft aus, ist das Inserat einen Tipp entfernt, und nach dem Kopieren folgt «Velo jetzt ausmustern».',
    'In «Retire bike» with the reason «Sold»: «Write the sale listing»': 'In «Velo ausmustern» mit dem Grund «Verkauft»: «Inserat schreiben»',
    'On the listing page, after «Copy»: «Retire this bike now»': 'Auf der Inserat-Seite nach «Kopieren»: «Velo jetzt ausmustern»',
    'Open Bikes, tap the «…» menu of a bike, choose «Retire bike»: with «Sold» the card «Write the sale listing» shows.': 'Öffne Velos, tippe auf das «…»-Menü eines Velos und wähle «Velo ausmustern»: bei «Verkauft» steht die Karte «Inserat schreiben».',
    'Tap it, then «Copy»: below the text «Retire this bike now» appears and opens the same window.': 'Tippe darauf, dann auf «Kopieren»: unter dem Text steht «Velo jetzt ausmustern» und öffnet dasselbe Fenster.',
  },
};

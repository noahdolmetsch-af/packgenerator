// «Abhaken» auf Heute (Noah 22.11.2026 «ja»): a chip under the greeting leads to «Tick off today»
export default {
  title: 'Tick off from Today',
  lead: 'Since Active sits under Week › Training, a new chip «Tick off» under the greeting of Today opens «Tick off today» in one tap.',
  points: [
    { text: 'Today: the chip «Tick off» next to «Ride today» opens «Tick off today»', go: { href: '#/', steps: [{ sel: '[data-goal="tick"]' }] } },
    { text: 'Like the other chips it can be switched off or moved, under «Chips under the greeting»', go: { href: '#/', where: 'Today › end of the page › Customise this page › Chips under the greeting.' } },
  ],
  small: [],
  test: ['Open Today: under the greeting stands the chip «Tick off». Tap it: «Tick off today» opens with your tiles.', 'On Today, at the end of the page, tap «Customise this page» and switch «Tick off» off: the chip is gone, everything else stays.'],
  since: [],
  de: {
    'Tick off from Today': 'Abhaken von Heute aus',
    'Since Active sits under Week › Training, a new chip «Tick off» under the greeting of Today opens «Tick off today» in one tap.': 'Seit Aktiv unter Woche › Training steht, öffnet ein neuer Chip «Abhaken» unter dem Gruss auf Heute «Heute abhaken» mit einem Tipp.',
    'Today: the chip «Tick off» next to «Ride today» opens «Tick off today»': 'Heute: der Chip «Abhaken» neben «Heute fahren» öffnet «Heute abhaken»',
    'Like the other chips it can be switched off or moved, under «Chips under the greeting»': 'Wie die anderen Chips lässt er sich ausschalten oder verschieben, unter «Chips unter dem Gruss»',
    'Today › end of the page › Customise this page › Chips under the greeting.': 'Heute › Seitenende › Diese Seite anpassen › Chips unter dem Gruss.',
    'Open Today: under the greeting stands the chip «Tick off». Tap it: «Tick off today» opens with your tiles.': 'Öffne Heute: Unter dem Gruss steht der Chip «Abhaken». Tippe ihn an: «Heute abhaken» öffnet sich mit deinen Kacheln.',
    'On Today, at the end of the page, tap «Customise this page» and switch «Tick off» off: the chip is gone, everything else stays.': 'Tippe auf Heute am Seitenende «Diese Seite anpassen» und schalte «Abhaken» aus: Der Chip ist weg, alles andere bleibt.',
  },
};

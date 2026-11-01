// «Heute als Begleiter» PR 4 (Noah 28.10.2026 «1a 2a 3a»): the card «Your moment» on Today
export default {
  title: 'Your moment on Today',
  lead: 'Today names the moment you are in and offers one next step.',
  points: [{ text: 'Under your habits stands «Your moment»: packing, on the way, back home … with the five steps of a trip and one button for the next step', href: '#/trips', go: { href: '#/', steps: [{ sel: '[data-section="moment"]' }], where: 'Shows on Today under your habits.' } }],
  small: [{ box: 'new', text: 'Move or remove the card under «Customise the start page»', go: null }],
  test: ['Open Today: under your habits stands «Your moment: …» with a button for the next step.', 'Tap the button: it opens the place for that step, for example the packing list.'],
  since: [],
  de: {
    'Your moment on Today': 'Dein Moment auf Heute',
    'Today names the moment you are in and offers one next step.': 'Heute nennt den Moment, in dem du bist, und bietet einen nächsten Schritt an.',
    'Under your habits stands «Your moment»: packing, on the way, back home … with the five steps of a trip and one button for the next step': 'Unter deinen Gewohnheiten steht «Dein Moment»: packen, unterwegs, zurück … mit den fünf Schritten einer Tour und einem Knopf für den nächsten Schritt',
    'Shows on Today under your habits.': 'Zeigt sich auf Heute unter deinen Gewohnheiten.',
    'Move or remove the card under «Customise the start page»': 'Verschiebe oder entferne die Karte unter «Startseite anpassen»',
    'Open Today: under your habits stands «Your moment: …» with a button for the next step.': 'Öffne Heute: Unter deinen Gewohnheiten steht «Dein Moment: …» mit einem Knopf für den nächsten Schritt.',
    'Tap the button: it opens the place for that step, for example the packing list.': 'Tippe auf den Knopf: Er öffnet den Ort für diesen Schritt, zum Beispiel die Packliste.',
  },
};

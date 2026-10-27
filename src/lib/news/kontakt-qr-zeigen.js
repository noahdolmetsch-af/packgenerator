// Kontakt-QR-Code step 2 (Noah 27.10.2026 «1a 4a»): the card shows until a day you pick (soft, the page then says
// «expired»), «Show big» puts the code alone on the screen, and «Straight to contacts» puts the contact itself in the code
export default {
  title: 'Big and on time',
  lead: 'Show your contact card big, and decide how long it shows.',
  points: [
    { text: '«Show big»: the QR code alone on a bright screen', href: '#/me/freunde?tab=card' },
    { text: 'The card shows today only, a week, a month or always', href: '#/me/freunde?tab=card' },
  ],
  small: [{ box: 'new', text: '«Straight to contacts»: the phone saves you right away, also without internet' }],
  test: [
    'Open Me › With friends › Contact card and tap «1 week»: below it says until which day the card shows.',
    'Tap «Show big»: the code fills the screen; close it with ×.',
    'Tap «Straight to contacts» and scan the code with a second phone: it offers to save the contact at once.',
  ],
  since: [],
  de: {
    'Big and on time': 'Gross und mit Ablauf',
    'Show your contact card big, and decide how long it shows.': 'Zeig deine Kontaktkarte gross und bestimme, wie lange sie gilt.',
    '«Show big»: the QR code alone on a bright screen': '«Gross zeigen»: der QR-Code allein auf hellem Bildschirm',
    'The card shows today only, a week, a month or always': 'Die Karte gilt nur heute, eine Woche, einen Monat oder immer',
    '«Straight to contacts»: the phone saves you right away, also without internet': '«Direkt Kontakte»: Das Handy speichert dich sofort, auch ohne Internet',
    'Open Me › With friends › Contact card and tap «1 week»: below it says until which day the card shows.':
      'Öffne Ich › Mit Freunden › Kontaktkarte und tippe «1 Woche»: Darunter steht, bis zu welchem Tag die Karte gilt.',
    'Tap «Show big»: the code fills the screen; close it with ×.': 'Tippe «Gross zeigen»: Der Code füllt den Bildschirm; mit × schliessen.',
    'Tap «Straight to contacts» and scan the code with a second phone: it offers to save the contact at once.':
      'Tippe «Direkt Kontakte» und scanne den Code mit einem zweiten Handy: Es bietet sofort an, den Kontakt zu speichern.',
  },
};

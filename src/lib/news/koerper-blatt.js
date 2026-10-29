// «Neuer Schwung» Blatt von unten (Noah 27.10.2026 «a»): on a phone «Dein Körper heute» opens a sheet with a ring
// per value, this week next to the week before and «All body values»; the computer keeps the link
export default {
  title: 'Your body at a glance',
  lead: 'On the phone «Your body today» opens a sheet from below.',
  points: [{ text: 'A ring per value shows where today stands in your last 4 weeks', href: '#/me/insights', go: { href: '#/', where: 'On the phone, tap «Details» in «Your body today» on Today.' } }],
  small: [{ box: 'nicer', text: 'This week next to the week before, and «All body values» one tap away', go: { href: '#/', where: 'On the phone, tap «Details» in «Your body today» on Today.' } }],
  test: ['On the phone open Today and tap «Details» in «Your body today»: a sheet comes up from below with four rings.', 'Tap «All body values»: the page with all values opens.'],
  since: [],
  de: {
    'Your body at a glance': 'Dein Körper auf einen Blick',
    'On the phone «Your body today» opens a sheet from below.': 'Am Handy öffnet «Dein Körper heute» ein Blatt von unten.',
    'A ring per value shows where today stands in your last 4 weeks': 'Ein Ring pro Wert zeigt, wo heute in deinen letzten 4 Wochen steht',
    'This week next to the week before, and «All body values» one tap away': 'Diese Woche neben der Woche davor, und «Alle Körperwerte» mit einem Tipp',
    'On the phone open Today and tap «Details» in «Your body today»: a sheet comes up from below with four rings.': 'Öffne am Handy Heute und tippe bei «Dein Körper heute» auf «Details»: Von unten kommt ein Blatt mit vier Ringen.',
    'On the phone, tap «Details» in «Your body today» on Today.': 'Tippe am Handy auf Heute bei «Dein Körper heute» auf «Details».',
    'Tap «All body values»: the page with all values opens.': 'Tippe «Alle Körperwerte»: Die Seite mit allen Werten öffnet sich.',
  },
};

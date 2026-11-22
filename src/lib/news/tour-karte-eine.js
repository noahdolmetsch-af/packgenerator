// Eine Tourkarte (Noah 17.11.2026 «1-5a», Startseite ruhiger, Entwurf A): bei einer geplanten Tour fällt die grosse Tourkarte weg, «Meine Tour» hält das Wichtige
export default {
  title: 'One card for your tour',
  lead: 'With one planned tour, «My tour» holds what the big trip card showed: how far the packing is, the base weight and the way to the packing list.',
  points: [{ text: 'With one planned tour, the big trip card is gone: «My tour» shows how far you have packed and the base weight', go: { href: '#/', steps: [{ sel: '[data-meinetour-packed]' }], where: 'Shows on Today while exactly one tour is planned: the card «My tour».' } }],
  small: [{ box: 'new', text: 'The packing list opens from «My tour» with one tap; with several tours the big card with its switch stays' }],
  test: [
    'Plan one tour and open Today: «My tour» shows the bar «n of m packed» and the base weight, and no second card for the same tour.',
    'Tap «Packing list» in «My tour»: the packing list of the tour opens. Plan a second tour: the big card with «Trip 1 of 2» is back.',
  ],
  since: [],
  de: {
    'One card for your tour': 'Eine Karte für deine Tour',
    'With one planned tour, «My tour» holds what the big trip card showed: how far the packing is, the base weight and the way to the packing list.': 'Bei einer geplanten Tour hält «Meine Tour», was die grosse Tourkarte zeigte: wie weit das Packen ist, das Basisgewicht und den Weg zur Packliste.',
    'With one planned tour, the big trip card is gone: «My tour» shows how far you have packed and the base weight': 'Bei einer geplanten Tour ist die grosse Tourkarte weg: «Meine Tour» zeigt, wie weit du gepackt hast, und das Basisgewicht',
    'Shows on Today while exactly one tour is planned: the card «My tour».': 'Erscheint auf Heute, solange genau eine Tour geplant ist: die Karte «Meine Tour».',
    'The packing list opens from «My tour» with one tap; with several tours the big card with its switch stays': 'Die Packliste öffnet sich aus «Meine Tour» mit einem Tipp; bei mehreren Touren bleibt die grosse Karte mit ihrem Umschalter',
    'Plan one tour and open Today: «My tour» shows the bar «n of m packed» and the base weight, and no second card for the same tour.': 'Plane eine Tour und öffne Heute: «Meine Tour» zeigt den Balken «n von m gepackt» und das Basisgewicht, und keine zweite Karte für dieselbe Tour.',
    'Tap «Packing list» in «My tour»: the packing list of the tour opens. Plan a second tour: the big card with «Trip 1 of 2» is back.': 'Tippe in «Meine Tour» auf «Packliste»: Die Packliste der Tour öffnet sich. Plane eine zweite Tour: Die grosse Karte mit «Tour 1 von 2» ist zurück.',
  },
};

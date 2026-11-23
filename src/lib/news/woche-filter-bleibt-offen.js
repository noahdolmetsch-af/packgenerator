// «Woche: Filter bleibt offen»: the filter fold of the week no longer snaps shut when the week data reloads a moment later
export default {
  title: 'The week filter stays open',
  lead: 'When you open «Filter» in the week, it stays open until you close it yourself.',
  points: [{ text: 'Planen › Woche › Filter: the kinds you tick stay visible while the week loads in the background', go: { href: '#/week', steps: [{ sel: '[data-week-filters] > summary' }], where: 'Planen › Woche: tap «Filter».' } }],
  small: [],
  test: ['Planen › Woche: tap «Filter». The kinds (dates, to-dos and more) show.', 'Wait two seconds: the fold is still open. Tap «Filter» again to close it.'],
  since: [],
  de: {
    'The week filter stays open': 'Der Filter der Woche bleibt offen',
    'When you open «Filter» in the week, it stays open until you close it yourself.': 'Wenn du in der Woche «Filter» öffnest, bleibt er offen, bis du ihn selbst schliesst.',
    'Planen › Woche › Filter: the kinds you tick stay visible while the week loads in the background': 'Planen › Woche › Filter: die Arten, die du antippst, bleiben sichtbar, auch wenn die Woche im Hintergrund nachlädt',
    'Planen › Woche: tap «Filter». The kinds (dates, to-dos and more) show.': 'Planen › Woche: tippe «Filter». Die Arten (Termine, Aufgaben und mehr) erscheinen.',
    'Wait two seconds: the fold is still open. Tap «Filter» again to close it.': 'Warte zwei Sekunden: der Filter ist noch offen. Tippe nochmals «Filter», um ihn zu schliessen.',
    'Planen › Woche: tap «Filter».': 'Planen › Woche: tippe «Filter».',
  },
};

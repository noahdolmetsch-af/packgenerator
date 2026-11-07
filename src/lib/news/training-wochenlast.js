// «Training verbessern» 6 «Wochenlast-Wächter und Entlastungswoche» (Noah 03.11.2026)
export default {
  title: 'A lighter week would fit',
  lead: 'When the planned week is much more than your last three, or comes after three growing weeks, a calm card on Aktiv › Training offers a lighter week. «Shorten the week» scales what is still to come (with Undo), «Keep it» hides the card for this week.',
  points: [{ text: 'A card on Aktiv › Training warns calmly about a week that is much bigger than your last ones, and offers a lighter week', go: { href: '#/flow/training', steps: [{ sel: '[data-section="week-plan"]' }] } }],
  small: [],
  test: [
    'Plan more hours than you usually train in a week. On Aktiv › Training the card «This week is a lot more than your last ones» appears.',
    'Tap «Shorten the week»: the sessions still to come get shorter, «Undo» brings them back. «Keep it» hides the card for this week.',
  ],
  since: [],
  de: {
    'A lighter week would fit': 'Eine leichtere Woche würde passen',
    'When the planned week is much more than your last three, or comes after three growing weeks, a calm card on Aktiv › Training offers a lighter week. «Shorten the week» scales what is still to come (with Undo), «Keep it» hides the card for this week.': 'Ist die geplante Woche deutlich mehr als deine letzten drei, oder kommt sie nach drei wachsenden Wochen, bietet eine ruhige Karte auf Aktiv › Training eine leichtere Woche an. «Woche kürzen» kürzt, was noch kommt (mit Rückgängig), «Behalten» blendet die Karte für diese Woche aus.',
    'A card on Aktiv › Training warns calmly about a week that is much bigger than your last ones, and offers a lighter week': 'Eine Karte auf Aktiv › Training weist ruhig auf eine Woche hin, die viel grösser ist als deine letzten, und bietet eine leichtere an',
    'Plan more hours than you usually train in a week. On Aktiv › Training the card «This week is a lot more than your last ones» appears.': 'Plane mehr Stunden, als du sonst in einer Woche trainierst. Auf Aktiv › Training erscheint die Karte «Diese Woche ist deutlich mehr als deine letzten».',
    'Tap «Shorten the week»: the sessions still to come get shorter, «Undo» brings them back. «Keep it» hides the card for this week.': 'Tippe «Woche kürzen»: die Einheiten, die noch kommen, werden kürzer, «Rückgängig» bringt sie zurück. «Behalten» blendet die Karte für diese Woche aus.',
  },
};

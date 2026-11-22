// «Spruch zum Einstieg» PR 3 (Noah 07.11.2026 «bau spruch pr3 und 4»): choose the tone, switch sources and sentences off, «No more like this»
export default {
  title: 'Choose your sayings',
  lead: 'The tile «Saying» now has a tone to choose, switches for every source and sentence, and «No more like this».',
  points: [
    { text: 'On the tile «Saying», «All sayings» opens the window: choose the tone (Mix, Encouraging, Calm, Funny, Vision, Challenge) and switch off sources or single sentences', go: { href: '#/', steps: [{ sel: '[data-spruch-all]' }] } },
    { text: '«No more like this» switches off the sentence you see, the next one comes, and Undo brings it back', go: { href: '#/', steps: [{ sel: '[data-spruch-nomore]' }] } },
  ],
  small: [
    { box: 'new', text: 'When your chosen tone has nothing to say today, the tile says so and shows a sentence from the mix' },
  ],
  test: [
    'Open Today, tap «All sayings» on the tile «Saying», choose «Calm» and tap «Done»: the sentence is a calm one.',
    'Tap «No more like this»: the next sentence comes. Tap «Undo» in the message: the first one is back.',
  ],
  de: {
    'Choose your sayings': 'Sprüche nach deiner Wahl',
    'The tile «Saying» now has a tone to choose, switches for every source and sentence, and «No more like this».': 'Die Kachel «Spruch» hat jetzt einen Ton zur Wahl, Schalter für jede Quelle und jeden Satz und «Nicht mehr solche».',
    'On the tile «Saying», «All sayings» opens the window: choose the tone (Mix, Encouraging, Calm, Funny, Vision, Challenge) and switch off sources or single sentences': 'Auf der Kachel «Spruch» öffnet «Alle Sprüche» das Fenster: Ton wählen (Mix, Motivierend, Ruhig, Lustig, Vision, Herausforderung) und Quellen oder einzelne Sätze ausschalten',
    '«No more like this» switches off the sentence you see, the next one comes, and Undo brings it back': '«Nicht mehr solche» schaltet den Satz aus, den du siehst, der nächste kommt, und Rückgängig holt ihn zurück',
    'When your chosen tone has nothing to say today, the tile says so and shows a sentence from the mix': 'Hat dein gewählter Ton heute nichts zu sagen, sagt die Kachel das und zeigt einen Satz aus dem Mix',
    'Open Today, tap «All sayings» on the tile «Saying», choose «Calm» and tap «Done»: the sentence is a calm one.': 'Öffne Heute, tippe auf der Kachel «Spruch» auf «Alle Sprüche», wähle «Ruhig» und tippe auf «Fertig»: der Satz ist ein ruhiger.',
    'Tap «No more like this»: the next sentence comes. Tap «Undo» in the message: the first one is back.': 'Tippe auf «Nicht mehr solche»: der nächste Satz kommt. Tippe in der Meldung auf «Rückgängig»: der erste ist wieder da.',
  },
};

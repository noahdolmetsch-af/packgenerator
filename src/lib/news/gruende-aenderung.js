// «Gründe für Planänderungen» (Noah 04.11.2026 «2a», Persönliches Lernen Idee 4): one tap says why a tour went differently
export default {
  title: 'Why was it different?',
  lead: 'When a tour is marked «Not riding», or the ridden km are far from the planned km, one tap says why. Never required.',
  points: [
    { text: 'A tour marked «Not riding» asks why: no time, tired legs, weather …', go: { href: '#/pack', where: 'Packen, on a tour you marked «Not riding» (⋯ menu).' } },
    { text: 'A tour ridden much shorter or longer than planned asks the same on its tour page', go: { href: '#/trips', where: 'Tour page of a ridden tour with a planned route.' } },
    { text: 'From three answers on, one line says which reason came up most often', go: { href: '#/me/lists', where: 'The reasons are a list you change: Me › Lists and types.' } },
  ],
  small: [{ box: 'new', text: 'A second tap on your reason takes it away, with Undo' }],
  test: ['Mark a tour «Not riding» in Planen (⋯ menu): a card asks why. Tap a reason, it stays marked.', 'Tap «Not now» on another change: the question goes away.', 'Tap the same reason again: the answer is gone, Undo brings it back.'],
  since: ['f.changewhy'],
  de: {
    'Why was it different?': 'Warum war es anders?',
    'When a tour is marked «Not riding», or the ridden km are far from the planned km, one tap says why. Never required.': 'Wenn eine Tour auf «Nicht fahren» steht oder die gefahrenen km weit von den geplanten abweichen, sagt ein Tipp, warum. Nie Pflicht.',
    'A tour marked «Not riding» asks why: no time, tired legs, weather …': 'Eine Tour mit «Nicht fahren» fragt nach dem Grund: keine Zeit, müde Beine, Wetter …',
    'Packen, on a tour you marked «Not riding» (⋯ menu).': 'Packen, bei einer Tour, die du auf «Nicht fahren» gesetzt hast (⋯-Menü).',
    'A tour ridden much shorter or longer than planned asks the same on its tour page': 'Eine Tour, die viel kürzer oder länger war als geplant, fragt dasselbe auf ihrer Tour-Seite',
    'Tour page of a ridden tour with a planned route.': 'Tour-Seite einer gefahrenen Tour mit geplanter Strecke.',
    'From three answers on, one line says which reason came up most often': 'Ab drei Antworten sagt eine Zeile, welcher Grund am häufigsten vorkam',
    'The reasons are a list you change: Me › Lists and types.': 'Die Gründe sind eine Liste, die du änderst: Ich › Listen und Typen.',
    'A second tap on your reason takes it away, with Undo': 'Ein zweiter Tipp auf deinen Grund nimmt ihn weg, mit Rückgängig',
    'Mark a tour «Not riding» in Planen (⋯ menu): a card asks why. Tap a reason, it stays marked.': 'Setz in Planen eine Tour auf «Nicht fahren» (⋯-Menü): eine Karte fragt, warum. Tipp einen Grund, er bleibt markiert.',
    'Tap «Not now» on another change: the question goes away.': 'Tipp bei einer anderen Änderung auf «Jetzt nicht»: die Frage verschwindet.',
    'Tap the same reason again: the answer is gone, Undo brings it back.': 'Tipp denselben Grund noch einmal: die Antwort ist weg, Rückgängig holt sie zurück.',
  },
};

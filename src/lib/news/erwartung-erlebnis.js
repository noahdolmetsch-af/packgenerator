// «Erwartung und Erlebnis» (Noah 04.11.2026 «1a», Persönliches Lernen Idee 1): guess before a tour, compare after
export default {
  title: 'Guessed and felt',
  lead: 'Guess how hard a bike tour will be before you go. After the ride the tour page puts your guess next to how it felt.',
  points: [
    { text: 'In Planen, a bike tour asks «How hard will it be?» with a number from 1 to 10', go: { href: '#/pack', steps: [{ sel: '[data-expect]' }], where: 'Packen, on a bike tour you have not ridden yet.' } },
    { text: 'The tour page shows your guess next to how it felt, and from three tours on whether your guesses lean one way', go: { href: '#/trips', where: 'Tour page of a bike tour with a guess and a ride, above the parts.' } },
  ],
  small: [{ box: 'new', text: 'A second tap on your number takes the guess away, with Undo' }],
  test: ['Open a bike tour in Planen: under «How hard will it be?» tap a number, it stays marked.', 'Tap the same number again: the guess is gone, Undo brings it back.', 'After a ride, open the tour page: it shows «Guessed» and «Felt» side by side.'],
  since: ['f.expectfelt'],
  de: {
    'Guessed and felt': 'Geschätzt und erlebt',
    'Guess how hard a bike tour will be before you go. After the ride the tour page puts your guess next to how it felt.': 'Schätze vor der Abfahrt, wie anstrengend eine Velotour wird. Nach der Fahrt stellt die Tour-Seite deine Schätzung neben dein Erleben.',
    'In Planen, a bike tour asks «How hard will it be?» with a number from 1 to 10': 'In Planen fragt eine Velotour «Wie anstrengend wird es?», mit einer Zahl von 1 bis 10',
    'Packen, on a bike tour you have not ridden yet.': 'Packen, bei einer Velotour, die du noch nicht gefahren bist.',
    'The tour page shows your guess next to how it felt, and from three tours on whether your guesses lean one way': 'Die Tour-Seite zeigt deine Schätzung neben dem Erleben, ab drei Touren auch, ob deine Schätzungen eher in eine Richtung gehen',
    'Tour page of a bike tour with a guess and a ride, above the parts.': 'Tour-Seite einer Velotour mit Schätzung und Fahrt, über den Teilen.',
    'A second tap on your number takes the guess away, with Undo': 'Ein zweiter Tipp auf deine Zahl nimmt die Schätzung weg, mit Rückgängig',
    'Open a bike tour in Planen: under «How hard will it be?» tap a number, it stays marked.': 'Öffne eine Velotour in Planen: tipp unter «Wie anstrengend wird es?» eine Zahl, sie bleibt markiert.',
    'Tap the same number again: the guess is gone, Undo brings it back.': 'Tipp dieselbe Zahl noch einmal: die Schätzung ist weg, Rückgängig holt sie zurück.',
    'After a ride, open the tour page: it shows «Guessed» and «Felt» side by side.': 'Öffne nach einer Fahrt die Tour-Seite: «Geschätzt» und «Erlebt» stehen nebeneinander.',
  },
};

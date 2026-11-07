// «Lange Wörter: Neuland und Träume» (Durchklick Etappe 5, Befunde E5-002 und E5-003, Noah 05.11.2026)
export default {
  title: 'Long words fit the screen in Neuland and Dreams',
  lead: 'A very long word in the Neuland search or in a new dream no longer makes the page wider than the screen.',
  points: [{ text: 'Dreams: the line after «Add» breaks a long title inside its box', go: { href: '#/trips/dreams', steps: [{ text: 'Add' }] } }],
  small: [{ box: 'new', text: 'Neuland: «Nothing found for …» breaks a long word' }],
  test: ['Open Trips › Dreams on a phone, type one very long word as the name and tap «Add»: the page does not move sideways and the line below the button breaks the word.', 'Open Neuland, type one very long word in the search: «Nothing found for …» stays on the screen.'],
  since: [],
  de: {
    'Long words fit the screen in Neuland and Dreams': 'Lange Wörter passen bei Neuland und Träumen auf den Bildschirm',
    'A very long word in the Neuland search or in a new dream no longer makes the page wider than the screen.': 'Ein sehr langes Wort in der Neuland-Suche oder in einem neuen Traum macht die Seite nicht mehr breiter als den Bildschirm.',
    'Dreams: the line after «Add» breaks a long title inside its box': 'Träume: Die Zeile nach «Hinzufügen» bricht einen langen Titel in ihrem Kasten um',
    'Neuland: «Nothing found for …» breaks a long word': 'Neuland: «Nichts gefunden für …» bricht ein langes Wort um',
    'Open Trips › Dreams on a phone, type one very long word as the name and tap «Add»: the page does not move sideways and the line below the button breaks the word.': 'Öffne auf dem Handy Touren › Träume, tippe ein einziges sehr langes Wort als Namen und tippe auf «Hinzufügen»: Die Seite lässt sich nicht seitwärts schieben, und die Zeile unter dem Knopf bricht das Wort um.',
    'Open Neuland, type one very long word in the search: «Nothing found for …» stays on the screen.': 'Öffne Neuland und tippe ein einziges sehr langes Wort in die Suche: «Nichts gefunden für …» bleibt auf dem Bildschirm.',
  },
};

// «Langer To-do-Text» (Durchklick Etappe 4, Befund E4-002, Noah 05.11.2026)
export default {
  title: 'To-dos: a long word fits the screen',
  lead: 'A to-do with a very long word (a web address, an order number) no longer makes Remember and Today wider than the screen.',
  points: [{ text: 'Remember and Today: a long to-do breaks inside its row', go: { href: '#/calendar', steps: [{ text: 'Add a to-do' }] } }],
  small: [],
  test: ['Open Planning › Remember on a phone, tap «Add a to-do» and write a very long word without spaces, due today.', 'Remember, Today and Week do not move sideways; the long word breaks into lines or ends in «…» on Today.'],
  since: [],
  de: {
    'To-dos: a long word fits the screen': 'To-dos: Ein langes Wort passt auf den Bildschirm',
    'A to-do with a very long word (a web address, an order number) no longer makes Remember and Today wider than the screen.': 'Ein To-do mit einem sehr langen Wort (eine Internetadresse, eine Bestellnummer) macht Merken und Heute nicht mehr breiter als der Bildschirm.',
    'Remember and Today: a long to-do breaks inside its row': 'Merken und Heute: Ein langes To-do bricht in seiner Zeile um',
    'Open Planning › Remember on a phone, tap «Add a to-do» and write a very long word without spaces, due today.': 'Öffne Planen › Merken auf dem Handy, tippe «To-do hinzufügen» und schreibe ein sehr langes Wort ohne Leerzeichen, fällig heute.',
    'Remember, Today and Week do not move sideways; the long word breaks into lines or ends in «…» on Today.': 'Merken, Heute und Woche verschieben sich nicht seitwärts; das lange Wort bricht in Zeilen um oder endet auf Heute mit «…».',
  },
};

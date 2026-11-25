// «Ein Eingang» (Noah 24.11.2026 «1-3a», Stufe 2): Lupe mit Funken statt Blase und Lupe, Hilfe als erste Zeile, Weg zum Assistenten unter einer Frage
export default {
  title: 'One way in for search, help and questions',
  lead: 'The search is now the one entrance: it finds, answers and leads to the help of the page and to the assistant.',
  points: [
    { text: 'The bubble is gone from the top bar; the magnifier with a small spark opens the one window', go: { href: '#/', steps: [{ aria: 'Search everything' }], where: 'The top bar on a phone; the search field on a computer.' } },
    { text: 'The empty window starts with «Help for this page»; the «?» stays in the bar', go: { href: '#/gear', steps: [{ aria: 'Search everything' }], where: 'Open the search, the first row.' } },
    { text: 'Under a question the app answers first; «Open the assistant» leads on, «Ask further at …» is a closed line', go: { href: '#/', steps: [{ aria: 'Search everything' }], where: 'Type a question such as «When is my next trip?».' } },
  ],
  small: [{ box: 'new', text: 'The assistant page and its address stay; you find it through the search, the map of the app and the function catalogue' }],
  test: ['Open the search on Gear: the first row says «Help for this page»; a tap opens the help window.', 'Type «When is my next trip?»: the answer stands first, then «Open the assistant»; tap it and the assistant opens with your question.', 'Type «rain»: no assistant row, one closed line for gear.'],
  since: [],
  de: {
    'One way in for search, help and questions': 'Ein Einstieg für Suche, Hilfe und Fragen',
    'The search is now the one entrance: it finds, answers and leads to the help of the page and to the assistant.': 'Die Suche ist jetzt der eine Einstieg: Sie findet, antwortet und führt zur Hilfe der Seite und zum Assistenten.',
    'The bubble is gone from the top bar; the magnifier with a small spark opens the one window': 'Die Sprechblase fehlt in der Leiste oben; die Lupe mit dem kleinen Funken öffnet das eine Fenster',
    'The top bar on a phone; the search field on a computer.': 'Die Leiste oben am Handy; das Suchfeld am Computer.',
    'The empty window starts with «Help for this page»; the «?» stays in the bar': 'Das leere Fenster beginnt mit «Hilfe zu dieser Seite»; das «?» bleibt in der Leiste',
    'Open the search, the first row.': 'Öffne die Suche, die erste Zeile.',
    'Under a question the app answers first; «Open the assistant» leads on, «Ask further at …» is a closed line': 'Unter einer Frage antwortet die App zuerst; «Assistent öffnen» führt weiter, «Weiter fragen bei …» ist eine zugeklappte Zeile',
    'Type a question such as «When is my next trip?».': 'Tippe eine Frage wie «Wann ist meine nächste Tour?».',
    'The assistant page and its address stay; you find it through the search, the map of the app and the function catalogue': 'Die Assistent-Seite und ihre Adresse bleiben; du findest sie über die Suche, die Karte der App und den Funktionskatalog',
    'Open the search on Gear: the first row says «Help for this page»; a tap opens the help window.': 'Öffne die Suche auf Material: die erste Zeile heisst «Hilfe zu dieser Seite»; ein Tipp öffnet das Hilfefenster.',
    'Type «When is my next trip?»: the answer stands first, then «Open the assistant»; tap it and the assistant opens with your question.': 'Tippe «Wann ist meine nächste Tour?»: die Antwort steht zuerst, dann «Assistent öffnen»; tippe darauf, und der Assistent öffnet sich mit deiner Frage.',
    'Type «rain»: no assistant row, one closed line for gear.': 'Tippe «Regen»: keine Assistent-Zeile, eine zugeklappte Zeile für Material.',
  },
};

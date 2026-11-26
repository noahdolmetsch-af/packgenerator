// «Touren-Seite klarer» (Noah 25.11.2026 «1-5a»): Aufräumen-Karte, «Meine Touren», ein Tabellen-Knopf, ein Rennen nur einmal oben, Erklärtexte im «?»
export default {
  title: 'A clearer Trips page',
  lead: 'Trips › Overview says what to tidy in one card, names its list «My trips», shows a race once at the top and keeps the explanations in the «?» window.',
  points: [
    { text: 'A card «Tidy up» above the list joins doubled trips with one tap and offers trips named like a test as test trips; both come back with Undo', go: { href: '#/trips', where: 'Shows above the list «My trips» when trips look doubled or are named like a test.' } },
    { text: 'The list is called «My trips», because it holds the trips you packed and the rides from GPX', go: { href: '#/trips', steps: [{ text: 'My trips' }] } },
    { text: 'The colours of the list and where the values come from are explained in the «?» window, not under the list', go: { href: '#/trips', steps: [{ aria: 'Help for this page' }] } },
  ],
  small: [
    { box: 'new', text: 'A race with a packing card shows «Race page» there; the extra row «Your race» is gone', go: { href: '#/trips', where: 'Shows on a trip card at the top of Trips when the trip is a coming race.' } },
    { box: 'new', text: '«On this page» jumps to all four parts, and the jump bar of «In numbers» shows only while a group is open' },
    { box: 'new', text: 'One button «Edit as a table», and the right column shows a soft shadow at its bottom edge while more is hidden' },
  ],
  test: [
    'Open Trips. If a card «Tidy up» stands above the list «My trips», tap «Join them» (or «Mark as test») and then «Undo»: everything is back as it was.',
    'Tap the «?» at the top: the paragraph «Reading the list» explains the colours and where the values come from.',
    'On a computer open «In numbers» and fold all groups: the jump bar goes; open one group and it is back.',
  ],
  since: [],
  de: {
    'A clearer Trips page': 'Eine klarere Tourenseite',
    'Trips › Overview says what to tidy in one card, names its list «My trips», shows a race once at the top and keeps the explanations in the «?» window.': 'Touren › Übersicht sagt in einer Karte, was aufzuräumen ist, nennt ihre Liste «Meine Touren», zeigt ein Rennen nur einmal oben und hält die Erklärungen im «?»-Fenster.',
    'A card «Tidy up» above the list joins doubled trips with one tap and offers trips named like a test as test trips; both come back with Undo': 'Eine Karte «Aufräumen» über der Liste legt doppelte Touren mit einem Tipp zusammen und schlägt Touren, die wie ein Test heissen, als Testtouren vor; beides kommt mit Rückgängig zurück',
    'Shows above the list «My trips» when trips look doubled or are named like a test.': 'Erscheint über der Liste «Meine Touren», wenn Touren doppelt aussehen oder wie ein Test heissen.',
    'The list is called «My trips», because it holds the trips you packed and the rides from GPX': 'Die Liste heisst «Meine Touren», weil sie die gepackten Touren und die Fahrten aus GPX enthält',
    'My trips': 'Meine Touren',
    'A race with a packing card shows «Race page» there; the extra row «Your race» is gone': 'Ein Rennen mit Pack-Karte zeigt dort «Zum Rennen»; die zusätzliche Zeile «Dein Rennen» fällt weg',
    'Shows on a trip card at the top of Trips when the trip is a coming race.': 'Erscheint auf einer Tour-Karte oben in Touren, wenn die Tour ein kommendes Rennen ist.',
    'The colours of the list and where the values come from are explained in the «?» window, not under the list': 'Die Farben der Liste und woher die Werte kommen, stehen im «?»-Fenster, nicht unter der Liste',
    'Help for this page': 'Hilfe zu dieser Seite',
    '«On this page» jumps to all four parts, and the jump bar of «In numbers» shows only while a group is open': '«Auf dieser Seite» springt zu allen vier Teilen, und die Sprungleiste von «In Zahlen» erscheint nur, solange eine Gruppe offen ist',
    'One button «Edit as a table», and the right column shows a soft shadow at its bottom edge while more is hidden': 'Ein Knopf «Als Tabelle bearbeiten», und die rechte Spalte zeigt am unteren Rand einen weichen Schatten, solange noch mehr verborgen ist',
    'Open Trips. If a card «Tidy up» stands above the list «My trips», tap «Join them» (or «Mark as test») and then «Undo»: everything is back as it was.': 'Öffne Touren. Steht über der Liste «Meine Touren» eine Karte «Aufräumen», tippe «Zusammenlegen» (oder «Als Test markieren») und dann «Rückgängig»: alles ist wieder wie vorher.',
    'Tap the «?» at the top: the paragraph «Reading the list» explains the colours and where the values come from.': 'Tippe oben auf das «?»: der Absatz «So liest du die Liste» erklärt die Farben und woher die Werte kommen.',
    'On a computer open «In numbers» and fold all groups: the jump bar goes; open one group and it is back.': 'Öffne am Computer «In Zahlen» und klappe alle Gruppen zu: die Sprungleiste verschwindet; öffne eine Gruppe, und sie ist wieder da.',
  },
};

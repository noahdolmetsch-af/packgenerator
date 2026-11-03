// «Was kostet das nächste Jahr?» (Idee C1 «App denkt mit», Noah 02.11.2026 «3b»)
export default {
  title: 'What the next months cost',
  lead: 'Your bike shows which parts run out soon, what they cost, and puts them on the shopping list.',
  points: [{ text: 'Bikes › Care › a bike › Wear: «What the next months cost» with 3, 6 or 12 months', go: 'f.wearcosts' }],
  small: [
    { box: 'new', go: 'f.wearcosts', text: 'The price is what your last change of the part cost; if the app does not know it, it says «price open»' },
    { box: 'new', go: 'f.wearcosts', text: '«All on the shopping list» adds the parts in one tap, with Undo' },
  ],
  test: [
    'Open Bikes › Care, pick a bike and tap «Wear».',
    'Scroll to «What the next months cost» and tap «6 months».',
    'Tap «All on the shopping list», then open Me › Daily life › Shopping list: the parts are there.',
  ],
  since: ['f.wearcosts'],
  de: {
    'What the next months cost': 'Was die nächsten Monate kosten',
    'Your bike shows which parts run out soon, what they cost, and puts them on the shopping list.': 'Dein Velo zeigt, welche Teile bald zu Ende gehen, was sie kosten, und setzt sie auf die Einkaufsliste.',
    'Bikes › Care › a bike › Wear: «What the next months cost» with 3, 6 or 12 months': 'Velos › Pflege › ein Velo › Verschleiss: «Was die nächsten Monate kosten» mit 3, 6 oder 12 Monaten',
    'The price is what your last change of the part cost; if the app does not know it, it says «price open»': 'Der Preis ist, was dein letzter Wechsel des Teils gekostet hat; kennt die App ihn nicht, steht «Preis offen»',
    '«All on the shopping list» adds the parts in one tap, with Undo': '«Alle auf die Einkaufsliste» setzt die Teile mit einem Tipp dazu, mit Rückgängig',
    'Open Bikes › Care, pick a bike and tap «Wear».': 'Öffne Velos › Pflege, wähle ein Velo und tipp «Verschleiss».',
    'Scroll to «What the next months cost» and tap «6 months».': 'Scrolle zu «Was die nächsten Monate kosten» und tipp «6 Monate».',
    'Tap «All on the shopping list», then open Me › Daily life › Shopping list: the parts are there.': 'Tipp «Alle auf die Einkaufsliste», öffne dann Ich › Alltag › Einkauf: die Teile stehen dort.',
  },
};

// «Suche findet mehr, Treffer lesbarer» (Warteliste 1, Noah 22.11.2026 «1a 4a 5a»): V1 and V4 of the search
export default {
  title: 'The search finds more',
  lead: 'The search now also finds rides, places, learnings, bike care, training, tasks and the functions under Me. Hits are easier to read.',
  points: [
    { text: 'Rides, places, learnings, bike care, training and tasks show up as their own groups', go: { href: '#/', where: 'The search at the top: type a word from one of your rides.' } },
    { text: 'The words found are marked; buttons «All | Rides · 6 | …» show one kind; «Show all» shows every hit', go: { href: '#/', where: 'The search at the top: type a word that several kinds have.' } },
    { text: 'A typo: «Do you mean …?» puts the close word in the field', go: { href: '#/', where: 'The search at the top: type a name with one wrong letter.' } },
  ],
  small: [],
  test: [
    'Tap the search and type a word from one of your rides: a group «Rides» shows it with day, km and bike.',
    'Type a word that rides and learnings share: the words are marked, and buttons with the number of hits sit above the list. Tap «Rides»: only rides, all of them.',
    'Type a name with one wrong letter: below «Nothing for …» a tap on «Do you mean …?» puts the right word in the field.',
  ],
  since: [],
  de: {
    'The search finds more': 'Die Suche findet mehr',
    'The search now also finds rides, places, learnings, bike care, training, tasks and the functions under Me. Hits are easier to read.': 'Die Suche findet jetzt auch Fahrten, Orte, Erkenntnisse, Velopflege, Training, Aufgaben und die Funktionen unter Ich. Treffer sind leichter zu lesen.',
    'Rides, places, learnings, bike care, training and tasks show up as their own groups': 'Fahrten, Orte, Erkenntnisse, Velopflege, Training und Aufgaben erscheinen als eigene Gruppen',
    'The search at the top: type a word from one of your rides.': 'Die Suche oben: ein Wort aus einer deiner Fahrten eintippen.',
    'The words found are marked; buttons «All | Rides · 6 | …» show one kind; «Show all» shows every hit': 'Die gefundenen Wörter sind markiert; Knöpfe «Alle | Fahrten · 6 | …» zeigen eine Art; «Alle zeigen» zeigt jeden Treffer',
    'The search at the top: type a word that several kinds have.': 'Die Suche oben: ein Wort eintippen, das mehrere Arten haben.',
    'A typo: «Do you mean …?» puts the close word in the field': 'Bei einem Tippfehler setzt «Meintest du …?» das nahe Wort ins Feld',
    'The search at the top: type a name with one wrong letter.': 'Die Suche oben: einen Namen mit einem falschen Buchstaben eintippen.',
    'Tap the search and type a word from one of your rides: a group «Rides» shows it with day, km and bike.': 'Die Suche antippen und ein Wort aus einer deiner Fahrten eintippen: eine Gruppe «Fahrten» zeigt sie mit Tag, km und Velo.',
    'Type a word that rides and learnings share: the words are marked, and buttons with the number of hits sit above the list. Tap «Rides»: only rides, all of them.': 'Ein Wort eintippen, das Fahrten und Erkenntnisse teilen: die Wörter sind markiert, über der Liste stehen Knöpfe mit der Zahl der Treffer. «Fahrten» antippen: nur Fahrten, alle.',
    'Type a name with one wrong letter: below «Nothing for …» a tap on «Do you mean …?» puts the right word in the field.': 'Einen Namen mit einem falschen Buchstaben eintippen: unter «Nichts für …» setzt ein Tipp auf «Meintest du …?» das richtige Wort ins Feld.',
  },
};

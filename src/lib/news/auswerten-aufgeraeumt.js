// «Aktionen in Auswerten» (Noah 23.11.2026 «1-5a», 5a) und «Sitemap» (Noah 24.11.2026, K4 und K5), ein PR für dieselben Seiten (Regel 4 vom 24.11.2026)
export default {
  title: 'Auswerten tidied up',
  lead: 'In «Auswerten › Rides» the chips «Challenges» and «Learned» stand further up, and the filter row of «Milestones» shows only the sports.',
  points: [
    { text: 'New chip «Challenges» behind «Milestones», and «Learned» (month and year review) moved up to the third chip', go: { href: '#/flow/challenges', where: 'Auswerten › Rides: the chip «Challenges» stands behind «Milestones».' } },
    { text: '«Milestones» no longer has a «Change stages» button next to the sport filters; «Change numbers and stages» at the end of the page does the same', go: { href: '#/flow/milestones', where: 'Scroll to the end of «Milestones»: «Change numbers and stages» opens the numbers.' } },
    { text: 'On a phone a note with two buttons keeps its text on one wide line, the buttons stand below', go: { href: '#/me/abfragen', where: 'Auswerten › Your questions: tap «Create your own question» and save one; the note shows at the bottom.' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Rides: the chips read Rides, Answers evaluated, Learned, Milestones, Challenges, Heatmap …',
    'Open «Milestones»: the filter row shows only the sports; at the end of the page «Change numbers and stages» opens the numbers.',
    'On a phone create an own question in «Your questions»: the note reads in one line of text with «Undo» and «Look at it» below.',
  ],
  since: [],
  de: {
    'Auswerten tidied up': 'Auswerten aufgeräumt',
    'In «Auswerten › Rides» the chips «Challenges» and «Learned» stand further up, and the filter row of «Milestones» shows only the sports.': 'In «Auswerten › Fahrten» stehen die Chips «Challenges» und «Erkenntnisse» weiter vorn, und die Filterzeile der «Meilensteine» zeigt nur noch die Sportarten.',
    'New chip «Challenges» behind «Milestones», and «Learned» (month and year review) moved up to the third chip': 'Neuer Chip «Challenges» hinter «Meilensteine», und «Erkenntnisse» (Monats- und Jahresrückblick) ist auf den dritten Chip gerückt',
    'Auswerten › Rides: the chip «Challenges» stands behind «Milestones».': 'Auswerten › Fahrten: Der Chip «Challenges» steht hinter «Meilensteine».',
    '«Milestones» no longer has a «Change stages» button next to the sport filters; «Change numbers and stages» at the end of the page does the same': 'Bei den «Meilensteinen» steht neben den Sportarten kein Knopf «Stufen ändern» mehr; «Zahlen und Stufen ändern» am Seitenende tut dasselbe',
    'Scroll to the end of «Milestones»: «Change numbers and stages» opens the numbers.': 'Scrolle ans Ende der «Meilensteine»: «Zahlen und Stufen ändern» öffnet die Zahlen.',
    'On a phone a note with two buttons keeps its text on one wide line, the buttons stand below': 'Auf dem Handy behält ein Hinweis mit zwei Tasten seinen Text in einer breiten Zeile, die Tasten stehen darunter',
    'Auswerten › Your questions: tap «Create your own question» and save one; the note shows at the bottom.': 'Auswerten › Wi gaht\'s?: Tippe auf «Eigene Frage anlegen» und speichere eine; der Hinweis erscheint unten.',
    'Open Auswerten › Rides: the chips read Rides, Answers evaluated, Learned, Milestones, Challenges, Heatmap …': 'Öffne Auswerten › Fahrten: Die Chips heissen Fahrten, Antworten ausgewertet, Erkenntnisse, Meilensteine, Challenges, Heatmap …',
    'Open «Milestones»: the filter row shows only the sports; at the end of the page «Change numbers and stages» opens the numbers.': 'Öffne «Meilensteine»: Die Filterzeile zeigt nur die Sportarten; am Seitenende öffnet «Zahlen und Stufen ändern» die Zahlen.',
    'On a phone create an own question in «Your questions»: the note reads in one line of text with «Undo» and «Look at it» below.': 'Lege auf dem Handy in «Wi gaht\'s?» eine eigene Frage an: Der Hinweis liest sich als eine Zeile Text, darunter «Rückgängig» und «Ansehen».',
  },
};

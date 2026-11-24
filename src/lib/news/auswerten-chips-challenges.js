// «Sitemap» (Noah 24.11.2026, K4 und K5): in «Auswerten › Fahrten» steht «Challenges» neben «Meilensteine», «Erkenntnisse» weiter vorn
export default {
  title: 'Challenges and Learned up front in Auswerten',
  lead: 'In «Auswerten › Rides» the chip «Challenges» stands next to «Milestones», and «Learned» moved up behind «Answers evaluated».',
  points: [
    { text: 'New chip «Challenges» behind «Milestones»: your daily goals are one tap away, and the page now belongs to «Auswerten»', go: { href: '#/flow/challenges', where: 'Auswerten › Rides: the chip «Challenges» stands behind «Milestones».' } },
    { text: '«Learned» (month and year review) moved from the last place to the third chip, behind «Answers evaluated»', go: { href: '#/gelernt', where: 'Auswerten › Rides: the chip «Learned» is now the third one.' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Rides: the chips read Rides, Answers evaluated, Learned, Milestones, Challenges, Heatmap …',
    'Tap «Challenges»: the page of your daily goals opens and «Auswerten» stays lit.',
    'Tap «Learned»: the month and year review opens.',
  ],
  since: [],
  de: {
    'Challenges and Learned up front in Auswerten': 'Challenges und Erkenntnisse weiter vorn in Auswerten',
    'In «Auswerten › Rides» the chip «Challenges» stands next to «Milestones», and «Learned» moved up behind «Answers evaluated».': 'In «Auswerten › Fahrten» steht der Chip «Challenges» neben «Meilensteine», und «Erkenntnisse» ist hinter «Antworten ausgewertet» nach vorn gerückt.',
    'New chip «Challenges» behind «Milestones»: your daily goals are one tap away, and the page now belongs to «Auswerten»': 'Neuer Chip «Challenges» hinter «Meilensteine»: Deine Tagesziele sind einen Tipp entfernt, und die Seite gehört jetzt zu «Auswerten»',
    'Auswerten › Rides: the chip «Challenges» stands behind «Milestones».': 'Auswerten › Fahrten: Der Chip «Challenges» steht hinter «Meilensteine».',
    '«Learned» (month and year review) moved from the last place to the third chip, behind «Answers evaluated»': '«Erkenntnisse» (Monats- und Jahresrückblick) ist vom letzten Platz auf den dritten Chip gerückt, hinter «Antworten ausgewertet»',
    'Auswerten › Rides: the chip «Learned» is now the third one.': 'Auswerten › Fahrten: Der Chip «Erkenntnisse» ist jetzt der dritte.',
    'Open Auswerten › Rides: the chips read Rides, Answers evaluated, Learned, Milestones, Challenges, Heatmap …': 'Öffne Auswerten › Fahrten: Die Chips heissen Fahrten, Antworten ausgewertet, Erkenntnisse, Meilensteine, Challenges, Heatmap …',
    'Tap «Challenges»: the page of your daily goals opens and «Auswerten» stays lit.': 'Tippe auf «Challenges»: Die Seite deiner Tagesziele öffnet sich und «Auswerten» bleibt hell.',
    'Tap «Learned»: the month and year review opens.': 'Tippe auf «Erkenntnisse»: Der Monats- und Jahresrückblick öffnet sich.',
  },
};

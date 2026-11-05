// «Pin deckt Titel nicht mehr zu» (Frontend-Durchklick Etappe 1, Noah 05.11.2026): der Pin-Knopf sass bei langen Seitentiteln auf dem Titelende
export default {
  title: 'Pin no longer covers the page title',
  lead: 'The pin button for Quick Links now moves aside when a page title is long.',
  points: [
    { text: 'On pages with a long title the pin sits beside or above the title instead of on its last letters', go: { href: '#/me/agenda', where: 'Under Me › Appointments and tasks, at the top right of the title.' } },
  ],
  small: [],
  test: [
    'Open Me › Appointments and tasks on the phone: the pin at the title does not hide any letter of the title.',
    'Tap the pin: the page is added to Quick Links as before.',
  ],
  since: [],
  de: {
    'Pin no longer covers the page title': 'Der Pin deckt den Seitentitel nicht mehr zu',
    'The pin button for Quick Links now moves aside when a page title is long.': 'Der Pin-Knopf für die Schnellzugriffe rutscht jetzt zur Seite, wenn ein Seitentitel lang ist.',
    'On pages with a long title the pin sits beside or above the title instead of on its last letters': 'Bei Seiten mit langem Titel sitzt der Pin neben oder über dem Titel statt auf den letzten Buchstaben',
    'Under Me › Appointments and tasks, at the top right of the title.': 'Unter Ich › Termine und Aufgaben, oben rechts am Titel.',
    'Open Me › Appointments and tasks on the phone: the pin at the title does not hide any letter of the title.': 'Öffne Ich › Termine und Aufgaben auf dem Handy: der Pin am Titel verdeckt keinen Buchstaben des Titels.',
    'Tap the pin: the page is added to Quick Links as before.': 'Tippe auf den Pin: die Seite kommt wie bisher in die Schnellzugriffe.',
  },
};

// «Meine Tour» (Plan «ganze App», Schritt 2a, Noah 08.11.2026 «2 a»): die Karte ganz oben auf Heute, bei einer geplanten Tour
export default {
  title: 'My tour on Today',
  lead: 'While a tour is planned, Today starts with the card «My tour»: where the tour stands and the next step.',
  points: [
    { text: 'The card shows the four phases and one big button to the next open step', go: { href: '#/', where: 'Shows on Today while a tour is planned: the card «My tour» right under the greeting.' } },
    { text: 'The open preparation of the event is one line on the card now, no longer a row in «Up now»', go: { href: '#/', where: 'Shows on Today while a tour with open preparation tasks is planned: the line under the big button.' } },
  ],
  small: [{ box: 'new', text: '«All steps» on the card opens the Tour path' }],
  test: [
    'Plan a tour with a start day. On Today the card «My tour» stands right under the greeting.',
    'Read the four phases: the current one is marked. Under it «Next: …» names the next open step.',
    'Tap the big button: the page of that step opens. Back on Today tap «All steps»: the Tour path opens.',
  ],
  since: [],
  de: {
    'My tour on Today': 'Meine Tour auf Heute',
    'While a tour is planned, Today starts with the card «My tour»: where the tour stands and the next step.': 'Solange eine Tour geplant ist, beginnt Heute mit der Karte «Meine Tour»: wo die Tour steht und was als Nächstes kommt.',
    'The card shows the four phases and one big button to the next open step': 'Die Karte zeigt die vier Phasen und einen grossen Knopf zum nächsten offenen Schritt',
    'Shows on Today while a tour is planned: the card «My tour» right under the greeting.': 'Erscheint auf Heute, solange eine Tour geplant ist: die Karte «Meine Tour» gleich unter dem Gruss.',
    'The open preparation of the event is one line on the card now, no longer a row in «Up now»': 'Die offene Vorbereitung des Events ist jetzt eine Zeile auf der Karte, nicht mehr eine Zeile in «Jetzt dran»',
    'Shows on Today while a tour with open preparation tasks is planned: the line under the big button.': 'Erscheint auf Heute, solange eine Tour mit offenen Vorbereitungs-Aufgaben geplant ist: die Zeile unter dem grossen Knopf.',
    '«All steps» on the card opens the Tour path': '«Alle Schritte» auf der Karte öffnet den Tour-Pfad',
    'Plan a tour with a start day. On Today the card «My tour» stands right under the greeting.': 'Plane eine Tour mit einem Starttag. Auf Heute steht die Karte «Meine Tour» gleich unter dem Gruss.',
    'Read the four phases: the current one is marked. Under it «Next: …» names the next open step.': 'Lies die vier Phasen: Die laufende ist markiert. Darunter nennt «Als Nächstes: …» den nächsten offenen Schritt.',
    'Tap the big button: the page of that step opens. Back on Today tap «All steps»: the Tour path opens.': 'Tippe den grossen Knopf: Die Seite dieses Schritts öffnet sich. Zurück auf Heute tippe «Alle Schritte»: Der Tour-Pfad öffnet sich.',
  },
};

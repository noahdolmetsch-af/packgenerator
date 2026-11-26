// «Zwei Neuheiten-Hinweise» (Noah 25.11.2026 «b»): the line under the chips and the card at the end of Heute lead to the same window
export default {
  title: 'One way into the news',
  lead: 'The line «New: …» under the chips of Today now opens the same window as the card at the end.',
  points: [
    {
      text: 'A tap on «and 22 more things» in the line under the chips opens the news by place',
      go: { href: '#/', steps: [{ sel: '[data-news-banner]' }], where: 'Shows under the chips of Today after an update, as long as the line «New: …» is open.' },
    },
  ],
  small: [{ box: 'new', text: 'Closing that window closes the line and the card at the end, both count as seen', go: null }],
  test: [
    'Open Today after an update: under the chips stands «New: …» and «and … more things».',
    'Tap «and … more things»: the window «News by place» opens, the first place is open.',
    'Close the window: the line under the chips and the card at the end are gone until the next update.',
  ],
  since: [],
  de: {
    'One way into the news': 'Ein Weg in die Neuheiten',
    'The line «New: …» under the chips of Today now opens the same window as the card at the end.': 'Die Zeile «Neu: …» unter den Chips von Heute öffnet jetzt dasselbe Fenster wie die Karte am Ende.',
    'A tap on «and 22 more things» in the line under the chips opens the news by place': 'Ein Tipp auf «und 22 weitere Dinge» in der Zeile unter den Chips öffnet die Neuheiten nach Ort',
    'Shows under the chips of Today after an update, as long as the line «New: …» is open.': 'Erscheint unter den Chips von Heute nach einem Update, solange die Zeile «Neu: …» offen ist.',
    'Closing that window closes the line and the card at the end, both count as seen': 'Das Fenster schliessen schliesst die Zeile und die Karte am Ende, beide zählen als gesehen',
    'Open Today after an update: under the chips stands «New: …» and «and … more things».': 'Öffne Heute nach einem Update: unter den Chips steht «Neu: …» und «und … weitere Dinge».',
    'Tap «and … more things»: the window «News by place» opens, the first place is open.': 'Tippe auf «und … weitere Dinge»: das Fenster «Neuheiten nach Ort» öffnet sich, der erste Ort ist offen.',
    'Close the window: the line under the chips and the card at the end are gone until the next update.': 'Schliesse das Fenster: die Zeile unter den Chips und die Karte am Ende sind weg bis zum nächsten Update.',
  },
};

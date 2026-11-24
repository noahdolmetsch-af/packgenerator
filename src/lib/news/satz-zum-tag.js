// «Ein Satz zum Tag» (Noah 24.11.2026 «1a», Thread «Wi gaht's? um Träume und Visionen erweitern»): the free field of the evening page, also in the history
export default {
  title: 'One sentence about the day',
  lead: 'The free field of the evening page is called «One sentence about the day», and the sentence also stands in your history.',
  points: [
    { text: 'Write one sentence about your day at the end of the evening page; it shows in «All answers» too', go: { href: '#/check/evening', steps: [{ sel: '[data-story]' }], where: 'Today › How was it? in the evening: the field at the very end of the page.' } },
  ],
  small: [{ box: 'fixed', text: 'Still optional; nothing changes for sentences already written' }],
  test: [
    'Open Today › How was it? in the evening and write a sentence in the last field.',
    'Reload: the sentence is still there.',
    'Open «All answers»: today shows the line «One sentence about the day».',
  ],
  since: [],
  de: {
    'One sentence about the day': 'Ein Satz zum Tag',
    'The free field of the evening page is called «One sentence about the day», and the sentence also stands in your history.': 'Das freie Feld der Abend-Seite heisst «Ein Satz zum Tag», und der Satz steht auch in deinem Verlauf.',
    'Write one sentence about your day at the end of the evening page; it shows in «All answers» too': 'Schreibe am Ende der Abend-Seite einen Satz zu deinem Tag; er steht auch in «Alle Antworten»',
    'Today › How was it? in the evening: the field at the very end of the page.': 'Heute › «Wie war\'s?» am Abend: das Feld ganz am Ende der Seite.',
    'Still optional; nothing changes for sentences already written': 'Weiter freiwillig; schon geschriebene Sätze bleiben',
    'Open Today › How was it? in the evening and write a sentence in the last field.': 'Öffne Heute › «Wie war\'s?» am Abend und schreibe einen Satz in das letzte Feld.',
    'Reload: the sentence is still there.': 'Lade neu: der Satz steht noch da.',
    'Open «All answers»: today shows the line «One sentence about the day».': 'Öffne «Alle Antworten»: heute steht die Zeile «Ein Satz zum Tag».',
  },
};

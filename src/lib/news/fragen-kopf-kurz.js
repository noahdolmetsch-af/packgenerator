// «Fragen-Bereich verbessern» (Noah 23.11.2026 «1-5a»), Teil 1: kurzer Kopf, beschriftete Zahlen, schmale Zeilen, Namen, «Stand»
export default {
  title: 'Ask your data: the answers come first',
  lead: 'The page «Ask your data» starts with the answers. What still needs data is a slim row.',
  points: [
    { text: 'The first answer stands near the top: a short title and one line, the way to the assistant is under the answers', go: { href: '#/auswerten/fragen', where: 'Open the page and look at the top.' } },
    { text: 'A question without enough data is a slim row: «Needs 5 more days with a ride». A tap opens the numbers and «Why?»', go: { href: '#/auswerten/fragen', where: 'Tap a slim row.' } },
    { text: 'Under each answer: «As of today, data up to yesterday»', go: { href: '#/auswerten/fragen', where: 'Look under an answer.' } },
  ],
  small: [{ box: 'new', text: 'One name: «Ask your own question» for the assistant, «The app asks you» for the questions the app puts to you' }],
  test: [
    'Open Evaluate › Questions on your phone: the first answer is in view without scrolling.',
    'Tap a slim row: the sentence with the numbers («16 days with a ride this year, 0 last year») and «Why?» open.',
    'Under an answer stands «As of today, data up to …».',
  ],
  since: [],
  de: {
    'Ask your data: the answers come first': 'Frag deine Daten: die Antworten stehen vorn',
    'The page «Ask your data» starts with the answers. What still needs data is a slim row.': 'Die Seite «Frag deine Daten» beginnt mit den Antworten. Was noch Daten braucht, ist eine schmale Zeile.',
    'The first answer stands near the top: a short title and one line, the way to the assistant is under the answers': 'Die erste Antwort steht weit oben: ein kurzer Titel und eine Zeile, der Weg zum Assistenten liegt unter den Antworten',
    'Open the page and look at the top.': 'Öffne die Seite und schau nach oben.',
    'A question without enough data is a slim row: «Needs 5 more days with a ride». A tap opens the numbers and «Why?»': 'Eine Frage ohne genug Daten ist eine schmale Zeile: «Braucht noch 5 Fahrtage». Ein Tipp öffnet die Zahlen und «Warum?»',
    'Tap a slim row.': 'Tippe auf eine schmale Zeile.',
    'Under each answer: «As of today, data up to yesterday»': 'Unter jeder Antwort: «Stand heute, Daten bis gestern»',
    'Look under an answer.': 'Schau unter eine Antwort.',
    'One name: «Ask your own question» for the assistant, «The app asks you» for the questions the app puts to you': 'Ein Name: «Eigene Frage stellen» für den Assistenten, «Die App fragt dich» für die Fragen, die die App dir stellt',
    'Open Evaluate › Questions on your phone: the first answer is in view without scrolling.': 'Öffne am Handy Auswerten › Fragen: Die erste Antwort ist ohne Scrollen zu sehen.',
    'Tap a slim row: the sentence with the numbers («16 days with a ride this year, 0 last year») and «Why?» open.': 'Tippe auf eine schmale Zeile: Der Satz mit den Zahlen («16 Fahrtage dieses Jahr, 0 im letzten») und «Warum?» klappen auf.',
    'Under an answer stands «As of today, data up to …».': 'Unter einer Antwort steht «Stand heute, Daten bis …».',
  },
};

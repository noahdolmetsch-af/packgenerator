// «Fragen» (Plan «ganze App», Schritt 4a, Noah 08.11.2026 «D b»): der erste Reiter in Auswerten
export default {
  title: 'Questions about your data',
  lead: 'Analysis has a first tab «Questions»: six questions, each answered in one sentence.',
  points: [
    { text: 'Each answer names its number and its limit, and says «observation, not a cause»', go: 'f.fragen' },
    { text: 'With too little data the card says so and does not guess; «Why?» shows how it was counted', go: 'f.fragen' },
  ],
  small: [{ box: 'new', text: 'Typing «questions» into the search leads to the tab' }],
  test: [
    'Open Analysis and tap the first tab «Questions»: six cards with a question each appear.',
    'Read an answer: one sentence, under it the limit. Tap «Why? How it was counted» to open the rule.',
    'Tap «More about this»: the page with the numbers behind the answer opens.',
  ],
  since: ['f.fragen'],
  de: {
    'Questions about your data': 'Fragen an deine Daten',
    'Analysis has a first tab «Questions»: six questions, each answered in one sentence.': 'Auswerten hat einen ersten Reiter «Fragen»: sechs Fragen, jede mit einem Satz als Antwort.',
    'Each answer names its number and its limit, and says «observation, not a cause»': 'Jede Antwort nennt ihre Zahl und ihre Grenze und sagt «Beobachtung, keine Ursache»',
    'With too little data the card says so and does not guess; «Why?» shows how it was counted': 'Bei zu wenig Daten sagt die Karte das und rät nicht; «Warum?» zeigt, wie gerechnet wurde',
    'Typing «questions» into the search leads to the tab': 'Wer «Fragen» in die Suche tippt, kommt zum Reiter',
    'Open Analysis and tap the first tab «Questions»: six cards with a question each appear.': 'Öffne Auswerten und tippe den ersten Reiter «Fragen»: Sechs Karten mit je einer Frage erscheinen.',
    'Read an answer: one sentence, under it the limit. Tap «Why? How it was counted» to open the rule.': 'Lies eine Antwort: ein Satz, darunter die Grenze. Tippe «Warum? Wie gerechnet», um die Regel zu öffnen.',
    'Tap «More about this»: the page with the numbers behind the answer opens.': 'Tippe «Mehr dazu»: Die Seite mit den Zahlen hinter der Antwort öffnet sich.',
  },
};

// Mini-Tools «Termin finden» (Noah 28.10.2026 «1b 2a 3a», idea 1 like Doodle)
export default {
  title: 'Find a date',
  lead: 'Ask a group which day works, by link and without an account.',
  points: [{ text: 'Me › Mini tools › Find a date: pick days, send the link, the best day is on top', href: '#/me/mini', go: 'f.minidate' }],
  small: [
    { box: 'new', text: 'People answer in the browser; only you can read the answers', go: 'f.minidate' },
    { box: 'new', text: 'Plan a trip on the best day or add it to your calendar', go: 'f.minidate' },
  ],
  test: [
    'Open Me › Mini tools › Find a date, write a title, pick three days and tap «Make the link».',
    'Open the link in a private window, write a name, answer and tap «Send my answer».',
    'Back in the app tap «Look for new answers»: the name is in «Who can when», the best day is on top.',
  ],
  since: ['f.minidate'],
  de: {
    'Find a date': 'Termin finden',
    'Ask a group which day works, by link and without an account.': 'Frag eine Gruppe, welcher Tag passt, per Link und ohne Konto.',
    'Me › Mini tools › Find a date: pick days, send the link, the best day is on top': 'Ich › Mini-Tools › Termin finden: Tage wählen, Link schicken, der beste Tag steht oben',
    'People answer in the browser; only you can read the answers': 'Die Leute antworten im Browser; nur du kannst die Antworten lesen',
    'Plan a trip on the best day or add it to your calendar': 'Plane eine Tour am besten Tag oder nimm ihn in den Kalender',
    'Open Me › Mini tools › Find a date, write a title, pick three days and tap «Make the link».': 'Öffne Ich › Mini-Tools › Termin finden, schreib einen Titel, wähle drei Tage und tipp «Link machen».',
    'Open the link in a private window, write a name, answer and tap «Send my answer».': 'Öffne den Link in einem privaten Fenster, schreib einen Namen, antworte und tipp «Antwort senden».',
    'Back in the app tap «Look for new answers»: the name is in «Who can when», the best day is on top.': 'Zurück in der App tipp «Neue Antworten holen»: der Name steht unter «Wer kann wann», der beste Tag oben.',
  },
};

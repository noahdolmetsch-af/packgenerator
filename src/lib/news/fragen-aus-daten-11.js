// «Fragen aus deinen Daten», Stufe 3, Kalender (Noah 05.11.2026 «2b»): am Tag nach einem Termin im Kalender fragen, wie er war
export default {
  title: 'A question after an appointment',
  lead: 'When your calendar had an appointment yesterday, the daily check asks how it was.',
  points: [
    { text: 'An appointment of at least 30 minutes yesterday: «An activity yesterday. How was it?»', go: 'f.datenfragen' },
    { text: 'The rule has a switch, a minimum length and your own words under Me › Your questions', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }] } },
  ],
  test: [
    'Open Me › Your questions: the box «Questions from your data» now shows the rule «An activity yesterday».',
    'Change the minimum length and write your own question, then tap «Back to standard».',
    'Without a Google calendar the box says why the rule is quiet.',
  ],
  since: [],
  de: {
    'A question after an appointment': 'Eine Frage nach einem Termin',
    'When your calendar had an appointment yesterday, the daily check asks how it was.': 'Stand gestern ein Termin in deinem Kalender, fragt der Tagescheck, wie er war.',
    'An appointment of at least 30 minutes yesterday: «An activity yesterday. How was it?»': 'Ein Termin von mindestens 30 Minuten gestern: «Eine Aktivität gestern. Wie war sie?»',
    'The rule has a switch, a minimum length and your own words under Me › Your questions': 'Die Regel hat unter Ich › Deine Abfragen einen Schalter, eine Mindestdauer und deine eigenen Worte',
    'Open Me › Your questions: the box «Questions from your data» now shows the rule «An activity yesterday».': 'Öffne Ich › Deine Abfragen: Der Kasten «Fragen aus deinen Daten» zeigt jetzt die Regel «Eine Aktivität gestern».',
    'Change the minimum length and write your own question, then tap «Back to standard».': 'Ändere die Mindestdauer und schreibe eine eigene Frage, dann tippe auf «Zurück zum Standard».',
    'Without a Google calendar the box says why the rule is quiet.': 'Ohne Google-Kalender sagt der Kasten, warum die Regel still ist.',
  },
};

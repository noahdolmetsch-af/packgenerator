// «Fragen aus deinen Daten», Stufe 3, To-Dos (Noah 05.11.2026 «1a»): bei einem To-Do, das lange überfällig ist, fragen, was im Weg steht
export default {
  title: 'A question about a stuck to-do',
  lead: 'When a to-do in your Google tasks is long past its date, the daily check asks what is in the way.',
  points: [
    { text: 'A to-do 5 days past its date: «What is in the way of this to-do?»', go: 'f.datenfragen' },
    { text: 'The rule has a switch, a number of days and your own words under Me › Your questions', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }] } },
  ],
  test: [
    'Open Me › Your questions: the box «Questions from your data» now shows the rule «A to-do that is stuck».',
    'Change the number of days and write your own question, then tap «Back to standard».',
    'Without Google tasks on this device the box says why the rule is quiet.',
  ],
  since: [],
  de: {
    'A question about a stuck to-do': 'Eine Frage zu einem festgefahrenen To-Do',
    'When a to-do in your Google tasks is long past its date, the daily check asks what is in the way.': 'Ist ein To-Do in deinen Google-Aufgaben lange überfällig, fragt der Tagescheck, was im Weg steht.',
    'A to-do 5 days past its date: «What is in the way of this to-do?»': 'Ein To-Do, das 5 Tage überfällig ist: «Was steht diesem To-Do im Weg?»',
    'The rule has a switch, a number of days and your own words under Me › Your questions': 'Die Regel hat unter Ich › Deine Abfragen einen Schalter, eine Tageszahl und deine eigenen Worte',
    'Open Me › Your questions: the box «Questions from your data» now shows the rule «A to-do that is stuck».': 'Öffne Ich › Deine Abfragen: Der Kasten «Fragen aus deinen Daten» zeigt jetzt die Regel «Ein To-Do, das feststeckt».',
    'Change the number of days and write your own question, then tap «Back to standard».': 'Ändere die Tageszahl und schreibe eine eigene Frage, dann tippe auf «Zurück zum Standard».',
    'Without Google tasks on this device the box says why the rule is quiet.': 'Ohne Google-Aufgaben auf diesem Gerät sagt der Kasten, warum die Regel still ist.',
  },
};

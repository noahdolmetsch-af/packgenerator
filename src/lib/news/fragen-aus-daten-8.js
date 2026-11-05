// «Fragen aus deinen Daten», Stufe 2, Wetter (Noah 04.11.2026 «1a und b»): graue Tage mit tiefer Stimmung, schönes Wetter mit freiem Abend
export default {
  title: 'Weather questions in your daily check',
  lead: 'Two new rules ask about the weather: a grey day with a low mood, and fine weather with a free evening.',
  points: [
    { text: 'Rain is likely and your mood was low: «What does you good on grey days?»', go: 'f.datenfragen' },
    { text: 'Dry, warm and nothing in your calendar this evening: «Anything planned outside?»', go: 'f.datenfragen' },
    { text: 'Both rules have a switch, a threshold and your own words under Me › Your questions', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }] } },
  ],
  test: [
    'Open Me › Your questions: the box «Questions from your data» now shows the rules «Grey day and a low mood» and «Fine weather and a free evening».',
    'Change the rain chance of the first rule and write your own question, then tap «Back to standard».',
    'Without a home place or a Google calendar the box says why the weather rules are quiet.',
  ],
  since: [],
  de: {
    'Weather questions in your daily check': 'Wetter-Fragen im Tagescheck',
    'Two new rules ask about the weather: a grey day with a low mood, and fine weather with a free evening.': 'Zwei neue Regeln fragen nach dem Wetter: ein grauer Tag mit tiefer Stimmung und schönes Wetter mit freiem Abend.',
    'Rain is likely and your mood was low: «What does you good on grey days?»': 'Regen ist wahrscheinlich und deine Stimmung war tief: «Was tut dir an grauen Tagen gut?»',
    'Dry, warm and nothing in your calendar this evening: «Anything planned outside?»': 'Trocken, warm und heute Abend nichts im Kalender: «Draussen etwas geplant?»',
    'Both rules have a switch, a threshold and your own words under Me › Your questions': 'Beide Regeln haben unter Ich › Deine Abfragen einen Schalter, eine Schwelle und deine eigenen Worte',
    'Open Me › Your questions: the box «Questions from your data» now shows the rules «Grey day and a low mood» and «Fine weather and a free evening».': 'Öffne Ich › Deine Abfragen: Der Kasten «Fragen aus deinen Daten» zeigt jetzt die Regeln «Grauer Tag und tiefe Stimmung» und «Schönes Wetter und ein freier Abend».',
    'Change the rain chance of the first rule and write your own question, then tap «Back to standard».': 'Ändere bei der ersten Regel die Regenwahrscheinlichkeit und schreibe eine eigene Frage, dann tippe auf «Zurück zum Standard».',
    'Without a home place or a Google calendar the box says why the weather rules are quiet.': 'Ohne Wohnort oder Google-Kalender sagt der Kasten, warum die Wetter-Regeln still sind.',
  },
};

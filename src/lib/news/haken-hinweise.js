// «Was auffällt» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Thread «Abhaken auf einen Blick verbessern», Schritt 3: Hinweise über alle Aktivitäten)
export default {
  title: 'What stands out in your ticks',
  lead: 'The app now looks across all your activities and tells you what it sees: a series, a gap, what you often tick together.',
  points: [
    { text: 'Auswerten › Woche has a card «What stands out» under the tick history, each hint with its reason', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-haken-hinweise]' }] } },
    { text: 'On Today one quiet line under «Tick off today» shows the most useful hint; a tap opens the card', go: { href: '#/', where: 'When your ticks show a series, a gap or a week without recovery', steps: [{ sel: '[data-haken-hinweis]' }] } },
  ],
  small: [{ box: 'new', text: 'Switch the line off under Me › Look › Suggestions › Performance tips' }],
  test: [
    'Open Auswerten › Woche: under the tick history the card «What stands out» lists up to five hints, each with «Why: …».',
    'Open Today: under «Tick off today» one line shows the most useful hint; tap it and the card opens.',
    'Tick something under «Recovery» (for example the sauna): after a week of movement the hint «Recover today?» is gone.',
  ],
  since: [],
  de: {
    'What stands out in your ticks': 'Was in deinen Haken auffällt',
    'The app now looks across all your activities and tells you what it sees: a series, a gap, what you often tick together.': 'Die App schaut jetzt über alle deine Aktivitäten und sagt dir, was sie sieht: eine Serie, eine Lücke, was du oft zusammen abhakst.',
    'Auswerten › Woche has a card «What stands out» under the tick history, each hint with its reason': 'Auswerten › Woche hat unter dem Haken-Verlauf eine Karte «Was auffällt», jeder Hinweis mit seinem Grund',
    'On Today one quiet line under «Tick off today» shows the most useful hint; a tap opens the card': 'Auf Heute zeigt eine ruhige Zeile unter «Heute abhaken» den nützlichsten Hinweis; ein Tipp öffnet die Karte',
    'When your ticks show a series, a gap or a week without recovery': 'Wenn deine Haken eine Serie, eine Lücke oder eine Woche ohne Erholung zeigen',
    'Switch the line off under Me › Look › Suggestions › Performance tips': 'Schalte die Zeile aus unter Ich › Aussehen › Vorschläge › Leistungstipps',
    'Open Auswerten › Woche: under the tick history the card «What stands out» lists up to five hints, each with «Why: …».': 'Öffne Auswerten › Woche: unter dem Haken-Verlauf listet die Karte «Was auffällt» bis zu fünf Hinweise, jeder mit «Warum: …».',
    'Open Today: under «Tick off today» one line shows the most useful hint; tap it and the card opens.': 'Öffne Heute: unter «Heute abhaken» zeigt eine Zeile den nützlichsten Hinweis; tippe sie an, und die Karte öffnet sich.',
    'Tick something under «Recovery» (for example the sauna): after a week of movement the hint «Recover today?» is gone.': 'Hake etwas unter «Erholung» ab (zum Beispiel die Sauna): nach einer Woche Bewegung ist der Hinweis «Heute erholen?» weg.',
  },
};

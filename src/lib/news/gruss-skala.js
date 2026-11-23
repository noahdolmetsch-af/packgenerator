// «Gesichter auf der Skala» (Noah 22.11.2026 «a», Schritt C/F2): the greeting's faces are answers of «How is the mood?»
export default {
  title: 'Your face is a mood answer',
  lead: 'The face you tap in the greeting now counts as your answer to «How is the mood?», so the week review and the evaluations read one mood.',
  points: [{ text: 'Tap a face in the greeting: it is saved as a mood from 1 to 10 (Müed 1, Gaht so 3, Okay 6, Guet 8, Super 10); older face answers stay and are read as before', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }], where: 'Today, the greeting at the top («Wi gaht\'s?»); the history under Me › Data › History.' } }],
  small: [],
  test: ['On Today tap the greeting and choose a face. Under Me › Data › History the answer stands as «How is the mood?» with its number. Older faces are still there.'],
  since: [],
  de: {
    'Your face is a mood answer': 'Dein Gesicht ist eine Stimmungs-Antwort',
    'The face you tap in the greeting now counts as your answer to «How is the mood?», so the week review and the evaluations read one mood.': 'Das Gesicht, das du im Gruss antippst, zählt jetzt als Antwort auf «Wie ist die Stimmung?», damit der Wochenrückblick und die Auswertungen eine Stimmung lesen.',
    'Tap a face in the greeting: it is saved as a mood from 1 to 10 (Müed 1, Gaht so 3, Okay 6, Guet 8, Super 10); older face answers stay and are read as before': 'Tippe im Gruss ein Gesicht an: es wird als Stimmung von 1 bis 10 gespeichert (Müed 1, Gaht so 3, Okay 6, Guet 8, Super 10); ältere Gesichts-Antworten bleiben und werden wie bisher gelesen',
    'Today, the greeting at the top («Wi gaht\'s?»); the history under Me › Data › History.': 'Heute, der Gruss ganz oben («Wi gaht\'s?»); der Verlauf unter Ich › Daten › Verlauf.',
    'On Today tap the greeting and choose a face. Under Me › Data › History the answer stands as «How is the mood?» with its number. Older faces are still there.': 'Tippe auf Heute den Gruss an und wähle ein Gesicht. Unter Ich › Daten › Verlauf steht die Antwort als «Wie ist die Stimmung?» mit ihrer Zahl. Ältere Gesichter sind noch da.',
  },
};

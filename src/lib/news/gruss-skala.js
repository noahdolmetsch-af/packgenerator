// «Gesichter auf der Skala» + «Gym zählt eine Stunde» (Noah 22.11.2026 «a» und «gym normalfall 1h», Schritt C/F2): one file, because a PR adds one news file
export default {
  title: 'Your face is a mood answer, Gym counts one hour',
  lead: 'The face you tap in the greeting counts as your answer to «How is the mood?», and a Gym tick without minutes counts one hour.',
  points: [
    { text: 'Tap a face in the greeting: it is saved as a mood from 1 to 10 (Müed 1, Gaht so 3, Okay 6, Guet 8, Super 10); older face answers stay and are read as before', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }], where: 'Today, the greeting at the top («Wi gaht\'s?»); the history under Me › Data › History.' } },
    { text: 'Where you did not note the minutes, Gym counts with one hour, marked «ca.»; change it for yourself under «Usual duration»', go: { href: '#/flow/sports', steps: [{ sel: '[data-usual-list] summary' }], where: 'Active › My activities › Usual duration: «Gym 60 min (standard)».' } },
  ],
  small: [],
  test: [
    'On Today tap the greeting and choose a face. Under Me › Data › History the answer stands as «How is the mood?» with its number. Older faces are still there.',
    'Open Active › My activities › Usual duration: Gym shows «60 min (standard)». Your own value stays as you set it.',
  ],
  since: [],
  de: {
    'Your face is a mood answer, Gym counts one hour': 'Dein Gesicht ist eine Stimmungs-Antwort, Gym zählt eine Stunde',
    'The face you tap in the greeting counts as your answer to «How is the mood?», and a Gym tick without minutes counts one hour.': 'Das Gesicht, das du im Gruss antippst, zählt als Antwort auf «Wie ist die Stimmung?», und ein Gym-Haken ohne Minuten zählt eine Stunde.',
    'Tap a face in the greeting: it is saved as a mood from 1 to 10 (Müed 1, Gaht so 3, Okay 6, Guet 8, Super 10); older face answers stay and are read as before': 'Tippe im Gruss ein Gesicht an: es wird als Stimmung von 1 bis 10 gespeichert (Müed 1, Gaht so 3, Okay 6, Guet 8, Super 10); ältere Gesichts-Antworten bleiben und werden wie bisher gelesen',
    'Today, the greeting at the top («Wi gaht\'s?»); the history under Me › Data › History.': 'Heute, der Gruss ganz oben («Wi gaht\'s?»); der Verlauf unter Ich › Daten › Verlauf.',
    'Where you did not note the minutes, Gym counts with one hour, marked «ca.»; change it for yourself under «Usual duration»': 'Wo du die Minuten nicht notiert hast, zählt Gym mit einer Stunde, mit «ca.» markiert; ändere es für dich unter «Übliche Dauer»',
    'Active › My activities › Usual duration: «Gym 60 min (standard)».': 'Aktiv › Meine Aktivitäten › Übliche Dauer: «Gym 60 Min. (Standard)».',
    'On Today tap the greeting and choose a face. Under Me › Data › History the answer stands as «How is the mood?» with its number. Older faces are still there.': 'Tippe auf Heute den Gruss an und wähle ein Gesicht. Unter Ich › Daten › Verlauf steht die Antwort als «Wie ist die Stimmung?» mit ihrer Zahl. Ältere Gesichter sind noch da.',
    'Open Active › My activities › Usual duration: Gym shows «60 min (standard)». Your own value stays as you set it.': 'Öffne Aktiv › Meine Aktivitäten › Übliche Dauer: Gym zeigt «60 Min. (Standard)». Dein eigener Wert bleibt, wie du ihn eingestellt hast.',
  },
};

// Noah 24.11.2026 (Karte «Vor Updates»: 3 Kopien = 166 MB, Entscheid «Nur 1 Kopie»): only the last copy before an update stays
export default {
  title: 'One copy before updates is enough',
  lead: 'The app keeps only the last copy of your data from before an update, so it takes much less room on this device.',
  points: [{ text: 'Me › Data › More › Before updates: one copy before the last update, three before imports', go: { href: '#/me/data', steps: [{ sel: '[data-morefold="more"] summary' }] } }],
  small: [],
  test: ['Open Me › Data › More: «Before updates» says one copy before the last update stays.', 'Tap «Measure storage»: the row «Before updates» shows one copy and a smaller size.'],
  since: [],
  de: {
    'One copy before updates is enough': 'Eine Kopie vor Updates genügt',
    'The app keeps only the last copy of your data from before an update, so it takes much less room on this device.': 'Die App behält nur noch die letzte Kopie deiner Daten von vor einem Update, so braucht sie viel weniger Platz auf diesem Gerät.',
    'Me › Data › More › Before updates: one copy before the last update, three before imports': 'Ich › Daten › Mehr › Vor Updates: eine Kopie vor dem letzten Update, drei vor Importen',
    'Open Me › Data › More: «Before updates» says one copy before the last update stays.': 'Öffne Ich › Daten › Mehr: «Vor Updates» sagt, dass eine Kopie vor dem letzten Update bleibt.',
    'Tap «Measure storage»: the row «Before updates» shows one copy and a smaller size.': 'Tippe auf «Speicher messen»: Die Zeile «Vor Updates» zeigt eine Kopie und eine kleinere Grösse.',
  },
};

// «Gemergt, noch nicht online» (Noah 27.10.2026 «1-5 a», question 5): Ich says how many finished changes
// are not online yet, from GitHub's public API without an account
export default {
  title: 'Finished, but not online yet',
  lead: 'Ich shows how many finished changes are still on their way online.',
  points: [{ text: 'Ich › Help: «2 finished changes are not online yet»', href: '#/me' }],
  small: [],
  test: ['Right after a merge open Ich › Help: under the version a line says how many changes are not online yet.', 'A few minutes later the line is gone and the online version is the new one.'],
  since: [],
  de: {
    'Finished, but not online yet': 'Fertig, aber noch nicht online',
    'Ich shows how many finished changes are still on their way online.': 'Ich zeigt, wie viele fertige Änderungen noch auf dem Weg online sind.',
    'Ich › Help: «2 finished changes are not online yet»': 'Ich › Hilfe: «2 fertige Änderungen sind noch nicht online»',
    'Right after a merge open Ich › Help: under the version a line says how many changes are not online yet.': 'Öffne gleich nach einem Merge Ich › Hilfe: Unter der Version steht, wie viele Änderungen noch nicht online sind.',
    'A few minutes later the line is gone and the online version is the new one.': 'Ein paar Minuten später ist die Zeile weg, und online steht die neue Version.',
  },
};

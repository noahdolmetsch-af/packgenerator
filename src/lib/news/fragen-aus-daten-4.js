// «Fragen aus deinen Daten», Stufe 2, Schritt 1 (Noah 03.11.2026, «bau stufe 2»): a long day on Strava asks about the legs
export default {
  title: 'A question after a long day',
  lead: 'After a long day on Strava the check asks how your legs feel, and says why.',
  points: [
    { text: 'A long activity yesterday (3 hours or more) brings the question «How do your legs feel after yesterday?»', go: 'f.datenfragen' },
    { text: 'Change the hours or the wording, or switch the rule off', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule-val="training"]' }] } },
  ],
  test: [
    'Open Me › Your questions: «Long day yesterday» is the fourth rule.',
    'Change the hours to 1 or switch the rule off and on.',
    'After a long ride, the next morning check asks about your legs with «Why am I asking this?».',
  ],
  since: [],
  de: {
    'A question after a long day': 'Eine Frage nach einem langen Tag',
    'After a long day on Strava the check asks how your legs feel, and says why.': 'Nach einem langen Tag auf Strava fragt der Check, wie sich deine Beine anfühlen, und sagt, warum.',
    'A long activity yesterday (3 hours or more) brings the question «How do your legs feel after yesterday?»': 'Eine lange Aktivität gestern (3 Stunden oder mehr) bringt die Frage «Wie fühlen sich deine Beine nach gestern an?»',
    'Change the hours or the wording, or switch the rule off': 'Ändere die Stunden oder die Worte, oder schalte die Regel aus',
    'Open Me › Your questions: «Long day yesterday» is the fourth rule.': 'Öffne Ich › Deine Abfragen: «Langer Tag gestern» ist die vierte Regel.',
    'Change the hours to 1 or switch the rule off and on.': 'Ändere die Stunden auf 1 oder schalte die Regel aus und wieder ein.',
    'After a long ride, the next morning check asks about your legs with «Why am I asking this?».': 'Nach einer langen Fahrt fragt der Morgen-Check nach deinen Beinen, mit «Warum frage ich das?».',
  },
};

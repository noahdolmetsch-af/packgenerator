// «Fragen aus deinen Daten» (Noah 03.11.2026 «1b 2a 3a 4a 5a», «bau stufe 1»): the first question that comes from your values
export default {
  title: 'Questions from your data',
  lead: 'When your resting pulse stands out, the check asks what was different, and says why.',
  points: [
    { text: 'The morning check asks about yesterday when your resting pulse is clearly above your usual, with «Why am I asking this?»', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }] } },
    { text: 'Under Me › Your questions you can switch this rule off', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule="ruhepuls"]' }] } },
  ],
  small: [{ box: 'new', text: 'Worked out on this device only, up to 3 such questions a day' }],
  test: [
    'Open Me › Your questions: on the right find «Questions from your data».',
    'Switch «Resting pulse above your usual» off and on again.',
  ],
  since: [],
  de: {
    'Questions from your data': 'Fragen aus deinen Daten',
    'When your resting pulse stands out, the check asks what was different, and says why.': 'Wenn dein Ruhepuls auffällt, fragt der Check, was anders war, und sagt, warum.',
    'The morning check asks about yesterday when your resting pulse is clearly above your usual, with «Why am I asking this?»': 'Der Morgen-Check fragt nach gestern, wenn dein Ruhepuls deutlich über deinem Üblichen liegt, mit «Warum frage ich das?»',
    'Under Me › Your questions you can switch this rule off': 'Unter Ich › Deine Abfragen kannst du diese Regel ausschalten',
    'Worked out on this device only, up to 3 such questions a day': 'Nur auf diesem Gerät gerechnet, bis zu 3 solche Fragen pro Tag',
    'Open Me › Your questions: on the right find «Questions from your data».': 'Öffne Ich › Deine Abfragen: rechts steht «Fragen aus deinen Daten».',
    'Switch «Resting pulse above your usual» off and on again.': 'Schalte «Ruhepuls über deinem Üblichen» aus und wieder ein.',
  },
};

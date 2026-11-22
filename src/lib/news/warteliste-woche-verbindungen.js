// Warteliste F3, F4, F6 (Noah 22.11.2026, Testfunde): three small fixes in the week and in Connections
export default {
  title: 'Three small fixes',
  lead: 'Own to-dos in the week no longer look like ideas of the app, removing asks first, and Mail shows its state.',
  points: [
    { text: 'A to-do of your own without a day says «Your to-do», with «Remove» instead of «Never suggest»', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }], where: 'Planen › Woche: the block «Still to plan».' } },
    { text: 'Removing a to-do or a date in the week asks first and then offers Undo', go: { href: '#/week', where: 'Planen › Woche: the × on a to-do or a date of your own.' } },
    { text: 'In Connections the row «Mail» shows «on» or «off» like the others', go: { href: '#/me/connections', where: 'Ich › Connections: the row «Mail».' } },
  ],
  small: [],
  test: [
    'Planen › Woche: open «Still to plan». A to-do without a day says «Your to-do, no day yet» and has «Remove», not «Never suggest».',
    'Tap «Remove» (or the × on a to-do in a day): a question appears. «Cancel» keeps it; «Delete» removes it and offers Undo.',
    'Ich › Connections: the row «Mail» has a state on the right, like Strava and Fitbit.',
  ],
  since: [],
  de: {
    'Three small fixes': 'Drei kleine Verbesserungen',
    'Own to-dos in the week no longer look like ideas of the app, removing asks first, and Mail shows its state.': 'Eigene To-dos in der Woche sehen nicht mehr wie Ideen der App aus, Entfernen fragt zuerst, und Mail zeigt seinen Stand.',
    'A to-do of your own without a day says «Your to-do», with «Remove» instead of «Never suggest»': 'Ein eigenes To-do ohne Tag sagt «Dein To-do» und hat «Entfernen» statt «Nie mehr vorschlagen»',
    'Planen › Woche: the block «Still to plan».': 'Planen › Woche: der Block «Noch einplanen».',
    'Removing a to-do or a date in the week asks first and then offers Undo': 'Ein To-do oder einen Termin in der Woche entfernen fragt zuerst und bietet dann Rückgängig',
    'Planen › Woche: the × on a to-do or a date of your own.': 'Planen › Woche: das × an einem eigenen To-do oder Termin.',
    'In Connections the row «Mail» shows «on» or «off» like the others': 'In Verbindungen zeigt die Zeile «Mail» «an» oder «aus» wie die anderen',
    'Ich › Connections: the row «Mail».': 'Ich › Verbindungen: die Zeile «Mail».',
    'Planen › Woche: open «Still to plan». A to-do without a day says «Your to-do, no day yet» and has «Remove», not «Never suggest».': 'Planen › Woche: «Noch einplanen» öffnen. Ein To-do ohne Tag sagt «Dein To-do, noch ohne Tag» und hat «Entfernen», nicht «Nie mehr vorschlagen».',
    'Tap «Remove» (or the × on a to-do in a day): a question appears. «Cancel» keeps it; «Delete» removes it and offers Undo.': '«Entfernen» antippen (oder das × an einem To-do in einem Tag): eine Frage erscheint. «Abbrechen» behält es; «Löschen» entfernt es und bietet Rückgängig.',
    'Ich › Connections: the row «Mail» has a state on the right, like Strava and Fitbit.': 'Ich › Verbindungen: die Zeile «Mail» hat rechts einen Stand, wie Strava und Fitbit.',
  },
};

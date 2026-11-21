// «Hinweise lernen aus dem Wegtippen» (Noah 21.11.2026 «4a»): after «Not today» on three days the app asks once
export default {
  title: 'Hints that listen',
  lead: 'If you send the same kind of hint away on three days, the app asks once whether to make it quieter.',
  points: [
    { text: '«Not today» three times under the rest-day line or the ride above the fog: one question «Make this hint quieter?»', go: { href: '#/me/look', steps: [{ text: 'Suggestions' }], where: 'Me › Look › Suggestions' } },
  ],
  small: [{ box: 'new', text: 'Nothing is switched off without your tap, and Undo brings it back' }],
  test: ['On Active, send the rest-day line away with «Not today» on three different days.', 'On the third day a question «Make this hint quieter?» appears: «Yes, quieter» switches the kind off, «Keep it» leaves it.'],
  since: ['f.hintquiet'],
  de: {
    'Hints that listen': 'Hinweise, die zuhören',
    'If you send the same kind of hint away on three days, the app asks once whether to make it quieter.': 'Wenn du dieselbe Art Hinweis an drei Tagen wegschickst, fragt die App einmal, ob sie leiser sein soll.',
    '«Not today» three times under the rest-day line or the ride above the fog: one question «Make this hint quieter?»': 'Dreimal «Nicht heute» bei der Ruhetag-Zeile oder der Fahrt über dem Nebel: eine Frage «Diesen Hinweis leiser stellen?»',
    'Me › Look › Suggestions': 'Ich › Darstellung › Vorschläge',
    'Nothing is switched off without your tap, and Undo brings it back': 'Ohne deinen Tipp wird nichts ausgeschaltet, und «Rückgängig» holt es zurück',
    'On Active, send the rest-day line away with «Not today» on three different days.': 'Schicke in Aktiv die Ruhetag-Zeile an drei verschiedenen Tagen mit «Nicht heute» weg.',
    'On the third day a question «Make this hint quieter?» appears: «Yes, quieter» switches the kind off, «Keep it» leaves it.': 'Am dritten Tag erscheint die Frage «Diesen Hinweis leiser stellen?»: «Ja, leiser» schaltet die Art aus, «So lassen» belässt sie.',
  },
};

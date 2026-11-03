// «Abgleich: klare Meldung» (Noah 03.11.2026 «3b»): a phone that cannot save says so instead of «server error»
export default {
  title: 'A clearer sync message',
  lead: 'If the phone cannot save what the sync brings, it now says so.',
  points: [{ text: 'A full phone is named as the reason instead of «server error»', go: { href: '#/me/data', where: 'Me › Data and backup › Phone and computer. The message appears only when the sync fails.' } }],
  small: [],
  test: ['Open Me › Data and backup › Phone and computer and tap «Sync now»: «Done» shows.', 'If the phone is full, the message says so.'],
  since: [],
  de: {
    'A clearer sync message': 'Eine klarere Abgleich-Meldung',
    'If the phone cannot save what the sync brings, it now says so.': 'Wenn das Handy nicht speichern kann, was der Abgleich bringt, sagt es das jetzt.',
    'A full phone is named as the reason instead of «server error»': 'Ein volles Handy wird als Grund genannt, statt «Serverfehler»',
    'Me › Data and backup › Phone and computer. The message appears only when the sync fails.': 'Ich › Daten und Backup › Handy und Computer. Die Meldung erscheint nur, wenn der Abgleich scheitert.',
    'Open Me › Data and backup › Phone and computer and tap «Sync now»: «Done» shows.': 'Öffne Ich › Daten und Backup › Handy und Computer und tippe «Jetzt abgleichen»: «Fertig» erscheint.',
    'If the phone is full, the message says so.': 'Ist das Handy voll, sagt die Meldung das.',
  },
};

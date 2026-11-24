// «Aktionen in Auswerten» (Noah 23.11.2026 «1-5a», 4a), Teil 4: die Löschen-Regel wird so geschrieben, wie die App sie lebt
export default {
  title: 'Deleting: Undo for the quick things',
  lead: 'What you make again quickly goes at once and can be undone for 8 seconds; things with a history still ask first.',
  points: [
    { text: 'An idea, a life phase or a weight goes at once with «Undo» for 8 seconds; a question with answers, a group with contents, a bike or a tour still ask first', go: { href: '#/flow/ideen', where: 'Remove one of your own ideas on «Ideas»: the note with «Undo» stays 8 seconds.' } },
  ],
  small: [],
  test: [
    'On «Ideas» remove one of your own ideas: it goes at once and the note offers «Undo».',
    'In «Wi gaht\'s?» delete a question: a window asks first.',
  ],
  since: [],
  de: {
    'Deleting: Undo for the quick things': 'Löschen: Rückgängig für das Schnelle',
    'What you make again quickly goes at once and can be undone for 8 seconds; things with a history still ask first.': 'Was du schnell wieder anlegst, geht sofort weg und lässt sich 8 Sekunden lang zurückholen; Dinge mit Verlauf fragen weiter zuerst.',
    'An idea, a life phase or a weight goes at once with «Undo» for 8 seconds; a question with answers, a group with contents, a bike or a tour still ask first': 'Eine Idee, eine Lebensphase oder ein Gewicht geht sofort weg, mit «Rückgängig» für 8 Sekunden; eine Frage mit Antworten, ein Bereich mit Inhalt, ein Velo oder eine Tour fragen weiter zuerst',
    'Remove one of your own ideas on «Ideas»: the note with «Undo» stays 8 seconds.': 'Entferne in «Ideen» eine deiner eigenen Ideen: Der Hinweis mit «Rückgängig» bleibt 8 Sekunden.',
    'On «Ideas» remove one of your own ideas: it goes at once and the note offers «Undo».': 'Entferne in «Ideen» eine deiner eigenen Ideen: Sie geht sofort weg, und der Hinweis bietet «Rückgängig».',
    'In «Wi gaht\'s?» delete a question: a window asks first.': 'Lösche in «Wi gaht\'s?» eine Frage: Ein Fenster fragt zuerst.',
  },
};

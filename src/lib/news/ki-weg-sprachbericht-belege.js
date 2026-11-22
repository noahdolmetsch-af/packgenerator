// «KI entfernen, Schritt 6b» (Noah 20.11.2026 «a»): kein Gemini mehr im Sprachbericht und bei den Belegen
export default {
  title: 'No more Gemini in the spoken debrief and the sources page',
  lead: 'The app sorts what you tell sentence by sentence; sources and open points of your plan stay.',
  points: [
    { text: 'The spoken debrief makes its key points with the app itself, sentence by sentence; you still keep or leave each point', go: { href: '#/debrief', where: 'Debrief: «Speak your look back».' } },
    { text: 'Assistant with sources: «Ask Gemini with these sources» and «Collect the strongest counter-arguments» are gone; sources and the open points of your next trip stay', go: { href: '#/me/ruhig/belege', where: 'Me › Calm and personal › Assistant with sources.' } },
    { text: '«Check AI suggestions first» only shows while answers kept from before are waiting', go: null },
  ],
  small: [],
  test: [
    'Open a debrief, fold «Speak your look back», type two sentences and tap «Make key points»: the points appear, with no word about Gemini.',
    'Open Me › Calm and personal › Assistant with sources, ask a question: the answer of the app and the sources show, but no button «Ask Gemini with these sources».',
    'Open «Question my plan»: the open points show, with no button for counter-arguments.',
  ],
  since: [],
  de: {
    'No more Gemini in the spoken debrief and the sources page': 'Kein Gemini mehr im Sprachbericht und bei den Belegen',
    'The app sorts what you tell sentence by sentence; sources and open points of your plan stay.': 'Die App gliedert, was du erzählst, Satz für Satz; Belege und offene Punkte deines Plans bleiben.',
    'The spoken debrief makes its key points with the app itself, sentence by sentence; you still keep or leave each point': 'Der Sprachbericht macht seine Kernpunkte mit der App selbst, Satz für Satz; jeden Punkt behältst du oder lässt ihn weg',
    'Debrief: «Speak your look back».': 'Rückblick: «Rückblick sprechen».',
    'Assistant with sources: «Ask Gemini with these sources» and «Collect the strongest counter-arguments» are gone; sources and the open points of your next trip stay': 'Assistent mit Belegen: «Gemini mit diesen Belegen fragen» und «Die stärksten Gegenargumente sammeln» sind weg; Belege und die offenen Punkte deiner nächsten Tour bleiben',
    'Me › Calm and personal › Assistant with sources.': 'Ich › Ruhig und persönlich › Assistent mit Belegen.',
    '«Check AI suggestions first» only shows while answers kept from before are waiting': '«KI-Vorschläge zuerst prüfen» zeigt sich nur noch, solange früher behaltene Antworten warten',
    'Open a debrief, fold «Speak your look back», type two sentences and tap «Make key points»: the points appear, with no word about Gemini.': 'Öffne einen Rückblick, klappe «Rückblick sprechen» auf, tippe zwei Sätze und tippe «Kernaussagen machen»: die Punkte erscheinen, ohne ein Wort über Gemini.',
    'Open Me › Calm and personal › Assistant with sources, ask a question: the answer of the app and the sources show, but no button «Ask Gemini with these sources».': 'Öffne Ich › Ruhig und persönlich › Assistent mit Belegen und stelle eine Frage: die Antwort der App und die Belege zeigen sich, aber kein Knopf «Gemini mit diesen Belegen fragen».',
    'Open «Question my plan»: the open points show, with no button for counter-arguments.': 'Öffne «Meinen Plan hinterfragen»: die offenen Punkte zeigen sich, ohne Knopf für Gegenargumente.',
  },
};

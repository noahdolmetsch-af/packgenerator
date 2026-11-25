// Gesamttest Runde 2 (25.11.2026, Noah «Alle B und C weitergeben»): C1 Suchfeld am Ort mit Namen, C2 Thema der Erkenntnis in der Suche übersetzt
export default {
  title: 'Search: topics in your language, fields with a name',
  lead: 'Two small fixes in the search: a learning shows its topic in your language, and the search field on a page has a name for screen readers.',
  points: [
    { text: 'Under «Learnings» the search now shows the topic in your language, like the page «Learned» does, and finds it by that word', go: { href: '#/', steps: [{ aria: 'Search everything' }], where: 'Type the topic of one of your learnings, for example «Schlaf».' } },
  ],
  small: [{ box: 'new', text: 'The search field on a page (Me, Evaluate, shared Komoot) has a name for screen readers, not only the grey hint' }],
  test: ['Open the search and type the topic of a learning in German (for example «Schlaf»): the row under «Learnings» shows the topic in German.', 'Open Evaluate: the search field on the page is read as «Find a value or question» by a screen reader.'],
  since: [],
  de: {
    'Search: topics in your language, fields with a name': 'Suche: Themen in deiner Sprache, Felder mit Namen',
    'Two small fixes in the search: a learning shows its topic in your language, and the search field on a page has a name for screen readers.': 'Zwei kleine Korrekturen in der Suche: Eine Erkenntnis zeigt ihr Thema in deiner Sprache, und das Suchfeld auf einer Seite hat einen Namen für Screenreader.',
    'Under «Learnings» the search now shows the topic in your language, like the page «Learned» does, and finds it by that word': 'Unter «Erkenntnisse» zeigt die Suche das Thema jetzt in deiner Sprache, wie die Seite «Gelernt», und findet es mit diesem Wort',
    'Type the topic of one of your learnings, for example «Schlaf».': 'Tippe das Thema einer deiner Erkenntnisse, zum Beispiel «Schlaf».',
    'The search field on a page (Me, Evaluate, shared Komoot) has a name for screen readers, not only the grey hint': 'Das Suchfeld auf einer Seite (Ich, Auswerten, geteilte Komoot-Routen) hat einen Namen für Screenreader, nicht nur den grauen Hinweis',
    'Open the search and type the topic of a learning in German (for example «Schlaf»): the row under «Learnings» shows the topic in German.': 'Öffne die Suche und tippe das Thema einer Erkenntnis auf Deutsch (zum Beispiel «Schlaf»): die Zeile unter «Erkenntnisse» zeigt das Thema auf Deutsch.',
    'Open Evaluate: the search field on the page is read as «Find a value or question» by a screen reader.': 'Öffne Auswerten: Ein Screenreader liest das Suchfeld auf der Seite als «Wert oder Frage suchen».',
  },
};

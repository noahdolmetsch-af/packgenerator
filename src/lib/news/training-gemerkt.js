// «Training verbessern» 3d (Noah 3.11.2026 «3d»): own changes to the suggestion are remembered
export default {
  title: 'Your changes are remembered',
  lead: 'When you take over a suggestion, the app notes what you removed or made longer or shorter. After two times it does the same in the next suggestion and says so in the reasons. «Forget them» clears it.',
  points: [{ text: 'See «Your earlier changes are remembered» in «Suggestion for this week»', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }] } }],
  small: [],
  test: [
    'Open Aktiv › Training, tap «Suggestion for this week», remove a session with × and tap «Take over». Do the same once more next time.',
    'The next suggestion leaves that session out and says so in the reasons; «Forget them» brings it back.',
  ],
  since: [],
  de: {
    'Your changes are remembered': 'Deine Änderungen werden gemerkt',
    'When you take over a suggestion, the app notes what you removed or made longer or shorter. After two times it does the same in the next suggestion and says so in the reasons. «Forget them» clears it.': 'Wenn du einen Vorschlag übernimmst, merkt sich die App, was du entfernt oder länger oder kürzer gemacht hast. Nach zweimal macht sie es im nächsten Vorschlag auch so und sagt es in der Begründung. «Vergessen» löscht es.',
    'See «Your earlier changes are remembered» in «Suggestion for this week»': 'Schau «Deine früheren Änderungen werden gemerkt» bei «Vorschlag für diese Woche» an',
    'Open Aktiv › Training, tap «Suggestion for this week», remove a session with × and tap «Take over». Do the same once more next time.': 'Öffne Aktiv › Training, tippe auf «Vorschlag für diese Woche», entferne eine Einheit mit × und tippe «Übernehmen». Mach es beim nächsten Mal nochmals so.',
    'The next suggestion leaves that session out and says so in the reasons; «Forget them» brings it back.': 'Der nächste Vorschlag lässt diese Einheit weg und sagt es in der Begründung; «Vergessen» bringt sie zurück.',
  },
};

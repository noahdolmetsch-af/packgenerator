// «Tourenvorschläge: Anreise» (Noah 23.11.2026 «alles umsetzen», «5a»: zuerst eine Schätzung ab Wohnort, der echte Fahrplan später)
export default {
  title: 'Tour suggestions: the journey',
  lead: 'Every suggested tour now says how long the journey takes there and back, so you see the whole day.',
  points: [
    { text: 'Each tour shows the journey (public transport with the bike or by car, from home or from Zurich main station) and the whole day with it', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="list"]' }, { sel: '[data-vs-trip]' }], where: 'Trips › Dreams › Tour suggestions, «List»: the line under the numbers of a tour.' } },
    { text: 'Filter by the longest journey: up to 1, 2 or 3 hours, by public transport or by car', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-travel]' }] } },
    { text: '«Why this suggestion?» says if the whole day fits into half a day', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-why]' }] } },
  ],
  small: [],
  test: ['Open Trips › Dreams › Tour suggestions › «List»: every tour has a line «Journey about … there».', 'Tap «By car» under Journey: the times get shorter.', 'Tap «Up to 1 h»: only tours with a short journey stay.', 'Open a tour: «Why this suggestion?» has a journey line with the whole day.'],
  since: [],
  de: {
    'Tour suggestions: the journey': 'Tourenvorschläge: die Anreise',
    'Every suggested tour now says how long the journey takes there and back, so you see the whole day.': 'Jede vorgeschlagene Tour sagt jetzt, wie lange die Anreise hin und zurück dauert, damit du den ganzen Tag siehst.',
    'Each tour shows the journey (public transport with the bike or by car, from home or from Zurich main station) and the whole day with it': 'Jede Tour zeigt die Anreise (ÖV mit Velo oder Auto, von zu Hause oder vom Zürcher Hauptbahnhof) und den ganzen Tag damit',
    'Trips › Dreams › Tour suggestions, «List»: the line under the numbers of a tour.': 'Touren › Träume › Tourenvorschläge, «Liste»: die Zeile unter den Zahlen einer Tour.',
    'Filter by the longest journey: up to 1, 2 or 3 hours, by public transport or by car': 'Filtere nach der längsten Anreise: bis 1, 2 oder 3 Stunden, mit ÖV oder Auto',
    '«Why this suggestion?» says if the whole day fits into half a day': '«Warum dieser Vorschlag?» sagt, ob der ganze Tag in einen halben Tag passt',
    'Open Trips › Dreams › Tour suggestions › «List»: every tour has a line «Journey about … there».': 'Öffne Touren › Träume › Tourenvorschläge › «Liste»: jede Tour hat eine Zeile «Anreise etwa … hin».',
    'Tap «By car» under Journey: the times get shorter.': 'Tippe unter Anreise «Mit dem Auto»: die Zeiten werden kürzer.',
    'Tap «Up to 1 h»: only tours with a short journey stay.': 'Tippe «Bis 1 h»: nur Touren mit kurzer Anreise bleiben.',
    'Open a tour: «Why this suggestion?» has a journey line with the whole day.': 'Öffne eine Tour: «Warum dieser Vorschlag?» hat eine Anreise-Zeile mit dem ganzen Tag.',
  },
};

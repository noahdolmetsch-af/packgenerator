// «Tourenvorschläge: Anreise und passt zu dir» (Noah 23.11.2026 «alles umsetzen», «5a»: zuerst eine Schätzung ab Wohnort, der echte Fahrplan später)
// Eine Datei für den ganzen PR (Version nach Reihenfolge auf main: eine Datei je PR).
export default {
  title: 'Tour suggestions: the journey and what fits you today',
  lead: 'Every suggested tour says how long the journey takes, and what fits you today: your form, your free time and your bike.',
  points: [
    { text: 'Each tour shows the journey (public transport with the bike or by car, from home or from Zurich main station) and the whole day with it; filter by the longest journey: up to 1, 2 or 3 hours', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="list"]' }, { sel: '[data-vs-trip]' }], where: 'Trips › Dreams › Tour suggestions, «List»: the line under the numbers of a tour.' } },
    { text: 'A line «For you» says how your form is today, how long you are free until sunset or your next appointment, and if you have a mountain bike; the filter «Doable today» keeps only what fits', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-you]' }], where: 'Trips › Dreams › Tour suggestions, filters: the group «For you».' } },
    { text: '«Why this suggestion?» says if the whole day fits into half a day and has the new lines «Free time», «Form today» and «Bike», each one can be switched off', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-why]' }] } },
  ],
  small: [],
  test: ['Open Trips › Dreams › Tour suggestions › «List»: every tour has a line «Journey about … there». Tap «By car» under Journey: the times get shorter.', 'Tap «Up to 1 h»: only tours with a short journey stay.', 'Under the filters the group «For you» has a line about today. Tap «Doable today»: only tours that fit stay (without a home place or a form answer all stay).', 'Open a tour: «Why this suggestion?» has a journey line with the whole day, and lines for free time, form and bike when the app knows them.'],
  since: [],
  de: {
    'Tour suggestions: the journey and what fits you today': 'Tourenvorschläge: die Anreise und was heute zu dir passt',
    'Every suggested tour says how long the journey takes, and what fits you today: your form, your free time and your bike.': 'Jede vorgeschlagene Tour sagt, wie lange die Anreise dauert und was heute zu dir passt: deine Form, deine freie Zeit und dein Velo.',
    'Each tour shows the journey (public transport with the bike or by car, from home or from Zurich main station) and the whole day with it; filter by the longest journey: up to 1, 2 or 3 hours': 'Jede Tour zeigt die Anreise (ÖV mit Velo oder Auto, von zu Hause oder vom Zürcher Hauptbahnhof) und den ganzen Tag damit; filtere nach der längsten Anreise: bis 1, 2 oder 3 Stunden',
    'Trips › Dreams › Tour suggestions, «List»: the line under the numbers of a tour.': 'Touren › Träume › Tourenvorschläge, «Liste»: die Zeile unter den Zahlen einer Tour.',
    'A line «For you» says how your form is today, how long you are free until sunset or your next appointment, and if you have a mountain bike; the filter «Doable today» keeps only what fits': 'Eine Zeile «Für dich» sagt, wie deine Form heute ist, wie lange du bis Sonnenuntergang oder zum nächsten Termin frei bist und ob du ein Mountainbike hast; der Filter «Heute machbar» behält nur, was passt',
    'Trips › Dreams › Tour suggestions, filters: the group «For you».': 'Touren › Träume › Tourenvorschläge, Filter: die Gruppe «Für dich».',
    '«Why this suggestion?» says if the whole day fits into half a day and has the new lines «Free time», «Form today» and «Bike», each one can be switched off': '«Warum dieser Vorschlag?» sagt, ob der ganze Tag in einen halben Tag passt, und hat die neuen Zeilen «Freie Zeit», «Form heute» und «Velo», jede lässt sich abschalten',
    'Open Trips › Dreams › Tour suggestions › «List»: every tour has a line «Journey about … there». Tap «By car» under Journey: the times get shorter.': 'Öffne Touren › Träume › Tourenvorschläge › «Liste»: jede Tour hat eine Zeile «Anreise etwa … hin». Tippe unter Anreise «Mit dem Auto»: die Zeiten werden kürzer.',
    'Tap «Up to 1 h»: only tours with a short journey stay.': 'Tippe «Bis 1 h»: nur Touren mit kurzer Anreise bleiben.',
    'Under the filters the group «For you» has a line about today. Tap «Doable today»: only tours that fit stay (without a home place or a form answer all stay).': 'Unter den Filtern hat die Gruppe «Für dich» eine Zeile zu heute. Tippe «Heute machbar»: nur Touren, die passen, bleiben (ohne Wohnort und ohne Formantwort bleiben alle).',
    'Open a tour: «Why this suggestion?» has a journey line with the whole day, and lines for free time, form and bike when the app knows them.': 'Öffne eine Tour: «Warum dieser Vorschlag?» hat eine Anreise-Zeile mit dem ganzen Tag und Zeilen zu freier Zeit, Form und Velo, wenn die App sie kennt.',
  },
};

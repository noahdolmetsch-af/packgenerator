// «Tourenvorschläge: Passt zu dir» (Noah 23.11.2026 «alles umsetzen»): Form heute, freie Zeit heute, Velo, Filter «Heute machbar»
export default {
  title: 'Tour suggestions: fits you today',
  lead: 'The tours now say what fits you today: your form, your free time and your bike. «Doable today» shows only what fits.',
  points: [
    { text: 'A line «For you» says how your form is today, how long you are free until sunset or your next appointment, and if you have a mountain bike', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-you]' }], where: 'Trips › Dreams › Tour suggestions, filters: the group «For you».' } },
    { text: 'The filter «Doable today» keeps the tours where the ride and the journey fit into your free time and that your form allows', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-today]' }] } },
    { text: '«Why this suggestion?» has the new lines «Free time», «Form today» and «Bike», each one can be switched off', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-why]' }] } },
  ],
  small: [],
  test: ['Open Trips › Dreams › Tour suggestions: under the filters, the group «For you» has a line about today.', 'Tap «Doable today»: only tours that fit stay (without a home place or a form answer all stay).', 'Open a tour: «Why this suggestion?» has lines for free time, form and bike when the app knows them.'],
  since: [],
  de: {
    'Tour suggestions: fits you today': 'Tourenvorschläge: passt heute zu dir',
    'The tours now say what fits you today: your form, your free time and your bike. «Doable today» shows only what fits.': 'Die Touren sagen jetzt, was heute zu dir passt: deine Form, deine freie Zeit und dein Velo. «Heute machbar» zeigt nur, was passt.',
    'A line «For you» says how your form is today, how long you are free until sunset or your next appointment, and if you have a mountain bike': 'Eine Zeile «Für dich» sagt, wie deine Form heute ist, wie lange du bis Sonnenuntergang oder zum nächsten Termin frei bist und ob du ein Mountainbike hast',
    'Trips › Dreams › Tour suggestions, filters: the group «For you».': 'Touren › Träume › Tourenvorschläge, Filter: die Gruppe «Für dich».',
    'The filter «Doable today» keeps the tours where the ride and the journey fit into your free time and that your form allows': 'Der Filter «Heute machbar» behält die Touren, bei denen Fahrt und Anreise in deine freie Zeit passen und die deine Form erlaubt',
    '«Why this suggestion?» has the new lines «Free time», «Form today» and «Bike», each one can be switched off': '«Warum dieser Vorschlag?» hat die neuen Zeilen «Freie Zeit», «Form heute» und «Velo», jede lässt sich abschalten',
    'Open Trips › Dreams › Tour suggestions: under the filters, the group «For you» has a line about today.': 'Öffne Touren › Träume › Tourenvorschläge: unter den Filtern hat die Gruppe «Für dich» eine Zeile zu heute.',
    'Tap «Doable today»: only tours that fit stay (without a home place or a form answer all stay).': 'Tippe «Heute machbar»: nur Touren, die passen, bleiben (ohne Wohnort und ohne Formantwort bleiben alle).',
    'Open a tour: «Why this suggestion?» has lines for free time, form and bike when the app knows them.': 'Öffne eine Tour: «Warum dieser Vorschlag?» hat Zeilen zu freier Zeit, Form und Velo, wenn die App sie kennt.',
  },
};

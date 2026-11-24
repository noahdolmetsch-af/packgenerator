// «Woche vorschlagen» ist der Wochenplan (Noah 23.11.2026 «3a», Thread «Wochenplan-Vorschläge verlässlich machen»)
export default {
  title: 'One suggestion for the week: your weekly plan',
  lead: 'With a weekly plan, «Suggest the week» opens the plan itself instead of a second, older suggestion.',
  points: [
    { text: '«Suggest the week» on Training › Week now leads to your weekly plan, with TrainingPeaks and your team dates; lighter, harder, rain and ski tour stay as switches', go: { href: '#/flow/training', where: 'Training › Week, the first row, with a weekly plan saved.' } },
    { text: 'The older suggestion with its own hours no longer shows up next to your plan', go: { href: '#/flow/training', where: 'Training › Week, below «My week».' } },
  ],
  small: [{ box: 'new', text: 'Without a weekly plan everything stays as it was' }],
  test: [
    'Open Training › Week and tap «Suggest the week»: the weekly plan opens.',
    'Below «My week» there is no second suggestion any more.',
  ],
  since: [],
  de: {
    'One suggestion for the week: your weekly plan': 'Ein Vorschlag für die Woche: dein Wochenplan',
    'With a weekly plan, «Suggest the week» opens the plan itself instead of a second, older suggestion.': 'Mit einem Wochenplan öffnet «Woche vorschlagen» den Plan selbst, nicht einen zweiten, älteren Vorschlag.',
    '«Suggest the week» on Training › Week now leads to your weekly plan, with TrainingPeaks and your team dates; lighter, harder, rain and ski tour stay as switches': '«Woche vorschlagen» auf Training › Woche führt jetzt zu deinem Wochenplan, mit TrainingPeaks und deinen Spielterminen; Leichter, Härter, Regen und Skitour bleiben als Schalter',
    'Training › Week, the first row, with a weekly plan saved.': 'Training › Woche, die erste Reihe, mit gespeichertem Wochenplan.',
    'The older suggestion with its own hours no longer shows up next to your plan': 'Der ältere Vorschlag mit eigenen Stunden steht nicht mehr neben deinem Plan',
    'Training › Week, below «My week».': 'Training › Woche, unter «Meine Woche».',
    'Without a weekly plan everything stays as it was': 'Ohne Wochenplan bleibt alles wie bisher',
    'Open Training › Week and tap «Suggest the week»: the weekly plan opens.': 'Öffne Training › Woche und tippe auf «Woche vorschlagen»: Der Wochenplan öffnet sich.',
    'Below «My week» there is no second suggestion any more.': 'Unter «Meine Woche» steht kein zweiter Vorschlag mehr.',
  },
};

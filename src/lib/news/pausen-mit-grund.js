// «Touren c» (996 Einzelideen 60, 61, 65, 66, 67, 68, 70; Noah 26.10.2026 «1a 2a 3a 4b 5a»): pause reasons, forgotten
// pause, hard to reach, split a recording, old trip from memory, speak your look back, feeling before the numbers
export default {
  title: 'Pauses with a reason',
  lead: 'And your look back can simply be spoken.',
  points: [
    { text: 'Pauses with a reason, and the app notices a forgotten pause', href: '#/ride', go: 'f.livepause' },
    { text: 'Speak your look back: the app sorts it into learned, missing and not needed', href: '#/debrief', go: 'f.missing' },
    { text: 'Add an old trip from memory, without GPS', href: '#/pack/past', go: 'f.past' },
  ],
  small: [{ box: 'new', text: 'Split one recording into stages when you upload a ride', href: '#/debrief/ride', go: 'f.upload' }],
  test: ['On the way tap «Pause» and choose a reason: rest, repair or waiting.', 'In the look back tap «Speak your look back», say two sentences and accept the points you want.'],
  since: [],
  de: {
    'Pauses with a reason': 'Pausen mit Grund',
    'And your look back can simply be spoken.': 'Und deinen Rückblick kannst du einfach sprechen.',
    'Pauses with a reason, and the app notices a forgotten pause': 'Pausen mit Grund, und die App merkt vergessene Pausen',
    'Speak your look back: the app sorts it into learned, missing and not needed': 'Rückblick sprechen: Die App sortiert in Gelernt, Fehlte und Nicht gebraucht',
    'Add an old trip from memory, without GPS': 'Alte Reise aus der Erinnerung nachtragen, ohne GPS',
    'Split one recording into stages when you upload a ride': 'Eine Aufnahme beim Hochladen in Etappen aufteilen',
    'On the way tap «Pause» and choose a reason: rest, repair or waiting.': 'Tippe unterwegs auf «Pause» und wähle einen Grund: Rast, Reparatur oder Warten.',
    'In the look back tap «Speak your look back», say two sentences and accept the points you want.': 'Tippe im Rückblick auf «Rückblick sprechen», sag zwei Sätze und übernimm die Punkte, die du willst.',
  },
};

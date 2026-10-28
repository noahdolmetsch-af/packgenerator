// «Pfad auf jeder Seite» (Noah 28.10.2026 «1a»): a quiet line above the title shows where you are
export default {
  title: 'The path on every page',
  lead: 'Above the title a quiet line shows where you are, for example Plan › Notes.',
  points: [{ text: 'Every page shows its place, tab and title as a path; tap a step to go back', go: { href: '#/notes', steps: [{ sel: '[data-pathline]' }] } }],
  small: [{ box: 'new', text: 'Switch it off in Me › Look › Handling', go: { href: '#/me/look', steps: [{ sel: 'input[data-op="path"]' }] } }],
  test: ['Open Plan › Notes: above the title stands «Planen › Notizen».', 'Tap «Planen»: you land on the week. Then open Me › Look and switch «Show the path on every page» off: the line is gone.'],
  since: [],
  de: {
    'The path on every page': 'Der Pfad auf jeder Seite',
    'Above the title a quiet line shows where you are, for example Plan › Notes.': 'Über dem Titel zeigt eine ruhige Zeile, wo du bist, zum Beispiel Planen › Notizen.',
    'Every page shows its place, tab and title as a path; tap a step to go back': 'Jede Seite zeigt Ort, Reiter und Titel als Pfad; tippe auf eine Stufe, um zurückzugehen',
    'Switch it off in Me › Look › Handling': 'Ausschalten unter Ich › Darstellung › Bedienung',
    'Open Plan › Notes: above the title stands «Planen › Notizen».': 'Öffne Planen › Notizen: über dem Titel steht «Planen › Notizen».',
    'Tap «Planen»: you land on the week. Then open Me › Look and switch «Show the path on every page» off: the line is gone.': 'Tippe auf «Planen»: du landest bei der Woche. Öffne dann Ich › Darstellung und schalte «Pfad auf jeder Seite zeigen» aus: die Zeile ist weg.',
  },
};

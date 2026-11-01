// Auffälligkeiten 28.10.2026 (Noah «3a»): the trash of Notes shows always, also when it is empty
export default {
  title: 'Trash always in Notes',
  lead: 'Without notes the trash link stays there.',
  points: [{ text: 'Plan › Notes: «Trash · empty» under the empty page', href: '#/notes', go: null }],
  test: ['Open Plan › Notes without notes: under the empty page «Trash · empty» shows.', 'Tap it: the trash opens and says it is empty.'],
  de: {
    'Trash always in Notes': 'Papierkorb immer in Notizen',
    'Without notes the trash link stays there.': 'Auch ohne Notizen bleibt der Link zum Papierkorb da.',
    'Plan › Notes: «Trash · empty» under the empty page': 'Planen › Notizen: «Papierkorb · leer» unter der leeren Seite',
    'Open Plan › Notes without notes: under the empty page «Trash · empty» shows.': 'Öffne Planen › Notizen ohne Notizen: unter der leeren Seite steht «Papierkorb · leer».',
    'Tap it: the trash opens and says it is empty.': 'Tippe darauf: der Papierkorb öffnet sich und sagt, dass er leer ist.',
  },
};

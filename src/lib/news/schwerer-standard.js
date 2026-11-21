// UI-Test 26.10.2026 T13 «Schwerer Standard» (G4-03): Bausteine says once when Standard weighs 5 kg or more and «Tidy up» suggests fewer things (packcleanup.js standardHint)
export default {
  title: 'A heavy Standard says so',
  lead: 'Building blocks tells you when «Standard» makes every trip heavy.',
  points: [{ text: 'From 5 kg the page shows what Standard weighs and how many things «Tidy up» would keep', href: '#/blocks', go: 'f.packcleanup' }],
  small: [],
  test: ['Gear › Building blocks: with a Standard of 5 kg or more a line says «On bikepacking trips your Standard brings …» with «Look at it ›».', '«Look at it ›» opens «Tidy up the packing list».'],
  since: [],
  de: {
    'A heavy Standard says so': 'Ein schwerer Standard sagt es',
    'Building blocks tells you when «Standard» makes every trip heavy.': 'Bausteine sagt dir, wenn «Standard» jede Tour schwer macht.',
    'From 5 kg the page shows what Standard weighs and how many things «Tidy up» would keep': 'Ab 5 kg zeigt die Seite, was Standard wiegt und wie viele Teile «Aufräumen» behalten würde',
    'Gear › Building blocks: with a Standard of 5 kg or more a line says «On bikepacking trips your Standard brings …» with «Look at it ›».': 'Material › Bausteine: Wiegt dein Standard 5 kg oder mehr, steht «Auf Bikepacking-Touren bringt dein Standard …» mit «Ansehen ›».',
    '«Look at it ›» opens «Tidy up the packing list».': '«Ansehen ›» öffnet «Packliste aufräumen».',
  },
};

// «Faustregeln aus deinen Rückblicken» (Idee D2 «App denkt mit», Noah 02.11.2026 «3b»)
export default {
  title: 'Rules of thumb from your debriefs',
  lead: 'The app finds patterns in your debriefs and suggests a rule for your own blocks.',
  points: [{ text: 'Me › How the app decides: a card on top with the rule of thumb', href: '#/me/regeln', go: 'f.faustregel' }],
  small: [{ box: 'new', go: 'f.faustregel', text: '«Make it a rule» saves it on the block; «Not this one» stops it; both have Undo' }],
  test: [
    'Open Me › How the app decides.',
    'If a card «Rules of thumb from your debriefs» is on top, read the pattern.',
    'Tap «Make it a rule» and open Blocks: the block has the rule.',
  ],
  since: ['f.faustregel'],
  de: {
    'Rules of thumb from your debriefs': 'Faustregeln aus deinen Rückblicken',
    'The app finds patterns in your debriefs and suggests a rule for your own blocks.': 'Die App findet Muster in deinen Rückblicken und schlägt eine Regel für deine eigenen Bausteine vor.',
    'Me › How the app decides: a card on top with the rule of thumb': 'Ich › So entscheidet die App: oben eine Karte mit der Faustregel',
    '«Make it a rule» saves it on the block; «Not this one» stops it; both have Undo': '«Als Regel übernehmen» speichert sie am Baustein; «Diese nicht» beendet sie; beides mit Rückgängig',
    'Open Me › How the app decides.': 'Öffne Ich › So entscheidet die App.',
    'If a card «Rules of thumb from your debriefs» is on top, read the pattern.': 'Steht oben eine Karte «Faustregeln aus deinen Rückblicken», lies das Muster.',
    'Tap «Make it a rule» and open Blocks: the block has the rule.': 'Tipp «Als Regel übernehmen» und öffne Bausteine: der Baustein hat die Regel.',
  },
};

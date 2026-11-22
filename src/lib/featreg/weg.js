// «Weg zum Ziel» (Noah 05.11.2026 «1b 2b 3a 4a 5a»): ein grosses Ziel mit Starttag, die App zählt rückwärts
export default {
  features: [
    { id: 'f.weg', group: 'before', title: 'Way to the goal', text: 'Name a big goal with a start day. The app counts back and lays out the steps on a timeline; you can change, move and delete every step.', href: '#/trips/weg', words: 'weg zum ziel rückwärts plan rennen ziel starttag schritte zeitlinie vorbereitung training backwards plan goal steps', moment: 'planen' },
  ],
  howto: { 'f.weg': ['Open Trips › Way to the goal, tap «New way».', 'Name the goal and set the start day.', 'Tick steps, move one to another day or add your own.'] },
  handbook: {
    'f.weg': {
      on: null,
      steps: ['Open Trips › Way to the goal, tap «New way».', 'Name the goal and set the start day.', 'Tick steps, move one to another day or add your own.'],
      example: 'Example: «Race in May», start 15 May: steps from «Far ahead» to «Last two weeks».',
    },
  },
  home: { 'f.weg': '#/trips/weg' },
};

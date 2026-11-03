// «Meine Sportarten kürzer» (Noah 02.11.2026 «4a»): paused sports in a folded block, a hint for equal names
export default {
  title: 'A shorter list of sports',
  lead: 'Paused sports wait in their own block, and the same name twice gets a hint.',
  points: [
    { text: 'Paused and resting sports sit in the folded block «Paused and resting»', go: { href: '#/flow/sports', steps: [{ sel: '[data-paused-block] summary' }] } },
    { text: 'A sport that appears twice gets a hint: rename one, pause it or leave it', go: null },
  ],
  small: [],
  test: [
    'Open Aktiv › Meine Sportarten: at the bottom of the list the block «Paused and resting» is folded; open it.',
    'Tap ⋯ at a sport and «Pause»: it moves into that block; there «Resume» brings it back.',
    'If a name appears twice, a hint stands above the list; «Leave it» hides it for that name.',
  ],
  since: [],
  de: {
    'A shorter list of sports': 'Eine kürzere Liste der Sportarten',
    'Paused sports wait in their own block, and the same name twice gets a hint.': 'Pausierte Sportarten warten in einem eigenen Block, und ein doppelter Name bekommt einen Hinweis.',
    'Paused and resting sports sit in the folded block «Paused and resting»': 'Pausierte und ruhende Sportarten stehen im eingeklappten Block «Pausiert und ruhend»',
    'A sport that appears twice gets a hint: rename one, pause it or leave it': 'Eine Sportart, die doppelt vorkommt, bekommt einen Hinweis: eine umbenennen, pausieren oder so lassen',
    'Open Aktiv › Meine Sportarten: at the bottom of the list the block «Paused and resting» is folded; open it.': 'Öffne Aktiv › Meine Sportarten: unten in der Liste steht eingeklappt der Block «Pausiert und ruhend»; öffne ihn.',
    'Tap ⋯ at a sport and «Pause»: it moves into that block; there «Resume» brings it back.': 'Tippe bei einer Sportart auf ⋯ und «Pause»: sie wandert in diesen Block; dort holt «Fortsetzen» sie zurück.',
    'If a name appears twice, a hint stands above the list; «Leave it» hides it for that name.': 'Kommt ein Name doppelt vor, steht über der Liste ein Hinweis; «So lassen» blendet ihn für diesen Namen aus.',
  },
};

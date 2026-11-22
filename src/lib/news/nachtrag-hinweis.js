// «Gestern nichts abgehakt? Nachtragen» (Noah 21.11.2026, Festlegung Abhaken, Punkt 5): a quiet hint in the morning on Aktiv
export default {
  title: 'Yesterday nothing ticked off?',
  lead: 'In the morning Aktiv reminds you quietly when yesterday has no tick, and opens the tick window on «Yesterday».',
  points: [
    { text: 'On Active, before noon: «Yesterday nothing ticked off? Add it.» with the tiles to pick from', go: { href: '#/flow', steps: [{ sel: '[data-more="yoga"]' }, { sel: '#tick-when' }] } },
    { text: '«Not today» hides the hint for the day; new users and long breaks do not see it', go: { href: '#/flow', steps: [{ sel: '[data-more="yoga"]' }, { sel: '#tick-when' }] } },
  ],
  small: [],
  test: ['On Active tick «Yoga» for three days ago (tap «•••», «Other day»). The next morning, before noon, the hint «Yesterday nothing ticked off? Add it.» stands above «Tick off today».', 'Tap «Add it», pick «Yoga»: the window opens with «Yesterday» chosen.'],
  since: [],
  de: {
    'Yesterday nothing ticked off?': 'Gestern nichts abgehakt?',
    'In the morning Aktiv reminds you quietly when yesterday has no tick, and opens the tick window on «Yesterday».': 'Am Morgen erinnert dich Aktiv ruhig, wenn gestern nichts abgehakt ist, und öffnet das Abhak-Fenster auf «Gestern».',
    'On Active, before noon: «Yesterday nothing ticked off? Add it.» with the tiles to pick from': 'Auf Aktiv vor 12 Uhr: «Gestern nichts abgehakt? Nachtragen.» mit den Kacheln zur Auswahl',
    '«Not today» hides the hint for the day; new users and long breaks do not see it': '«Heute nicht» blendet den Hinweis für den Tag aus; wer neu ist oder lange Pause hatte, sieht ihn nicht',
    'On Active tick «Yoga» for three days ago (tap «•••», «Other day»). The next morning, before noon, the hint «Yesterday nothing ticked off? Add it.» stands above «Tick off today».': 'Hake auf Aktiv «Yoga» für vor drei Tagen ab (auf «•••» tippen, «Anderer Tag»). Am nächsten Morgen vor 12 Uhr steht der Hinweis «Gestern nichts abgehakt? Nachtragen.» über «Heute abhaken».',
    'Tap «Add it», pick «Yoga»: the window opens with «Yesterday» chosen.': 'Tippe «Nachtragen», wähle «Yoga»: Das Fenster öffnet sich mit «Gestern» gewählt.',
  },
};

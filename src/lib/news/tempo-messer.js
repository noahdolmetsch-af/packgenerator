// Noah 2.11.2026 «a» (thread «App wird langsam»): a speed meter that works only on the device
export default {
  title: 'Speed meter',
  lead: 'A switch measures on this phone how fast the app feels and which part holds it up.',
  points: [{ text: 'Me › Data › Speed meter: switch on, scroll Today, copy the line', go: { href: '#/me/data', steps: [{ sel: '[data-tempo-switch]' }] } }],
  small: [],
  test: ['Open Me › Data and switch on «Speed meter».', 'Scroll Today for a moment, come back: a line with numbers shows and can be copied.'],
  since: [],
  de: {
    'Speed meter': 'Tempo-Messer',
    'A switch measures on this phone how fast the app feels and which part holds it up.': 'Ein Schalter misst auf diesem Handy, wie schnell sich die App anfühlt und was sie bremst.',
    'Me › Data › Speed meter: switch on, scroll Today, copy the line': 'Ich › Daten › Tempo-Messer: einschalten, Heute scrollen, Zeile kopieren',
    'Open Me › Data and switch on «Speed meter».': 'Öffne Ich › Daten und schalte den «Tempo-Messer» ein.',
    'Scroll Today for a moment, come back: a line with numbers shows and can be copied.': 'Scrolle kurz Heute und komm zurück: Eine Zeile mit Zahlen erscheint und lässt sich kopieren.',
  },
};

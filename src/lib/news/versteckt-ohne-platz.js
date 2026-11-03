// «Versteckte Funktionen» Schritt 1 (Noah 03.11.2026 «4b»): functions without a way in get one
export default {
  title: 'New ways in',
  lead: 'Three functions that were hard to reach now have a link where you need them.',
  points: [
    { text: 'Plant passport: always in Plan › Remember, also before your first plant', go: { href: '#/calendar', steps: [{ sel: '[data-plant-pass-open]' }] } },
    { text: 'Your daily list «What does me good» is linked from Active › Recovery', go: { href: '#/flow/rest', steps: [{ sel: '[data-rest-routine]' }] } },
    { text: 'Ski tours: emergency QR, signposts and the slope map straight from the start page', go: { href: '#/ski', steps: [{ sel: '[data-mountain-direct]' }] } },
  ],
  small: [],
  test: ['Open Plan › Remember: under the to-dos you see «Plant passport», also without a plant.', 'Open Active › Recovery: under the list you see «Your daily list «What does me good»».', 'Open Trips › Ski tours: under the emergency numbers you see «Straight to:» with three links.'],
  since: [],
  de: {
    'New ways in': 'Neue Wege hinein',
    'Three functions that were hard to reach now have a link where you need them.': 'Drei Funktionen, die schwer zu finden waren, haben jetzt einen Link dort, wo du sie brauchst.',
    'Plant passport: always in Plan › Remember, also before your first plant': 'Pflanzenpass: immer unter Planen › Merken, auch vor der ersten Pflanze',
    'Your daily list «What does me good» is linked from Active › Recovery': 'Deine tägliche Liste «Was mir gut tut» ist unter Aktiv › Erholung verlinkt',
    'Ski tours: emergency QR, signposts and the slope map straight from the start page': 'Skitouren: Notfall-QR, Wegweiser und Hangkarte direkt von der Startseite',
    'Open Plan › Remember: under the to-dos you see «Plant passport», also without a plant.': 'Öffne Planen › Merken: Unter den Aufgaben steht «Pflanzenpass», auch ohne Pflanze.',
    'Open Active › Recovery: under the list you see «Your daily list «What does me good»».': 'Öffne Aktiv › Erholung: Unter der Liste steht «Deine tägliche Liste «Was mir gut tut»».',
    'Open Trips › Ski tours: under the emergency numbers you see «Straight to:» with three links.': 'Öffne Touren › Skitouren: Unter den Notfallnummern steht «Direkt zu:» mit drei Links.',
  },
};

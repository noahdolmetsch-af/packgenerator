// «Training verbessern» 1 (Noah 2.11.2026): the week plan knows every sport of Aktiv, and you can add your own
export default {
  title: 'Your sports in the week plan',
  lead: 'Plan yoga, climbing, gym or any other sport of yours in the training week, not only bike, run and hike.',
  points: [{ text: 'In «Plan the week» choose «Other», then a sport, or add a new one', go: { href: '#/flow/training', steps: [{ sel: '[data-add]' }, { sel: '[data-session-form] button' }] } }],
  small: [{ box: 'new', text: 'A planned sport is done as soon as you tick it in Aktiv', go: null }],
  test: [
    'Open Aktiv › Training, tap + on a day, choose «Other» and pick a sport (or tap «Add a sport»).',
    'Save it. Tick the same sport in Aktiv: the planned session turns green.',
  ],
  since: [],
  de: {
    'Your sports in the week plan': 'Deine Sportarten im Wochenplan',
    'Plan yoga, climbing, gym or any other sport of yours in the training week, not only bike, run and hike.': 'Plane Yoga, Klettern, Gym oder jede andere Sportart von dir in der Trainingswoche, nicht nur Velo, Laufen und Wandern.',
    'In «Plan the week» choose «Other», then a sport, or add a new one': 'Wähle bei «Woche planen» «Andere», dann eine Sportart, oder lege eine neue an',
    'A planned sport is done as soon as you tick it in Aktiv': 'Eine geplante Sportart ist gemacht, sobald du sie in Aktiv abhakst',
    'Open Aktiv › Training, tap + on a day, choose «Other» and pick a sport (or tap «Add a sport»).': 'Öffne Aktiv › Training, tippe bei einem Tag auf +, wähle «Andere» und eine Sportart (oder tippe auf «Sportart anlegen»).',
    'Save it. Tick the same sport in Aktiv: the planned session turns green.': 'Speichere es. Hake dieselbe Sportart in Aktiv ab: die geplante Einheit wird grün.',
  },
};

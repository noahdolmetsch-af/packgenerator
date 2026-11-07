// «Wege-Gedächtnis» (Noah 07.11.2026 «4a 5a», Thread «Verbessern: Routing und Navigation»): Stücke nach der Fahrt bewerten, schlechte beim Planen meiden, gute auf der Karte zeigen
export default {
  title: 'Remembered ways',
  lead: 'After a ride you can mark each stretch as good or to avoid. The app avoids the bad ones when it plans a new way.',
  points: [
    { text: 'In «Your ride» each stretch of about 3 km has a thumb up or down; nothing is required', href: '#/live', go: 'f.live' },
    { text: 'A stretch you marked as bad is kept out of the way when you plan «a new way to …»; a good one gets a sign on the live map', href: '#/live', go: 'f.live' },
    { text: 'Rename, change or delete your marks in the options of the live map, under «Remembered ways»', href: '#/live', go: 'f.live' },
  ],
  small: [],
  test: ['Ride a few km on the live map, stop, and in «Your ride» tap a thumb on a stretch.', 'On the live map open «Options › Remembered ways»: your marks are there; rename one, delete one (it asks first, with Undo).', 'Plan «a new way to …»: the window says how many stretches are avoided.'],
  since: [],
  de: {
    'Remembered ways': 'Gemerkte Wege',
    'After a ride you can mark each stretch as good or to avoid. The app avoids the bad ones when it plans a new way.': 'Nach einer Fahrt kannst du jedes Stück als gut oder als zu meiden markieren. Die App meidet die schlechten, wenn sie einen neuen Weg plant.',
    'In «Your ride» each stretch of about 3 km has a thumb up or down; nothing is required': 'In «Deine Fahrt» hat jedes Stück von etwa 3 km einen Daumen hoch oder runter; nichts ist Pflicht',
    'A stretch you marked as bad is kept out of the way when you plan «a new way to …»; a good one gets a sign on the live map': 'Ein Stück, das du als schlecht markiert hast, bleibt aus dem Weg, wenn du «Neu planen zu …» benutzt; ein gutes bekommt ein Zeichen auf der Live-Karte',
    'Rename, change or delete your marks in the options of the live map, under «Remembered ways»': 'Benenne deine Markierungen um, ändere oder lösche sie in den Optionen der Live-Karte unter «Gemerkte Wege»',
    'Ride a few km on the live map, stop, and in «Your ride» tap a thumb on a stretch.': 'Fahr ein paar km auf der Live-Karte, halte an und tippe in «Deine Fahrt» bei einem Stück auf einen Daumen.',
    'On the live map open «Options › Remembered ways»: your marks are there; rename one, delete one (it asks first, with Undo).': 'Öffne auf der Live-Karte «Optionen › Gemerkte Wege»: Deine Markierungen stehen dort; benenne eine um, lösche eine (es fragt zuerst, mit Rückgängig).',
    'Plan «a new way to …»: the window says how many stretches are avoided.': 'Plane «Neu planen zu …»: Das Fenster sagt, wie viele Stücke gemieden werden.',
  },
};

// «Belastungslandschaft» (Noah 03.11.2026, Cockpit-Idee 1): past days and planned sessions as hills or curves
export default {
  title: 'Load landscape',
  lead: 'On «Form and recovery» your last eight weeks are a landscape: fitness as the back hill, fatigue as the front hill, the days as ridges. Planned sessions of Training continue it to the right as an estimate. One tap shows the same days as exact curves.',
  points: [
    { text: 'Point at a day or use ← → to go through the days: its numbers and its single sessions, each a link', go: { href: '#/flow/form', steps: [{ sel: '[data-form-landscape]' }], where: 'Aktiv › Form und Erholung, the card «Load landscape».' } },
    { text: 'Planned sessions continue the landscape as a dashed estimate, from minutes and zone', go: { href: '#/flow/form', steps: [{ sel: '[data-form-landscape]' }], where: 'Aktiv › Form und Erholung, the card «Load landscape».' } },
    { text: '«Curves» shows the same days with an axis, for exact numbers', go: { href: '#/flow/form', steps: [{ sel: '[data-form-landscape]' }, { text: 'Curves' }], where: 'Aktiv › Form und Erholung, the switch on the card.' } },
  ],
  small: [{ box: 'new', text: 'Today and the days before show the same numbers as the chart above' }],
  test: [
    'Open Aktiv › Form und Erholung and scroll to «Load landscape».',
    'Press ← or → (or point at a day): the numbers and the sessions of that day appear below.',
    'Plan a session in Training: it appears to the right as a dashed, lighter estimate. Tap «Curves» to see the exact lines.',
  ],
  since: [],
  de: {
    'Load landscape': 'Belastungs-Landschaft',
    Curves: 'Kurven',
    'On «Form and recovery» your last eight weeks are a landscape: fitness as the back hill, fatigue as the front hill, the days as ridges. Planned sessions of Training continue it to the right as an estimate. One tap shows the same days as exact curves.': 'Auf «Form und Erholung» sind deine letzten acht Wochen eine Landschaft: Fitness als hinterer Hügel, Müdigkeit als vorderer Hügel, die Tage als Grate. Geplante Einheiten aus dem Training führen sie nach rechts weiter, als Schätzung. Ein Tipp zeigt dieselben Tage als genaue Kurven.',
    'Point at a day or use ← → to go through the days: its numbers and its single sessions, each a link': 'Tippe auf einen Tag oder gehe mit ← → durch die Tage: seine Zahlen und seine einzelnen Einheiten, jede ein Link',
    'Aktiv › Form und Erholung, the card «Load landscape».': 'Aktiv › Form und Erholung, die Karte «Belastungslandschaft».',
    'Planned sessions continue the landscape as a dashed estimate, from minutes and zone': 'Geplante Einheiten führen die Landschaft als gestrichelte Schätzung weiter, aus Minuten und Zone',
    '«Curves» shows the same days with an axis, for exact numbers': '«Kurven» zeigt dieselben Tage mit einer Achse, für genaue Zahlen',
    'Aktiv › Form und Erholung, the switch on the card.': 'Aktiv › Form und Erholung, der Schalter auf der Karte.',
    'Today and the days before show the same numbers as the chart above': 'Heute und die Tage davor zeigen dieselben Zahlen wie das Diagramm darüber',
    'Open Aktiv › Form und Erholung and scroll to «Load landscape».': 'Öffne Aktiv › Form und Erholung und scrolle zu «Belastungslandschaft».',
    'Press ← or → (or point at a day): the numbers and the sessions of that day appear below.': 'Drücke ← oder → (oder tippe auf einen Tag): die Zahlen und die Einheiten dieses Tages erscheinen darunter.',
    'Plan a session in Training: it appears to the right as a dashed, lighter estimate. Tap «Curves» to see the exact lines.': 'Plane im Training eine Einheit: sie erscheint rechts als gestrichelte, hellere Schätzung. Tippe «Kurven», um die genauen Linien zu sehen.',
  },
};

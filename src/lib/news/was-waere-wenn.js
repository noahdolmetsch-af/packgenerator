// «Was wäre, wenn …» (Noah 03.11.2026, Cockpit-Idee 2): a pause, a short or a long session, a model with a range
export default {
  title: 'What if …',
  lead: 'On «Form and recovery» you can pick a day in the next week and compare a pause, a short and a long session: what happens to fitness, fatigue and form the day after, after 3 and after 7 days. A model with a range, not a forecast.',
  points: [
    { text: 'Pick a day and see pause, short, long (and the plan, if one is planned that day) side by side', go: { href: '#/flow/form', steps: [{ sel: '[data-form-whatif]' }], where: 'Aktiv › Form und Erholung, the card «What if …».' } },
    { text: 'Every number comes with a range (all coming loads 25 % lower or higher), so you see how sure it is', go: { href: '#/flow/form', steps: [{ sel: '[data-form-whatif]' }], where: 'Aktiv › Form und Erholung, the card «What if …».' } },
    { text: 'Only fitness, fatigue and form: resting pulse, HRV and sleep cannot be predicted, so they are left out', go: { href: '#/flow/form', steps: [{ sel: '[data-form-whatif]' }], where: 'Aktiv › Form und Erholung, the card «What if …».' } },
  ],
  small: [{ box: 'new', text: 'Short and long session: set the minutes and the zone yourself' }],
  test: [
    'Open Aktiv › Form und Erholung and scroll to «What if …».',
    'Pick tomorrow: three columns, Pause, Short, Long, with the form the day after, after 3 and after 7 days.',
    'Switch to «Fatigue» and change the minutes of the long session: the numbers and the sentence above change.',
  ],
  since: [],
  de: {
    'What if …': 'Was wäre, wenn …',
    'On «Form and recovery» you can pick a day in the next week and compare a pause, a short and a long session: what happens to fitness, fatigue and form the day after, after 3 and after 7 days. A model with a range, not a forecast.': 'Auf «Form und Erholung» wählst du einen Tag der nächsten Woche und vergleichst eine Pause, eine kurze und eine lange Einheit: was mit Fitness, Müdigkeit und Form am Tag danach, nach 3 und nach 7 Tagen passiert. Ein Modell mit Spanne, keine Vorhersage.',
    'Pick a day and see pause, short, long (and the plan, if one is planned that day) side by side': 'Wähle einen Tag und sieh Pause, kurz, lang (und den Plan, falls an dem Tag etwas geplant ist) nebeneinander',
    'Aktiv › Form und Erholung, the card «What if …».': 'Aktiv › Form und Erholung, die Karte «Was wäre, wenn …».',
    'Every number comes with a range (all coming loads 25 % lower or higher), so you see how sure it is': 'Jede Zahl hat eine Spanne (alle kommenden Belastungen 25 % tiefer oder höher), so siehst du, wie sicher sie ist',
    'Only fitness, fatigue and form: resting pulse, HRV and sleep cannot be predicted, so they are left out': 'Nur Fitness, Müdigkeit und Form: Ruhepuls, HRV und Schlaf lassen sich nicht vorhersagen, darum fehlen sie',
    'Short and long session: set the minutes and the zone yourself': 'Kurze und lange Einheit: Minuten und Zone stellst du selbst ein',
    'Open Aktiv › Form und Erholung and scroll to «What if …».': 'Öffne Aktiv › Form und Erholung und scrolle zu «Was wäre, wenn …».',
    'Pick tomorrow: three columns, Pause, Short, Long, with the form the day after, after 3 and after 7 days.': 'Wähle morgen: drei Spalten, Pause, Kurz, Lang, mit der Form am Tag danach, nach 3 und nach 7 Tagen.',
    'Switch to «Fatigue» and change the minutes of the long session: the numbers and the sentence above change.': 'Wechsle zu «Müdigkeit» und ändere die Minuten der langen Einheit: die Zahlen und der Satz darüber ändern sich.',
  },
};

// «Erinnerungen aufs Handy in vier Gruppen» (Impeccable-Test 08.11.2026, Arbeitsliste 7b-08; Noah «alles»): 22 Schalter, vier zugeklappte Gruppen
export default {
  title: 'Reminders on the phone in four groups',
  lead: 'The 22 switches now sit in four groups: around the tour, weather and light, bikes and gear, everyday life. Each shows how many are on.',
  points: [{ text: 'Open a group to see its switches; closed, it says «3 of 8 on»', go: { href: '#/me/push', steps: [{ sel: '[data-push-group]' }] } }],
  small: [],
  test: [
    'Open Me › Reminders on the phone: four closed groups, each with «n of m on» or «All off».',
    'Tap «Weather and light»: its eight switches open, the others stay closed.',
  ],
  since: [],
  de: {
    'Reminders on the phone in four groups': 'Erinnerungen aufs Handy in vier Gruppen',
    'The 22 switches now sit in four groups: around the tour, weather and light, bikes and gear, everyday life. Each shows how many are on.': 'Die 22 Schalter stehen jetzt in vier Gruppen: Rund um die Tour, Wetter und Licht, Velos und Material, Alltag. Jede zeigt, wie viele an sind.',
    'Open a group to see its switches; closed, it says «3 of 8 on»': 'Öffne eine Gruppe, um ihre Schalter zu sehen; zugeklappt steht dort «3 von 8 an»',
    'Open Me › Reminders on the phone: four closed groups, each with «n of m on» or «All off».': 'Öffne Ich › Erinnerungen aufs Handy: vier zugeklappte Gruppen, jede mit «n von m an» oder «Alles aus».',
    'Tap «Weather and light»: its eight switches open, the others stay closed.': 'Tippe auf «Wetter und Licht»: Die acht Schalter öffnen sich, die anderen Gruppen bleiben zu.',
  },
};

// «Training verbessern» 4 «Heute passt» (Noah 03.11.2026)
export default {
  title: 'Today a lighter one fits',
  lead: 'When you are tired and a session is planned for today, a calm card on Aktiv › Training offers a lighter version. «Lighter» changes it (with Undo), «Keep it» leaves it as it is for today.',
  points: [{ text: 'On a tired day a card on Aktiv › Training offers a lighter session for today', go: { href: '#/flow/training', steps: [{ sel: '[data-section="week-plan"]' }] } }],
  small: [],
  test: [
    'Open Aktiv › Training on a day you are tired (bad sleep, little energy) with a session planned for today.',
    'Tap «Lighter»: the session is shorter and easier, «Undo» brings it back. «Keep it» hides the card for today.',
  ],
  since: [],
  de: {
    'Today a lighter one fits': 'Heute passt eine leichtere',
    'When you are tired and a session is planned for today, a calm card on Aktiv › Training offers a lighter version. «Lighter» changes it (with Undo), «Keep it» leaves it as it is for today.': 'Wenn du müde bist und für heute eine Einheit geplant ist, bietet eine ruhige Karte auf Aktiv › Training eine leichtere Version an. «Leichter» ändert sie (mit Rückgängig), «Behalten» lässt sie für heute, wie sie ist.',
    'On a tired day a card on Aktiv › Training offers a lighter session for today': 'An einem müden Tag bietet eine Karte auf Aktiv › Training eine leichtere Einheit für heute an',
    'Open Aktiv › Training on a day you are tired (bad sleep, little energy) with a session planned for today.': 'Öffne Aktiv › Training an einem Tag, an dem du müde bist (schlecht geschlafen, wenig Energie), mit einer Einheit für heute.',
    'Tap «Lighter»: the session is shorter and easier, «Undo» brings it back. «Keep it» hides the card for today.': 'Tippe «Leichter»: die Einheit ist kürzer und leichter, «Rückgängig» bringt sie zurück. «Behalten» blendet die Karte für heute aus.',
  },
};

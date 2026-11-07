// «Training verbessern» 8 «Rückblick schlägt die nächste Woche vor» (Noah 03.11.2026)
export default {
  title: 'Next week, suggested by the look back',
  lead: 'Under «Look back» on Aktiv › Training you can say how next week should be: like last week, a little more, or easier. A tap opens the suggestion for next week with those hours; it is taken over only when you tap «Take over». The card says why and shows your goals per sport. It appears from Friday and stays until next week is planned.',
  points: [{ text: 'In «Look back» on Aktiv › Training: «Next week» with «Keep on like this», «A little more», «Easier»', go: { href: '#/flow/training', steps: [{ sel: '[data-section="look-back"]' }] } }],
  small: [],
  test: [
    'From Friday: open Aktiv › Training, scroll to «Look back» (needs training time last week). Under «Next week» read the reason and tap «A little more».',
    'The week shown jumps to next week and the suggestion opens with the hours of your choice; you can still change everything before «Take over».',
  ],
  since: [],
  de: {
    'Next week, suggested by the look back': 'Die nächste Woche, vom Rückblick vorgeschlagen',
    'Under «Look back» on Aktiv › Training you can say how next week should be: like last week, a little more, or easier. A tap opens the suggestion for next week with those hours; it is taken over only when you tap «Take over». The card says why and shows your goals per sport. It appears from Friday and stays until next week is planned.': 'Unter «Rückblick» auf Aktiv › Training sagst du, wie die nächste Woche sein soll: wie letzte Woche, etwas mehr oder leichter. Ein Tipp öffnet den Vorschlag für die nächste Woche mit diesen Stunden; übernommen wird erst, wenn du «Übernehmen» tippst. Die Karte nennt den Grund und zeigt deine Ziele pro Sportart. Sie erscheint ab Freitag und bleibt, bis die nächste Woche geplant ist.',
    'In «Look back» on Aktiv › Training: «Next week» with «Keep on like this», «A little more», «Easier»': 'Im «Rückblick» auf Aktiv › Training: «Nächste Woche» mit «Ähnlich weiter», «Etwas mehr», «Entlastung»',
    'From Friday: open Aktiv › Training, scroll to «Look back» (needs training time last week). Under «Next week» read the reason and tap «A little more».': 'Ab Freitag: Öffne Aktiv › Training, scrolle zu «Rückblick» (braucht Trainingszeit der letzten Woche). Lies unter «Nächste Woche» den Grund und tippe auf «Etwas mehr».',
    'The week shown jumps to next week and the suggestion opens with the hours of your choice; you can still change everything before «Take over».': 'Die gezeigte Woche springt auf die nächste und der Vorschlag öffnet sich mit den gewählten Stunden; du kannst vor «Übernehmen» noch alles ändern.',
  },
};

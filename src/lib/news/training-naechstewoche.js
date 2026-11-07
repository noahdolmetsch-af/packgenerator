// «Training verbessern» 8 «Rückblick schlägt die nächste Woche vor» (Noah 03.11.2026)
export default {
  title: 'Next week, suggested by the look back',
  lead: 'Under «Look back» on Aktiv › Training you can say how next week should be: like last week, a little more, or easier. A tap opens the suggestion for next week with those hours; it is taken over only when you tap «Take over».',
  points: [{ text: 'In «Look back» on Aktiv › Training: «Next week» with «Keep on like this», «A little more», «Easier»', go: { href: '#/flow/training', steps: [{ sel: '[data-section="look-back"]' }] } }],
  small: [],
  test: [
    'Open Aktiv › Training, scroll to «Look back» (needs training time last week). Under «Next week» tap «A little more».',
    'The week shown jumps to next week and the suggestion opens with the hours of your choice; you can still change everything before «Take over».',
  ],
  since: [],
  de: {
    'Next week, suggested by the look back': 'Die nächste Woche, vom Rückblick vorgeschlagen',
    'Under «Look back» on Aktiv › Training you can say how next week should be: like last week, a little more, or easier. A tap opens the suggestion for next week with those hours; it is taken over only when you tap «Take over».': 'Unter «Rückblick» auf Aktiv › Training sagst du, wie die nächste Woche sein soll: wie letzte Woche, etwas mehr oder leichter. Ein Tipp öffnet den Vorschlag für die nächste Woche mit diesen Stunden; übernommen wird erst, wenn du «Übernehmen» tippst.',
    'In «Look back» on Aktiv › Training: «Next week» with «Keep on like this», «A little more», «Easier»': 'Im «Rückblick» auf Aktiv › Training: «Nächste Woche» mit «Ähnlich weiter», «Etwas mehr», «Entlastung»',
    'Open Aktiv › Training, scroll to «Look back» (needs training time last week). Under «Next week» tap «A little more».': 'Öffne Aktiv › Training, scrolle zu «Rückblick» (braucht Trainingszeit der letzten Woche). Tippe unter «Nächste Woche» auf «Etwas mehr».',
    'The week shown jumps to next week and the suggestion opens with the hours of your choice; you can still change everything before «Take over».': 'Die gezeigte Woche springt auf die nächste und der Vorschlag öffnet sich mit den gewählten Stunden; du kannst vor «Übernehmen» noch alles ändern.',
  },
};

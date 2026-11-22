// «Training verbessern» 5 «Verpasst? Verschieben» (Noah 03.11.2026)
export default {
  title: 'Missed one? Move it',
  lead: 'A session planned earlier this week that you did not do gets a calm card on Aktiv › Training: move it to a day that is left, or let it go. Both have Undo.',
  points: [{ text: 'A missed session of this week can be moved to a later day or let go', go: { href: '#/flow/training', steps: [{ sel: '[data-section="week-plan"]' }] } }],
  small: [],
  test: [
    'Plan a session on an earlier day of this week and do not tick it. Open Aktiv › Training: the card «Missed one? Move it» shows it.',
    'Tap a day: the session moves there, «Undo» brings it back. «Let it go» takes it out of the plan.',
  ],
  since: [],
  de: {
    'Missed one? Move it': 'Verpasst? Verschieben',
    'A session planned earlier this week that you did not do gets a calm card on Aktiv › Training: move it to a day that is left, or let it go. Both have Undo.': 'Eine Einheit, die du früher in dieser Woche geplant und nicht gemacht hast, bekommt auf Aktiv › Training eine ruhige Karte: auf einen Tag verschieben, der noch kommt, oder loslassen. Beides mit Rückgängig.',
    'A missed session of this week can be moved to a later day or let go': 'Eine verpasste Einheit dieser Woche lässt sich auf einen späteren Tag verschieben oder loslassen',
    'Plan a session on an earlier day of this week and do not tick it. Open Aktiv › Training: the card «Missed one? Move it» shows it.': 'Plane eine Einheit an einem früheren Tag dieser Woche und hake sie nicht ab. Öffne Aktiv › Training: die Karte «Verpasst? Verschieben» zeigt sie.',
    'Tap a day: the session moves there, «Undo» brings it back. «Let it go» takes it out of the plan.': 'Tippe einen Tag: die Einheit zieht dorthin, «Rückgängig» holt sie zurück. «Loslassen» nimmt sie aus dem Plan.',
  },
};

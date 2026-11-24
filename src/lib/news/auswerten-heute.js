// «Auswerten neu» Teil 1 (Noah 24.11.2026 «1b 2a 3b 4a 5a»): the new start «Heute» of Auswerten, your own normal
export default {
  title: 'Analysis starts with Today',
  lead: 'Analysis now opens with the answer for today and shows where your values stand in your own usual range.',
  points: [
    { text: 'The answer for today stands first, with its reason, «Note it for today» and «I see it differently»', go: 'f.auswertenheute' },
    { text: 'Resting pulse, HRV and sleep against your own last 12 months, with the last 4 weeks as the second number, never against other people', go: { href: '#/auswerten', steps: [{ sel: '[data-heute-normal]' }], where: 'Analysis › Today: «Your normal».' } },
  ],
  small: [{ box: 'nicer', text: 'The old overview moved to Analysis › Overview, unchanged' }],
  test: ['Open Analysis: the first card is the answer for today with its reason.', 'Below, «Your normal» shows HRV, resting pulse and sleep with a band: the dot is today, the dark band your middle half.', 'Tap «The old overview»: the earlier start with the form card and «In focus» is still there.'],
  since: ['f.auswertenheute'],
  de: {
    'Analysis starts with Today': 'Auswerten beginnt mit Heute',
    'Analysis now opens with the answer for today and shows where your values stand in your own usual range.': 'Auswerten öffnet jetzt mit der Antwort für heute und zeigt, wo deine Werte in deinem eigenen Üblichen stehen.',
    'The answer for today stands first, with its reason, «Note it for today» and «I see it differently»': 'Die Antwort für heute steht zuerst, mit ihrem Grund, «Für heute vormerken» und «Ich sehe das anders»',
    'Resting pulse, HRV and sleep against your own last 12 months, with the last 4 weeks as the second number, never against other people': 'Ruhepuls, HRV und Schlaf gemessen an deinen eigenen letzten 12 Monaten, mit den letzten 4 Wochen als zweiter Zahl, nie an anderen Menschen',
    'Analysis › Today: «Your normal».': 'Auswerten › Heute: «Dein Normal».',
    'The old overview moved to Analysis › Overview, unchanged': 'Die alte Übersicht ist nach Auswerten › Übersicht gezogen, unverändert',
    'Open Analysis: the first card is the answer for today with its reason.': 'Öffne Auswerten: die erste Karte ist die Antwort für heute mit ihrem Grund.',
    'Below, «Your normal» shows HRV, resting pulse and sleep with a band: the dot is today, the dark band your middle half.': 'Darunter zeigt «Dein Normal» HRV, Ruhepuls und Schlaf mit einem Band: der Punkt ist heute, das dunkle Band deine mittlere Hälfte.',
    'Tap «The old overview»: the earlier start with the form card and «In focus» is still there.': 'Tippe «Die alte Übersicht»: der frühere Start mit der Formkarte und «Im Fokus» ist noch da.',
  },
};

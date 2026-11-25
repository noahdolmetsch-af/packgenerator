// «Auswerten neu» Teil 2 (Noah 24.11.2026 «1b 2a 3b 4a 5a», Entwurf B): the tab «Woche» of Auswerten
export default {
  title: 'Analysis starts with Week',
  lead: 'The tab «Week» of Analysis shows what you did and how you recovered, per week, month or year.',
  points: [
    { text: 'One sentence about the period, the hours by sport as bars and the period before next to it', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-woche-report]' }], where: 'Analysis › Week: the tab «Week».' } },
    { text: 'Resting pulse, HRV and sleep of the period against your own last 12 months', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-woche-recovery]' }], where: 'Analysis › Week: «How you recovered».' } },
  ],
  small: [{ box: 'nicer', text: 'The tab «Rides» is now «Week» and starts with the report; its pages (Rides, Ticks, Milestones …) are chips next to it' }],
  test: ['Open Analysis and tap «Week»: the first card says how many hours, units and days the week had.', 'Tap ‹: the week before opens and the first card names the change in percent.', 'Below «How you recovered» shows HRV, resting pulse and sleep with the same band as on «Today».'],
  since: ['f.auswertenwoche'],
  de: {
    'Analysis starts with Week': 'Auswerten mit Woche',
    'The tab «Week» of Analysis shows what you did and how you recovered, per week, month or year.': 'Der Reiter «Woche» in Auswerten zeigt, was du gemacht hast und wie du dich erholt hast, pro Woche, Monat oder Jahr.',
    'One sentence about the period, the hours by sport as bars and the period before next to it': 'Ein Satz über den Zeitraum, die Stunden pro Sportart als Balken und der Zeitraum davor daneben',
    'Resting pulse, HRV and sleep of the period against your own last 12 months': 'Ruhepuls, HRV und Schlaf des Zeitraums gemessen an deinen eigenen letzten 12 Monaten',
    'Analysis › Week: the tab «Week».': 'Auswerten › Woche: der Reiter «Woche».',
    'Analysis › Week: «How you recovered».': 'Auswerten › Woche: «Wie du dich erholt hast».',
    'The tab «Rides» is now «Week» and starts with the report; its pages (Rides, Ticks, Milestones …) are chips next to it': 'Der Reiter «Fahrten» heisst jetzt «Woche» und beginnt mit dem Bericht; seine Seiten (Fahrten, Haken, Meilensteine …) stehen als Chips daneben',
    'Open Analysis and tap «Week»: the first card says how many hours, units and days the week had.': 'Öffne Auswerten und tippe «Woche»: die erste Karte sagt, wie viele Stunden, Einheiten und Tage die Woche hatte.',
    'Tap ‹: the week before opens and the first card names the change in percent.': 'Tippe ‹: die Woche davor öffnet sich und die erste Karte nennt die Änderung in Prozent.',
    'Below «How you recovered» shows HRV, resting pulse and sleep with the same band as on «Today».': 'Darunter zeigt «Wie du dich erholt hast» HRV, Ruhepuls und Schlaf mit demselben Band wie bei «Heute».',
  },
};

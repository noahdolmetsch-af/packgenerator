// «Neue Ordnung» Schritt V3 (Noah 21.11.2026 «1a 2a 3a 4a 5a»): one number «k of n units» for the week on Aktiv
export default {
  title: 'One number for the week',
  lead: 'On Aktiv the week has one number now: «k of n units», Monday to Sunday.',
  points: [
    { text: 'The head, «Tick off today» and the week card all say the same «k of n units this week (Mon to Sun)»; the four different numbers are gone', go: { href: '#/flow', steps: [{ sel: '[data-today-line]' }, { sel: '[data-week-glance] .wgl' }], where: 'Active, at the top and on the week card.' } },
    { text: 'The week page leads to the whole week with dates and notes', go: { href: '#/flow/week', steps: [{ sel: 'a[data-to-week]' }], where: 'Active › week card › «Plan the week».' } },
  ],
  small: [],
  test: [
    'Open Active: the line under the title and the week card say the same «k of n units this week (Mon to Sun)».',
    'Tap the week card, then «Whole week with dates and notes»: the page «Week» opens.',
  ],
  since: [],
  de: {
    'One number for the week': 'Eine Zahl für die Woche',
    'On Aktiv the week has one number now: «k of n units», Monday to Sunday.': 'Auf Aktiv hat die Woche jetzt eine Zahl: «k von n Einheiten», Montag bis Sonntag.',
    'The head, «Tick off today» and the week card all say the same «k of n units this week (Mon to Sun)»; the four different numbers are gone': 'Der Kopf, «Heute abhaken» und die Wochenkarte sagen alle dasselbe: «k von n Einheiten diese Woche (Mo bis So)»; die vier verschiedenen Zahlen sind weg',
    'Active, at the top and on the week card.': 'Aktiv, oben und auf der Wochenkarte.',
    'The week page leads to the whole week with dates and notes': 'Die Wochenseite führt auf die ganze Woche mit Terminen und Notizen',
    'Active › week card › «Plan the week».': 'Aktiv › Wochenkarte › «Woche planen».',
    'Open Active: the line under the title and the week card say the same «k of n units this week (Mon to Sun)».': 'Öffne Aktiv: Die Zeile unter dem Titel und die Wochenkarte sagen dasselbe: «k von n Einheiten diese Woche (Mo bis So)».',
    'Tap the week card, then «Whole week with dates and notes»: the page «Week» opens.': 'Tippe die Wochenkarte, dann «Ganze Woche mit Terminen und Notizen»: Die Seite «Woche» öffnet sich.',
  },
};

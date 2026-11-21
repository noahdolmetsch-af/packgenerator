// «Neu in der App» in the week card (Noah 21.11.2026 «4a»): one line with the number of changes of the week
export default {
  title: 'What went online this week',
  lead: 'The Sunday card now also says how many changes came to the app this week.',
  points: [
    {
      text: 'The Sunday card shows «New in the app: N changes this week» with a link to «What is new»',
      go: { href: '#/', where: 'Shows on Today from Sunday 5 pm until Monday noon.' },
    },
  ],
  test: [
    'On a Sunday after 5 pm open Today: in the card «Your week in three numbers» a line says how many changes came this week.',
    'Tap «What is new» in that line: the list of changes opens.',
  ],
  since: [],
  de: {
    'What went online this week': 'Was diese Woche online ging',
    'The Sunday card now also says how many changes came to the app this week.': 'Die Sonntagskarte sagt jetzt auch, wie viele Änderungen diese Woche in die App kamen.',
    'The Sunday card shows «New in the app: N changes this week» with a link to «What is new»': 'Die Sonntagskarte zeigt «Neu in der App: N Änderungen diese Woche» mit einem Link zu «Was ist neu»',
    'Shows on Today from Sunday 5 pm until Monday noon.': 'Zeigt sich auf Heute von Sonntag 17 Uhr bis Montag mittags.',
    'On a Sunday after 5 pm open Today: in the card «Your week in three numbers» a line says how many changes came this week.': 'Öffne an einem Sonntag nach 17 Uhr Heute: in der Karte «Deine Woche in drei Zahlen» steht eine Zeile mit der Zahl der Änderungen dieser Woche.',
    'Tap «What is new» in that line: the list of changes opens.': 'Tippe in dieser Zeile auf «Was ist neu»: die Liste der Änderungen öffnet sich.',
  },
};

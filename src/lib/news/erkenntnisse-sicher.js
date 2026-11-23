// «Erkenntnisse mit Sicherheitsangabe» (S4, Noah 21.11.2026 «3a»): jede Erkenntnis sagt, wie sicher sie ist
export default {
  title: 'Insights say how sure they are',
  lead: 'Each insight now shows «Sure», «Tendency» or «Too little data», so you see what holds and what may be chance.',
  points: [
    { text: 'Under «All that goes together», every sentence has a small word: Sure, Tendency or Too little data', go: { href: '#/me/insights', steps: [{ sel: '[data-insight]' }], where: 'Analysis › Body › Insights › «All that goes together» (shows once the app has 14 days with both values)' } },
    { text: '«How it is counted» at the end of the page says what each word means', go: { href: '#/me/insights', steps: [{ sel: '[data-insights-how]' }], where: 'Analysis › Body › Insights › the closed line «How it is counted» at the end of the page' } },
  ],
  small: [{ box: 'new', text: 'The words replace «goes together clearly» and «goes together a little»; the sentences stay the same' }],
  test: ['Open Analysis › Body › Insights: under each sentence a small word shows how sure it is.', 'Open «How it is counted» at the end: it says what Sure, Tendency and Too little data mean.'],
  since: [],
  de: {
    'Insights say how sure they are': 'Erkenntnisse sagen, wie sicher sie sind',
    'Each insight now shows «Sure», «Tendency» or «Too little data», so you see what holds and what may be chance.': 'Jede Erkenntnis zeigt jetzt «Sicher», «Tendenz» oder «Zu wenig Daten», damit du siehst, was trägt und was Zufall sein kann.',
    'Under «All that goes together», every sentence has a small word: Sure, Tendency or Too little data': 'Unter «Alles, was zusammenhängt» hat jeder Satz ein kleines Wort: Sicher, Tendenz oder Zu wenig Daten',
    'Analysis › Body › Insights › «All that goes together» (shows once the app has 14 days with both values)': 'Auswerten › Körper › Zusammenhänge › «Alles, was zusammenhängt» (erscheint, sobald die App 14 Tage mit beiden Werten hat)',
    '«How it is counted» at the end of the page says what each word means': '«So gerechnet» am Seitenende sagt, was jedes Wort bedeutet',
    'Analysis › Body › Insights › the closed line «How it is counted» at the end of the page': 'Auswerten › Körper › Zusammenhänge › die zugeklappte Zeile «So gerechnet» am Seitenende',
    'The words replace «goes together clearly» and «goes together a little»; the sentences stay the same': 'Die Wörter ersetzen «hängt deutlich zusammen» und «hängt etwas zusammen»; die Sätze bleiben gleich',
    'Open Analysis › Body › Insights: under each sentence a small word shows how sure it is.': 'Öffne Auswerten › Körper › Zusammenhänge: Unter jedem Satz zeigt ein kleines Wort, wie sicher er ist.',
    'Open «How it is counted» at the end: it says what Sure, Tendency and Too little data mean.': 'Öffne «So gerechnet» am Ende: Dort steht, was Sicher, Tendenz und Zu wenig Daten bedeuten.',
  },
};

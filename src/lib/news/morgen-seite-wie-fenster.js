// «Morgen-Seite wie das Fenster» (Noah 04.11.2026 «2a», Thread «Planen: Tagescheck mit Fragen»): ein Fragebogen statt zwei
export default {
  title: 'The morning page asks what the window asks',
  lead: 'The page of the morning check shows the same questions as the window, and an answer counts in both.',
  points: [{ text: 'Morning check: sleep, battery, goal … are the questions of «Your questions»; you decide there which ones come', go: { href: '#/check/morning', steps: [{ sel: '[data-round-questions]' }], where: 'Today › Morning check: the questions at the top, in five steps.' } }],
  small: [
    { box: 'nicer', text: 'Answered in the window, filled in on the page (and the other way round)' },
    { box: 'fixed', text: 'The rotating question and the goal chips left the morning page; the goal is one sentence now' },
  ],
  test: [
    'Open Today › Morning check: sleep and battery are in five steps, the same as in the window.',
    'Tap «okay» for sleep, wait a moment, reload the page: the answer is still marked.',
    'Open Me › Your questions: switch a morning question off: it is gone from the page too.',
  ],
  since: [],
  de: {
    'The morning page asks what the window asks': 'Die Morgen-Seite fragt, was das Fenster fragt',
    'The page of the morning check shows the same questions as the window, and an answer counts in both.': 'Die Seite vom Morgen-Check zeigt dieselben Fragen wie das Fenster, und eine Antwort zählt in beiden.',
    'Morning check: sleep, battery, goal … are the questions of «Your questions»; you decide there which ones come': 'Morgen-Check: Schlaf, Akku, Ziel … sind die Fragen aus «Deine Fragen»; dort bestimmst du, welche kommen',
    'Today › Morning check: the questions at the top, in five steps.': 'Heute › Morgen-Check: die Fragen oben, in fünf Stufen.',
    'Answered in the window, filled in on the page (and the other way round)': 'Im Fenster beantwortet, auf der Seite eingetragen (und umgekehrt)',
    'The rotating question and the goal chips left the morning page; the goal is one sentence now': 'Die wechselnde Frage und die Ziel-Knöpfe sind von der Morgen-Seite weg; das Ziel ist jetzt ein Satz',
    'Open Today › Morning check: sleep and battery are in five steps, the same as in the window.': 'Öffne Heute › Morgen-Check: Schlaf und Akku sind in fünf Stufen, wie im Fenster.',
    'Tap «okay» for sleep, wait a moment, reload the page: the answer is still marked.': 'Tippe bei Schlaf auf «okay», warte kurz, lade die Seite neu: die Antwort ist noch markiert.',
    'Open Me › Your questions: switch a morning question off: it is gone from the page too.': 'Öffne Ich › Deine Fragen: Schalte eine Morgenfrage aus: sie ist auch von der Seite weg.',
  },
};

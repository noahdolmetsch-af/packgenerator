// Gruss «Wi gahts?» C (Noah 05.11.2026 «alle umsetzen», Thread «Planen: Tagescheck mit Fragen»): Wetter im Kopf und «Letzte 7 Tage»
export default {
  title: 'Weather in my head and your last 7 days',
  lead: 'The greeting has a new group of buttons, the weather in your head, and shows your last 7 days as small dots.',
  points: [
    { text: 'Greeting › «More» › «Weather in my head»: sunny, cloudy, fog, thunderstorm, rainbow (as many as fit)', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }, { sel: '[data-hello-more]' }], where: 'Today › the greeting at the top › «More».' } },
    { text: 'In the greeting window: «Last 7 days» as seven dots, today at the right, only an observation', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }], where: 'Today › the greeting at the top, under the five faces.' } },
  ],
  small: [
    { box: 'new', text: 'Rename, hide, delete and sort the weather buttons like all others under «Adjust buttons»' },
    { box: 'nicer', text: 'A day without an answer is an empty ring, nothing is counted as missed' },
  ],
  test: [
    'Open Today and tap the greeting: under the five faces stands «Last 7 days», today is the last dot.',
    'Tap a face: today’s dot fills at once and the line under it counts one more day.',
    'Tap «More»: under «Weather in my head» choose «Näbel» and «Rägeboge» (both can stay chosen).',
  ],
  since: [],
  de: {
    'Weather in my head and your last 7 days': 'Wetter im Kopf und deine letzten 7 Tage',
    'The greeting has a new group of buttons, the weather in your head, and shows your last 7 days as small dots.': 'Der Gruss hat eine neue Gruppe von Knöpfen, das Wetter im Kopf, und zeigt deine letzten 7 Tage als kleine Punkte.',
    'Greeting › «More» › «Weather in my head»: sunny, cloudy, fog, thunderstorm, rainbow (as many as fit)': 'Gruss › «Mehr» › «Wetter im Kopf»: sunnig, wolkig, Nebel, Gewitter, Regenbogen (so viele wie passen)',
    'Today › the greeting at the top › «More».': 'Heute › der Gruss oben › «Mehr».',
    'In the greeting window: «Last 7 days» as seven dots, today at the right, only an observation': 'Im Fenster des Grusses: «Letzte 7 Tage» als sieben Punkte, heute rechts, nur eine Beobachtung',
    'Today › the greeting at the top, under the five faces.': 'Heute › der Gruss oben, unter den fünf Gesichtern.',
    'Rename, hide, delete and sort the weather buttons like all others under «Adjust buttons»': 'Die Wetter-Knöpfe lassen sich wie alle anderen unter «Knöpfe anpassen» umbenennen, ausblenden, löschen und ordnen',
    'A day without an answer is an empty ring, nothing is counted as missed': 'Ein Tag ohne Antwort ist ein leerer Ring, nichts wird als verpasst gezählt',
    'Open Today and tap the greeting: under the five faces stands «Last 7 days», today is the last dot.': 'Öffne Heute und tippe auf den Gruss: unter den fünf Gesichtern steht «Letzte 7 Tage», heute ist der letzte Punkt.',
    'Tap a face: today’s dot fills at once and the line under it counts one more day.': 'Tippe ein Gesicht: der Punkt von heute füllt sich sofort und die Zeile darunter zählt einen Tag mehr.',
    'Tap «More»: under «Weather in my head» choose «Näbel» and «Rägeboge» (both can stay chosen).': 'Tippe «Mehr»: unter «Wetter im Kopf» wähle «Näbel» und «Rägeboge» (beide dürfen gewählt bleiben).',
  },
};

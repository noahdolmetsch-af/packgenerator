// «Heute und Diese Woche aufräumen» (Noah 23.11.2026 «ja»): Heute in three parts, the double things once, Woche calmer
export default {
  title: 'Today and This week tidied up',
  lead: 'Today has three parts now, and the week page is calmer.',
  points: [
    { text: 'Today: «Now» and «Your week» stand open, everything else is under one closed line «More»', go: { href: '#/', steps: [{ sel: '[data-home-more]' }], where: 'Today, below «Your week».' } },
    { text: 'The weather, «How are you?» and the tour each stand once; «Good night» ends at 05:00', go: { href: '#/', steps: [{ sel: '[data-weather]' }], where: 'Today, under the greeting.' } },
    { text: 'Week: one help line, old items and «Fits here» closed, a line when the week holds more time than your weekly plan', go: { href: '#/week', steps: [{ sel: '[data-week-sum]' }], where: 'Week, under the title.' } },
  ],
  small: [],
  test: [
    'Open Today: under «Now» and «Your week» there is a line «More» with the names of the areas. Tap it: the rest opens.',
    'Look at the greeting and «Your body today» (under «More»): the weather and «How are you?» are not there twice.',
    'Open Week: below the title there is only «What you can do here»; «Close the week» is one line with the number of old items.',
  ],
  since: [],
  de: {
    'Today and This week tidied up': 'Heute und Diese Woche aufgeräumt',
    'Today has three parts now, and the week page is calmer.': 'Heute hat jetzt drei Teile, und die Wochenseite ist ruhiger.',
    'Today: «Now» and «Your week» stand open, everything else is under one closed line «More»': 'Heute: «Jetzt» und «Deine Woche» stehen offen, alles andere steht unter einer zugeklappten Zeile «Mehr»',
    'Today, below «Your week».': 'Heute, unter «Deine Woche».',
    'The weather, «How are you?» and the tour each stand once; «Good night» ends at 05:00': 'Das Wetter, «Wi gaht\'s?» und die Tour stehen je einmal; «Guät Nacht» endet um 05:00',
    'Today, under the greeting.': 'Heute, unter dem Gruss.',
    'Week: one help line, old items and «Fits here» closed, a line when the week holds more time than your weekly plan': 'Woche: eine Hilfezeile, alte Punkte und «Passt hier» zugeklappt, eine Zeile, wenn die Woche mehr Zeit hat als dein Wochenplan',
    'Week, under the title.': 'Woche, unter dem Titel.',
    'Open Today: under «Now» and «Your week» there is a line «More» with the names of the areas. Tap it: the rest opens.': 'Heute öffnen: Unter «Jetzt» und «Deine Woche» steht eine Zeile «Mehr» mit den Namen der Bereiche. Antippen: Der Rest öffnet sich.',
    'Look at the greeting and «Your body today» (under «More»): the weather and «How are you?» are not there twice.': 'Schau auf den Gruss und «Dein Körper heute» (unter «Mehr»): Das Wetter und «Wi gaht\'s?» stehen nicht doppelt.',
    'Open Week: below the title there is only «What you can do here»; «Close the week» is one line with the number of old items.': 'Woche öffnen: Unter dem Titel steht nur «Was du hier tun kannst»; «Woche abschliessen» ist eine Zeile mit der Zahl der alten Punkte.',
  },
};

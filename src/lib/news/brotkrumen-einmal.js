// «Brotkrumen einmal» (impeccable F-10, Noah 27.11.2026 «gerne normal einreihen»): the path above a page names the page once
export default {
  title: 'The path names the page once',
  lead: 'Above «Wi gaht\'s?» the path no longer says «Wi gaht\'s?» twice.',
  points: [
    { text: 'The small path above the title ends before the page: «Auswerten › Verlauf» and then the page itself', go: { href: '#/me/abfragen', steps: [{ sel: '[data-page-title], .vhead .title, .phead .title' }], where: 'On the page «Wi gaht\'s?» and every other page whose last path step had its own name.' } },
  ],
  small: [{ box: 'fixed', text: 'A page is named once in the path above its title' }],
  test: [
    'Open Auswerten › Verlauf › «Wi gaht\'s?» and look at the small path above the title.',
    'It reads «Auswerten › Verlauf › Wi gaht\'s?» with the page last, not «Wi gaht\'s?» twice.',
  ],
  since: [],
  de: {
    'The path names the page once': 'Der Pfad nennt die Seite nur einmal',
    'Above «Wi gaht\'s?» the path no longer says «Wi gaht\'s?» twice.': 'Über «Wi gaht\'s?» steht «Wi gaht\'s?» im Pfad nicht mehr doppelt.',
    'The small path above the title ends before the page: «Auswerten › Verlauf» and then the page itself': 'Der kleine Pfad über dem Titel endet vor der Seite: «Auswerten › Verlauf» und dann die Seite selbst',
    'On the page «Wi gaht\'s?» and every other page whose last path step had its own name.': 'Auf der Seite «Wi gaht\'s?» und jeder anderen Seite, deren letzter Pfad-Schritt ihren eigenen Namen trug.',
    'A page is named once in the path above its title': 'Eine Seite steht im Pfad über ihrem Titel nur einmal',
    'Open Auswerten › Verlauf › «Wi gaht\'s?» and look at the small path above the title.': 'Öffne Auswerten › Verlauf › «Wi gaht\'s?» und sieh dir den kleinen Pfad über dem Titel an.',
    'It reads «Auswerten › Verlauf › Wi gaht\'s?» with the page last, not «Wi gaht\'s?» twice.': 'Er lautet «Auswerten › Verlauf › Wi gaht\'s?» mit der Seite zuletzt, nicht zweimal «Wi gaht\'s?».',
  },
};

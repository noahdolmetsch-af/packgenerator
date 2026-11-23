// «Kursblick» repair (Noah 23.11.2026 «freie hand, Fehler selbst beheben»): gold and currency days were off by one around weekends
export default {
  title: 'Gold closes on the right day',
  lead: 'Kursblick now puts the gold close on the day it belongs to, so the last close is always a trading day.',
  points: [
    { text: 'The gold price of «yesterday» is the close of the last trading day, never a Sunday', go: 'f.kursblick' },
    { text: 'The reference day 1 Nov 2026 counts the close of Friday 30 Oct', go: 'f.kursblick' },
    { text: 'Kursblick has its own row on the Me page, next to «Small apps»', go: { href: '#/me', steps: [{ sel: '[data-me-row="kurse"]' }] } },
  ],
  test: ['Open Kursblick: the day under the gold price is a weekday.', 'Under Sources the day of the gold close is the last trading day before today.'],
  since: [],
  de: {
    'Gold closes on the right day': 'Gold schliesst am richtigen Tag',
    'Kursblick now puts the gold close on the day it belongs to, so the last close is always a trading day.': 'Kursblick ordnet den Goldkurs jetzt dem richtigen Tag zu, der letzte Schlusskurs ist also immer ein Handelstag.',
    'The gold price of «yesterday» is the close of the last trading day, never a Sunday': 'Der Goldpreis von «gestern» ist der Schlusskurs des letzten Handelstags, nie ein Sonntag',
    'The reference day 1 Nov 2026 counts the close of Friday 30 Oct': 'Der Referenztag 1. Nov. 2026 zählt den Schlusskurs von Freitag, 30. Okt.',
    'Kursblick has its own row on the Me page, next to «Small apps»': 'Kursblick hat eine eigene Zeile auf der Ich-Seite, neben «Kleine Apps»',
    'Open Kursblick: the day under the gold price is a weekday.': 'Öffne Kursblick: Der Tag unter dem Goldpreis ist ein Werktag.',
    'Under Sources the day of the gold close is the last trading day before today.': 'Unter Quellen ist der Tag des Gold-Schlusskurses der letzte Handelstag vor heute.',
  },
};

// «Ruckeln beim Scrollen und Seitenwechsel» (Noah 11.11.2026 «c»): the small title line at the top while you scroll and the flight
// of a tour's name to its page are gone; pages scroll and open without them
export default {
  title: 'Calmer scrolling and page changes',
  lead: 'Two small effects are gone, so pages scroll and open more smoothly.',
  points: [{ text: 'The small title line at the top while you scroll is gone; the big title simply scrolls away', go: null }],
  small: [{ box: 'nicer', text: 'A tour\'s name no longer travels to its page when you open it; the page opens at once', go: null }],
  test: ['Open Tours and scroll down: the page scrolls without a small title line appearing at the top.', 'Open a tour from the list: its page opens at once, without the name moving.'],
  since: [],
  de: {
    'Calmer scrolling and page changes': 'Ruhigeres Scrollen und Seitenwechseln',
    'Two small effects are gone, so pages scroll and open more smoothly.': 'Zwei kleine Effekte sind weg, damit Seiten flüssiger scrollen und öffnen.',
    'The small title line at the top while you scroll is gone; the big title simply scrolls away': 'Die kleine Titelzeile oben beim Scrollen ist weg; der grosse Titel scrollt einfach weg',
    'A tour\'s name no longer travels to its page when you open it; the page opens at once': 'Der Name einer Tour fliegt beim Öffnen nicht mehr zu ihrer Seite; die Seite öffnet sofort',
    'Open Tours and scroll down: the page scrolls without a small title line appearing at the top.': 'Öffne Touren und scrolle nach unten: Die Seite scrollt, ohne dass oben eine kleine Titelzeile erscheint.',
    'Open a tour from the list: its page opens at once, without the name moving.': 'Öffne eine Tour aus der Liste: Ihre Seite öffnet sofort, ohne dass sich der Name bewegt.',
  },
};

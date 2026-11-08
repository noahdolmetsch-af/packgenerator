// «Hilfe-Karte nach dem Titel» (Noah 08.11.2026 «A», UX-Test 1-01 / 2b-01): the card «What you can do here» sits behind the page title and starts as one line
export default {
  title: 'Help card behind the title',
  lead: 'On every page the card «What you can do here» now stands behind the page title and starts as one line. The page itself comes first.',
  points: [
    {
      text: 'Title first, then the one-line card «What you can do here»; a tap opens it',
      go: { href: '#/notes', steps: [{ sel: '[data-seiteninhalt-line]' }] },
    },
    {
      text: 'Appearance › Page cards › «Fold all cards again», with Undo',
      go: { href: '#/me/look', steps: [{ sel: '[data-seiteninhalt-set]' }] },
    },
  ],
  small: [{ box: 'new', text: 'A card you opened stays open on its page' }],
  test: [
    'Open Plan › Notes: the title «Notes» comes first, right behind it is one line «What you can do here · Open the card». A tap on it opens the card.',
    'Open Me › Appearance › Page cards: it counts the pages where you opened the card. «Fold all cards again» folds them; Undo opens them again.',
  ],
  since: [],
  de: {
    'Help card behind the title': 'Hilfe-Karte nach dem Titel',
    'On every page the card «What you can do here» now stands behind the page title and starts as one line. The page itself comes first.': 'Auf jeder Seite steht die Karte «Was du hier tun kannst» jetzt hinter dem Seitentitel und beginnt als eine Zeile. Die Seite selbst kommt zuerst.',
    'Title first, then the one-line card «What you can do here»; a tap opens it': 'Zuerst der Titel, dann die Zeile «Was du hier tun kannst»; ein Tipp öffnet sie',
    'Appearance › Page cards › «Fold all cards again», with Undo': 'Aussehen › Karten auf den Seiten › «Alle Karten wieder einklappen», mit Rückgängig',
    'A card you opened stays open on its page': 'Eine Karte, die du geöffnet hast, bleibt auf ihrer Seite offen',
    'Open Plan › Notes: the title «Notes» comes first, right behind it is one line «What you can do here · Open the card». A tap on it opens the card.': 'Öffne Planen › Notizen: zuerst der Titel «Notizen», direkt dahinter eine Zeile «Was du hier tun kannst · Aufklappen». Ein Tipp darauf öffnet die Karte.',
    'Open Me › Appearance › Page cards: it counts the pages where you opened the card. «Fold all cards again» folds them; Undo opens them again.': 'Öffne Ich › Aussehen › Karten auf den Seiten: dort steht, auf wie vielen Seiten du die Karte geöffnet hast. «Alle Karten wieder einklappen» klappt sie zu; Rückgängig öffnet sie wieder.',
  },
};

// «Hilfe-Karte als eine Zeile» (Noah 08.11.2026 «1-5 a», Frage 1a): the card «What you can do here» starts as one line on every page
export default {
  title: 'The help card starts as one line',
  lead: 'On every page the card «What you can do here» is one line now, so the page itself comes first.',
  points: [
    {
      text: 'A tap on the line «What you can do here» opens the card; the choice is kept per page',
      go: { href: '#/trips/dreams', steps: [{ sel: '[data-seiteninhalt-line]' }] },
    },
    {
      text: 'Appearance › Page cards › «Fold all cards again», with Undo',
      go: { href: '#/me/look', steps: [{ sel: '[data-seiteninhalt-set]' }] },
    },
  ],
  small: [],
  test: [
    'Open Trips › Dream tours: the page starts with its title, and the card is one line «What you can do here · Open the card». A tap on it opens the card.',
    'Open Me › Appearance › Page cards: it counts the pages where you opened the card. «Fold all cards again» closes them; Undo opens them again.',
  ],
  since: [],
  de: {
    'The help card starts as one line': 'Die Hilfe-Karte startet als eine Zeile',
    'On every page the card «What you can do here» is one line now, so the page itself comes first.': 'Auf jeder Seite ist die Karte «Was du hier tun kannst» jetzt eine Zeile, so steht die Seite selbst zuerst.',
    'A tap on the line «What you can do here» opens the card; the choice is kept per page': 'Ein Tipp auf die Zeile «Was du hier tun kannst» öffnet die Karte; deine Wahl bleibt pro Seite gemerkt',
    'Appearance › Page cards › «Fold all cards again», with Undo': 'Aussehen › Karten auf den Seiten › «Alle Karten wieder einklappen», mit Rückgängig',
    'Open Trips › Dream tours: the page starts with its title, and the card is one line «What you can do here · Open the card». A tap on it opens the card.': 'Öffne Touren › Traumtouren: die Seite beginnt mit ihrem Titel, die Karte ist eine Zeile «Was du hier tun kannst · Aufklappen». Ein Tipp darauf öffnet die Karte.',
    'Open Me › Appearance › Page cards: it counts the pages where you opened the card. «Fold all cards again» closes them; Undo opens them again.': 'Öffne Ich › Aussehen › Karten auf den Seiten: dort steht, auf wie vielen Seiten du die Karte geöffnet hast. «Alle Karten wieder einklappen» schliesst sie; Rückgängig öffnet sie wieder.',
  },
};

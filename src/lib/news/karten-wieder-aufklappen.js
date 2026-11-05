// «Karten wieder aufklappen» (Noah 05.11.2026 «c»): the folded card «What you can do here» says it is only folded and opens again, alone or all at once
export default {
  title: 'Folded cards come back easily',
  lead: 'The card «What you can do here» was never deleted. Now it says so, and you can open all cards again.',
  points: [
    {
      text: '«Fold the card» instead of ×; the folded line says «Open the card»',
      go: { href: '#/trips/dreams', steps: [{ sel: '[data-seiteninhalt-fold]' }] },
    },
    {
      text: 'Appearance › Page cards › «Open all cards again», with Undo',
      go: { href: '#/me/look', steps: [{ sel: '[data-seiteninhalt-set]' }] },
    },
  ],
  small: [],
  test: [
    'Open Trips › Dream tours and tap «Fold the card»: one line «What you can do here · Open the card» stays. A tap on it opens the card.',
    'Fold it again, then open Me › Appearance › Page cards: it counts the pages with a folded card. «Open all cards again» opens them; Undo folds them again.',
  ],
  since: [],
  de: {
    'Folded cards come back easily': 'Eingeklappte Karten kommen leicht zurück',
    'The card «What you can do here» was never deleted. Now it says so, and you can open all cards again.': 'Die Karte «Was du hier tun kannst» war nie gelöscht. Jetzt steht es dran, und du kannst alle Karten wieder aufklappen.',
    '«Fold the card» instead of ×; the folded line says «Open the card»': '«Einklappen» statt ×; die Zeile sagt «Aufklappen»',
    'Appearance › Page cards › «Open all cards again», with Undo': 'Aussehen › Karten auf den Seiten › «Alle Karten wieder aufklappen», mit Rückgängig',
    'Open Trips › Dream tours and tap «Fold the card»: one line «What you can do here · Open the card» stays. A tap on it opens the card.': 'Öffne Touren › Traumtouren und tippe «Einklappen»: es bleibt eine Zeile «Was du hier tun kannst · Aufklappen». Ein Tipp darauf öffnet die Karte.',
    'Fold it again, then open Me › Appearance › Page cards: it counts the pages with a folded card. «Open all cards again» opens them; Undo folds them again.': 'Klappe sie wieder ein und öffne Ich › Aussehen › Karten auf den Seiten: dort steht, auf wie vielen Seiten die Karte eingeklappt ist. «Alle Karten wieder aufklappen» öffnet sie; Rückgängig klappt sie wieder zu.',
  },
};

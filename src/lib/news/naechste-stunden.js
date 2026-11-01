// «Die nächsten Stunden» (Ziel 6, Noah 27.10.2026 «4a»): the weather page shows the next 2, 4, 6 and 8 hours from
// five weather models side by side, with where they agree
export default {
  title: 'The next hours',
  lead: 'Five weather models side by side for the next 2 to 8 hours.',
  points: [{ text: 'The weather page shows in 2, 4, 6 and 8 h whether the models agree on rain', href: '#/wetter', go: { href: '#/wetter', where: 'Shows on the weather page, under «Today».' } }],
  small: [{ box: 'new', text: '«Show the models» opens the numbers of each model' }],
  test: ['Open Ich › Wetter: under «Heute» stands the card «Die nächsten Stunden» with four rows (in 2, 4, 6, 8 h).', 'Each row says e.g. «Alle 5 Modelle: trocken» or «2 von 5 Modellen: Regen». Tap «Modelle zeigen»: a table with every model.'],
  since: [],
  de: {
    'The next hours': 'Die nächsten Stunden',
    'Five weather models side by side for the next 2 to 8 hours.': 'Fünf Wettermodelle nebeneinander für die nächsten 2 bis 8 Stunden.',
    'The weather page shows in 2, 4, 6 and 8 h whether the models agree on rain': 'Die Wetter-Seite zeigt für in 2, 4, 6 und 8 h, ob sich die Modelle beim Regen einig sind',
    '«Show the models» opens the numbers of each model': '«Modelle zeigen» öffnet die Zahlen jedes Modells',
    'Open Ich › Wetter: under «Heute» stands the card «Die nächsten Stunden» with four rows (in 2, 4, 6, 8 h).': 'Öffne Ich › Wetter: unter «Heute» steht die Karte «Die nächsten Stunden» mit vier Zeilen (in 2, 4, 6, 8 h).',
    'Each row says e.g. «Alle 5 Modelle: trocken» or «2 von 5 Modellen: Regen». Tap «Modelle zeigen»: a table with every model.': 'Jede Zeile sagt z. B. «Alle 5 Modelle: trocken» oder «2 von 5 Modellen: Regen». Tippe «Modelle zeigen»: eine Tabelle mit jedem Modell.',
    'Shows on the weather page, under «Today».': 'Zeigt sich auf der Wetter-Seite, unter «Heute».',
  },
};

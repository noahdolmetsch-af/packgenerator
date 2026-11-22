// «Lange Wörter»: a long word in a narrow card (New window, wardrobe layers, bike care rows) breaks at a syllable, not mid-letter
export default {
  title: 'Long words break at a syllable',
  lead: 'In narrow cards a long name no longer breaks in the middle of a letter.',
  points: [{ text: 'Neu window, Kleiderschrank layers and the bike shop row in Velopflege show whole words or a clean syllable break', go: null }],
  small: [],
  test: ['Open «New» on the computer: «Überraschungsrunde» shows whole or with a hyphen at a syllable.', 'Velopflege on a small phone: the row «Bike shop & 2026» keeps its words whole and its numbers wrap to the next line.'],
  since: [],
  de: {
    'Long words break at a syllable': 'Lange Wörter trennen sauber',
    'In narrow cards a long name no longer breaks in the middle of a letter.': 'In schmalen Karten bricht ein langer Name nicht mehr mitten im Buchstaben um.',
    'Neu window, Kleiderschrank layers and the bike shop row in Velopflege show whole words or a clean syllable break': 'Das Fenster «Neu», die Schichten im Kleiderschrank und die Zeile «Velomech» in der Velopflege zeigen ganze Wörter oder eine saubere Silbentrennung',
    'Open «New» on the computer: «Überraschungsrunde» shows whole or with a hyphen at a syllable.': 'Öffne am Computer «Neu»: «Überraschungsrunde» steht ganz oder mit Trennstrich bei einer Silbe.',
    'Velopflege on a small phone: the row «Bike shop & 2026» keeps its words whole and its numbers wrap to the next line.': 'Velopflege auf einem kleinen Handy: die Zeile «Velomech & 2026» behält ihre Wörter ganz, die Zahlen rutschen in die nächste Zeile.',
  },
};

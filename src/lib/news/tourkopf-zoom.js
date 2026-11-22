// Durchklick Etappe 6 (Noah 05.11.2026, Befund E6-009): the head of a running tour at browser zoom 200 %
export default {
  title: 'Tour head at zoom 200 %',
  lead: 'At a big browser zoom the name of a running tour keeps room for words.',
  points: [
    { text: 'The name of a running tour no longer shrinks to a few letters in a short window (browser zoom 200 %, phone held sideways): the buttons move to their own line', go: null },
  ],
  small: [],
  test: [
    'Zoom the browser to 200 % (Ctrl and +) and open «On the way» with a running tour: the name stands in words, not letter by letter.',
    'Set the zoom back to 100 %: the head looks as before.',
  ],
  since: [],
  de: {
    'Tour head at zoom 200 %': 'Tour-Kopf bei Zoom 200 %',
    'At a big browser zoom the name of a running tour keeps room for words.': 'Bei grossem Browser-Zoom hat der Name einer laufenden Tour Platz für Wörter.',
    'The name of a running tour no longer shrinks to a few letters in a short window (browser zoom 200 %, phone held sideways): the buttons move to their own line': 'Der Name einer laufenden Tour schrumpft in einem niedrigen Fenster (Browser-Zoom 200 %, Handy quer) nicht mehr auf ein paar Buchstaben: die Knöpfe rutschen in eine eigene Zeile',
    'Zoom the browser to 200 % (Ctrl and +) and open «On the way» with a running tour: the name stands in words, not letter by letter.': 'Zoome den Browser auf 200 % (Strg und +) und öffne «Unterwegs» mit einer laufenden Tour: der Name steht in Wörtern, nicht Buchstabe für Buchstabe.',
    'Set the zoom back to 100 %: the head looks as before.': 'Stelle den Zoom zurück auf 100 %: der Kopf sieht aus wie vorher.',
  },
};

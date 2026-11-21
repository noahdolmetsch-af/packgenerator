// «Rückgängig statt Undo» (Gesamttest 19.11.2026): four old lines in «Was ist neu» used the English word «Undo» in German
export default {
  title: 'One word for taking back',
  lead: 'Four older lines in «What is new» said «Undo» in the German text. Now they say «Rückgängig» like the rest of the app.',
  points: [
    {
      text: 'The word is «Rückgängig» everywhere in the German texts',
      go: null,
    },
  ],
  small: [],
  test: [
    'Open Ich › Was ist neu, search for «Undo»: no line has the English word any more.',
    'Search for «Rückgängig»: the lines about the green card of a new tour and about moving items between bags use it.',
  ],
  since: [],
  de: {
    'One word for taking back': 'Ein Wort fürs Zurücknehmen',
    'Four older lines in «What is new» said «Undo» in the German text. Now they say «Rückgängig» like the rest of the app.': 'Vier ältere Zeilen in «Was ist neu» sagten im deutschen Text «Undo». Jetzt steht dort «Rückgängig» wie im Rest der App.',
    'The word is «Rückgängig» everywhere in the German texts': 'Das Wort heisst in allen deutschen Texten «Rückgängig»',
    'Open Ich › Was ist neu, search for «Undo»: no line has the English word any more.': 'Öffne Ich › Was ist neu und suche nach «Undo»: Keine Zeile hat das englische Wort mehr.',
    'Search for «Rückgängig»: the lines about the green card of a new tour and about moving items between bags use it.': 'Suche nach «Rückgängig»: Die Zeilen über die grüne Karte einer neuen Tour und über das Verschieben von Teilen zwischen Taschen benutzen es.',
  },
};

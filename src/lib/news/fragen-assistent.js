// «Fragen-Bereich verbessern» (Noah 23.11.2026 «1-5a», 5a), Teil 2: Assistent von den Fragen aus
export default {
  title: 'Ask your own question: you stay where you were',
  lead: 'From «Ask your data» the assistant opens with the cursor in the field, and the six questions are buttons there.',
  points: [
    { text: 'The cursor is in the field at once, «Evaluate» stays lit and a link leads back to «Ask your data»', go: { href: '#/auswerten/fragen', where: 'Tap «Ask your own question» under the answers.' } },
    { text: 'The six questions of «Ask your data» are buttons in the assistant: a tap shows the same answer', go: { href: '#/assistent?von=fragen', where: 'Tap one of the questions under the field.' } },
  ],
  small: [],
  test: [
    'Open Evaluate › Questions, tap «Ask your own question»: the cursor blinks in the field and «Evaluate» is lit.',
    'Tap a question under the field: the answer with «As of today» appears. The link at the top leads back to the questions.',
  ],
  since: [],
  de: {
    'Ask your own question: you stay where you were': 'Eigene Frage stellen: du bleibst, wo du warst',
    'From «Ask your data» the assistant opens with the cursor in the field, and the six questions are buttons there.': 'Von «Frag deine Daten» aus öffnet der Assistent mit dem Cursor im Feld, und die sechs Fragen sind dort Knöpfe.',
    'The cursor is in the field at once, «Evaluate» stays lit and a link leads back to «Ask your data»': 'Der Cursor steht gleich im Feld, «Auswerten» bleibt markiert und ein Link führt zurück zu «Frag deine Daten»',
    'Tap «Ask your own question» under the answers.': 'Tippe unter den Antworten auf «Eigene Frage stellen».',
    'The six questions of «Ask your data» are buttons in the assistant: a tap shows the same answer': 'Die sechs Fragen von «Frag deine Daten» sind im Assistenten Knöpfe: Ein Tipp zeigt dieselbe Antwort',
    'Tap one of the questions under the field.': 'Tippe unter dem Feld auf eine der Fragen.',
    'Open Evaluate › Questions, tap «Ask your own question»: the cursor blinks in the field and «Evaluate» is lit.': 'Öffne Auswerten › Fragen und tippe auf «Eigene Frage stellen»: Der Cursor blinkt im Feld und «Auswerten» ist markiert.',
    'Tap a question under the field: the answer with «As of today» appears. The link at the top leads back to the questions.': 'Tippe unter dem Feld auf eine Frage: Die Antwort mit «Stand heute» erscheint. Der Link oben führt zurück zu den Fragen.',
  },
};

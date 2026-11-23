// «Taschen am Starttag wiegen» (Noah 23.11.2026 «K3», Thread «Bikepacking-Rennen: Stand und Ideen zeigen»)
export default {
  title: 'Weigh the bags on the start day',
  lead: 'Type the weight of a packed bag; the app says if it fits its calculation or where to look.',
  points: [{ text: 'In Pack an open bag has «Packed bag on the scale (g)»: the app compares your number with the items and the bag itself and says «380 g more: is a piece missing?»', go: null }],
  test: ['Open a trip in Pack, open a bag «By bags» and type the weight under «Packed bag on the scale (g)», then «Save».', 'Read the line: «this fits» or the difference with a question where to look.', '«Change» edits the number, «Remove» takes it away; «Undo» brings it back.'],
  since: ['f.bagweigh'],
  de: {
    'Weigh the bags on the start day': 'Taschen am Starttag wiegen',
    'Type the weight of a packed bag; the app says if it fits its calculation or where to look.': 'Tippe das Gewicht einer gepackten Tasche; die App sagt, ob es zu ihrer Rechnung passt oder wo man nachschauen soll.',
    'In Pack an open bag has «Packed bag on the scale (g)»: the app compares your number with the items and the bag itself and says «380 g more: is a piece missing?»': 'Beim Packen hat eine geöffnete Tasche «Gepackte Tasche auf der Waage (g)»: die App vergleicht deine Zahl mit den Teilen und der Tasche selbst und sagt «380 g mehr: fehlt ein Teil?»',
    'Open a trip in Pack, open a bag «By bags» and type the weight under «Packed bag on the scale (g)», then «Save».': 'Öffne beim Packen eine Tour, öffne eine Tasche «Nach Taschen» und tippe das Gewicht unter «Gepackte Tasche auf der Waage (g)», dann «Speichern».',
    'Read the line: «this fits» or the difference with a question where to look.': 'Lies die Zeile: «das passt» oder der Unterschied mit der Frage, wo man nachschauen soll.',
    '«Change» edits the number, «Remove» takes it away; «Undo» brings it back.': '«Ändern» ändert die Zahl, «Entfernen» nimmt sie weg; «Rückgängig» bringt sie zurück.',
  },
};

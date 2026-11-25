// «Navigation schlanker» (Noah 24.11.2026 «was ja», Entwurf freigegeben 25.11.2026): ein Ort, ein Reiter, eine Seite, jedes nur einmal genannt
export default {
  title: 'Fewer bars, clearer where you are',
  lead: 'A page names its place, tab and page once: the line «Week › My day» is gone, the sidebar names the page under the lit tab.',
  points: [{ text: 'Planning › Week › My day: no line above the title, the sidebar shows «My day» under «Week»', go: { href: '#/day', steps: [{ sel: 'nav.psubs' }], where: 'Planning › Week: the chips under the tabs.' } }],
  small: [
    { box: 'nicer', text: 'The «i» of a tab stands at the end of the chips, not in a row of its own' },
    { box: 'nicer', text: 'On a computer the page starts higher, right under the two round icons' },
  ],
  test: [
    'Open Planning › Week and tap the chip «My day»: no line «Week › My day» above the title.',
    'On a computer the sidebar names «My day» under «Week» and marks it, «Week» itself is not marked.',
    'Open Planning › Week: the line «Week › This week» is still there, its title goes deeper.',
  ],
  since: [],
  de: {
    'Fewer bars, clearer where you are': 'Weniger Leisten, klarer wo du bist',
    'A page names its place, tab and page once: the line «Week › My day» is gone, the sidebar names the page under the lit tab.': 'Eine Seite nennt Ort, Reiter und Seite nur einmal: die Zeile «Woche › Mein Tag» ist weg, die Seitenleiste nennt die Seite unter dem markierten Reiter.',
    'Planning › Week › My day: no line above the title, the sidebar shows «My day» under «Week»': 'Planen › Woche › Mein Tag: keine Zeile über dem Titel, die Seitenleiste zeigt «Mein Tag» unter «Woche»',
    'Planning › Week: the chips under the tabs.': 'Planen › Woche: die Chips unter den Reitern.',
    'The «i» of a tab stands at the end of the chips, not in a row of its own': 'Das «i» eines Reiters steht am Ende der Chips, nicht in einer eigenen Zeile',
    'On a computer the page starts higher, right under the two round icons': 'Am Computer beginnt die Seite höher, direkt unter den zwei runden Symbolen',
    'Open Planning › Week and tap the chip «My day»: no line «Week › My day» above the title.': 'Öffne Planen › Woche und tippe den Chip «Mein Tag»: keine Zeile «Woche › Mein Tag» über dem Titel.',
    'On a computer the sidebar names «My day» under «Week» and marks it, «Week» itself is not marked.': 'Am Computer nennt die Seitenleiste «Mein Tag» unter «Woche» und markiert es, «Woche» selbst ist nicht markiert.',
    'Open Planning › Week: the line «Week › This week» is still there, its title goes deeper.': 'Öffne Planen › Woche: die Zeile «Woche › Diese Woche» steht noch, ihr Titel geht tiefer.',
  },
};

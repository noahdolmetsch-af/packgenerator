// «Neuer Schwung» Packen 2, block B6 (Noah 27.10.2026 «1a 2a 3a» page by page with motion, «ok Packen» incl. swipe):
// on the packing day a row swiped to the right is ticked like a tap
export default {
  title: 'Swipe to pack',
  lead: 'On the phone you tick an item by swiping its row to the right.',
  points: [{ text: 'The row follows your finger and turns green; far enough and it is packed', href: '#/pack?day' }],
  small: [{ box: 'nicer', text: 'Tapping works as before; up and down still scrolls' }],
  test: ['On the phone open a trip on its packing day and tap «Pack».', 'Swipe an item row to the right: it is ticked and the ring of its bag fills.'],
  since: [],
  de: {
    'Swipe to pack': 'Wischen zum Packen',
    'On the phone you tick an item by swiping its row to the right.': 'Am Handy hakst du ein Teil ab, indem du seine Zeile nach rechts wischst.',
    'The row follows your finger and turns green; far enough and it is packed': 'Die Zeile folgt deinem Finger und wird grün; weit genug, dann ist es gepackt',
    'Tapping works as before; up and down still scrolls': 'Tippen geht wie bisher, nach oben und unten scrollt die Seite',
    'On the phone open a trip on its packing day and tap «Pack».': 'Öffne am Handy eine Tour am Packtag und tippe «Packen».',
    'Swipe an item row to the right: it is ticked and the ring of its bag fills.': 'Wische eine Zeile nach rechts: Das Teil ist abgehakt, und der Ring seiner Tasche füllt sich.',
  },
};

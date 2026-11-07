// «Spruch zum Einstieg» PR 1 (Noah 07.11.2026 «Bau spruch pr1», Thread «Entwerfen: täglicher Einstiegs-Spruch»): the tile «Saying» on Today
export default {
  title: 'A saying on Today',
  lead: 'A new tile on Today with one short sentence in Bernese German, built from your own numbers.',
  points: [
    { text: 'The tile «Saying» (under «Your moment») names your weather, zone minutes, sleep and resting pulse or next trip in one friendly sentence', go: { href: '#/', steps: [{ sel: '[data-section="spruch"]' }] } },
    { text: '«Why?» shows the number behind the sentence, «New saying» gives the next one', go: { href: '#/', steps: [{ sel: '[data-spruch-why-btn]' }] } },
  ],
  small: [
    { box: 'new', text: 'A new sentence at each fresh start; none of the last 30 comes again' },
    { box: 'new', text: 'On a day when your sleep or resting pulse are clearly off your own normal, only calm sentences come, never a challenge' },
  ],
  test: [
    'Open Today and find the tile «Saying»: read the sentence and tap «Why?».',
    'Tap «New saying» a few times: each time another sentence appears.',
  ],
  since: ['f.spruch'],
  de: {
    'A saying on Today': 'Ein Spruch auf Heute',
    'A new tile on Today with one short sentence in Bernese German, built from your own numbers.': 'Eine neue Kachel auf Heute mit einem kurzen Satz auf Berndeutsch, gebaut aus deinen eigenen Zahlen.',
    'The tile «Saying» (under «Your moment») names your weather, zone minutes, sleep and resting pulse or next trip in one friendly sentence': 'Die Kachel «Spruch» (unter «Dein Moment») nennt dein Wetter, deine Zonenminuten, deinen Schlaf und Ruhepuls oder deine nächste Tour in einem freundlichen Satz',
    '«Why?» shows the number behind the sentence, «New saying» gives the next one': '«Warum?» zeigt die Zahl hinter dem Satz, «Neuer Spruch» gibt den nächsten',
    'A new sentence at each fresh start; none of the last 30 comes again': 'Bei jedem frischen Start ein neuer Satz; keiner der letzten 30 kommt wieder',
    'On a day when your sleep or resting pulse are clearly off your own normal, only calm sentences come, never a challenge': 'An einem Tag, an dem Schlaf oder Ruhepuls deutlich von deinem eigenen Normal abweichen, kommen nur ruhige Sätze, nie eine Herausforderung',
    'Open Today and find the tile «Saying»: read the sentence and tap «Why?».': 'Öffne Heute und such die Kachel «Spruch»: lies den Satz und tippe auf «Warum?».',
    'Tap «New saying» a few times: each time another sentence appears.': 'Tippe ein paar Mal auf «Neuer Spruch»: jedes Mal kommt ein anderer Satz.',
  },
};

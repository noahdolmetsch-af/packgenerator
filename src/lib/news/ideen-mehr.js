// «Ideen mehr» (Noah 27.11.2026 «ich kann nicht mehr ideen laden. bitte verbessern»): several tips per area, «Another idea», buttons on every area
export default {
  title: 'More ideas for your balance',
  lead: 'Ideas never run out now: every area has several tips, and you can ask for another one.',
  points: [
    { text: 'Every area has six tips. «Another idea» shows the next one, «I like it» puts the tip into your ideas and brings the next', go: { href: '#/flow/ideen', steps: [{ sel: '[data-tip-other-btn]' }], where: 'Auswerten › Verlauf › Ideen, on each of the three weakest areas.' } },
    { text: 'The further areas are full cards with the same buttons, so you can pick ideas from any area', go: { href: '#/flow/ideen', steps: [{ sel: '[data-tip-other]' }], where: 'Auswerten › Verlauf › Ideen, under «more areas».' } },
  ],
  small: [{ box: 'fixed', text: 'The path above «Ideen» names the page once on the computer too' }],
  test: [
    'Open Auswerten › Verlauf › Ideen and tap «Another idea» on a card: another tip appears and is still there after you reload.',
    'Tap «I like it → my ideas»: the tip is in your list «My ideas» and the card shows the next tip.',
    'Open «more areas»: each area has «I like it → my ideas» and «Another idea».',
  ],
  since: [],
  de: {
    'More ideas for your balance': 'Mehr Ideen für deine Balance',
    'Ideas never run out now: every area has several tips, and you can ask for another one.': 'Die Ideen gehen nicht mehr aus: Jeder Bereich hat mehrere Tipps, und du kannst nach einem anderen fragen.',
    'Every area has six tips. «Another idea» shows the next one, «I like it» puts the tip into your ideas and brings the next': 'Jeder Bereich hat sechs Tipps. «Andere Idee» zeigt den nächsten, «Mag ich» legt den Tipp in deine Ideen und bringt den nächsten',
    'Auswerten › Verlauf › Ideen, on each of the three weakest areas.': 'Auswerten › Verlauf › Ideen, bei jedem der drei schwächsten Bereiche.',
    'The further areas are full cards with the same buttons, so you can pick ideas from any area': 'Die weiteren Bereiche sind volle Karten mit denselben Knöpfen, du kannst also aus jedem Bereich Ideen holen',
    'Auswerten › Verlauf › Ideen, under «more areas».': 'Auswerten › Verlauf › Ideen, unter «weitere Bereiche».',
    'The path above «Ideen» names the page once on the computer too': 'Der Pfad über «Ideen» nennt die Seite auch am Computer nur einmal',
    'Open Auswerten › Verlauf › Ideen and tap «Another idea» on a card: another tip appears and is still there after you reload.': 'Öffne Auswerten › Verlauf › Ideen und tippe bei einer Karte auf «Andere Idee»: Ein anderer Tipp erscheint und bleibt auch nach dem Neuladen.',
    'Tap «I like it → my ideas»: the tip is in your list «My ideas» and the card shows the next tip.': 'Tippe auf «Mag ich → in meine Ideen»: Der Tipp steht in deiner Liste «Meine Ideen» und die Karte zeigt den nächsten Tipp.',
    'Open «more areas»: each area has «I like it → my ideas» and «Another idea».': 'Öffne «weitere Bereiche»: Jeder Bereich hat «Mag ich → in meine Ideen» und «Andere Idee».',
  },
};

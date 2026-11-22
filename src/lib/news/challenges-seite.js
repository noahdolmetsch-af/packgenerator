// «Challenges» PR 3 (Noah 21.11.2026 «4a», 22.11.2026 «a»): the page Challenges with own daily goals and «Tick off»
export default {
  title: 'Page Challenges',
  lead: 'Set yourself goals per day: 10 minutes of stretching, 8000 steps, 8 glasses of water. Each one has a card with «Tick off», like your habits.',
  points: [
    { text: 'Milestones › Challenges shows Outdoors and your own goals; «New challenge» takes name, unit (minutes, a count, steps), goal per day and the days', go: { href: '#/flow/challenges', steps: [{ sel: '[data-challenges-page]' }] } },
    { text: '«Tick off» counts the goal of today as reached (with Undo); under «More» you add smaller or larger amounts or your own number', go: { href: '#/flow/challenges', steps: [{ sel: '[data-ziel-new]' }] } },
  ],
  small: [{ box: 'new', text: 'Today stays as it is: only the card Outdoors stands there; your own challenges live on the page Challenges' }],
  test: ['Open Milestones, tap «Challenges ›», tap «New challenge», enter «Stretching», keep 10 minutes and tap «Start»: a card with the green button «Tick off» appears.', 'Tap «Tick off»: the card says «Done today» and one dot is filled; tap «Ticked · take back» or «Undo» in the message: it is open again.'],
  since: ['f.challenges'],
  de: {
    'Page Challenges': 'Seite Challenges',
    'Set yourself goals per day: 10 minutes of stretching, 8000 steps, 8 glasses of water. Each one has a card with «Tick off», like your habits.': 'Setze dir Tagesziele: 10 Minuten Dehnen, 8000 Schritte, 8 Gläser Wasser. Jedes hat eine Karte mit «Abhaken», wie deine Gewohnheiten.',
    'Milestones › Challenges shows Outdoors and your own goals; «New challenge» takes name, unit (minutes, a count, steps), goal per day and the days': 'Meilensteine › Challenges zeigt Draussen und deine eigenen Ziele; «Neue Challenge» fragt Name, Einheit (Minuten, Anzahl, Schritte), Ziel pro Tag und die Tage',
    '«Tick off» counts the goal of today as reached (with Undo); under «More» you add smaller or larger amounts or your own number': '«Abhaken» zählt das Tagesziel von heute als erreicht (mit Rückgängig); unter «Mehr» zählst du kleinere oder grössere Mengen oder eine eigene Zahl dazu',
    'Today stays as it is: only the card Outdoors stands there; your own challenges live on the page Challenges': 'Heute bleibt, wie es ist: dort steht nur die Karte Draussen; deine eigenen Challenges wohnen auf der Seite Challenges',
    'Open Milestones, tap «Challenges ›», tap «New challenge», enter «Stretching», keep 10 minutes and tap «Start»: a card with the green button «Tick off» appears.': 'Öffne Meilensteine, tippe auf «Challenges ›», dann auf «Neue Challenge», gib «Dehnen» ein, lass 10 Minuten stehen und tippe auf «Start»: eine Karte mit dem grünen Knopf «Abhaken» erscheint.',
    'Tap «Tick off»: the card says «Done today» and one dot is filled; tap «Ticked · take back» or «Undo» in the message: it is open again.': 'Tippe auf «Abhaken»: die Karte sagt «Heute geschafft» und ein Punkt ist gefüllt; tippe auf «Abgehakt · zurücknehmen» oder in der Meldung auf «Rückgängig»: sie ist wieder offen.',
  },
};

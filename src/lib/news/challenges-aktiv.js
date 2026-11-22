// «Challenges» (Noah 22.11.2026): running challenges can be ticked off on Aktiv › «Heute abhaken» too
export default {
  title: 'Challenges on Aktiv',
  lead: 'Your running challenges (Outdoors and your own daily goals) now stand under «Tick off today» on Aktiv, each with the green button «Tick off».',
  points: [
    { text: 'Under the tiles of «Tick off today» on Aktiv stand the cards of your running challenges; one tap on «Tick off» counts the goal of today, a second tap takes it back', go: { href: '#/flow', steps: [{ sel: '[data-aktiv-challenges], [data-flow-tick], #tick-h' }] } },
  ],
  small: [{ box: 'new', text: 'Without a running challenge nothing new appears on Aktiv; the offer «Start a challenge» stays on Today' }],
  test: ['Start an own challenge on the page Challenges (Milestones › Challenges › New challenge), then open Aktiv: its card stands under the tiles of «Tick off today».', 'Tap «Tick off»: the card says «Done today»; tap again: it is open again.'],
  since: [],
  de: {
    'Challenges on Aktiv': 'Challenges auf Aktiv',
    'Your running challenges (Outdoors and your own daily goals) now stand under «Tick off today» on Aktiv, each with the green button «Tick off».': 'Deine laufenden Challenges (Draussen und deine eigenen Tagesziele) stehen jetzt auf Aktiv unter «Heute abhaken», jede mit dem grünen Knopf «Abhaken».',
    'Under the tiles of «Tick off today» on Aktiv stand the cards of your running challenges; one tap on «Tick off» counts the goal of today, a second tap takes it back': 'Unter den Kacheln von «Heute abhaken» auf Aktiv stehen die Karten deiner laufenden Challenges; ein Tipp auf «Abhaken» zählt das Tagesziel, ein zweiter nimmt es zurück',
    'Without a running challenge nothing new appears on Aktiv; the offer «Start a challenge» stays on Today': 'Läuft keine Challenge, erscheint auf Aktiv nichts Neues; der Vorschlag «Challenge starten» bleibt auf Heute',
    'Start an own challenge on the page Challenges (Milestones › Challenges › New challenge), then open Aktiv: its card stands under the tiles of «Tick off today».': 'Starte eine eigene Challenge auf der Seite Challenges (Meilensteine › Challenges › Neue Challenge) und öffne dann Aktiv: ihre Karte steht unter den Kacheln von «Heute abhaken».',
    'Tap «Tick off»: the card says «Done today»; tap again: it is open again.': 'Tippe auf «Abhaken»: die Karte sagt «Heute geschafft»; tippe nochmal: sie ist wieder offen.',
  },
};

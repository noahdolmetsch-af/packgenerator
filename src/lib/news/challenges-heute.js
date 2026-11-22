// «Challenges» (Noah 22.11.2026: nothing may drop from Heute, planned things may be added): own challenges as cards on Heute
export default {
  title: 'Own challenges on Today',
  lead: 'Your own challenges that run today now stand on Today under the card Outdoors, each with the green button «Tick off».',
  points: [
    { text: 'A running own challenge (for example 10 minutes of stretching) shows as a card on Today with «Tick off»; without a running one nothing new appears', go: { href: '#/', steps: [{ sel: '[data-ziel-card], [data-outdoor-card], [data-outdoor-offer]' }] } },
    { text: 'The pencil on the card changes, ends or deletes the challenge; all of them are still listed on the page Challenges', go: { href: '#/flow/challenges', steps: [{ sel: '[data-challenges-page]' }] } },
  ],
  small: [{ box: 'new', text: 'Nothing on Today moves away: the cards of your running challenges are added under the card Outdoors' }],
  test: ['Start an own challenge on the page Challenges (Milestones › Challenges › New challenge), then open Today: its card stands under the card Outdoors.', 'Tap «Tick off» on Today: the card says «Done today»; tap «Ticked · take back»: it is open again.'],
  since: [],
  de: {
    'Own challenges on Today': 'Eigene Challenges auf Heute',
    'Your own challenges that run today now stand on Today under the card Outdoors, each with the green button «Tick off».': 'Deine eigenen Challenges, die heute laufen, stehen jetzt auf Heute unter der Karte Draussen, jede mit dem grünen Knopf «Abhaken».',
    'A running own challenge (for example 10 minutes of stretching) shows as a card on Today with «Tick off»; without a running one nothing new appears': 'Eine laufende eigene Challenge (zum Beispiel 10 Minuten Dehnen) steht als Karte auf Heute mit «Abhaken»; läuft keine, erscheint nichts Neues',
    'The pencil on the card changes, ends or deletes the challenge; all of them are still listed on the page Challenges': 'Der Stift auf der Karte ändert, beendet oder löscht die Challenge; alle stehen weiter auf der Seite Challenges',
    'Nothing on Today moves away: the cards of your running challenges are added under the card Outdoors': 'Auf Heute fällt nichts weg: die Karten deiner laufenden Challenges kommen unter die Karte Draussen',
    'Start an own challenge on the page Challenges (Milestones › Challenges › New challenge), then open Today: its card stands under the card Outdoors.': 'Starte eine eigene Challenge auf der Seite Challenges (Meilensteine › Challenges › Neue Challenge) und öffne dann Heute: ihre Karte steht unter der Karte Draussen.',
    'Tap «Tick off» on Today: the card says «Done today»; tap «Ticked · take back»: it is open again.': 'Tippe auf Heute auf «Abhaken»: die Karte sagt «Heute geschafft»; tippe auf «Abgehakt · zurücknehmen»: sie ist wieder offen.',
  },
};

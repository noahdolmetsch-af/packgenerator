// «Challenges» PR 4 (Noah 22.11.2026 «c»): the question every 10 days, as a phone message and a card on the page Challenges
export default {
  title: 'Challenge question',
  lead: 'Every 10 days the app asks, quietly: a new challenge, a milestone or a crazy idea? Only if you like.',
  points: [
    { text: 'On the page Challenges a card «Time for a look» has three buttons (Challenge, Milestone, Crazy idea) and «Later», which asks again tomorrow', go: { href: '#/flow/challenges', steps: [{ sel: '[data-challenge-ask]' }] } },
    { text: 'A message on the phone every 10 days at 18:00: switch it on under Ich › Reminders on the phone › «Challenge question» (off until you switch it on)', go: { href: '#/me/push', steps: [{ sel: '[data-push-page]' }] } },
  ],
  small: [{ box: 'new', text: 'Today stays as it is: the question lives on the page Challenges and in the message, not on Heute' }],
  test: ['Open Milestones › «Challenges ›»: at the top the card «Time for a look» stands with three buttons.', 'Tap «Later»: the card is gone for today. Tap «Milestone» on another day: Milestones open and the next question comes in 10 days.'],
  de: {
    'Challenge question': 'Challenge-Frage',
    'Every 10 days the app asks, quietly: a new challenge, a milestone or a crazy idea? Only if you like.': 'Alle 10 Tage fragt die App leise: eine neue Challenge, ein Meilenstein oder eine verrückte Idee? Nur wenn du magst.',
    'On the page Challenges a card «Time for a look» has three buttons (Challenge, Milestone, Crazy idea) and «Later», which asks again tomorrow': 'Auf der Seite Challenges hat eine Karte «Zeit für einen Blick» drei Knöpfe (Challenge, Meilenstein, Verrückte Idee) und «Später», das morgen wieder fragt',
    'A message on the phone every 10 days at 18:00: switch it on under Ich › Reminders on the phone › «Challenge question» (off until you switch it on)': 'Eine Mitteilung aufs Handy alle 10 Tage um 18:00: einschalten unter Ich › Erinnerungen aufs Handy › «Challenge-Frage» (aus, bis du sie einschaltest)',
    'Today stays as it is: the question lives on the page Challenges and in the message, not on Heute': 'Heute bleibt, wie es ist: die Frage wohnt auf der Seite Challenges und in der Mitteilung, nicht auf Heute',
    'Open Milestones › «Challenges ›»: at the top the card «Time for a look» stands with three buttons.': 'Öffne Meilensteine › «Challenges ›»: oben steht die Karte «Zeit für einen Blick» mit drei Knöpfen.',
    'Tap «Later»: the card is gone for today. Tap «Milestone» on another day: Milestones open and the next question comes in 10 days.': 'Tippe auf «Später»: die Karte ist für heute weg. Tippe an einem anderen Tag auf «Meilenstein»: Meilensteine öffnen sich und die nächste Frage kommt in 10 Tagen.',
  },
};

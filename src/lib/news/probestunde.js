// «Probestunde» (Noah 04.11.2026 «10a», 08.11.2026 «ja»): eine Art «Trial lesson» im Angebot, einmal pro Person
export default {
  title: 'Trial lesson for your offer',
  lead: 'A trial lesson is a kind of your offer: one place, half the price, once per person.',
  points: [
    { text: 'Switch on «Offer a trial lesson» under «How booking works»; open its times like any other time', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, «How booking works».' } },
    { text: 'A second request of the same person is marked, with a message offering a normal lesson', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, «How booking works».' } },
  ],
  small: [{ box: 'new', text: 'The customer sheet marks the trial lesson in the list of lessons', go: null }],
  test: [
    'Open a tennis offer, then «Change» under «How booking works».',
    'Switch on «Offer a trial lesson» and save: «Trial lesson» is now a kind when you open a time.',
  ],
  since: [],
  de: {
    'Trial lesson for your offer': 'Schnupperstunde für dein Angebot',
    'A trial lesson is a kind of your offer: one place, half the price, once per person.': 'Die Schnupperstunde ist eine Art deines Angebots: ein Platz, halber Preis, einmal pro Person.',
    'Switch on «Offer a trial lesson» under «How booking works»; open its times like any other time': 'Schalte unter «So wird gebucht» «Schnupperstunde anbieten» ein; ihre Zeiten öffnest du wie jede andere Zeit',
    'A second request of the same person is marked, with a message offering a normal lesson': 'Eine zweite Anfrage derselben Person ist markiert, mit einer Nachricht, die eine normale Stunde anbietet',
    'The customer sheet marks the trial lesson in the list of lessons': 'Im Kundenblatt ist die Schnupperstunde bei den Stunden markiert',
    'Tennis › Offers, one offer, «How booking works».': 'Tennis › Angebote, ein Angebot, «So wird gebucht».',
    'Open a tennis offer, then «Change» under «How booking works».': 'Öffne ein Tennis-Angebot, dann «Ändern» unter «So wird gebucht».',
    'Switch on «Offer a trial lesson» and save: «Trial lesson» is now a kind when you open a time.': 'Schalte «Schnupperstunde anbieten» ein und speichere: «Schnupperstunde» ist jetzt eine Art, wenn du eine Zeit öffnest.',
  },
};

// «Heute als Begleiter» (Noah 1.11.2026 «a»): the four chips under the greeting are off by default
export default {
  title: 'Today: the row of quick chips is off',
  lead: 'The chips under the greeting (Plan a trip, Work on the bike, Plan the week) are off. «Ride today» stays. You can switch them on.',
  points: [{ text: 'Three quick chips under the greeting are off; switch them on under «Customise the start page»', go: { href: '#/', steps: [{ sel: '[data-section="moment"]' }], where: 'Under the greeting only the countdown and «Ride today» are left; «Your moment» shows the next step.' } }],
  small: [],
  test: ['Open Today: under the greeting only the countdown and «Ride today» stay.', 'Customise the start page: switch «Plan a trip» on again, the chip comes back.'],
  since: [],
  de: {
    'Today: the row of quick chips is off': 'Heute: die Reihe der Schnellknöpfe ist aus',
    'The chips under the greeting (Plan a trip, Work on the bike, Plan the week) are off. «Ride today» stays. You can switch them on.': 'Die Knöpfe unter der Begrüssung (Tour planen, Velo schrauben, Woche planen) sind aus. «Heute fahren» bleibt. Du kannst sie einschalten.',
    'Three quick chips under the greeting are off; switch them on under «Customise the start page»': 'Drei Schnellknöpfe unter der Begrüssung sind aus; schalte sie unter «Startseite anpassen» ein',
    'Under the greeting only the countdown and «Ride today» are left; «Your moment» shows the next step.': 'Unter der Begrüssung bleiben der Countdown und «Heute fahren»; «Dein Moment» zeigt den nächsten Schritt.',
    'Open Today: under the greeting only the countdown and «Ride today» stay.': 'Öffne Heute: unter der Begrüssung bleiben nur der Countdown und «Heute fahren».',
    'Customise the start page: switch «Plan a trip» on again, the chip comes back.': 'Startseite anpassen: schalte «Tour planen» wieder ein, der Knopf kommt zurück.',
  },
};

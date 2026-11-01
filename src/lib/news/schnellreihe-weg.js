// «Heute als Begleiter» (Noah 1.11.2026 «a»): the four chips under the greeting are off by default
export default {
  title: 'Today: the row of quick chips is off',
  lead: 'The chips under the greeting (Ride today, Plan a trip, Work on the bike, Plan the week) are off. You can switch them on.',
  points: [{ text: 'The quick chips under the greeting are off; switch them on under «Customise the start page»', go: { href: '#/', steps: [{ sel: '[data-section="moment"]' }], where: 'Under the greeting only the countdown chip is left; «Your moment» shows the next step.' } }],
  small: [],
  test: ['Open Today: under the greeting only the countdown chip stays.', 'Customise the start page: switch «Ride today» on again, the chip comes back.'],
  since: [],
  de: {
    'Today: the row of quick chips is off': 'Heute: die Reihe der Schnellknöpfe ist aus',
    'The chips under the greeting (Ride today, Plan a trip, Work on the bike, Plan the week) are off. You can switch them on.': 'Die Knöpfe unter der Begrüssung (Heute fahren, Tour planen, Velo schrauben, Woche planen) sind aus. Du kannst sie einschalten.',
    'The quick chips under the greeting are off; switch them on under «Customise the start page»': 'Die Schnellknöpfe unter der Begrüssung sind aus; schalte sie unter «Startseite anpassen» ein',
    'Under the greeting only the countdown chip is left; «Your moment» shows the next step.': 'Unter der Begrüssung bleibt nur der Countdown; «Dein Moment» zeigt den nächsten Schritt.',
    'Open Today: under the greeting only the countdown chip stays.': 'Öffne Heute: unter der Begrüssung bleibt nur der Countdown.',
    'Customise the start page: switch «Ride today» on again, the chip comes back.': 'Startseite anpassen: schalte «Heute fahren» wieder ein, der Knopf kommt zurück.',
  },
};

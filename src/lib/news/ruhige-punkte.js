// «Ruhige Punkte an allen Orten» (Noah 23.11.2026 «1a 2a 3a 4a 5a», Punkt 4): the menu shows what waits, not only on Velos
export default {
  title: 'Quiet marks in the menu',
  lead: 'The menu now shows where something waits: open ticks on Plan, a tour that is not packed yet on Tours.',
  points: [
    { text: 'A small number on «Plan» says how many ticks are still open today (the same number as in «Tick off today»)', go: { href: '#/week', where: 'Shows in the menu (bottom bar on a phone, side bar on a computer) while a tick is still open today.' } },
    { text: 'A small dot on «Tours» says a tour starts within 3 days and something is not packed yet', go: { href: '#/trips', where: 'Shows in the menu once a tour starts within 3 days and its packing list is not full.' } },
  ],
  small: [{ box: 'new', text: 'Each mark can be switched off in Me › Look › Operation' }],
  test: [
    'Look at the menu: «Plan» shows a number while ticks are open today.',
    'Plan a tour that starts tomorrow and leave something unpacked: «Tours» shows a dot.',
    'Open Me › Look › Operation and switch a mark off: it goes from the menu.',
  ],
  since: [],
  de: {
    'Quiet marks in the menu': 'Ruhige Punkte im Menü',
    'The menu now shows where something waits: open ticks on Plan, a tour that is not packed yet on Tours.': 'Das Menü zeigt jetzt, wo etwas wartet: offene Haken bei Plan, eine noch nicht gepackte Tour bei Touren.',
    'A small number on «Plan» says how many ticks are still open today (the same number as in «Tick off today»)': 'Eine kleine Zahl bei «Plan» sagt, wie viele Haken heute noch offen sind (dieselbe Zahl wie in «Heute abhaken»)',
    'Shows in the menu (bottom bar on a phone, side bar on a computer) while a tick is still open today.': 'Steht im Menü (unten am Handy, seitlich am Computer), solange heute noch ein Haken offen ist.',
    'A small dot on «Tours» says a tour starts within 3 days and something is not packed yet': 'Ein kleiner Punkt bei «Touren» sagt, dass eine Tour in den nächsten 3 Tagen startet und noch nicht alles gepackt ist',
    'Shows in the menu once a tour starts within 3 days and its packing list is not full.': 'Steht im Menü, sobald eine Tour in den nächsten 3 Tagen startet und ihre Packliste nicht voll ist.',
    'Each mark can be switched off in Me › Look › Operation': 'Jeder Punkt lässt sich unter Ich › Darstellung › Bedienung ausschalten',
    'Look at the menu: «Plan» shows a number while ticks are open today.': 'Schau auf das Menü: «Plan» zeigt eine Zahl, solange heute Haken offen sind.',
    'Plan a tour that starts tomorrow and leave something unpacked: «Tours» shows a dot.': 'Plane eine Tour, die morgen startet, und lass etwas ungepackt: «Touren» zeigt einen Punkt.',
    'Open Me › Look › Operation and switch a mark off: it goes from the menu.': 'Öffne Ich › Darstellung › Bedienung und schalte einen Punkt aus: Er verschwindet aus dem Menü.',
  },
};

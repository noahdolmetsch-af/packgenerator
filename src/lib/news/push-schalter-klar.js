// «Push-Morgenschalter» (Impeccable-Test 08.11.2026, Arbeitsliste 7b-07): no more «off» and «on» at the same time
export default {
  title: 'Reminders on the phone: clear what is on',
  lead: 'While «On the phone» is off, the switches below are grey and say they are only saved. If your browser blocks notifications, the page shows the steps and a «Try again» button.',
  points: [{ text: 'Grey switches while «On the phone» is off, with one line why', go: { href: '#/me/push', steps: [{ sel: '[data-push-wait]' }] } }],
  small: [],
  test: [
    'Open Me › Reminders on the phone while «On the phone» is off: «One message in the morning» is grey, and a line says to switch on «On the phone» first.',
    'Switch it on in a browser that allows notifications: the switches turn green.',
  ],
  since: [],
  de: {
    'Reminders on the phone: clear what is on': 'Erinnerungen aufs Handy: klar, was an ist',
    'While «On the phone» is off, the switches below are grey and say they are only saved. If your browser blocks notifications, the page shows the steps and a «Try again» button.': 'Solange «Aufs Handy» aus ist, sind die Schalter darunter grau und sagen, dass sie nur gemerkt sind. Blockiert dein Browser Hinweise, zeigt die Seite die Schritte und einen Knopf «Nochmals».',
    'Grey switches while «On the phone» is off, with one line why': 'Graue Schalter, solange «Aufs Handy» aus ist, mit einer Zeile dazu',
    'Open Me › Reminders on the phone while «On the phone» is off: «One message in the morning» is grey, and a line says to switch on «On the phone» first.': 'Öffne Ich › Erinnerungen aufs Handy, solange «Aufs Handy» aus ist: «Eine Nachricht am Morgen» ist grau, und eine Zeile sagt, du sollst zuerst «Aufs Handy» einschalten.',
    'Switch it on in a browser that allows notifications: the switches turn green.': 'Schalte es in einem Browser ein, der Hinweise erlaubt: Die Schalter werden grün.',
  },
};

// «Timer: Knöpfe gut lesbar» (Gesamttest 19.11.2026): the green buttons «Start», «Save» and «Tick off» had grey text
export default {
  title: 'Timer buttons easy to read',
  lead: 'The green buttons «Start» (typed time), «Save» and «Tick off» on the Timer pages had dark grey text. Now the text is white like on every other green button.',
  points: [
    {
      text: 'Timer: «Start» next to the typed time is readable',
      go: { href: '#/timer', steps: [{ sel: '[data-typed]' }] },
    },
  ],
  small: [],
  test: [
    'Open Timer: next to «Type a time» the green button «Start» has white text, like the big «Start» above.',
    'Open the Timer log (#/timer/log), tap an entry to change it: «Save» has white text on green.',
  ],
  since: [],
  de: {
    'Timer buttons easy to read': 'Timer-Knöpfe gut lesbar',
    'The green buttons «Start» (typed time), «Save» and «Tick off» on the Timer pages had dark grey text. Now the text is white like on every other green button.': 'Die grünen Knöpfe «Start» (getippte Zeit), «Speichern» und «Abhaken» auf den Timer-Seiten hatten dunkelgrauen Text. Jetzt ist der Text weiss wie auf jedem anderen grünen Knopf.',
    'Timer: «Start» next to the typed time is readable': 'Timer: «Start» neben der getippten Zeit ist gut lesbar',
    'Open Timer: next to «Type a time» the green button «Start» has white text, like the big «Start» above.': 'Öffne Timer: Neben «Zeit eintippen» hat der grüne Knopf «Start» weissen Text, wie das grosse «Start» darüber.',
    'Open the Timer log (#/timer/log), tap an entry to change it: «Save» has white text on green.': 'Öffne das Timer-Log (#/timer/log), tippe einen Eintrag zum Ändern: «Speichern» hat weissen Text auf Grün.',
  },
};

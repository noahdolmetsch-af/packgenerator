// «Schriftgrösse Klein/Normal/Gross» (Noah 03.11.2026 «Drei Knöpfe dazu»): three quick sizes above the slider
export default {
  title: 'Three quick sizes',
  lead: 'Small, Normal or Large with one tap, for reading in the sun. The slider stays for fine steps.',
  points: [{ text: 'Me › Appearance › Size: three buttons Small, Normal and Large above the slider', go: { href: '#/me/look', steps: [{ sel: '[data-size-presets]' }] } }],
  small: [],
  test: [
    'Open Me › Appearance › Size and light and tap «Large»: the whole app gets bigger.',
    'Tap «Normal»: back to the usual size.',
  ],
  since: [],
  de: {
    'Three quick sizes': 'Drei schnelle Grössen',
    'Small, Normal or Large with one tap, for reading in the sun. The slider stays for fine steps.': 'Klein, Normal oder Gross mit einem Tipp, zum Lesen in der Sonne. Der Regler bleibt für feine Schritte.',
    'Me › Appearance › Size: three buttons Small, Normal and Large above the slider': 'Ich › Darstellung › Grösse: drei Knöpfe Klein, Normal und Gross über dem Regler',
    'Open Me › Appearance › Size and light and tap «Large»: the whole app gets bigger.': 'Öffne Ich › Darstellung › Grösse und Licht und tippe «Gross»: Die ganze App wird grösser.',
    'Tap «Normal»: back to the usual size.': 'Tippe «Normal»: zurück zur üblichen Grösse.',
  },
};

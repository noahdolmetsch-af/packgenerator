// «Bewegung beim Seitenwechsel» 1 «Richtung zeigen» (Noah 03.11.2026 «b», Paket A): deeper glides in from the right, back from the left
export default {
  title: 'Pages show which way you go',
  lead: 'Going deeper, the new page glides in from the right; going back, from the left.',
  points: [{ text: 'Open a tour from Tours: the page glides in from the right, and back to the left', href: '#/trips', go: { href: '#/trips', where: 'Shows when you open a tour or a packing list from Tours, and when you go back.' } }],
  small: [{ box: 'new', text: 'About a fifth of a second; with «Reduce motion» on the device or Motion «Off» nothing glides', go: { href: '#/me/look', where: 'Shows in Me › Appearance under Handling.' } }],
  test: ['On Tours open a tour: the page glides in from the right.', 'Tap «Tours» at the top left to go back: the page glides in from the left. Between Today, Tours and the other places nothing glides.'],
  since: [],
  de: {
    'Pages show which way you go': 'Seiten zeigen, wohin du gehst',
    'Going deeper, the new page glides in from the right; going back, from the left.': 'Gehst du tiefer, gleitet die neue Seite von rechts herein; gehst du zurück, von links.',
    'Open a tour from Tours: the page glides in from the right, and back to the left': 'Öffne in Touren eine Tour: die Seite gleitet von rechts herein, beim Zurück nach links',
    'Shows when you open a tour or a packing list from Tours, and when you go back.': 'Zeigt sich, wenn du in Touren eine Tour oder eine Packliste öffnest und wenn du zurückgehst.',
    'About a fifth of a second; with «Reduce motion» on the device or Motion «Off» nothing glides': 'Etwa eine Fünftelsekunde; mit «Bewegung reduzieren» am Gerät oder Bewegung «Aus» gleitet nichts',
    'On Tours open a tour: the page glides in from the right.': 'Öffne in Touren eine Tour: die Seite gleitet von rechts herein.',
    'Tap «Tours» at the top left to go back: the page glides in from the left. Between Today, Tours and the other places nothing glides.': 'Tippe oben links auf «Touren», um zurückzugehen: die Seite gleitet von links herein. Zwischen Heute, Touren und den anderen Orten gleitet nichts.',
  },
};

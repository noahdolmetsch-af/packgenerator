// «Bewegung beim Seitenwechsel» 2 «Der Titel fliegt mit» (Noah 03.11.2026 «b», Paket A): a tour's name travels from the list to its page
export default {
  title: 'The name flies along',
  lead: 'Tap a tour in the list and its name travels to the top of the tour page.',
  points: [{ text: 'Tours › With packing list: tap the name of a tour and watch it travel to the heading of its page', href: '#/trips', go: { href: '#/trips', where: 'Shows in Tours when you tap the name of a tour in the list (on a phone first open «With packing list»).' } }],
  small: [{ box: 'new', text: 'Only the name moves, about a quarter of a second; with «Reduce motion» on the device or Motion «Off», and in a browser without this feature, the page opens as before', go: { href: '#/me/look', where: 'Shows in Me › Appearance under Handling.' } }],
  test: ['On a phone open Tours and tap «With packing list». On a computer the list is already there.', 'Tap the name of a tour: the name travels up to the heading of the tour page.'],
  since: [],
  de: {
    'The name flies along': 'Der Name fliegt mit',
    'Tap a tour in the list and its name travels to the top of the tour page.': 'Tippe in der Liste auf eine Tour: ihr Name wandert nach oben auf die Tour-Seite.',
    'Tours › With packing list: tap the name of a tour and watch it travel to the heading of its page': 'Touren › Mit Packliste: tippe auf den Namen einer Tour und sieh zu, wie er zur Überschrift ihrer Seite wandert',
    'Shows in Tours when you tap the name of a tour in the list (on a phone first open «With packing list»).': 'Zeigt sich in Touren, wenn du in der Liste auf den Namen einer Tour tippst (am Handy zuerst «Mit Packliste» öffnen).',
    'Only the name moves, about a quarter of a second; with «Reduce motion» on the device or Motion «Off», and in a browser without this feature, the page opens as before': 'Nur der Name bewegt sich, etwa eine Viertelsekunde; mit «Bewegung reduzieren» am Gerät oder Bewegung «Aus» und in einem Browser ohne diese Funktion geht die Seite auf wie bisher',
    'On a phone open Tours and tap «With packing list». On a computer the list is already there.': 'Öffne am Handy Touren und tippe auf «Mit Packliste». Am Computer steht die Liste schon da.',
    'Tap the name of a tour: the name travels up to the heading of the tour page.': 'Tippe auf den Namen einer Tour: der Name wandert nach oben zur Überschrift der Tour-Seite.',
  },
};

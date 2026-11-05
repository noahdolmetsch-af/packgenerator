// «Bewegung beim Seitenwechsel» 3 «Markierung gleitet» (Noah 03.11.2026 «b», Paket A): the pill in the bottom bar glides from place to place
export default {
  title: 'The bottom bar glides',
  lead: 'On a phone, the light pill behind the chosen place now glides from icon to icon.',
  points: [{ text: 'Tap another place in the bar at the bottom: the pill glides over to it', href: '#/trips', go: { href: '#/trips', where: 'Shows in the bar at the bottom of a phone when you change the place.' } }],
  small: [{ box: 'new', text: 'About a fifth of a second; with «Reduce motion» on the device or Motion «Off» it just stands in the new place', go: { href: '#/me/look', where: 'Shows in Me › Appearance under Handling.' } }],
  test: ['On a phone tap «Tours» in the bar at the bottom: the light pill glides from «Today» to «Tours».', 'Then tap «Active»: it glides on. On a computer nothing changes (the sidebar stays as it was).'],
  since: [],
  de: {
    'The bottom bar glides': 'Die Leiste unten gleitet',
    'On a phone, the light pill behind the chosen place now glides from icon to icon.': 'Am Handy gleitet die helle Markierung hinter dem gewählten Ort jetzt von Symbol zu Symbol.',
    'Tap another place in the bar at the bottom: the pill glides over to it': 'Tippe in der Leiste unten auf einen anderen Ort: die Markierung gleitet zu ihm hinüber',
    'Shows in the bar at the bottom of a phone when you change the place.': 'Zeigt sich in der Leiste unten am Handy, wenn du den Ort wechselst.',
    'About a fifth of a second; with «Reduce motion» on the device or Motion «Off» it just stands in the new place': 'Etwa eine Fünftelsekunde; mit «Bewegung reduzieren» am Gerät oder Bewegung «Aus» steht sie einfach am neuen Ort',
    'On a phone tap «Tours» in the bar at the bottom: the light pill glides from «Today» to «Tours».': 'Tippe am Handy in der Leiste unten auf «Touren»: die helle Markierung gleitet von «Heute» zu «Touren».',
    'Then tap «Active»: it glides on. On a computer nothing changes (the sidebar stays as it was).': 'Tippe dann auf «Aktiv»: sie gleitet weiter. Am Computer ändert sich nichts (die Seitenleiste bleibt wie sie war).',
  },
};

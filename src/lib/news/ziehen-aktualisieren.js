// «Ziehen zum Aktualisieren mit Velorad» (Noah 03.11.2026 «b», Paket D, Idee 10): pull Today down, a bike wheel turns while weather and Strava load
export default {
  title: 'Pull down to refresh',
  lead: 'Pull Today down: a small bike wheel turns while the weather and your Strava rides load fresh.',
  points: [{ text: 'On Today, pull the page down at the top and let go: the wheel spins, then «Up to date»', go: { href: '#/', where: 'On a phone or tablet at the very top of Today: pull down with one finger and let go.' } }],
  small: [{ box: 'new', text: 'With «Reduce motion» the wheel does not spin; the text still says what happens' }],
  test: ['On your phone open Today and scroll to the top. Pull down with one finger until it says «Let go to refresh», then let go.', 'The wheel spins, the weather line reloads and, with Strava connected, new rides come in; then «Up to date» shows briefly.'],
  since: [],
  de: {
    'Pull down to refresh': 'Zum Aktualisieren ziehen',
    'Pull Today down: a small bike wheel turns while the weather and your Strava rides load fresh.': 'Zieh Heute nach unten: Ein kleines Velorad dreht sich, während Wetter und deine Strava-Fahrten neu geladen werden.',
    'On Today, pull the page down at the top and let go: the wheel spins, then «Up to date»': 'Auf Heute oben die Seite nach unten ziehen und loslassen: Das Rad dreht sich, dann «Auf dem neuesten Stand»',
    'On a phone or tablet at the very top of Today: pull down with one finger and let go.': 'Am Handy oder Tablet ganz oben auf Heute: mit einem Finger nach unten ziehen und loslassen.',
    'With «Reduce motion» the wheel does not spin; the text still says what happens': 'Bei «Bewegung reduzieren» dreht sich das Rad nicht; der Text sagt trotzdem, was passiert',
    'On your phone open Today and scroll to the top. Pull down with one finger until it says «Let go to refresh», then let go.': 'Öffne am Handy Heute und scrolle ganz nach oben. Zieh mit einem Finger nach unten, bis «Loslassen zum Aktualisieren» steht, dann lass los.',
    'The wheel spins, the weather line reloads and, with Strava connected, new rides come in; then «Up to date» shows briefly.': 'Das Rad dreht sich, die Wetterzeile lädt neu und, mit verbundenem Strava, kommen neue Fahrten herein; dann steht kurz «Auf dem neuesten Stand».',
  },
};

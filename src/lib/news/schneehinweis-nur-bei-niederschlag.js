// «Schneehinweis» (Noah 08.11.2026, Thread «Prüfen: Schnee bei dir möglich trotz mildem Tag»): the hint only with precipitation and cold
export default {
  title: 'Snow hint only when snow is likely',
  lead: '«Snow possible at your place» no longer shows on a dry, mild day.',
  points: [
    { text: 'The hint shows only when the snow line is down to your height, precipitation is expected and it is cold enough there', go: { href: '#/', where: 'Today, under the weather line, on a day with snow in the forecast (needs a home place).' } },
    { text: 'The hint says from which hour snow is possible', go: { href: '#/wetter', where: 'Weather › the card «Today», under the snow line.' } },
  ],
  small: [{ box: 'new', text: 'The snow line itself stays as it was' }],
  test: [
    'On a dry day Today shows the snow line without a red hint, even when the line is down to your height.',
    'On a day with snow in the forecast Today and the weather page say «from … h» in red.',
  ],
  since: [],
  de: {
    'Snow hint only when snow is likely': 'Schneehinweis nur, wenn Schnee wahrscheinlich ist',
    '«Snow possible at your place» no longer shows on a dry, mild day.': '«Schnee bei dir möglich» erscheint an einem trockenen, milden Tag nicht mehr.',
    'The hint shows only when the snow line is down to your height, precipitation is expected and it is cold enough there': 'Der Hinweis erscheint nur, wenn die Schneefallgrenze bis in deine Höhe sinkt, Niederschlag zu erwarten ist und es dort kalt genug ist',
    'Today, under the weather line, on a day with snow in the forecast (needs a home place).': 'Heute, unter der Wetterzeile, an einem Tag mit Schnee in der Vorhersage (braucht einen Wohnort).',
    'The hint says from which hour snow is possible': 'Der Hinweis sagt, ab welcher Uhrzeit Schnee möglich ist',
    'Weather › the card «Today», under the snow line.': 'Wetter › Karte «Heute», unter der Schneefallgrenze.',
    'The snow line itself stays as it was': 'Die Schneefallgrenze selbst bleibt, wie sie war',
    'On a dry day Today shows the snow line without a red hint, even when the line is down to your height.': 'An einem trockenen Tag zeigt Heute die Schneefallgrenze ohne roten Hinweis, auch wenn die Grenze bis in deine Höhe sinkt.',
    'On a day with snow in the forecast Today and the weather page say «from … h» in red.': 'An einem Tag mit Schnee in der Vorhersage steht auf Heute und auf der Wetterseite rot «ab … Uhr».',
  },
};

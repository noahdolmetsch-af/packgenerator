// «Temperaturen nach Höhe auf Heute» (Noah 05.11.2026 «1b»): one calm line with 1000, 2000 and 3000 m
export default {
  title: 'Mountain temperatures on Today',
  lead: 'Today shows how warm or cold the air is at 1000, 2000 and 3000 m, in one calm line.',
  points: [
    { text: 'Today has one line for your home place: the temperature now at 1000, 2000 and 3000 m', go: { href: '#/', where: 'Today, under the weather line (needs a home place and the internet once).' } },
    { text: 'You can switch the line off', go: { href: '#/wetter', where: 'Weather › «Now» › «Temperatures by height» › «Choose places and peaks».' } },
  ],
  small: [{ box: 'new', text: 'A tap on the line opens the weather page with the whole card' }],
  test: [
    'Open Today: under the weather line you see «1000 m … · 2000 m … · 3000 m …».',
    'On the weather page open «Choose places and peaks» and take the check off: the line is gone from Today.',
  ],
  since: [],
  de: {
    'Mountain temperatures on Today': 'Bergtemperaturen auf Heute',
    'Today shows how warm or cold the air is at 1000, 2000 and 3000 m, in one calm line.': 'Heute zeigt in einer ruhigen Zeile, wie warm oder kalt die Luft auf 1000, 2000 und 3000 m ist.',
    'Today has one line for your home place: the temperature now at 1000, 2000 and 3000 m': 'Heute hat eine Zeile für deinen Wohnort: die Temperatur jetzt auf 1000, 2000 und 3000 m',
    'Today, under the weather line (needs a home place and the internet once).': 'Heute, unter der Wetterzeile (braucht einen Wohnort und einmal Internet).',
    'You can switch the line off': 'Du kannst die Zeile ausschalten',
    'Weather › «Now» › «Temperatures by height» › «Choose places and peaks».': 'Wetter › «Jetzt» › «Temperaturen nach Höhe» › «Orte und Gipfel wählen».',
    'A tap on the line opens the weather page with the whole card': 'Ein Tipp auf die Zeile öffnet die Wetterseite mit der ganzen Karte',
    'Open Today: under the weather line you see «1000 m … · 2000 m … · 3000 m …».': 'Öffne Heute: Unter der Wetterzeile siehst du «1000 m … · 2000 m … · 3000 m …».',
    'On the weather page open «Choose places and peaks» and take the check off: the line is gone from Today.': 'Öffne auf der Wetterseite «Orte und Gipfel wählen» und nimm den Haken weg: Die Zeile ist von Heute verschwunden.',
  },
};

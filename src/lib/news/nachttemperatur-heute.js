// «Nachttemperatur» (Noah 06.11.2026 «1a und c 2a 3a 4a 5a», PR 2): one calm line on Today
export default {
  title: 'Night temperature on Today',
  lead: 'Today has one calm line: how cold this morning was and how cold the next night gets.',
  points: [
    { text: 'The line shows this morning and tomorrow morning for your home place, and frost or the change against yesterday', go: { href: '#/', where: 'Today, under the fog line (needs a home place and the internet once).' } },
    { text: 'A tap on the line opens the weather page with the card «Night temperature»', go: { href: '#/wetter', where: 'Weather › part «Now», card «Night temperature».' } },
  ],
  small: [{ box: 'new', text: 'The line can be switched off under «Set night line» on the weather page' }],
  test: [
    'Open Today: under the weather lines you see «Night: this morning … °C, tomorrow morning … °C».',
    'Tap the line: the weather page opens at the card «Night temperature».',
    'Under «Set night line» switch the line off: it is gone on Today.',
  ],
  since: [],
  de: {
    'Night temperature on Today': 'Nachttemperatur auf Heute',
    'Today has one calm line: how cold this morning was and how cold the next night gets.': 'Heute hat eine ruhige Zeile: wie kalt es heute früh war und wie kalt die nächste Nacht wird.',
    'The line shows this morning and tomorrow morning for your home place, and frost or the change against yesterday': 'Die Zeile zeigt heute früh und morgen früh für deinen Wohnort, dazu Frost oder die Veränderung zu gestern',
    'Today, under the fog line (needs a home place and the internet once).': 'Heute, unter der Nebelgrenze (braucht einen Wohnort und einmal Internet).',
    'A tap on the line opens the weather page with the card «Night temperature»': 'Ein Tipp auf die Zeile öffnet die Wetterseite mit der Karte «Nachttemperatur»',
    'Weather › part «Now», card «Night temperature».': 'Wetter › Reiter «Jetzt», Karte «Nachttemperatur».',
    'The line can be switched off under «Set night line» on the weather page': 'Die Zeile lässt sich auf der Wetterseite unter «Nachtzeile einstellen» ausschalten',
    'Open Today: under the weather lines you see «Night: this morning … °C, tomorrow morning … °C».': 'Öffne Heute: Unter den Wetterzeilen siehst du «Nacht: heute früh … °C, morgen früh … °C».',
    'Tap the line: the weather page opens at the card «Night temperature».': 'Tippe auf die Zeile: Die Wetterseite öffnet sich bei der Karte «Nachttemperatur».',
    'Under «Set night line» switch the line off: it is gone on Today.': 'Schalte unter «Nachtzeile einstellen» die Zeile aus: Auf Heute ist sie weg.',
  },
};

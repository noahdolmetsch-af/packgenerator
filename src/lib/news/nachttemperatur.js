// «Nachttemperatur» (Noah 06.11.2026 «1a und c 2a 3a 4a 5a»): the lowest temperature of the night on the weather page
export default {
  title: 'Night temperature',
  lead: 'The weather page shows how cold last night was and how cold the next one gets.',
  points: [
    { text: 'The card «Night temperature» shows this morning and tomorrow morning, with bars for 7 nights back and 6 ahead', go: { href: '#/wetter', where: 'Weather › part «Now», under the card «Today» (needs a home place).' } },
    { text: 'Hints when it is worth a word: warmer or colder than yesterday and than a week ago', go: { href: '#/wetter', where: 'Weather › part «Now», card «Night temperature».' } },
    { text: 'The forecast says falling or rising, «back to 5 °C or more in 3 days» and frost', go: { href: '#/wetter', where: 'Weather › part «Now», card «Night temperature», under the bars.' } },
  ],
  small: [{ box: 'new', text: 'The night is the time from 18 to 8 h; its name is the morning it ends on' }],
  test: [
    'Open the weather page: under «Today» you see the card «Night temperature» with this morning and tomorrow morning.',
    'Under the two numbers are 14 bars; the bar with a frame is this morning.',
    'Search another place on the page: the card shows the nights of that place.',
  ],
  since: [],
  de: {
    'Night temperature': 'Nachttemperatur',
    'The weather page shows how cold last night was and how cold the next one gets.': 'Die Wetterseite zeigt, wie kalt die letzte Nacht war und wie kalt die nächste wird.',
    'The card «Night temperature» shows this morning and tomorrow morning, with bars for 7 nights back and 6 ahead': 'Die Karte «Nachttemperatur» zeigt heute früh und morgen früh, mit Säulen für 7 Nächte zurück und 6 voraus',
    'Weather › part «Now», under the card «Today» (needs a home place).': 'Wetter › Reiter «Jetzt», unter der Karte «Heute» (braucht einen Wohnort).',
    'Hints when it is worth a word: warmer or colder than yesterday and than a week ago': 'Hinweise, wenn sie ein Wort wert sind: wärmer oder kälter als gestern und als vor einer Woche',
    'Weather › part «Now», card «Night temperature».': 'Wetter › Reiter «Jetzt», Karte «Nachttemperatur».',
    'The forecast says falling or rising, «back to 5 °C or more in 3 days» and frost': 'Die Prognose sagt sinkend oder steigend, «wieder 5 Plus in 3 Tagen» und Frost',
    'Weather › part «Now», card «Night temperature», under the bars.': 'Wetter › Reiter «Jetzt», Karte «Nachttemperatur», unter den Säulen.',
    'The night is the time from 18 to 8 h; its name is the morning it ends on': 'Die Nacht ist die Zeit von 18 bis 8 Uhr; ihr Name ist der Morgen, an dem sie endet',
    'Open the weather page: under «Today» you see the card «Night temperature» with this morning and tomorrow morning.': 'Öffne die Wetterseite: Unter «Heute» siehst du die Karte «Nachttemperatur» mit heute früh und morgen früh.',
    'Under the two numbers are 14 bars; the bar with a frame is this morning.': 'Unter den zwei Zahlen stehen 14 Säulen; die Säule mit Rahmen ist heute früh.',
    'Search another place on the page: the card shows the nights of that place.': 'Suche auf der Seite einen anderen Ort: Die Karte zeigt die Nächte dieses Ortes.',
  },
};

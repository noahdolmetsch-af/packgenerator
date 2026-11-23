// «Was ist neu» mit Release-Datum, Uhrzeit und Bild (Warteliste 3; Noah 22.11.2026 «1b», «2a und Uhrzeit», «3a», «4a», «5a»)
export default {
  title: 'What is new: the day, the time and a picture',
  lead: 'Every entry shows its day with the weekday and the time it went online. Some entries have a picture you can open.',
  points: [
    { text: 'Every update shows its full day, like «Sat, 21 Nov 2026, 14:32»; the tile «New» on Today names the day too', go: { href: '#/me/news', steps: [{ sel: '[data-version]' }] } },
    { text: 'Under an update with a picture: «Show picture» (before and after next to each other); a tap on the picture makes it bigger', go: { href: '#/me/news', steps: [{ sel: '[data-news-pic]' }] } },
  ],
  small: [{ box: 'new', text: 'The picture loads only when you tap «Show picture»; without the internet it says so', go: null }],
  test: [
    'Open Me › What is new: every update has its day with the weekday.',
    'Find an update with «Show picture», tap it: the picture shows; tap the picture: it gets bigger; «Hide picture» closes it.',
  ],
  since: [],
  de: {
    'What is new: the day, the time and a picture': 'Was ist neu: Tag, Uhrzeit und ein Bild',
    'Every entry shows its day with the weekday and the time it went online. Some entries have a picture you can open.': 'Jeder Eintrag zeigt seinen Tag mit Wochentag und die Uhrzeit, zu der er online ging. Manche Einträge haben ein Bild zum Öffnen.',
    'Every update shows its full day, like «Sat, 21 Nov 2026, 14:32»; the tile «New» on Today names the day too': 'Jede Neuerung zeigt ihren ganzen Tag, etwa «Sa., 21. Nov. 2026, 14:32»; die Kachel «Neu» auf Heute nennt den Tag auch',
    'Under an update with a picture: «Show picture» (before and after next to each other); a tap on the picture makes it bigger': 'Unter einer Neuerung mit Bild: «Bild zeigen» (Vorher und Nachher nebeneinander); ein Tipp aufs Bild vergrössert es',
    'The picture loads only when you tap «Show picture»; without the internet it says so': 'Das Bild lädt erst, wenn du «Bild zeigen» antippst; ohne Internet steht das da',
    'Open Me › What is new: every update has its day with the weekday.': 'Ich › Was ist neu öffnen: jede Neuerung zeigt ihren Tag mit Wochentag.',
    'Find an update with «Show picture», tap it: the picture shows; tap the picture: it gets bigger; «Hide picture» closes it.': 'Eine Neuerung mit «Bild zeigen» suchen, antippen: das Bild erscheint; aufs Bild tippen: es wird grösser; «Bild ausblenden» schliesst es.',
  },
};

// «Dazu nötig» (Noah 23.11.2026 «G1»): the small thing that belongs with a bigger one is on the list too
export default {
  title: 'Needed with it: the small thing is not forgotten',
  lead: 'Name what belongs with a thing (the cable of the bike computer): if it is missing on a list, Pack says so.',
  points: [
    { text: 'In the window of an item, the row «Needed with this»: choose the things that belong with it', go: { href: '#/gear', where: 'Open a thing in Material: the row «Needed with this» is in its window.', steps: [{ text: 'Needed with this' }] } },
    { text: 'On a planned trip the card «Ready to go?» gets a line «Needed with it: … is missing»; a tap opens a window to add it', go: { href: '#/pack', where: 'Shows on Pack when a thing on the list has a companion that is not on it.', steps: [{ sel: '[data-ampel]' }] } },
    { text: 'The app also suggests a thing that came along with another one on all your last trips (at least 3)', go: { href: '#/pack', where: 'Shows on Pack after at least three finished trips with the same two things.', steps: [{ sel: '[data-ampel]' }] } },
  ],
  small: [{ box: 'new', text: '«Not this time» leaves a suggestion out for one trip only; nothing is added by itself' }],
  test: [
    'In Material open a thing, for example a lamp: in the window tap the row «Needed with this» and choose the cable.',
    'Open a planned trip in Pack that has the lamp but not the cable, and open the card «Ready to go?»: a line says the cable is missing.',
    'Tap the line: in the window tap «Add»: the cable is on the list and the line is gone.',
  ],
  since: [],
  de: {
    'Needed with it: the small thing is not forgotten': 'Dazu nötig: das kleine Teil wird nicht vergessen',
    'Name what belongs with a thing (the cable of the bike computer): if it is missing on a list, Pack says so.': 'Lege fest, was zu einem Teil gehört (das Kabel des Velocomputers): fehlt es auf einer Liste, sagt es Packen.',
    'In the window of an item, the row «Needed with this»: choose the things that belong with it': 'Im Fenster eines Teils die Zeile «Dazu nötig»: wähle die Teile, die dazugehören',
    'Open a thing in Material: the row «Needed with this» is in its window.': 'Öffne ein Teil in Material: die Zeile «Dazu nötig» steht in seinem Fenster.',
    'On a planned trip the card «Ready to go?» gets a line «Needed with it: … is missing»; a tap opens a window to add it': 'Bei einer geplanten Tour hat die Karte «Bereit zur Abfahrt?» eine Zeile «Dazu nötig: … fehlt»; ein Tipp öffnet ein Fenster zum Hinzufügen',
    'Shows on Pack when a thing on the list has a companion that is not on it.': 'Steht in Packen, wenn ein Teil auf der Liste ein Begleitteil hat, das nicht darauf steht.',
    'The app also suggests a thing that came along with another one on all your last trips (at least 3)': 'Die App schlägt auch ein Teil vor, das auf allen deinen letzten Touren mit einem anderen dabei war (mindestens 3)',
    'Shows on Pack after at least three finished trips with the same two things.': 'Steht in Packen, nach mindestens drei abgeschlossenen Touren mit denselben zwei Teilen.',
    '«Not this time» leaves a suggestion out for one trip only; nothing is added by itself': '«Diesmal nicht» lässt einen Vorschlag nur für diese Tour weg; nichts wird von selbst hinzugefügt',
    'In Material open a thing, for example a lamp: in the window tap the row «Needed with this» and choose the cable.': 'Öffne in Material ein Teil, zum Beispiel eine Lampe: tippe im Fenster auf die Zeile «Dazu nötig» und wähle das Kabel.',
    'Open a planned trip in Pack that has the lamp but not the cable, and open the card «Ready to go?»: a line says the cable is missing.': 'Öffne in Packen eine geplante Tour mit der Lampe, aber ohne das Kabel, und klappe die Karte «Bereit zur Abfahrt?» auf: eine Zeile sagt, dass das Kabel fehlt.',
    'Tap the line: in the window tap «Add»: the cable is on the list and the line is gone.': 'Tippe auf die Zeile und im Fenster auf «Hinzufügen»: das Kabel steht auf der Liste und die Zeile ist weg.',
  },
};

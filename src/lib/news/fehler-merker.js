// Noah 21.11.2026 «a» (thread «Prüfungen so einrichten, dass main grün bleibt»): the app quietly notes its errors on this device
export default {
  title: 'Noted errors',
  lead: 'The app now notes its own errors on this phone, so a problem can be found even if you do not see it.',
  points: [{ text: 'Me › Data › Noted errors: see them, copy them, clear the list', go: { href: '#/me/logbuch', where: 'The noted errors show in the improvement log as «Error».' } }],
  small: [],
  test: ['Open Me › Data and scroll down to «Noted errors».', 'It says «No errors noted», or lists the last ones with page and time; «Copy the errors» puts them on the clipboard.'],
  since: [],
  de: {
    'Noted errors': 'Gemerkte Fehler',
    'The app now notes its own errors on this phone, so a problem can be found even if you do not see it.': 'Die App merkt sich ihre Fehler jetzt auf diesem Handy, damit man ein Problem auch findet, wenn du es nicht siehst.',
    'Me › Data › Noted errors: see them, copy them, clear the list': 'Ich › Daten › Gemerkte Fehler: ansehen, kopieren, Liste leeren',
    'Open Me › Data and scroll down to «Noted errors».': 'Öffne Ich › Daten und scrolle nach unten zu «Gemerkte Fehler».',
    'It says «No errors noted», or lists the last ones with page and time; «Copy the errors» puts them on the clipboard.': 'Dort steht «Keine Fehler gemerkt» oder die letzten mit Seite und Zeit; «Fehler kopieren» legt sie in die Zwischenablage.',
  },
};

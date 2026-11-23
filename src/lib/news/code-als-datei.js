// «Code als Datei sichern» (Noah 22.11.2026 «4a», Thread «Sync»): der Kopplungscode lässt sich auf dem Computer aufbewahren
export default {
  title: 'Keep your pairing code as a file',
  lead: 'Save the code of your sync on the computer, to pair a new or emptied phone later.',
  points: [{ text: 'A new button «Save code as file» next to «Copy code»', go: { href: '#/me/data', where: 'Ich › Data and backup › Phone and computer › Pair another device.' } }],
  small: [{ box: 'nicer', text: 'You can paste the whole text of the file into «I have a code»; the app finds the code in it' }],
  test: [
    'Open Ich › Data and backup, in «Phone and computer» tap «Pair another device».',
    'Tap «Save code as file»: a small text file with the code is saved.',
    'Open the file: it holds the code and what to do with it.',
  ],
  since: [],
  de: {
    'Keep your pairing code as a file': 'Bewahre deinen Kopplungscode als Datei auf',
    'Save the code of your sync on the computer, to pair a new or emptied phone later.': 'Sichere den Code deines Abgleichs auf dem Computer, um später ein neues oder geleertes Handy zu koppeln.',
    'A new button «Save code as file» next to «Copy code»': 'Neuer Knopf «Code als Datei sichern» neben «Code kopieren»',
    'Ich › Data and backup › Phone and computer › Pair another device.': 'Ich › Daten und Backup › Handy und Computer › Zweites Gerät koppeln.',
    'You can paste the whole text of the file into «I have a code»; the app finds the code in it': 'Den ganzen Text der Datei kannst du in «Ich habe einen Code» einfügen; die App findet den Code darin',
    'Open Ich › Data and backup, in «Phone and computer» tap «Pair another device».': 'Öffne Ich › Daten und Backup, tippe bei «Handy und Computer» auf «Zweites Gerät koppeln».',
    'Tap «Save code as file»: a small text file with the code is saved.': 'Tippe «Code als Datei sichern»: Eine kleine Textdatei mit dem Code wird gespeichert.',
    'Open the file: it holds the code and what to do with it.': 'Öffne die Datei: Sie enthält den Code und was damit zu tun ist.',
  },
};

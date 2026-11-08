// «Ein Wort pro Sache: Backup» (Noah «namen ok» 08.11.2026, Namensliste Zeile 7): the backup has one name everywhere
export default {
  title: 'One name for the backup',
  lead: 'The backup is called «Backup» everywhere: «Backup speichern», «Backup prüfen», «Backup-Datei».',
  points: [{ text: 'Ich › Daten und Backup: «Backup prüfen» instead of «Sicherung prüfen», «Backup speichern» instead of «Jetzt sichern» and «Backup herunterladen»', go: { href: '#/me/data', where: 'Shows on Me › Data and backup, in the status line and under «Is everything fine?».' } }],
  small: [{ box: 'new', text: 'Messages and tips say «Backup-Datei» instead of «Sicherungsdatei»' }],
  test: [
    'Open Ich › Daten und Backup: the buttons say «Backup speichern», «Backup importieren» and «Backup prüfen».',
    'Tap «Backup prüfen» and choose a file: the answer says «Dieses Backup ist gut.» or what is wrong.',
  ],
  since: [],
  de: {
    'One name for the backup': 'Ein Name für das Backup',
    'The backup is called «Backup» everywhere: «Backup speichern», «Backup prüfen», «Backup-Datei».': 'Das Backup heisst überall «Backup»: «Backup speichern», «Backup prüfen», «Backup-Datei».',
    'Ich › Daten und Backup: «Backup prüfen» instead of «Sicherung prüfen», «Backup speichern» instead of «Jetzt sichern» and «Backup herunterladen»': 'Ich › Daten und Backup: «Backup prüfen» statt «Sicherung prüfen», «Backup speichern» statt «Jetzt sichern» und «Backup herunterladen»',
    'Shows on Me › Data and backup, in the status line and under «Is everything fine?».': 'Steht unter Ich › Daten und Backup, in der Statuszeile und unter «Alles in Ordnung?».',
    'Messages and tips say «Backup-Datei» instead of «Sicherungsdatei»': 'Meldungen und Tipps sagen «Backup-Datei» statt «Sicherungsdatei»',
    'Open Ich › Daten und Backup: the buttons say «Backup speichern», «Backup importieren» and «Backup prüfen».': 'Öffne Ich › Daten und Backup: die Knöpfe heissen «Backup speichern», «Backup importieren» und «Backup prüfen».',
    'Tap «Backup prüfen» and choose a file: the answer says «Dieses Backup ist gut.» or what is wrong.': 'Tippe «Backup prüfen» und wähle eine Datei: die Antwort sagt «Dieses Backup ist gut.» oder was nicht stimmt.',
  },
};

// «Backup-Ordner braucht OK» (Noah 31.10.2026 «1a und b 2a»): Today says when the browser wants a tap to write into the backup folder again
export default {
  title: 'Backup folder: one tap',
  lead: 'When the browser asks again for the backup folder, Today shows it with a button.',
  points: [{ text: 'Today: «Allow backup» when the folder waits for your OK', go: null }],
  small: [{ box: 'new', text: 'A tip how Chrome asks less often', go: null }],
  test: ['On the computer choose a backup folder in Me › Data and backup, then close Chrome fully and open the app again.', 'On Today tap «Allow backup»: the row is gone and the backup writes again.'],
  since: [],
  de: {
    'Backup folder: one tap': 'Backup-Ordner: ein Tipp',
    'When the browser asks again for the backup folder, Today shows it with a button.': 'Wenn der Browser den Backup-Ordner neu erlauben will, zeigt Heute es mit einem Knopf.',
    'Today: «Allow backup» when the folder waits for your OK': 'Heute: «Backup erlauben», wenn der Ordner auf dein OK wartet',
    'A tip how Chrome asks less often': 'Ein Tipp, wie Chrome seltener fragt',
    'On the computer choose a backup folder in Me › Data and backup, then close Chrome fully and open the app again.': 'Wähle am Computer unter Ich › Daten und Backup einen Backup-Ordner, schliesse Chrome ganz und öffne die App neu.',
    'On Today tap «Allow backup»: the row is gone and the backup writes again.': 'Tippe auf Heute «Backup erlauben»: Die Zeile verschwindet und das Backup schreibt wieder.',
  },
};

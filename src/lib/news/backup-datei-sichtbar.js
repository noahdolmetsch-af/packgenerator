// Noah 03.11.2026: the backup file buttons were hidden in a closed fold; now they stand open on the page
export default {
  title: 'Backup file always in view',
  lead: 'Download a backup and import it on the other device: the buttons are open again, with steps and Undo.',
  points: [
    { text: 'Ich › Daten und Backup: «Save backup» and «Import backup» are open at the top, with four steps', go: { href: '#/me/data', steps: [{ text: 'Import backup' }] } },
    { text: 'After an import, «Undo import» brings the data back as it was', go: { href: '#/me/data', where: 'Me › Data and backup: after you import a file, the button «Undo import» appears.' } },
  ],
  small: [],
  test: ['On the phone open Ich › Daten und Backup: «Backup herunterladen» and «Backup importieren» stand under «Alles in Ordnung?», no fold.', 'Import a backup file: the check shows what is added and what is replaced; «Zusammenführen» is the suggested button.', 'After the import tap «Import rückgängig»: the data is as before.'],
  since: [],
  de: {
    'Backup file always in view': 'Backup-Datei immer sichtbar',
    'Download a backup and import it on the other device: the buttons are open again, with steps and Undo.': 'Backup herunterladen und auf dem anderen Gerät importieren: Die Knöpfe sind wieder offen, mit Schritten und Rückgängig.',
    'Ich › Daten und Backup: «Save backup» and «Import backup» are open at the top, with four steps': 'Ich › Daten und Backup: «Backup herunterladen» und «Backup importieren» stehen offen oben, mit vier Schritten',
    'After an import, «Undo import» brings the data back as it was': 'Nach einem Import holt «Import rückgängig» die Daten zurück, wie sie waren',
    'Me › Data and backup: after you import a file, the button «Undo import» appears.': 'Ich › Daten und Backup: Nach dem Import einer Datei erscheint der Knopf «Import rückgängig».',
    'On the phone open Ich › Daten und Backup: «Backup herunterladen» and «Backup importieren» stand under «Alles in Ordnung?», no fold.': 'Öffne am Handy Ich › Daten und Backup: «Backup herunterladen» und «Backup importieren» stehen unter «Alles in Ordnung?», ohne Faltstelle.',
    'Import a backup file: the check shows what is added and what is replaced; «Zusammenführen» is the suggested button.': 'Importiere eine Backup-Datei: Die Prüfung zeigt, was dazukommt und was ersetzt wird; «Zusammenführen» ist der vorgeschlagene Knopf.',
    'After the import tap «Import rückgängig»: the data is as before.': 'Tippe nach dem Import «Import rückgängig»: Die Daten sind wie vorher.',
  },
};

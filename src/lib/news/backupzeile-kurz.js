// «Backup-Ordner wartet auf dein OK» kürzer (Noah 05.11.2026, Jetzt dran «2a»): one short line, the tip behind «More»
export default {
  title: 'A shorter backup folder line',
  lead: 'On Today the backup folder line is one short sentence. The tip waits behind «More».',
  points: [{ text: '«The backup folder waits for your OK» with «Allow backup», the Chrome tip behind «More»', go: null }],
  small: [{ box: 'nicer', text: 'Rows of «Up now» can keep a longer explanation behind «More»', go: null }],
  test: [
    'On Today, when the browser asks again for the backup folder, the row «Der Backup-Ordner … wartet auf dein OK.» has «Backup erlauben» and «Mehr».',
    'Tap «Mehr»: the tip about «Bei jedem Besuch erlauben» opens under the line; tap again to close it.',
  ],
  since: [],
  de: {
    'A shorter backup folder line': 'Eine kürzere Backup-Ordner-Zeile',
    'On Today the backup folder line is one short sentence. The tip waits behind «More».': 'Auf Heute ist die Backup-Ordner-Zeile ein kurzer Satz. Der Tipp wartet hinter «Mehr».',
    '«The backup folder waits for your OK» with «Allow backup», the Chrome tip behind «More»': '«Der Backup-Ordner wartet auf dein OK» mit «Backup erlauben», der Chrome-Tipp hinter «Mehr»',
    'Rows of «Up now» can keep a longer explanation behind «More»': 'Zeilen von «Jetzt dran» können eine längere Erklärung hinter «Mehr» behalten',
    'On Today, when the browser asks again for the backup folder, the row «Der Backup-Ordner … wartet auf dein OK.» has «Backup erlauben» and «Mehr».': 'Wenn der Browser auf Heute wieder nach dem Backup-Ordner fragt, hat die Zeile «Der Backup-Ordner … wartet auf dein OK.» die Knöpfe «Backup erlauben» und «Mehr».',
    'Tap «Mehr»: the tip about «Bei jedem Besuch erlauben» opens under the line; tap again to close it.': 'Tippe auf «Mehr»: Der Tipp zu «Bei jedem Besuch erlauben» öffnet sich unter der Zeile; tippe nochmals, um ihn zu schliessen.',
  },
};

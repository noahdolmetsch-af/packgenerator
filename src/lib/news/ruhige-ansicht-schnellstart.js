// «Ruhige Ansicht» Schritt 7 (Noah 02.11.2026 «bauen alles»): quick starts, one tap
export default {
  title: 'Quick starts for the calm view',
  lead: 'Tap «Clean the bike», «Pack calmly» or «Analysis» and the calm view starts, without typing.',
  points: [{ text: 'Under «Calm view» stand ready-made starts; you can rename, add and delete them', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  small: [{ box: 'new', text: 'The starts use the time you chose below', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  test: [
    'Open Me › Calm and personal › Less app for the moment › Calm view and tap «Pack calmly».',
    'The strip shows «You are doing: Pack calmly». Tap «Change the quick starts» to add your own.',
  ],
  since: [],
  de: {
    'Quick starts for the calm view': 'Schnellstarts für die Ruhige Ansicht',
    'Tap «Clean the bike», «Pack calmly» or «Analysis» and the calm view starts, without typing.': 'Tippe «Velo putzen», «In Ruhe packen» oder «Analyse», und die Ruhige Ansicht startet, ohne Tippen.',
    'Under «Calm view» stand ready-made starts; you can rename, add and delete them': 'Unter «Ruhige Ansicht» stehen fertige Starts; du kannst sie umbenennen, ergänzen und löschen',
    'The starts use the time you chose below': 'Die Starts nehmen die Zeit, die du darunter gewählt hast',
    'Open Me › Calm and personal › Less app for the moment › Calm view and tap «Pack calmly».': 'Öffne Ich › Ruhig und persönlich › Weniger App für den Moment › Ruhige Ansicht und tippe «In Ruhe packen».',
    'The strip shows «You are doing: Pack calmly». Tap «Change the quick starts» to add your own.': 'Die Leiste zeigt «Du machst gerade: In Ruhe packen». Tippe «Schnellstarts ändern», um eigene zu ergänzen.',
  },
};

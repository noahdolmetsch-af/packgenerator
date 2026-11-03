// «Ruhige Ansicht» Schritt 4 (Noah 02.11.2026 «bauen alles»): a little history of the calm views
export default {
  title: 'What you did calmly this week',
  lead: 'When you tap «Done», the app keeps one line and shows your week: «3× clean the bike, 2 h».',
  points: [{ text: 'Under the calm view, «This week» sums up what you did and for how long', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  small: [{ box: 'new', text: 'The history can be cleared at any time', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  test: [
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «clean the bike», tap «Calm view», then «Done».',
    '«This week» shows «1× clean the bike» with the minutes. «Clear the history» empties it.',
  ],
  since: [],
  de: {
    'What you did calmly this week': 'Was du diese Woche in Ruhe getan hast',
    'When you tap «Done», the app keeps one line and shows your week: «3× clean the bike, 2 h».': 'Wenn du «Fertig» tippst, merkt sich die App eine Zeile und zeigt deine Woche: «3× Velo putzen, 2 Std.».',
    'Under the calm view, «This week» sums up what you did and for how long': 'Unter der Ruhigen Ansicht fasst «Diese Woche» zusammen, was du wie lange getan hast',
    'The history can be cleared at any time': 'Den Verlauf kannst du jederzeit leeren',
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «clean the bike», tap «Calm view», then «Done».': 'Öffne Ich › Ruhig und persönlich › Weniger App für den Moment › Ruhige Ansicht, schreib «Velo putzen», tippe «Ruhige Ansicht», dann «Fertig».',
    '«This week» shows «1× clean the bike» with the minutes. «Clear the history» empties it.': '«Diese Woche» zeigt «1× Velo putzen» mit den Minuten. «Verlauf leeren» leert ihn.',
  },
};

// «Geschafft» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T1): the page after a tick
export default {
  title: 'After a tick: the page «Geschafft»',
  lead: 'One calm page shows what you did and what the week looks like, instead of two links in a message that disappears.',
  points: [
    { text: 'After ticking, the message says «Was du geschafft hast» and opens the page «Geschafft»', go: { href: '#/flow/geschafft', where: 'Shows after you tick something on Active: tap «Was du geschafft hast» in the message.' } },
    { text: 'The page counts: the time this week, hours and days, the weekly goals still open; with Strava also the last time next to it', go: { href: '#/flow/geschafft', where: 'Shows after you tick something on Active: tap «Was du geschafft hast» in the message.' } },
  ],
  small: [{ box: 'new', text: '«Undo» on the page takes the tick back; «All numbers of this training» leads to the sport as before', go: { href: '#/flow/geschafft', where: 'Shows after you tick something on Active: tap «Was du geschafft hast» in the message.' } }],
  test: ['On Active tick an activity and tap «Was du geschafft hast» in the message.', 'Read «Das … Mal diese Woche», «Diese Woche» and «Wochenziele», then tap «Zurück zu Aktiv».'],
  since: ['f.geschafft'],
  de: {
    'Shows after you tick something on Active: tap «Was du geschafft hast» in the message.': 'Erscheint, nachdem du auf Aktiv etwas abgehakt hast: tippe in der Meldung auf «Was du geschafft hast».',
    'After a tick: the page «Geschafft»': 'Nach dem Abhaken: die Seite «Geschafft»',
    'One calm page shows what you did and what the week looks like, instead of two links in a message that disappears.': 'Eine ruhige Seite zeigt, was du gemacht hast und wie die Woche aussieht, statt zweier Links in einer Meldung, die verschwindet.',
    'After ticking, the message says «Was du geschafft hast» and opens the page «Geschafft»': 'Nach dem Abhaken sagt die Meldung «Was du geschafft hast» und öffnet die Seite «Geschafft»',
    'The page counts: the time this week, hours and days, the weekly goals still open; with Strava also the last time next to it': 'Die Seite zählt: das Mal diese Woche, Stunden und Tage, die offenen Wochenziele; mit Strava auch das letzte Mal daneben',
    '«Undo» on the page takes the tick back; «All numbers of this training» leads to the sport as before': '«Rückgängig» auf der Seite nimmt das Abhaken zurück; «Alle Zahlen zu diesem Training» führt wie bisher zur Sportart',
    'On Active tick an activity and tap «Was du geschafft hast» in the message.': 'Hak auf Aktiv eine Aktivität ab und tippe in der Meldung auf «Was du geschafft hast».',
    'Read «Das … Mal diese Woche», «Diese Woche» and «Wochenziele», then tap «Zurück zu Aktiv».': 'Lies «Das … Mal diese Woche», «Diese Woche» und «Wochenziele» und tippe dann auf «Zurück zu Aktiv».',
  },
};

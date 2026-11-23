// «Dein Körper heute» als Band, Schritt 2 (Noah 23.11.2026 «1-4a», Thread «Körper-Banner auf Heute bauen»): Schritte, Draussen und die Stufe von heute
export default {
  title: 'Steps, outdoors and today\'s level in the body band',
  lead: 'The band on Heute shows three more fields: steps against yesterday, the outdoors minutes and today\'s level.',
  points: [
    { text: 'Steps stand next to yesterday up to the same hour', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'While your outdoors challenge runs, today\'s minutes stand with a bar', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'The level of today from Form and recovery stands in the band (rest, easy, normal or ready)', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
  ],
  small: [{ box: 'new', text: 'The sleep score and the steps also have a ring in the «Details» window', go: null }],
  test: ['Open Heute and look at «Your body today».', 'Under the steps it says «yesterday by now …».', 'Tap the level: Form and recovery opens.'],
  since: [],
  de: {
    'Steps, outdoors and today\'s level in the body band': 'Schritte, Draussen und die Stufe von heute im Körper-Band',
    'The band on Heute shows three more fields: steps against yesterday, the outdoors minutes and today\'s level.': 'Das Band auf Heute zeigt drei Felder mehr: Schritte gegen gestern, die Minuten draussen und die Stufe von heute.',
    'Steps stand next to yesterday up to the same hour': 'Die Schritte stehen neben gestern bis zur selben Stunde',
    'While your outdoors challenge runs, today\'s minutes stand with a bar': 'Solange deine Challenge «Draussen» läuft, stehen die Minuten von heute mit einem Balken da',
    'The level of today from Form and recovery stands in the band (rest, easy, normal or ready)': 'Die Stufe von heute aus Form und Erholung steht im Band (Ruhe, locker, normal oder bereit)',
    'The sleep score and the steps also have a ring in the «Details» window': 'Schlafwert und Schritte haben auch einen Ring im Fenster «Details»',
    'Tap the level: Form and recovery opens.': 'Tippe die Stufe: Form und Erholung öffnet sich.',
    'Under the steps it says «yesterday by now …».': 'Unter den Schritten steht «gestern bis jetzt …».',
  },
};

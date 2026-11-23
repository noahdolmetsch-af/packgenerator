// «Dein Körper heute» als Band, Schritt 4 (Noah 23.11.2026 «1-4a», Thread «Körper-Banner auf Heute bauen»): das Band steht unter dem Gruss
export default {
  title: 'The body band stands right under the greeting',
  lead: '«Your body today» is the first thing under the greeting on Heute now.',
  points: [
    { text: 'Resting pulse, zone minutes, sleep, HRV, steps, outdoors and today\'s level are in view without opening «More»', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'Move it, make it smaller or take it off like any tile: «Customise the start page»', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
  ],
  small: [{ box: 'new', text: 'Aktiv and the other body values stay where they were, under «More»', go: null }],
  test: ['Open Heute: under the greeting stands «Your body today».', 'Tap «More»: Aktiv and the other body tiles are still there.'],
  since: [],
  de: {
    'The body band stands right under the greeting': 'Das Körper-Band steht direkt unter dem Gruss',
    '«Your body today» is the first thing under the greeting on Heute now.': '«Dein Körper heute» ist auf Heute jetzt das Erste unter dem Gruss.',
    'Resting pulse, zone minutes, sleep, HRV, steps, outdoors and today\'s level are in view without opening «More»': 'Ruhepuls, Zonenminuten, Schlaf, HRV, Schritte, Draussen und die Stufe von heute sind sichtbar, ohne «Mehr» zu öffnen',
    'Move it, make it smaller or take it off like any tile: «Customise the start page»': 'Verschiebe es, mach es kleiner oder nimm es weg wie jede Kachel: «Startseite anpassen»',
    'Aktiv and the other body values stay where they were, under «More»': 'Aktiv und die anderen Körperwerte bleiben, wo sie waren, unter «Mehr»',
    'Open Heute: under the greeting stands «Your body today».': 'Öffne Heute: Unter dem Gruss steht «Dein Körper heute».',
    'Tap «More»: Aktiv and the other body tiles are still there.': 'Tippe «Mehr»: Aktiv und die anderen Körper-Kacheln sind noch da.',
  },
};

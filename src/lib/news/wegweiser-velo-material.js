// «Wegweiser statt Katalog» PR 3 (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»): tools of the Toolbox at the bike and the gear
export default {
  title: 'Bike tools at the bike',
  lead: 'Gear ratios and spirit level wait at the setup log, bar code and units at your gear.',
  points: [
    {
      text: 'Bikes › Setup: «Fits here» with gear ratios and spirit level under the setup log',
      go: { href: '#/bikes?tab=rig', steps: [{ sel: '[data-passt-hier="rig"]' }], where: 'Shows under «Setup log» on the tab Setup of a bike.' },
    },
    {
      text: 'Gear: «Bar code → gear» and «Convert units» in the row of views and tools',
      go: { href: '#/gear', steps: [{ sel: '[data-gear-quick-item="barcode"]' }], where: 'Shows in the row above your gear list.' },
    },
  ],
  small: [{ box: 'new', text: 'Gear ratios and spirit level each have a line «Good to know»', go: 'f.gears' }],
  test: [
    'Open Bikes › Setup: under «Setup log» is «Fits here» with gear ratios and spirit level.',
    'Open Gear: the row above the list has «Bar code → gear» and «Convert units».',
    'Tap «Gear ratios»: the page opens with «Good to know» at the top.',
  ],
  since: [],
  de: {
    'Bike tools at the bike': 'Velo-Werkzeuge direkt beim Velo',
    'Gear ratios and spirit level wait at the setup log, bar code and units at your gear.': 'Übersetzungs-Rechner und Wasserwaage warten beim Setup-Logbuch, Strichcode und Einheiten beim Material.',
    'Bikes › Setup: «Fits here» with gear ratios and spirit level under the setup log': 'Velos › Setup: «Passt hier» mit Übersetzungs-Rechner und Wasserwaage unter dem Setup-Logbuch',
    'Shows under «Setup log» on the tab Setup of a bike.': 'Erscheint unter «Setup-Logbuch» im Reiter Setup eines Velos.',
    'Gear: «Bar code → gear» and «Convert units» in the row of views and tools': 'Material: «Strichcode → Material» und «Masse umrechnen» in der Zeile der Ansichten und Werkzeuge',
    'Shows in the row above your gear list.': 'Erscheint in der Zeile über deiner Materialliste.',
    'Gear ratios and spirit level each have a line «Good to know»': 'Übersetzungs-Rechner und Wasserwaage haben je eine Zeile «Gut zu wissen»',
    'Open Bikes › Setup: under «Setup log» is «Fits here» with gear ratios and spirit level.': 'Öffne Velos › Setup: unter «Setup-Logbuch» steht «Passt hier» mit Übersetzungs-Rechner und Wasserwaage.',
    'Open Gear: the row above the list has «Bar code → gear» and «Convert units».': 'Öffne Material: die Zeile über der Liste hat «Strichcode → Material» und «Masse umrechnen».',
    'Tap «Gear ratios»: the page opens with «Good to know» at the top.': 'Tippe auf «Übersetzungs-Rechner»: die Seite öffnet sich mit «Gut zu wissen» oben.',
  },
};

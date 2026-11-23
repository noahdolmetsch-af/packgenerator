// «Neue Ordnung» Schritt V5 (Noah 21.11.2026 «1a»): Velos, Material and Ausrüstung are one place with four tabs
export default {
  title: 'Bikes and gear in one place',
  lead: 'Bikes, gear and equipment are one place now, with four tabs: Bikes, Care, Gear and Sets.',
  points: [
    { text: '«Bikes and gear» has four tabs; the old pages (Workshop, My setup, Clothes, Shopping, Supplies, Lent out, Building blocks) are chips under them', go: { href: '#/bikes', steps: [{ sel: '[data-place="bikes"]' }], where: 'Bikes and gear in the bar below or in the sidebar.' } },
    { text: 'The switch Bikes | Equipment | Gear on a phone is gone: Equipment is the chip «Sets» under the tab «Sets»', go: { href: '#/equipment', steps: [{ sel: 'nav.psubs' }], where: 'Bikes and gear › Sets.' } },
  ],
  small: [{ box: 'new', text: '«g m» still opens Gear' }],
  test: [
    'Open «Bikes and gear»: there are four tabs, Bikes, Care, Gear, Sets.',
    'Tap «Gear»: under the tabs are the chips All, Clothes, Shopping, Supplies and Lent out.',
    'Tap «Sets»: the chips Building blocks and Sets are there.',
  ],
  since: [],
  de: {
    'Bikes and gear in one place': 'Velos und Material an einem Ort',
    'Bikes, gear and equipment are one place now, with four tabs: Bikes, Care, Gear and Sets.': 'Velos, Material und Ausrüstung sind jetzt ein Bereich mit vier Reitern: Velos, Pflege, Material und Sets.',
    '«Bikes and gear» has four tabs; the old pages (Workshop, My setup, Clothes, Shopping, Supplies, Lent out, Building blocks) are chips under them': '«Velos und Material» hat vier Reiter; die alten Seiten (Werkstatt, Mein Setup, Kleider, Einkauf, Vorrat, Ausgeliehen, Bausteine) sind Chips darunter',
    'Bikes and gear in the bar below or in the sidebar.': 'Velos und Material in der Leiste unten oder in der Seitenleiste.',
    'The switch Bikes | Equipment | Gear on a phone is gone: Equipment is the chip «Sets» under the tab «Sets»': 'Der Schalter Velos | Ausrüstung | Material am Handy fällt weg: Ausrüstung ist der Chip «Sets» unter dem Reiter «Sets»',
    'Bikes and gear › Sets.': 'Velos und Material › Sets.',
    '«g m» still opens Gear': '«g m» öffnet weiter Material',
    'Open «Bikes and gear»: there are four tabs, Bikes, Care, Gear, Sets.': 'Öffne «Velos und Material»: Es gibt vier Reiter, Velos, Pflege, Material, Sets.',
    'Tap «Gear»: under the tabs are the chips All, Clothes, Shopping, Supplies and Lent out.': 'Tippe «Material»: Unter den Reitern stehen die Chips Alle, Kleider, Einkauf, Vorrat und Ausgeliehen.',
    'Tap «Sets»: the chips Building blocks and Sets are there.': 'Tippe «Sets»: Dort stehen die Chips Bausteine und Sets.',
  },
};

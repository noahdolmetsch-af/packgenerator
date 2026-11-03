// «Welches Velo passt zur Tour?» (Idee C3 «App denkt mit», Noah 02.11.2026 «3b»)
export default {
  title: 'Which bike fits the trip',
  lead: 'The bike comparison names the bike that fits your trip best, and why.',
  points: [{ text: 'Packen › bike comparison: a line «Fits this trip best» on top', href: '#/pack', go: { href: '#/pack', where: 'Shows in Packen › Compare bikes, when one bike is clearly ahead.' } }],
  small: [{ box: 'new', go: { href: '#/pack', where: 'Shows in Packen › Compare bikes, when one bike is clearly ahead.' }, text: 'The best bike has a tag «fits best»; the line only appears when one bike is clearly ahead' }],
  test: [
    'Open a trip in Packen and tap the bike comparison.',
    'Read the line on top: which bike fits best and why.',
    'Switch the bike with «Use this» or close the window.',
  ],
  de: {
    'Shows in Packen › Compare bikes, when one bike is clearly ahead.': 'Zeigt sich in Packen › Velos vergleichen, wenn ein Velo klar vorn liegt.',
    'Which bike fits the trip': 'Welches Velo passt zur Tour',
    'The bike comparison names the bike that fits your trip best, and why.': 'Der Velo-Vergleich nennt das Velo, das am besten zu deiner Tour passt, und warum.',
    'Packen › bike comparison: a line «Fits this trip best» on top': 'Packen › Velo-Vergleich: oben eine Zeile «Passt am besten zur Tour»',
    'The best bike has a tag «fits best»; the line only appears when one bike is clearly ahead': 'Das beste Velo hat ein Zeichen «passt am besten»; die Zeile erscheint nur, wenn ein Velo klar vorn liegt',
    'Open a trip in Packen and tap the bike comparison.': 'Öffne eine Tour in Packen und tipp auf den Velo-Vergleich.',
    'Read the line on top: which bike fits best and why.': 'Lies die Zeile oben: welches Velo am besten passt und warum.',
    'Switch the bike with «Use this» or close the window.': 'Wechsle das Velo mit «Dieses nehmen» oder schliesse das Fenster.',
  },
};

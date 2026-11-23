// «Dein Körper heute» als Banner, Schritt 1 (Noah 23.11.2026 «1-4a», Thread «Körper-Banner auf Heute bauen»): Ruhepuls mit Abrufzeit, Zonenminuten, Schlaf und HRV gegen üblich
export default {
  title: 'Your body today in one band',
  lead: 'Resting pulse, active zone minutes, sleep and HRV stand side by side, each with its comparison.',
  points: [
    { text: 'The resting pulse says when Fitbit delivered it («fetched 07:12»), and «Fetch now» sits under the values', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'Sleep and HRV stand next to your usual value; a small arrow shows when one is far from it', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
  ],
  small: [{ box: 'new', text: 'On a computer a tap on a value opens its history', go: null }],
  test: ['Open Heute and look at «Your body today».', 'Under the resting pulse it says «fetched» with the time; under the sleep «usual» with your usual night.', 'Tap «Fetch now»: the line below the values shows the new time.'],
  since: [],
  de: {
    'Your body today in one band': 'Dein Körper heute in einem Band',
    'Resting pulse, active zone minutes, sleep and HRV stand side by side, each with its comparison.': 'Ruhepuls, Aktivzonenminuten, Schlaf und HRV stehen nebeneinander, jedes mit seinem Vergleich.',
    'The resting pulse says when Fitbit delivered it («fetched 07:12»), and «Fetch now» sits under the values': 'Der Ruhepuls sagt, wann Fitbit ihn geliefert hat («geholt 07:12»), und «Jetzt holen» steht unter den Werten',
    'Sleep and HRV stand next to your usual value; a small arrow shows when one is far from it': 'Schlaf und HRV stehen neben deinem üblichen Wert; ein kleiner Pfeil zeigt, wenn einer weit davon liegt',
    'On a computer a tap on a value opens its history': 'Am Computer öffnet ein Tipp auf einen Wert seinen Verlauf',
    'Open Heute and look at «Your body today».': 'Öffne Heute und schau auf «Dein Körper heute».',
    'Under the resting pulse it says «fetched» with the time; under the sleep «usual» with your usual night.': 'Unter dem Ruhepuls steht «geholt» mit der Uhrzeit, unter dem Schlaf «üblich» mit deiner üblichen Nacht.',
    'Tap «Fetch now»: the line below the values shows the new time.': 'Tippe «Jetzt holen»: die Zeile unter den Werten zeigt die neue Zeit.',
  },
};

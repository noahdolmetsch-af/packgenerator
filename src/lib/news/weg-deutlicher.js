// «Wege besser sichtbar» (Noah 07.11.2026 «1a»): a number or a line that leads somewhere looks like a link
export default {
  title: 'Tappable numbers are easier to see',
  lead: 'A number that leads somewhere is now green and underlined, with a clear arrow.',
  points: [{ text: 'Open a value in Analyse: «Source: Fitbit ›» is green and underlined, with a dark arrow', go: { href: '#/auswerten/analyse/rhr', steps: [{ sel: '[data-source]' }], where: 'Analyse › any value, right under the title.' } }],
  small: [],
  test: ['Open Analyse › Resting pulse: the source line under the title is green and underlined, the arrow is dark and bigger.', 'Open Velos: the kilometres on a bike card look the same and still open the bike page.'],
  since: [],
  de: {
    'Tappable numbers are easier to see': 'Antippbare Zahlen sind leichter zu sehen',
    'A number that leads somewhere is now green and underlined, with a clear arrow.': 'Eine Zahl, die weiterführt, ist jetzt grün und unterstrichen, mit deutlichem Pfeil.',
    'Open a value in Analyse: «Source: Fitbit ›» is green and underlined, with a dark arrow': 'Öffne einen Wert in der Analyse: «Quelle: Fitbit ›» ist grün und unterstrichen, mit dunklem Pfeil',
    'Analyse › any value, right under the title.': 'Analyse › ein beliebiger Wert, direkt unter dem Titel.',
    'Open Analyse › Resting pulse: the source line under the title is green and underlined, the arrow is dark and bigger.': 'Öffne Analyse › Ruhepuls: die Quelle-Zeile unter dem Titel ist grün und unterstrichen, der Pfeil dunkel und grösser.',
    'Open Velos: the kilometres on a bike card look the same and still open the bike page.': 'Öffne Velos: die Kilometer auf einer Velo-Karte sehen gleich aus und öffnen weiter die Velo-Seite.',
  },
};

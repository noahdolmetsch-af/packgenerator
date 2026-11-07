// «Ausgemusterte Velos» (Noah 05.11.2026): a retired bike no longer shows up on Today
export default {
  title: 'Retired bikes stay away',
  lead: 'A bike you retired no longer appears on Today: no ride idea, no care rows, no weighing.',
  points: [{ text: 'The ride idea in «Up now» only names bikes you still ride', go: null }],
  small: [
    { box: 'fixed', text: 'Today, the number on Bikes, the agenda and the Quick Links hint skip retired bikes', go: null },
    { box: 'new', text: 'Their trips, km and services stay and still count in your reviews', go: null },
  ],
  test: [
    'Open Bikes, retire a bike with «…» › «Retire bike».',
    'Open Today: the ride idea and the care rows name only the bikes that are left.',
  ],
  since: [],
  de: {
    'Retired bikes stay away': 'Ausgemusterte Velos bleiben weg',
    'A bike you retired no longer appears on Today: no ride idea, no care rows, no weighing.': 'Ein ausgemustertes Velo taucht auf Heute nicht mehr auf: keine Fahr-Idee, keine Pflege-Zeilen, kein Wägen.',
    'The ride idea in «Up now» only names bikes you still ride': 'Die Fahr-Idee in «Jetzt dran» nennt nur Velos, die du noch fährst',
    'Today, the number on Bikes, the agenda and the Quick Links hint skip retired bikes': 'Heute, die Zahl bei Velos, der Kalender und der Hinweis bei Quick Links lassen ausgemusterte Velos aus',
    'Their trips, km and services stay and still count in your reviews': 'Ihre Touren, km und Services bleiben und zählen weiter in deinen Auswertungen',
    'Open Bikes, retire a bike with «…» › «Retire bike».': 'Öffne Velos und mustere ein Velo mit «…» › «Velo ausmustern» aus.',
    'Open Today: the ride idea and the care rows name only the bikes that are left.': 'Öffne Heute: Fahr-Idee und Pflege-Zeilen nennen nur noch die übrigen Velos.',
  },
};

// «Muster entdeckt» (Noah 03.11.2026, Idee 5 der Cockpit-Ideen): the value «Late sessions» for the links of Analyse
export default {
  title: 'Late sessions in your patterns',
  lead: 'The app now counts sessions that end at 19:00 or later, so you can ask: do I sleep shorter after them?',
  points: [
    { text: 'New value «Late sessions» in Analyse › All values › Sports and bike', go: { href: '#/auswerten/analyse/late', steps: [{ sel: '[data-detail="late"]' }], where: 'Auswerten › Analyse › All values › Sports and bike › Late sessions.' } },
    { text: '«What goes together?» can put it next to sleep, resting pulse or HRV, also for the night after', go: 'f.analyse' },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse › All values › Sports and bike › «Late sessions».',
    'Open «What goes together?», choose «Late sessions» horizontally and «Sleep» vertically with «the day after (night after)».',
  ],
  since: [],
  de: {
    'Late sessions in your patterns': 'Späte Einheiten in deinen Mustern',
    'The app now counts sessions that end at 19:00 or later, so you can ask: do I sleep shorter after them?': 'Die App zählt jetzt Einheiten, die um 19:00 Uhr oder später enden. So kannst du fragen: schlafe ich danach kürzer?',
    'New value «Late sessions» in Analyse › All values › Sports and bike': 'Neuer Wert «Späte Einheiten» in Analyse › Alle Werte › Sport und Velo',
    'Auswerten › Analyse › All values › Sports and bike › Late sessions.': 'Auswerten › Analyse › Alle Werte › Sport und Velo › Späte Einheiten.',
    '«What goes together?» can put it next to sleep, resting pulse or HRV, also for the night after': '«Was hängt zusammen?» kann ihn neben Schlaf, Ruhepuls oder HRV legen, auch für die Nacht danach',
    'Open Auswerten › Analyse › All values › Sports and bike › «Late sessions».': 'Öffne Auswerten › Analyse › Alle Werte › Sport und Velo › «Späte Einheiten».',
    'Open «What goes together?», choose «Late sessions» horizontally and «Sleep» vertically with «the day after (night after)».': 'Öffne «Was hängt zusammen?», wähle waagrecht «Späte Einheiten» und senkrecht «Schlaf» mit «Tag danach (Nacht danach)».',
  },
};

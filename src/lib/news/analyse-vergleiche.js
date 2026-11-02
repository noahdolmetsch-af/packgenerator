// «Analyse» M3 «Vergleichen» (Noah 27.10.2026 «alle Mockups 1:1», idea «Woche vor gegen Woche nach einer Tour»)
export default {
  title: 'Compare in Analyse',
  lead: 'This month against the last one, one activity against another, and the days before a trip against the days after.',
  points: [
    { text: 'Period against period: week, month or year, one line each, with a sentence where you stand today', go: 'f.analyse' },
    { text: 'Activity against activity: how often per week over 12 weeks, up to 4 activities', go: 'f.analyse' },
    { text: 'Before and after a trip: sleep, pulse, energy and more, 7 days before against 7 days after', go: 'f.analyse' },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse and scroll to «Zeitraum gegen Zeitraum»; tap «Schlaf», then «Woche».',
    'In «Aktivität gegen Aktivität» add one more activity with «+ Aktivität», then remove it with ×.',
    'In «Vor und nach einer Tour» choose a trip: the table shows before, after and the change.',
  ],
  since: [],
  de: {
    'Compare in Analyse': 'Vergleichen in Analyse',
    'This month against the last one, one activity against another, and the days before a trip against the days after.':
      'Dieser Monat gegen den letzten, eine Aktivität gegen eine andere, und die Tage vor einer Tour gegen die Tage danach.',
    'Period against period: week, month or year, one line each, with a sentence where you stand today':
      'Zeitraum gegen Zeitraum: Woche, Monat oder Jahr, je eine Linie, mit einem Satz, wo du heute stehst',
    'Activity against activity: how often per week over 12 weeks, up to 4 activities': 'Aktivität gegen Aktivität: wie oft pro Woche über 12 Wochen, bis 4 Aktivitäten',
    'Before and after a trip: sleep, pulse, energy and more, 7 days before against 7 days after':
      'Vor und nach einer Tour: Schlaf, Puls, Energie und mehr, 7 Tage davor gegen 7 Tage danach',
    'Open Auswerten › Analyse and scroll to «Zeitraum gegen Zeitraum»; tap «Schlaf», then «Woche».':
      'Öffne Auswerten › Analyse und scrolle zu «Zeitraum gegen Zeitraum»; tippe «Schlaf», dann «Woche».',
    'In «Aktivität gegen Aktivität» add one more activity with «+ Aktivität», then remove it with ×.':
      'Nimm bei «Aktivität gegen Aktivität» mit «+ Aktivität» eine dazu und entferne sie mit × wieder.',
    'In «Vor und nach einer Tour» choose a trip: the table shows before, after and the change.':
      'Wähle bei «Vor und nach einer Tour» eine Tour: Die Tabelle zeigt davor, danach und die Änderung.',
  },
};

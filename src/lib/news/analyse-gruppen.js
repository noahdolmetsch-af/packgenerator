// «Gruppen mit Vorschau» (Noah 08.11.2026 «3a», UI-Test der Analyse-Seite): a closed group says what is inside
export default {
  title: 'All values: groups with a preview',
  lead: 'In «All values» a closed group now shows up to three of its values with their latest state, so you see what is inside before you open it.',
  points: [
    { text: 'A closed group in «All values» shows up to three values with their state, for example «Resting pulse 53 bpm»', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-group-preview]' }], where: 'Auswerten › Analyse › All values, under the name of each group.' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse › All values: under each closed group a line names its values with their numbers.',
    'Open a group: the line goes away and the tiles show.',
  ],
  since: [],
  de: {
    'All values: groups with a preview': 'Alle Werte: Gruppen mit Vorschau',
    'In «All values» a closed group now shows up to three of its values with their latest state, so you see what is inside before you open it.': 'In «Alle Werte» zeigt eine geschlossene Gruppe jetzt bis zu drei ihrer Werte mit dem letzten Stand, so siehst du, was drin ist, bevor du sie öffnest.',
    'A closed group in «All values» shows up to three values with their state, for example «Resting pulse 53 bpm»': 'Eine geschlossene Gruppe in «Alle Werte» zeigt bis zu drei Werte mit ihrem Stand, zum Beispiel «Ruhepuls 53 bpm»',
    'Auswerten › Analyse › All values, under the name of each group.': 'Auswerten › Analyse › Alle Werte, unter dem Namen jeder Gruppe.',
    'Open Auswerten › Analyse › All values: under each closed group a line names its values with their numbers.': 'Öffne Auswerten › Analyse › Alle Werte: Unter jeder geschlossenen Gruppe nennt eine Zeile ihre Werte mit den Zahlen.',
    'Open a group: the line goes away and the tiles show.': 'Öffne eine Gruppe: Die Zeile verschwindet und die Kacheln erscheinen.',
  },
};

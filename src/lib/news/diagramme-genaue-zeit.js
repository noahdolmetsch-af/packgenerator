// «Genaue Werte» (Noah 21.11.2026 «1a 2b 3a»): time in the tapped charts of the hours pages is exact, in hours and minutes
export default {
  title: 'Exact time when you point at a chart',
  lead: 'In the Sports year, the review of a sport and My week, pointing at or tapping a bar shows the time as hours and minutes, not a rounded hour.',
  points: [
    { text: 'Point at a bar: «34 h 24 min» instead of «34»', href: '#/auswerten/sportjahr', go: { href: '#/auswerten/sportjahr', where: 'Auswerten › Sports year › year › point at a month.' } },
    { text: 'The table and the window of a tapped bar show the same exact time', href: '#/auswerten/sportjahr', go: { href: '#/auswerten/sportjahr', where: 'Auswerten › Sports year › tap a bar or «As table».' } },
  ],
  test: [
    'Open the Sports year, choose «Year» and point at a month: the hours show as hours and minutes, for example «34 h 24 min».',
    'Tap the month: the window lists the sports with their exact time.',
    'Tap «As table»: the hours column shows hours and minutes too.',
  ],
  since: [],
  de: {
    'Exact time when you point at a chart': 'Genaue Zeit beim Zeigen auf ein Diagramm',
    'In the Sports year, the review of a sport and My week, pointing at or tapping a bar shows the time as hours and minutes, not a rounded hour.': 'Im Sportjahr, im Rückblick pro Sportart und in Meine Woche zeigt Zeigen oder Tippen auf einen Balken die Zeit in Stunden und Minuten, nicht auf eine Stunde gerundet.',
    'Point at a bar: «34 h 24 min» instead of «34»': 'Zeig auf einen Balken: «34 h 24 min» statt «34»',
    'The table and the window of a tapped bar show the same exact time': 'Tabelle und Fenster eines angetippten Balkens zeigen dieselbe genaue Zeit',
    'Auswerten › Sports year › year › point at a month.': 'Auswerten › Sportjahr › Jahr › auf einen Monat zeigen.',
    'Auswerten › Sports year › tap a bar or «As table».': 'Auswerten › Sportjahr › einen Balken antippen oder «Als Tabelle».',
    'Open the Sports year, choose «Year» and point at a month: the hours show as hours and minutes, for example «34 h 24 min».': 'Öffne das Sportjahr, wähle «Jahr» und zeig auf einen Monat: die Stunden stehen als Stunden und Minuten da, zum Beispiel «34 h 24 min».',
    'Tap the month: the window lists the sports with their exact time.': 'Tippe den Monat an: das Fenster nennt die Sportarten mit ihrer genauen Zeit.',
    'Tap «As table»: the hours column shows hours and minutes too.': 'Tippe «Als Tabelle»: die Spalte mit den Stunden zeigt auch Stunden und Minuten.',
  },
};

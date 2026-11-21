// Testfix (Koordinator 08.11.2026, «1a» Pauschal): two lines of «Was ist neu» pointed at tiles that an empty test page does not show
export default {
  title: 'An update line gets a place text',
  lead: 'An older line about Analysis now says where to look when there is no data yet.',
  points: [{ text: 'The line about the overview tiles in Analysis names its place even before there is data', go: null }],
  small: [],
  test: [
    'Open Ich › Was ist neu and find «Analysis: clearer periods»: tap its second line, the place is named.',
    'Without data in Analysis the line still leads to Analysis › Overview.',
  ],
  since: [],
  de: {
    'An update line gets a place text': 'Eine Neuigkeiten-Zeile nennt ihren Ort',
    'An older line about Analysis now says where to look when there is no data yet.': 'Eine ältere Zeile zu Auswerten sagt jetzt, wo man hinschaut, solange es noch keine Daten gibt.',
    'The line about the overview tiles in Analysis names its place even before there is data': 'Die Zeile zu den Kacheln der Übersicht in Auswerten nennt ihren Ort auch dann, wenn es noch keine Daten gibt',
    'Open Ich › Was ist neu and find «Analysis: clearer periods»: tap its second line, the place is named.': 'Öffne Ich › Was ist neu und such «Auswerten: Zeiträume klarer»: Tipp auf die zweite Zeile, der Ort wird genannt.',
    'Without data in Analysis the line still leads to Analysis › Overview.': 'Auch ohne Daten in Auswerten führt die Zeile zu Auswerten › Übersicht.',
  },
};

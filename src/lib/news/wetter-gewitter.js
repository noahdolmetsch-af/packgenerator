// «Wetter neu» PR 3 (Noah 04.11.2026 «5 alle»): thunderstorm hint with a time span
export default {
  title: 'Thunderstorms with a time',
  lead: 'The weather page now says when thunderstorms are possible, e.g. «today, 15:00 to 18:00».',
  points: [{ text: 'On the weather page, under «Today», see the span of possible thunderstorms with the rain chance', go: 'f.weather' }],
  small: [{ box: 'new', text: 'Today and tomorrow are named, a calm day shows nothing' }],
  test: [
    'Open Weather (Me › Weather). On a day with thunderstorm risk, «Today» shows a line like «Thunderstorms possible today, 15:00 to 18:00.»',
    'On a calm day the line is not there.',
  ],
  since: [],
  de: {
    'Thunderstorms with a time': 'Gewitter mit Uhrzeit',
    'The weather page now says when thunderstorms are possible, e.g. «today, 15:00 to 18:00».': 'Die Wetterseite sagt jetzt, wann Gewitter möglich sind, zum Beispiel «heute, 15:00 bis 18:00».',
    'On the weather page, under «Today», see the span of possible thunderstorms with the rain chance': 'Auf der Wetterseite unter «Heute» siehst du die Zeitspanne möglicher Gewitter mit der Regenchance',
    'Today and tomorrow are named, a calm day shows nothing': 'Heute und morgen werden genannt, ein ruhiger Tag zeigt nichts',
    'Open Weather (Me › Weather). On a day with thunderstorm risk, «Today» shows a line like «Thunderstorms possible today, 15:00 to 18:00.»': 'Öffne Wetter (Ich › Wetter). An einem Tag mit Gewitterrisiko zeigt «Heute» eine Zeile wie «Gewitter möglich heute, 15:00 bis 18:00.»',
    'On a calm day the line is not there.': 'An einem ruhigen Tag fehlt die Zeile.',
  },
};

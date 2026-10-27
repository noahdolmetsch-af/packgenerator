// «Apple-Health-Export einlesen» (Noah 27.10.2026 «4a», thread «Geräte und Datenquellen»): iPhone values as days
export default {
  title: 'Apple Health from the iPhone',
  lead: 'The export of the Health app becomes days of sleep, resting heart rate, HRV, steps, VO2max and weight.',
  points: [{ text: 'Ich › Connections › Apple Health: choose the zip, check, take over, Undo possible', href: '#/me/connections' }],
  small: [{ box: 'new', text: 'The same places as Fitbit show the values; the file stays on your device' }],
  test: [
    'Ich › Verbindungen: the card «Apple Health (iPhone)» is under «Alte Fitbit-Daten» and says in three steps how to export.',
    'Without an iPhone: nothing changes for your Fitbit days.',
  ],
  since: [],
  de: {
    'Apple Health from the iPhone': 'Apple Health vom iPhone',
    'The export of the Health app becomes days of sleep, resting heart rate, HRV, steps, VO2max and weight.':
      'Der Export der Health-App wird zu Tagen mit Schlaf, Ruhepuls, HRV, Schritten, VO2max und Gewicht.',
    'Ich › Connections › Apple Health: choose the zip, check, take over, Undo possible': 'Ich › Verbindungen › Apple Health: Zip wählen, prüfen, übernehmen, Rückgängig möglich',
    'The same places as Fitbit show the values; the file stays on your device': 'Die gleichen Stellen wie bei Fitbit zeigen die Werte; die Datei bleibt auf deinem Gerät',
    'Ich › Verbindungen: the card «Apple Health (iPhone)» is under «Alte Fitbit-Daten» and says in three steps how to export.':
      'Ich › Verbindungen: Die Karte «Apple Health (iPhone)» steht unter «Alte Fitbit-Daten» und sagt in drei Schritten, wie du exportierst.',
    'Without an iPhone: nothing changes for your Fitbit days.': 'Ohne iPhone: An deinen Fitbit-Tagen ändert sich nichts.',
  },
};

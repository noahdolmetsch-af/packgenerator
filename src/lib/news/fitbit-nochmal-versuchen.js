// Fitbit holt keine Daten (Noah 1.11.2026): the fetch ended never; now in small steps, with a time limit
export default {
  title: 'Fitbit fetch no longer hangs',
  lead: 'The Fitbit fetch asks in small steps and stops after 40 seconds with a clear message.',
  points: [{ text: 'If Fitbit takes too long, the card says so and offers «Try again»', href: '#/me/data', go: 'f.fitbit' }],
  small: [{ box: 'new', text: 'What has already arrived is kept, even if a later step fails', go: 'f.fitbit' }],
  test: [
    'Open Me › Data and backup and tap «Fetch now» on the Fitbit card.',
    'The button ends: values appear, or a message with «Try again» shows.',
  ],
  since: [],
  de: {
    'Fitbit fetch no longer hangs': 'Fitbit-Abruf hängt nicht mehr',
    'The Fitbit fetch asks in small steps and stops after 40 seconds with a clear message.': 'Der Fitbit-Abruf fragt in kleinen Schritten und hört nach 40 Sekunden mit einer klaren Meldung auf.',
    'If Fitbit takes too long, the card says so and offers «Try again»': 'Dauert Fitbit zu lange, sagt die Karte es und bietet «Nochmal versuchen» an',
    'What has already arrived is kept, even if a later step fails': 'Was schon angekommen ist, bleibt, auch wenn ein späterer Schritt scheitert',
    'Open Me › Data and backup and tap «Fetch now» on the Fitbit card.': 'Öffne Ich › Daten und Backup und tippe auf der Fitbit-Karte auf «Jetzt holen».',
    'The button ends: values appear, or a message with «Try again» shows.': 'Der Knopf hört auf: Werte erscheinen, oder eine Meldung mit «Nochmal versuchen» kommt.',
  },
};

// «Vier Wege auf der Tourkarte» (UI-Prüfung 07.11.2026 T2, Noah «alle Vorschläge»): Packen, Wetter, Form und Rückblick direkt auf der Tourkarte
export default {
  title: 'Ways on every trip card',
  lead: 'Each planned trip in Trips has small ways now: Pack, Weather, Form. And «4 wait for your review» shows exactly those trips.',
  points: [
    { text: 'The card of a planned trip leads to Pack, to the weather of this trip and to Form (after the trip: to its review)', go: { href: '#/trips', steps: [{ sel: '[data-plan-ways]' }] } },
    { text: 'The number «n wait for your review» under the title is a way: it shows those trips', go: { href: '#/trips', steps: [{ sel: '[data-waiting-go]' }] } },
  ],
  small: [],
  test: [
    'Open Trips: under a planned trip stand the ways Pack, Weather and Form. Tap «Weather»: the weather of this trip opens.',
    'Tap «… wait for your review» under the title: the list below shows only those trips, with «Rate».',
    'Remove the filter «Completed» above the list: all trips are there again.',
  ],
  since: [],
  de: {
    'Ways on every trip card': 'Wege auf jeder Tourkarte',
    'Each planned trip in Trips has small ways now: Pack, Weather, Form. And «4 wait for your review» shows exactly those trips.': 'Jede geplante Tour in Touren hat jetzt kleine Wege: Packen, Wetter, Form. Und «4 warten auf deinen Rückblick» zeigt genau diese Touren.',
    'The card of a planned trip leads to Pack, to the weather of this trip and to Form (after the trip: to its review)': 'Die Karte einer geplanten Tour führt zu Packen, zum Wetter dieser Tour und zu Form (nach der Tour: zu ihrem Rückblick)',
    'The number «n wait for your review» under the title is a way: it shows those trips': 'Die Zahl «n warten auf deinen Rückblick» unter dem Titel ist ein Weg: Sie zeigt diese Touren',
    'Open Trips: under a planned trip stand the ways Pack, Weather and Form. Tap «Weather»: the weather of this trip opens.': 'Öffne Touren: Unter einer geplanten Tour stehen die Wege Packen, Wetter und Form. Tippe «Wetter»: Das Wetter dieser Tour öffnet sich.',
    'Tap «… wait for your review» under the title: the list below shows only those trips, with «Rate».': 'Tippe unter dem Titel auf «… warten auf deinen Rückblick»: Die Liste darunter zeigt nur diese Touren, mit «Bewerten».',
    'Remove the filter «Completed» above the list: all trips are there again.': 'Nimm über der Liste den Filter «Abgeschlossen» weg: Alle Touren sind wieder da.',
  },
};

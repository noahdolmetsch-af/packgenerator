// «Strava-Doppel» (Noah 22.11.2026 «Warteliste Strava-Doppel», «a», «freigabe», Thread «Sync»): Fahrten, die zwei Geräte doppelt geholt haben
export default {
  title: 'Strava rides count once',
  lead: 'A Strava ride fetched by two devices is one entry now, and rides that stand twice can be tidied up.',
  points: [{ text: 'On a bike under «More» the ride ledger shows «Tidy up?» when Strava rides stand twice; the extra entry is left out, not deleted', go: { href: '#/bikes', where: 'Bikes › Care › your bike › More › Ride ledger: the line shows only when a Strava ride stands twice.' } }],
  small: [{ box: 'fixed', text: 'Before tidying up, the app makes a copy of your data; Undo brings the entries back' }],
  test: [
    'Open your bike under Care › More: if «Tidy up?» shows, tap it and read the rides that stay once.',
    'Tap «Leave out the doubles»: the km of the bike go down by the extra km, the notice offers Undo.',
    'Tap Undo: the extra entries are counted again.',
  ],
  since: [],
  de: {
    'Strava rides count once': 'Strava-Fahrten zählen einmal',
    'A Strava ride fetched by two devices is one entry now, and rides that stand twice can be tidied up.': 'Eine Strava-Fahrt, die zwei Geräte geholt haben, ist jetzt ein Eintrag, und doppelt stehende Fahrten lassen sich aufräumen.',
    'On a bike under «More» the ride ledger shows «Tidy up?» when Strava rides stand twice; the extra entry is left out, not deleted': 'Bei einem Velo zeigt das Fahrten-Buch unter «Mehr» «Aufräumen?», wenn Strava-Fahrten doppelt stehen; der zweite Eintrag wird ausgelassen, nicht gelöscht',
    'Bikes › Care › your bike › More › Ride ledger: the line shows only when a Strava ride stands twice.': 'Velos › Pflege › dein Velo › Mehr › Fahrten-Buch: die Zeile erscheint nur, wenn eine Strava-Fahrt doppelt steht.',
    'Before tidying up, the app makes a copy of your data; Undo brings the entries back': 'Vor dem Aufräumen macht die App eine Kopie deiner Daten; Rückgängig bringt die Einträge zurück',
    'Open your bike under Care › More: if «Tidy up?» shows, tap it and read the rides that stay once.': 'Öffne dein Velo unter Pflege › Mehr: Wenn «Aufräumen?» erscheint, tippe es an und lies die Fahrten, die einmal bleiben.',
    'Tap «Leave out the doubles»: the km of the bike go down by the extra km, the notice offers Undo.': 'Tippe «Doppelte auslassen»: Die km des Velos sinken um die doppelten km, die Meldung bietet Rückgängig.',
    'Tap Undo: the extra entries are counted again.': 'Tippe Rückgängig: Die zweiten Einträge zählen wieder.',
  },
};

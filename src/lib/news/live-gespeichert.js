// Live Navigation (Noah 28.10.2026 Handy-Test: «unklar, ob und wo die Tour gespeichert ist»; name «b»).
export default {
  title: 'Clear where your ride is saved',
  lead: 'After a ride a card says it is saved in Trips, under which name and where. Open it or rename it right there.',
  points: [{ text: 'Card «Saved in Trips» with the name, Open and Rename', href: '#/live', go: 'f.live' }],
  small: [{ box: 'nicer', text: 'Rename the ride right after riding, with Undo', go: 'f.live' }],
  test: ['Ride a few hundred metres and tap «Fahrt beenden» › «Beenden und speichern»: a green card «Gespeichert in Touren» with the name shows.', 'Tap «Umbenennen», type a new name, «Speichern»: the card shows the new name; «Öffnen» opens the ride.'],
  since: [],
  de: {
    'Clear where your ride is saved': 'Klar, wo deine Fahrt gespeichert ist',
    'After a ride a card says it is saved in Trips, under which name and where. Open it or rename it right there.': 'Nach der Fahrt sagt eine Karte, dass sie in Touren gespeichert ist, unter welchem Namen und wo. Gleich dort öffnen oder umbenennen.',
    'Card «Saved in Trips» with the name, Open and Rename': 'Karte «Gespeichert in Touren» mit Name, Öffnen und Umbenennen',
    'Rename the ride right after riding, with Undo': 'Fahrt gleich nach dem Fahren umbenennen, mit Rückgängig',
    'Ride a few hundred metres and tap «Fahrt beenden» › «Beenden und speichern»: a green card «Gespeichert in Touren» with the name shows.': 'Ein paar hundert Meter fahren und «Fahrt beenden» › «Beenden und speichern» tippen: eine grüne Karte «Gespeichert in Touren» mit dem Namen erscheint.',
    'Tap «Umbenennen», type a new name, «Speichern»: the card shows the new name; «Öffnen» opens the ride.': '«Umbenennen» tippen, neuen Namen eingeben, «Speichern»: die Karte zeigt den neuen Namen; «Öffnen» öffnet die Fahrt.',
  },
};

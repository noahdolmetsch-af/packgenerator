// Nachprüfung Bikepacking (Noah 27.10.2026 «prüfe, ob wir wirklich alles so gemacht haben»): two promises of 19.10. that
// were still open: the fine, zoomable profile on the race page «Anstiege», and the app icon shortcuts in German
export default {
  title: 'Climbs with the fine profile',
  lead: 'The race page «Anstiege» now has the fine profile you can zoom, like on the map.',
  points: [{ text: 'Opening a climb zooms the profile to it', href: '#/race', go: 'f.climbs' }],
  small: [{ box: 'nicer', text: 'A long press on the app icon now says «Ausfahrt starten» and «Neue Notiz»', go: null }],
  test: [
    'Touren › Rennen › an example race › «Anstiege»: under «Alle Anstiege kurz» is the elevation profile with + and −.',
    'Tap a climb in the list: the profile zooms to that climb.',
  ],
  since: [],
  de: {
    'Climbs with the fine profile': 'Anstiege mit dem feinen Profil',
    'The race page «Anstiege» now has the fine profile you can zoom, like on the map.': 'Die Rennseite «Anstiege» hat jetzt das feine Profil zum Zoomen, wie auf der Karte.',
    'Opening a climb zooms the profile to it': 'Öffnest du einen Anstieg, zoomt das Profil auf ihn',
    'A long press on the app icon now says «Ausfahrt starten» and «Neue Notiz»': 'Langes Drücken auf das App-Symbol zeigt jetzt «Ausfahrt starten» und «Neue Notiz»',
    'Touren › Rennen › an example race › «Anstiege»: under «Alle Anstiege kurz» is the elevation profile with + and −.': 'Touren › Rennen › ein Rennen › «Anstiege»: Unter «Alle Anstiege kurz» steht das Höhenprofil mit + und −.',
    'Tap a climb in the list: the profile zooms to that climb.': 'Tippe einen Anstieg in der Liste an: Das Profil zoomt auf diesen Anstieg.',
  },
};

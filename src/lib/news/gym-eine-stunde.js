// «Gym zählt eine Stunde» (Noah 22.11.2026 «gym normalfall 1h»): the standard duration of a Gym tick without minutes
export default {
  title: 'Gym counts one hour',
  lead: 'A Gym tick without minutes now counts one hour, marked «ca.», instead of 20 minutes.',
  points: [{ text: 'Where you did not note the minutes, Gym counts with one hour; change it for yourself under «Usual duration»', go: { href: '#/flow/sports', steps: [{ sel: '[data-usual-list] summary' }], where: 'Active › My activities › Usual duration: «Gym 60 min (standard)».' } }],
  small: [],
  test: ['Open Active › My activities › Usual duration: Gym shows «60 min (standard)». Your own value stays as you set it.'],
  since: [],
  de: {
    'Gym counts one hour': 'Gym zählt eine Stunde',
    'A Gym tick without minutes now counts one hour, marked «ca.», instead of 20 minutes.': 'Ein Gym-Haken ohne Minuten zählt jetzt eine Stunde, mit «ca.» markiert, statt 20 Minuten.',
    'Where you did not note the minutes, Gym counts with one hour; change it for yourself under «Usual duration»': 'Wo du die Minuten nicht notiert hast, zählt Gym mit einer Stunde; ändere es für dich unter «Übliche Dauer»',
    'Active › My activities › Usual duration: «Gym 60 min (standard)».': 'Aktiv › Meine Aktivitäten › Übliche Dauer: «Gym 60 Min. (Standard)».',
    'Open Active › My activities › Usual duration: Gym shows «60 min (standard)». Your own value stays as you set it.': 'Öffne Aktiv › Meine Aktivitäten › Übliche Dauer: Gym zeigt «60 Min. (Standard)». Dein eigener Wert bleibt, wie du ihn eingestellt hast.',
  },
};

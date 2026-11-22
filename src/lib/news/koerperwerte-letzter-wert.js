// «Körperwerte nie leer» (Noah 7.11.2026 «1a 2a 3a»): last value with its day per value, a line why, Fitbit on pull
export default {
  title: 'Body values are never empty',
  lead: 'A value that Fitbit has not delivered today shows the last one, with its day.',
  points: [
    { text: 'In «Your body today» every missing value shows the last one of the last 7 days, marked «from yesterday» or with its date', href: '#/me/fitbit', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'A line says that Fitbit has not delivered everything yet, with «Fetch now»', href: '#/me/fitbit', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'Pulling Heute down also fetches the Fitbit values (when connected)', href: '#/me/fitbit', go: { href: '#/', where: 'Shows on a phone: pull Heute down at the very top.' } },
  ],
  test: ['Open Heute and look under «Your body today».', 'A value without a reading today shows the last one with its day, not a dash.', 'Pull Heute down at the top: the wheel says «Refreshing weather, Strava and Fitbit …».'],
  since: [],
  de: {
    'Body values are never empty': 'Körperwerte sind nie leer',
    'A value that Fitbit has not delivered today shows the last one, with its day.': 'Ein Wert, den Fitbit heute noch nicht geliefert hat, zeigt den letzten, mit seinem Tag.',
    'In «Your body today» every missing value shows the last one of the last 7 days, marked «from yesterday» or with its date': 'In «Dein Körper heute» zeigt jeder fehlende Wert den letzten der letzten 7 Tage, mit «von gestern» oder dem Datum',
    'A line says that Fitbit has not delivered everything yet, with «Fetch now»': 'Eine Zeile sagt, dass Fitbit noch nicht alles geliefert hat, mit «Jetzt holen»',
    'Pulling Heute down also fetches the Fitbit values (when connected)': 'Heute nach unten ziehen holt auch die Fitbit-Werte (wenn verbunden)',
    'Shows on a phone: pull Heute down at the very top.': 'Zeigt sich am Handy: Heute ganz oben nach unten ziehen.',
    'Open Heute and look under «Your body today».': 'Öffne Heute und schau unter «Dein Körper heute».',
    'A value without a reading today shows the last one with its day, not a dash.': 'Ein Wert ohne Messung von heute zeigt den letzten mit seinem Tag, kein «–».',
    'Pull Heute down at the top: the wheel says «Refreshing weather, Strava and Fitbit …».': 'Heute oben nach unten ziehen: das Rad sagt «Wetter, Strava und Fitbit werden neu geladen …».',
  },
};

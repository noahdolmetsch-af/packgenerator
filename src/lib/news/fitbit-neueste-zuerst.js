// «Fitbit holt nicht mehr» (Noah 2.11.2026): the newest days first, a shown card instead of a white page
export default {
  title: 'Fitbit fetches the newest days first',
  lead: 'Today’s values come first, the older days follow.',
  points: [{ text: 'Fitbit fetches the newest days first and does not start again from the oldest', go: 'f.fitbit' }],
  small: [{ box: 'new', text: 'If the app ever stays empty, a small card offers «Reload the newest version»', go: 'f.fitbit' }],
  test: [
    'Open Me › Data and backup › Fitbit and tap «Fetch now»: the newest days arrive first.',
    'Look at «Sleep» and «Steps»: they say «until yesterday» or «today».',
  ],
  since: [],
  de: {
    'Fitbit fetches the newest days first': 'Fitbit holt zuerst die neuesten Tage',
    'Today’s values come first, the older days follow.': 'Die Werte von heute kommen zuerst, die älteren Tage folgen.',
    'Fitbit fetches the newest days first and does not start again from the oldest': 'Fitbit holt zuerst die neuesten Tage und fängt nicht mehr beim ältesten an',
    'If the app ever stays empty, a small card offers «Reload the newest version»': 'Bleibt die App einmal leer, bietet eine kleine Karte «Neueste Version laden» an',
    'Open Me › Data and backup › Fitbit and tap «Fetch now»: the newest days arrive first.': 'Öffne Ich › Daten und Backup › Fitbit und tippe auf «Jetzt holen»: Die neuesten Tage kommen zuerst.',
    'Look at «Sleep» and «Steps»: they say «until yesterday» or «today».': 'Schau bei «Schlaf» und «Schritte»: Dort steht «bis gestern» oder «heute».',
  },
};

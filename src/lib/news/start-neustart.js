// Durchklick Etappe 6 (Noah 06.11.2026 «1a», Befund E6-010): the start without network that stayed empty now and then
export default {
  title: 'Start without network: a second try',
  lead: 'If the app does not open at the first try without network, it tries once more by itself.',
  points: [
    { text: 'When the app cannot load its main file at the start (seen now and then without network), it starts once again by itself, instead of staying on an empty screen', go: null },
  ],
  small: [],
  test: [
    'Switch on flight mode and open the app from the home screen: it opens with Today.',
    'Close it and open it again a few times: the screen is not empty once.',
  ],
  since: [],
  de: {
    'Start without network: a second try': 'Start ohne Netz: ein zweiter Versuch',
    'If the app does not open at the first try without network, it tries once more by itself.': 'Wenn die App ohne Netz beim ersten Versuch nicht aufgeht, versucht sie es einmal selbst nochmals.',
    'When the app cannot load its main file at the start (seen now and then without network), it starts once again by itself, instead of staying on an empty screen': 'Wenn die App ihre Hauptdatei beim Start nicht laden kann (ohne Netz ab und zu gesehen), startet sie einmal selbst neu, statt auf einem leeren Bildschirm zu bleiben',
    'Switch on flight mode and open the app from the home screen: it opens with Today.': 'Schalte den Flugmodus ein und öffne die App vom Startbildschirm: Sie öffnet mit Heute.',
    'Close it and open it again a few times: the screen is not empty once.': 'Schliesse sie und öffne sie mehrmals neu: Der Bildschirm bleibt kein einziges Mal leer.',
  },
};

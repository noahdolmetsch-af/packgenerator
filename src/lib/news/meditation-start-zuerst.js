// «Meditation: Start zuerst» (Durchklick Etappe 5, Bericht Frage 3a, Noah 06.11.2026)
export default {
  title: 'Meditation: «Start» comes before «Save as a template?»',
  lead: 'On a new session the Start button now stands right under the settings, and the template card comes after it.',
  points: [{ text: 'New session: the Start button is no longer pushed down by the template card', go: { href: '#/flow/act/meditation/timer?new=1', steps: [{ sel: '[data-start="timer"]' }] } }],
  small: [],
  test: ['Open Aktiv › Meditation › New session: the Start button stands under the settings.', 'Scroll down: the card «Save as a template?» comes after the Start button.'],
  since: [],
  de: {
    'Meditation: «Start» comes before «Save as a template?»': 'Meditation: «Starten» kommt vor «Als Vorlage speichern?»',
    'On a new session the Start button now stands right under the settings, and the template card comes after it.': 'Bei einer neuen Sitzung steht der Start-Knopf jetzt direkt unter den Einstellungen, die Vorlagen-Karte kommt danach.',
    'New session: the Start button is no longer pushed down by the template card': 'Neue Sitzung: Der Start-Knopf wird nicht mehr von der Vorlagen-Karte nach unten geschoben',
    'Open Aktiv › Meditation › New session: the Start button stands under the settings.': 'Öffne Aktiv › Meditation › Neue Sitzung: Der Start-Knopf steht unter den Einstellungen.',
    'Scroll down: the card «Save as a template?» comes after the Start button.': 'Scrolle nach unten: Die Karte «Als Vorlage speichern?» kommt nach dem Start-Knopf.',
  },
};

// «Schreibweise» (Noah 25.11.2026, Gesamttest C8): a hint for the spelling of the text of your own rule, only a suggestion
export default {
  title: 'Spelling hint for your rules',
  lead: 'When you save the text of a rule, the app suggests a better spelling. Your text stays as you wrote it.',
  points: [
    { text: 'After saving the question of a rule, a quiet line suggests a capital at the start and «5 Std.» for «5h»; «Use it» takes it, «Keep mine» hides it', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }], where: 'Under «Wi gaht\'s?»: «The app asks you» › a rule › «The question».' } },
  ],
  small: [],
  test: [
    'Open Me › Wi gaht\'s? › «The app asks you», write «warum hast du weniger als 5h geschlafen?» into the field «The question» and leave it.',
    'A line suggests «Warum hast du weniger als 5 Std. geschlafen?»; «Use it» takes it, «Keep mine» hides the line.',
  ],
  since: [],
  de: {
    'Spelling hint for your rules': 'Schreibweise-Vorschlag für deine Regeln',
    'When you save the text of a rule, the app suggests a better spelling. Your text stays as you wrote it.': 'Wenn du den Text einer Regel speicherst, schlägt die App eine bessere Schreibweise vor. Dein Text bleibt, wie du ihn geschrieben hast.',
    'After saving the question of a rule, a quiet line suggests a capital at the start and «5 Std.» for «5h»; «Use it» takes it, «Keep mine» hides it': 'Nach dem Speichern der Frage einer Regel schlägt eine ruhige Zeile Grossschreibung am Anfang und «5 Std.» statt «5h» vor; «Übernehmen» nimmt sie, «So lassen» blendet sie aus',
    'Under «Wi gaht\'s?»: «The app asks you» › a rule › «The question».': 'Unter «Wi gaht\'s?»: «Die App fragt dich» › eine Regel › «Die Frage».',
    'Open Me › Wi gaht\'s? › «The app asks you», write «warum hast du weniger als 5h geschlafen?» into the field «The question» and leave it.': 'Öffne Ich › Wi gaht\'s? › «Die App fragt dich», schreibe «warum hast du weniger als 5h geschlafen?» ins Feld «Die Frage» und verlasse es.',
    'A line suggests «Warum hast du weniger als 5 Std. geschlafen?»; «Use it» takes it, «Keep mine» hides the line.': 'Eine Zeile schlägt «Warum hast du weniger als 5 Std. geschlafen?» vor; «Übernehmen» nimmt es, «So lassen» blendet die Zeile aus.',
  },
};

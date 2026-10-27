// «Check übernehmen» (Noah 27.10.2026, idea 3 after the Rennen-Check): the check of one race into the next
export default {
  title: 'Take the check into the next race',
  lead: 'Start the race check of a new race with the answers of an earlier one.',
  points: [{ text: 'Race check › Answers: «Take over» fills the empty fields from another race', href: '#/racecheck' }],
  small: [{ box: 'new', text: 'Name, date and test ride stay with each race; Undo takes it back' }],
  test: ['Open a race in «Rennen detailliert planen» whose check is still empty; at the bottom under «Antworten» choose another race and tap «Übernehmen».', 'The empty fields now hold the answers of the other race; «Rennen» and «Datum» on sheet 1 stay empty.'],
  since: [],
  de: {
    'Take the check into the next race': 'Den Check ins nächste Rennen mitnehmen',
    'Start the race check of a new race with the answers of an earlier one.': 'Beginn den Rennen-Check eines neuen Rennens mit den Antworten eines früheren.',
    'Race check › Answers: «Take over» fills the empty fields from another race': 'Rennen-Check › Antworten: «Übernehmen» füllt die leeren Felder aus einem anderen Rennen',
    'Name, date and test ride stay with each race; Undo takes it back': 'Name, Datum und Probefahrt bleiben beim Rennen; Rückgängig nimmt es zurück',
    'Open a race in «Rennen detailliert planen» whose check is still empty; at the bottom under «Antworten» choose another race and tap «Übernehmen».': 'Öffne in «Rennen detailliert planen» ein Rennen mit leerem Check; unten bei «Antworten» ein anderes Rennen wählen und «Übernehmen» tippen.',
    'The empty fields now hold the answers of the other race; «Rennen» and «Datum» on sheet 1 stay empty.': 'Die leeren Felder haben jetzt die Antworten des anderen Rennens; «Rennen» und «Datum» auf Blatt 1 bleiben leer.',
  },
};

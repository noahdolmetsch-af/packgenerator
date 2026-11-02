// «Wer hat geantwortet» (Noah 1.11.2026 «1a»): Termin finden zeigt, wer geantwortet hat und wer fehlt
export default {
  title: 'Who has answered',
  lead: 'In a date question you see who answered and who is still missing.',
  points: [{ text: 'Type the names of the people you asked and see who is missing', go: { href: '#/me/mini', where: 'Me › Mini tools › open a date question: the card «Who did you ask?» is on top.' } }],
  small: [{ box: 'new', go: null, text: 'A tap on «Remind» writes the message to the missing people for the group chat' }],
  test: [
    'Open Me › Mini tools and a date question, type two names in «Who did you ask?» and tap «Add».',
    'Both show «missing». After one of them answered and you tapped «Look for new answers», that name shows «answered».',
  ],
  since: [],
  de: {
    'Who has answered': 'Wer hat geantwortet',
    'In a date question you see who answered and who is still missing.': 'In einer Termin-Frage siehst du, wer geantwortet hat und wer noch fehlt.',
    'Type the names of the people you asked and see who is missing': 'Namen der Gefragten eintippen und sehen, wer fehlt',
    'Me › Mini tools › open a date question: the card «Who did you ask?» is on top.': 'Ich › Mini-Tools › eine Termin-Frage öffnen: ganz oben steht die Karte «Wen hast du gefragt?».',
    'A tap on «Remind» writes the message to the missing people for the group chat': 'Ein Tipp auf «Erinnern» schreibt die Nachricht an die Fehlenden für den Gruppenchat',
    'Open Me › Mini tools and a date question, type two names in «Who did you ask?» and tap «Add».': 'Öffne Ich › Mini-Tools und eine Termin-Frage, schreib zwei Namen unter «Wen hast du gefragt?» und tipp «Hinzufügen».',
    'Both show «missing». After one of them answered and you tapped «Look for new answers», that name shows «answered».': 'Beide zeigen «fehlt noch». Hat einer geantwortet und du tippst «Neue Antworten holen», steht bei dem Namen «hat geantwortet».',
  },
};

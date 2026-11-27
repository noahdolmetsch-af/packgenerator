// «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a»): after an update every news item shows what is new, how to test it, and «Works» / «Does not work»
export default {
  title: 'After an update: test every news item',
  lead: 'The news after an update come with their PR number, the steps to test them and two answers.',
  points: [
    { text: 'After an update Today shows a small card with the two newest news, each with its PR, the first test step, «Show me», «Works» and «Does not work»', go: { href: '#/', where: 'Today, directly under the chips, after the next update.' } },
    { text: '«+N more» opens a window with every news since your last visit, each with all its steps', go: { href: '#/', where: 'Today, the card under the chips, «+N more».' } },
    { text: 'Me › What is new shows the PR and the test steps of every update, filters by «Not tested yet», «Works», «Does not work» and «Not visible», and finds an update by its PR number', go: { href: '#/me/news', where: 'Me › What is new, under «All versions».' } },
  ],
  small: [
    { box: 'fixed', text: 'The news on Today are never cut off: a long title wraps' },
    { box: 'new', text: '«Does not work» opens the window of «Improve» with the kind «Error» and the release in it; the improvement order names release and PR' },
  ],
  test: [
    'After the next update open Today: under the chips a card shows the two newest news with their PR and the first test step.',
    'Tap «Works» under one of them: the answer is kept, and the log (Me › Improvement log) holds an entry with the release.',
    'Tap «Does not work» under the other: the window of «Improve» opens with «Error» and the release; write one sentence and save.',
    'Open Me › What is new, tap the chip «Not tested yet», open a row: the PR, the steps and the two answers are there.',
  ],
  since: [],
  de: {
    'After an update: test every news item': 'Nach einem Update: jede Neuheit testen',
    'The news after an update come with their PR number, the steps to test them and two answers.': 'Die Neuheiten nach einem Update kommen mit ihrer PR-Nummer, den Schritten zum Testen und zwei Antworten.',
    'After an update Today shows a small card with the two newest news, each with its PR, the first test step, «Show me», «Works» and «Does not work»': 'Nach einem Update zeigt Heute eine kleine Karte mit den zwei neuesten Neuheiten, je mit PR, dem ersten Testschritt, «Zeig mir», «Klappt» und «Klappt nicht»',
    'Today, directly under the chips, after the next update.': 'Heute, direkt unter den Chips, nach dem nächsten Update.',
    '«+N more» opens a window with every news since your last visit, each with all its steps': '«+N weitere» öffnet ein Fenster mit jeder Neuheit seit deinem letzten Besuch, je mit allen Schritten',
    'Today, the card under the chips, «+N more».': 'Heute, die Karte unter den Chips, «+N weitere».',
    'Me › What is new shows the PR and the test steps of every update, filters by «Not tested yet», «Works», «Does not work» and «Not visible», and finds an update by its PR number': 'Ich › Was ist neu zeigt zu jedem Update die PR und die Testschritte, filtert nach «Noch nicht getestet», «Klappt», «Klappt nicht» und «Unsichtbar» und findet ein Update über seine PR-Nummer',
    'Me › What is new, under «All versions».': 'Ich › Was ist neu, unter «Alle Versionen».',
    'The news on Today are never cut off: a long title wraps': 'Die Neuheiten auf Heute werden nie abgeschnitten: ein langer Titel bricht um',
    '«Does not work» opens the window of «Improve» with the kind «Error» and the release in it; the improvement order names release and PR': '«Klappt nicht» öffnet das Fenster von «Verbessern» mit der Art «Fehler» und dem Release darin; der Auftrag nennt Release und PR',
    'After the next update open Today: under the chips a card shows the two newest news with their PR and the first test step.': 'Öffne nach dem nächsten Update Heute: Unter den Chips zeigt eine Karte die zwei neuesten Neuheiten mit ihrer PR und dem ersten Testschritt.',
    'Tap «Works» under one of them: the answer is kept, and the log (Me › Improvement log) holds an entry with the release.': 'Tippe bei einer auf «Klappt»: Die Antwort bleibt, und das Logbuch (Ich › Verbesserungs-Logbuch) hat einen Eintrag mit dem Release.',
    'Tap «Does not work» under the other: the window of «Improve» opens with «Error» and the release; write one sentence and save.': 'Tippe bei der anderen auf «Klappt nicht»: Das Fenster von «Verbessern» öffnet sich mit «Fehler» und dem Release; schreibe einen Satz und speichere.',
    'Open Me › What is new, tap the chip «Not tested yet», open a row: the PR, the steps and the two answers are there.': 'Öffne Ich › Was ist neu, tippe auf «Noch nicht getestet», öffne eine Zeile: Die PR, die Schritte und die zwei Antworten sind da.',
  },
};

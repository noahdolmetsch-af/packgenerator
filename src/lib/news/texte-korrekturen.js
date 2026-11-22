// «Texte richtig» (UX-Test 08.11.2026): wrong German in six places, no new function
export default {
  title: 'Correct German in six places',
  lead: 'Sentences that read wrongly now read right: singular where it is one night, no formal «Sie», no test-preview talk.',
  points: [
    { text: 'Race notes say «1 Nacht», «In 1 Nacht» and «Das Zelt wiegt …» instead of «1 Nächte» and «Das Zelt sind …»', go: { href: '#/race', where: 'Shows in the risk notes of a way and in the race briefing; the sample race has them.' } },
    { text: 'Hinweise und News without a connection say what is wrong and what to tap, without «test preview»', go: { href: '#/me/hinweise', where: 'Shows on Me › Alerts and news when the server does not answer.' } },
  ],
  small: [
    { box: 'new', text: '«Ride with friends» on the live map speaks to you with «du» and says who opens the link' },
    { box: 'new', text: 'The sentence about papers on «Before you leave» reads in one go; «Wohnungshüter» is one word' },
    { box: 'new', text: 'The evening review no longer promises «30 seconds»: it says «a few minutes» and that every question can be skipped' },
  ],
  test: [
    'Open the sample race (Touren › Rennen, example), tab «Strategie»: a way with one late night says «In 1 Nacht kommst du nach dem Check-in an».',
    'Open Ich › Hinweise und News without a connection: the line says that the server does not answer and what to tap.',
    'Open Heute › Abend-Rückblick: the line under the date says «ein paar Minuten».',
  ],
  since: [],
  de: {
    'Correct German in six places': 'Richtiges Deutsch an sechs Stellen',
    'Sentences that read wrongly now read right: singular where it is one night, no formal «Sie», no test-preview talk.': 'Sätze, die falsch klangen, klingen jetzt richtig: Einzahl bei einer Nacht, kein «Sie», kein Wort von der Test-Vorschau.',
    'Race notes say «1 Nacht», «In 1 Nacht» and «Das Zelt wiegt …» instead of «1 Nächte» and «Das Zelt sind …»': 'Die Hinweise im Rennen sagen «1 Nacht», «In 1 Nacht» und «Das Zelt wiegt …» statt «1 Nächte» und «Das Zelt sind …»',
    'Shows in the risk notes of a way and in the race briefing; the sample race has them.': 'Steht bei den Risiken einer Variante und im Briefing; das Muster-Rennen zeigt sie.',
    'Hinweise und News without a connection say what is wrong and what to tap, without «test preview»': 'Hinweise und News ohne Verbindung sagen, was los ist und was du tippen kannst, ohne «Test-Vorschau»',
    'Shows on Me › Alerts and news when the server does not answer.': 'Steht unter Ich › Hinweise und News, wenn der Server nicht antwortet.',
    '«Ride with friends» on the live map speaks to you with «du» and says who opens the link': '«Mit Freunden fahren» auf der Live-Karte spricht dich mit «du» an und sagt, wer den Link öffnet',
    'The sentence about papers on «Before you leave» reads in one go; «Wohnungshüter» is one word': 'Der Satz zu den Papieren bei «Vor der Abfahrt» lässt sich in einem Zug lesen; «Wohnungshüter» ist ein Wort',
    'The evening review no longer promises «30 seconds»: it says «a few minutes» and that every question can be skipped': 'Der Abend-Rückblick verspricht nicht mehr «30 Sekunden»: er sagt «ein paar Minuten» und dass jede Frage übersprungen werden darf',
    'Open the sample race (Touren › Rennen, example), tab «Strategie»: a way with one late night says «In 1 Nacht kommst du nach dem Check-in an».': 'Öffne das Muster-Rennen (Touren › Rennen, Beispiel), Reiter «Strategie»: eine Variante mit einer späten Nacht sagt «In 1 Nacht kommst du nach dem Check-in an».',
    'Open Ich › Hinweise und News without a connection: the line says that the server does not answer and what to tap.': 'Öffne Ich › Hinweise und News ohne Verbindung: die Zeile sagt, dass der Server nicht antwortet und was du tippen kannst.',
    'Open Heute › Abend-Rückblick: the line under the date says «ein paar Minuten».': 'Öffne Heute › Abend-Rückblick: die Zeile unter dem Datum sagt «ein paar Minuten».',
  },
};

// «KI entfernen, Schritt 6a» (Noah 20.11.2026 «a»): keine Gemini-Schritte mehr in Tagebuch und Eingabeleiste
export default {
  title: 'No more Gemini in the diary and under your texts',
  lead: 'Titles, prompts and summaries are written by you; the voice note, templates and writing prompts stay.',
  points: [
    { text: 'The diary entry has no box «Send the text to Gemini» any more (no title suggestion, tidy-up, prompts, highlights)', go: { href: '#/tagebuch?neu', where: 'Diary: write a new entry.' } },
    { text: 'The diary review has no «With Gemini» card any more (sum up a month, ask your diary); mood curve, word cloud and series stay', go: null },
    { text: 'The bar under a text has no «AI helper» tool any more; voice note, photo, file, place, tag, template and writing prompts stay', go: null },
  ],
  small: [],
  test: [
    'Open Diary › New entry: under the text there is no box «Send the text of this entry to Gemini».',
    'Open Diary › Review: the mood curve, the words of the month and the series are there; no card «With Gemini».',
    'Open a note: under the text the row «Add» shows «Voice note» and «Writing prompts», but no «AI helper».',
  ],
  since: [],
  de: {
    'No more Gemini in the diary and under your texts': 'Kein Gemini mehr im Tagebuch und unter deinen Texten',
    'Titles, prompts and summaries are written by you; the voice note, templates and writing prompts stay.': 'Titel, Anregungen und Zusammenfassungen schreibst du selbst; Sprachnotiz, Vorlagen und Schreibanreize bleiben.',
    'The diary entry has no box «Send the text to Gemini» any more (no title suggestion, tidy-up, prompts, highlights)': 'Der Tagebuch-Eintrag hat keinen Kasten «Text an Gemini schicken» mehr (kein Titelvorschlag, kein Aufräumen, keine Anregungen, keine Höhepunkte)',
    'Diary: write a new entry.': 'Tagebuch: einen neuen Eintrag schreiben.',
    'The diary review has no «With Gemini» card any more (sum up a month, ask your diary); mood curve, word cloud and series stay': 'Der Tagebuch-Rückblick hat keine Karte «Mit Gemini» mehr (Monat zusammenfassen, Tagebuch fragen); Stimmungskurve, Wortwolke und Serien bleiben',
    'The bar under a text has no «AI helper» tool any more; voice note, photo, file, place, tag, template and writing prompts stay': 'Die Leiste unter einem Text hat kein Werkzeug «KI-Helfer» mehr; Sprachnotiz, Foto, Datei, Ort, Schlagwort, Vorlage und Schreibanreize bleiben',
    'Open Diary › New entry: under the text there is no box «Send the text of this entry to Gemini».': 'Öffne Tagebuch › Neuer Eintrag: unter dem Text gibt es keinen Kasten «Text dieses Eintrags an Gemini schicken».',
    'Open Diary › Review: the mood curve, the words of the month and the series are there; no card «With Gemini».': 'Öffne Tagebuch › Rückblick: Stimmungskurve, Wörter des Monats und Serien sind da; keine Karte «Mit Gemini».',
    'Open a note: under the text the row «Add» shows «Voice note» and «Writing prompts», but no «AI helper».': 'Öffne eine Notiz: unter dem Text zeigt die Zeile «Hinzufügen» «Sprachnotiz» und «Schreibanreize», aber keinen «KI-Helfer».',
  },
};

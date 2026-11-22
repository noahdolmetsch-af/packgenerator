# Kein Gemini mehr im Tagebuch und unter deinen Texten

PR folgt · 22.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 6a)

## Was ist neu
- Der Tagebuch-Eintrag hat den Kasten «Text dieses Eintrags an Gemini schicken» nicht mehr (Titel vorschlagen, Text aufräumen, Anregungen, Höhepunkte).
- Der Tagebuch-Rückblick hat die Karte «Mit Gemini» nicht mehr (Monat zusammenfassen, Tagebuch fragen). Stimmungskurve, Wortwolke und Serien bleiben.
- Die Leiste unter einem Text (Eingaben überall) hat das Werkzeug «KI-Helfer» nicht mehr. Sprachnotiz, Foto, Datei, Ort, Schlagwort, Vorlage und Schreibanreize bleiben.
- Aus dem Code entfernt: `tagebuch/ai.js`, `inputAi` und die Hilfen für Gemini-Antworten (`aiLines`, `highlightsBlock`) mit ihren Tests.

## Was fällt weg oder rutscht tiefer
- Titel vorschlagen, Text aufräumen, «Anregungen, die passen», «Höhepunkte» im Tagebuch und in der Eingabeleiste → nichts; die festen Schreibanreize (täglich andere) und die Vorlagen bleiben.
- «Monat zusammenfassen» und «Frag dein Tagebuch» im Rückblick (auch «Als Eintrag behalten») → nichts. Schon früher so behaltene Einträge bleiben im Tagebuch.

## Selbst entschieden
- Der Schritt 6 wurde geteilt: 6a (dieser PR: Tagebuch und Eingabeleiste), 6b (Sprachbericht, Belege und `gemini.js`), damit jeder PR klein bleibt. Es bleibt bei 9 Schritten.
- Die Server-Tests für die Tagebuch-Aufgaben (`DIARY_MODES`) bleiben bis zum Server-Schritt.
- Übrige deutsche Texte der entfernten Stellen bleiben bis zum Aufräumen (Schritt 9) in `de/*.js`.
- Nichts an Datenformat oder Backup: gespeicherte Einträge und Eingaben bleiben unverändert.

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» bleibt.

## Stand im Plan
- KI entfernen: Schritt 6a von 9.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tagebuch › Neuer Eintrag: unter dem Text kein Kasten «Text dieses Eintrags an Gemini schicken».
2. Tagebuch › Rückblick: Stimmungskurve, Wörter des Monats und Serien da, keine Karte «Mit Gemini».
3. Eine Notiz öffnen: bei «Hinzufügen» «Sprachnotiz» und «Schreibanreize», kein «KI-Helfer».

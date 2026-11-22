# Kein Gemini mehr im Sprachbericht und bei den Belegen

PR folgt · 22.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 6b)

## Was ist neu
- Der Rückblick als Sprachnachricht macht seine Kernpunkte nur noch mit der App selbst, Satz für Satz. Jeden Punkt behältst du oder lässt ihn weg, «Übernehmen» wie bisher.
- «Assistent mit Belegen»: die Knöpfe «Gemini mit diesen Belegen fragen» und «Die stärksten Gegenargumente sammeln» sind weg. Die Antwort der App, die Belege und die offenen Punkte deiner nächsten Tour («Meinen Plan hinterfragen») bleiben.
- «KI-Vorschläge zuerst prüfen» zeigt sich nur noch, solange früher behaltene Antworten warten (Titel dann «Frühere KI-Vorschläge»). Sie bleiben sichtbar, bis du sie übernimmst oder verwirfst; nichts geht verloren.
- Aus dem Code entfernt: `assistent/gemini.js` (die Anfrage an Gemini), die Antwort-Leser für Gemini in `tourenc/voicepoints.js` und `ruhig/belege.js` samt Tests.

## Was fällt weg oder rutscht tiefer
- Gemini gliedert den Sprachbericht → die App gliedert Satz für Satz (der Hinweis steht im Text).
- «Gemini mit diesen Belegen fragen» und «Gegenargumente sammeln» → nichts.
- Funktion «KI-Vorschläge zuerst prüfen» (`f.aicheck`) → fällt als eigene Funktion weg; die Karte bleibt nur, solange alte Vorschläge da sind.
- Der Hinweis «Gemini bekommt deine No-Gos mit jeder Frage» → nichts; die No-Gos selbst und der Hinweis auf Listen bleiben.

## Selbst entschieden
- Die Seite «Assistent mit Belegen» bleibt mit ihren lokalen Teilen (Antwort der App mit Belegen, offene Punkte, No-Gos); sie wird nicht gelöscht.
- Schon gespeicherte KI-Vorschläge (Einstellung `ruhig.aiCheck`) bleiben unverändert und sichtbar (nichts am Datenformat oder Backup).
- Die Server-Tests für Gemini (`DIARY_MODES`, `geminiRequest`) bleiben bis zum Server-Schritt; übrige deutsche Texte der entfernten Stellen bleiben bis zum Aufräumen (Schritt 9).

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» bleibt.

## Stand im Plan
- KI entfernen: Schritt 6b von 9. Danach hängt nur noch die Seite «KI-Helfer» mit ihrem Code am alten Helfer (Schritt 7).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Einen Rückblick öffnen, «Rückblick sprechen» aufklappen, zwei Sätze tippen, «Kernaussagen machen»: die Punkte erscheinen, ohne ein Wort über Gemini.
2. Ich › Ruhig und persönlich › Assistent mit Belegen, eine Frage stellen: Antwort der App und Belege, kein Knopf «Gemini mit diesen Belegen fragen».
3. «Meinen Plan hinterfragen»: offene Punkte, kein Knopf für Gegenargumente.

# Keine Gemini-Antworten mehr in Suche, Assistent und Fragen

PR folgt · 22.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 5)

## Was ist neu
- Unter einer Antwort gibt es kein «Gemini hier fragen» mehr. «Weiter fragen bei» (Claude, ChatGPT, Perplexity, Google …) bleibt.
- Eine gesprochene Frage geht nicht mehr von selbst an Gemini. Die App antwortet aus deinen Daten, die KI im Gerät antwortet, oder du fragst weiter.
- Ich › Suche hat die Schalter «Gemini (gratis)» und «Gemini antwortet auf eine gesprochene Frage von selbst» nicht mehr; der Hinweis «KI-Helfer (Claude)» fällt weg. Ich › Diktat hat die Zeile «Gemini in der App» nicht mehr.
- «KI im Gerät» (LocalAsk) fragt nur noch das Gerät, nicht mehr zuerst Gemini.

## Was fällt weg oder rutscht tiefer
- «Gemini hier fragen» unter Antworten (Assistent, Suche) → nichts; «Weiter fragen bei» bleibt.
- Gemini beantwortet eine gesprochene Frage von selbst → nichts.
- Schalter «Gemini (gratis)», «Gemini antwortet …» in Ich › Suche, «Gemini in der App» in Ich › Diktat → nichts.
- «KI fragen (Gemini, online)» bei der KI im Gerät → nur noch «KI im Gerät fragen».

## Selbst entschieden
- Die Links «Weiter fragen bei Claude, ChatGPT …» bleiben, bis Noah auf die offene Frage antwortet.
- Alte Schlüssel `gemini`/`geminiAuto` in gespeicherten Einstellungen bleiben liegen und werden nicht mehr gelesen (kein Datenformat, kein Backup berührt).
- Gemini in Tagebuch, Eingabe, Sprachbericht und Belegen sowie `gemini.js` folgen in Schritt 6.

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» bleibt.

## Stand im Plan
- KI entfernen: Schritt 5 von 9.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Assistent öffnen und eine Frage stellen: unter der Antwort «Weiter fragen bei», kein «Gemini hier fragen».
2. Ich › Suche: keine Gemini-Schalter.
3. Ich › Diktat: keine Zeile «Gemini in der App».

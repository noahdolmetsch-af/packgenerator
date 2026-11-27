# Frag Gemini antwortet schneller: leichte Modelle zuerst

27.11.2026 · Auftrag: Noah, Test von «Frag Gemini» mit Version 0.1322 (27.11. 17:58): die Frage hing und scheiterte

## Was ist neu
- Der Server probiert bei den neuesten Gemini-Versionen zuerst das leichte «lite»-Modell, dann das «flash» derselben Version. Bei «überlastet» (503) fragt er einmal nochmals.
- Das Ganze dauert höchstens etwa 25 Sekunden (je Versuch höchstens 8). Die Seite wartet höchstens 40 Sekunden, dann sagt sie, dass Gemini nicht geantwortet hat.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Reihenfolge «lite vor flash»: eine einfache Frage braucht nicht das grosse Modell, und es spart das gratis Tageslimit.
- Höchstens 4 Modelle aus der Modellliste, damit die Wartezeit begrenzt bleibt.

## Entscheide
- `docs/decisions/frag-gemini-lite.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Assistent › «Frag Gemini», «Was kostet ein Fahrradschlauch ungefähr?» fragen: eine Antwort kommt innert etwa einer halben Minute.
2. Kommt keine, steht unter der Meldung die Zeile «Technische Angabe». Bitte vorlesen.

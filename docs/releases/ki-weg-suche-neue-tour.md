# Keine Claude-Antworten mehr in Suche und Neue Tour

PR folgt · 20.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 1 von 7)

## Was ist neu
- Suche und Assistent antworten nur noch aus der App selbst (eigene Daten, gratis, auf dem Gerät). Die Claude-Antwort über den Treffern ist weg.
- In «Neue Tour» gibt es kein «Frag den Helfer» mehr, und die Teile «Vom Helfer» in der Liste fallen mit weg. Vorlagen, «Hilf mir planen» und die eigene Absicht bleiben.
- Die Funktion «Frag den Helfer» (`f.ask`) ist aus dem Katalog, dem Handbuch und den Wegen entfernt. Sie steht im Verlust-Wächter unter «abgeloest».

## Was fällt weg oder rutscht tiefer
- «Frag den Helfer» in Neue Tour → nichts; Ersatz sind Vorlagen und «Hilf mir planen».
- Claude-Antwort in Suche und Assistent («3 · Claude») → die App-Antwort und die Chrome-KI bleiben.
- Knopf «Als Packliste vorschlagen» → weg.
- Alte Touren mit Teilen, die der Helfer früher hinzugefügt hat, bleiben unverändert.

## Selbst entschieden
- Die zwei E2E-Tests «Monatsgrenze» und «Guthaben leer» sind entfernt: Ihre Orte (Neue Tour, Suche) gibt es nicht mehr. Die Grenze und der Guthaben-Hinweis verschwinden mit dem Helfer in Schritt 4.
- Der Server (`api/helper.js`) und der Helfer-Client bleiben, bis Schritt 4 bis 6; nichts mit `api/`, Daten oder Backup wird hier angefasst.
- Übrige deutsche Texte der entfernten Stellen stehen noch in `de/*.js`; sie werden in Schritt 7 aufgeräumt.

## Entscheide (für decisions.md)
- 20.11.2026: Alle KI-Funktionen mit Claude und Gemini werden entfernt, in kleinen PRs; «KI im Gerät» und die Bilderkennung auf dem Gerät bleiben (Noah «a», Karte «Nein, behalten»).

## Stand im Plan (roadmap.md / vorhaben.md)
- KI entfernen: Schritt 1 von 7.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Assistent öffnen, «Wie viele km diesen Monat?» fragen: Antwort aus der App.
2. Touren › Neue Tour: kein Feld «Frag den Helfer».
3. In der Suche eine Frage mit «?» tippen: keine Claude-Antwort über den Treffern.

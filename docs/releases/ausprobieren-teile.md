# Test «Ausprobieren»: in Teile aufgeteilt

PR folgt · 03.11.2026 · Auftrag: Koordinator (Merges blockiert, Test lief in den 10-Minuten-Timeout)

## Was ist neu
- Ein kleiner Fehler in der App ist behoben: Tippt man in «Was ist neu» auf eine Zeile zu «Was ziehe ich an?», öffnet sich das Fenster wie bisher und unten steht wieder «Neu hier: …». Seit #610 fehlte diese Zeile bei Funktionen, die eine Handlung starten (`src/lib/know/featureRun.js`). Der Test hatte das gemeldet.
- Der Test `tests/e2e/ausprobieren.spec.js` ging alle ~500 Neuigkeiten-Zeilen in einem Lauf durch und brauchte mehr als 10 Minuten. Er läuft jetzt in Teilen zu je 40 Zeilen (je ein eigener Test). Jede Zeile wird weiterhin genau einmal geprüft, nichts ist gelockert; die Teile werden aus den Zeilen im Quelltext gezählt.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- 40 Zeilen pro Teil, 5 Minuten Zeitgrenze pro Teil (vorher 10 Minuten für alles).
- Ein eigener kleiner Test prüft, dass es überhaupt Zeilen mit festem Ort gibt.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Wacklige Tests (Lücken-Vorschläge 02.11., Schritt 5): dieser Test war über die Zeit zu lang geworden.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Neuigkeiten, eine Zeile zu «Was ziehe ich an?» antippen.
2. Heute öffnet das Fenster, unten steht «Neu hier: …».

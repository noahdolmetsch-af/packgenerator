# Analyse öffnet schneller

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «Idee A: Tempo-Runde für Seiten» (Thread «Umsetzen Tempo-Runde für Seiten»)

## Was ist neu
- Auswerten › Analyse: Die Bereitschaft (0–100) für jeden Tag des Jahres wird viel leichter gerechnet. Bisher kopierte die Rechnung für jeden der gut 360 Tage die ganze Tagesreihe und rechnete 30 Datumsangaben neu. Jetzt wird nichts kopiert und die Daten werden nachgeschlagen.
- Gemessen (Handy-Ansicht, Prozessor 4× langsamer, 700 Testteile, 5 Wechsel): blockierte Zeit beim Öffnen 0.60 s → 0.13 s, Rechenzeit der Bereitschaft im Profil 424 ms → 20 ms. Die Zahlen sind dieselben (Probe mit 400 Tagen: gleiche Anzahl, gleiche Summe).
- Dieselbe Rechnung (`recoveryParts`) läuft auch auf Aktiv › Form und Heute; sie ist dort ebenso leichter.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die Rechnung geändert (`src/lib/form.js`), keine Anzeige. Die Daten-Nachschlagetabelle (Tag → Text) bleibt bei höchstens 5000 Einträgen im Arbeitsspeicher.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo-Runde für Seiten (Idee A, «Neuer Schwung»): Schritt 1 von 4. Bericht: notes/tempo-runde-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse öffnen: die Kacheln erscheinen und das Scrollen läuft gleich flüssig.
2. Eine Kachel zur Bereitschaft öffnen: Werte und Diagramm sind wie vorher.

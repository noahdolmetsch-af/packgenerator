# Höhen-Test stabiler

Auftrag: Bündler 23.11.2026 (PR 1527 rot nur bei `tests/e2e/hoehe.spec.js:7`, `data-hoehe-row="1000"` fehlt, auch im Wiederholungslauf).

## Was ist neu
- Nichts in der App. `tests/e2e/hoehe.spec.js` stellt die Luftschicht-Antworten jetzt VOR dem Laden von Heute ein (`weather`-Option von `openHome`), wie schon `hoehe-heute.spec.js` und `nachttemperatur.spec.js` (PR 1535). Vorher kamen sie erst danach; war Heute schneller, konnte die allgemeine Testantwort von `openHome` die Karte füllen.
- Auf aktuellem main (nach 1535) war der Test lokal 6 von 6 grün (Handy, 4 Arbeiter): der Fehler liess sich dort nicht nachstellen. Mit der Änderung 9 von 9 grün (`hoehe.spec` + `hoehe-heute.spec`, 3× wiederholt, 6 Arbeiter). Ob das 1527 behebt, zeigt dessen nächster Lauf.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine Prüfung gelockert, dieselben Erwartungen. Keine Daten, kein Schema, kein Backup, kein Sync, kein `api/`.

## Prüfschritte (nach dem Merge)
1. Wetter öffnen: die Karte «Temperaturen nach Höhe» zeigt wie vorher drei Höhen.

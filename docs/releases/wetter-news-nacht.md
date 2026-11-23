# Wetter-Neuigkeiten: zwei weitere Stellen, Nachttest ohne Zufall

Auftrag: Bündler 23.11.2026 (`ausprobieren.spec` läuft in PR 1527 komplett; `nachttemperatur.spec` auf dem Handy mal rot, mal grün).

## Was ist neu
- Zwei weitere Zeilen der Neuigkeit «Wetterseite aufgeräumt» («Regen in den nächsten 3 Stunden» und die geschlossene Zeile «Wetter heute» auf Heute) leuchteten nichts an, solange der Wetterdienst nicht geantwortet hat oder kein Tag mit geplanter Tour da war. Sie haben jetzt eine Zeile «wo» (wie in der letzten Korrektur). Die Seiten selbst sind unverändert.
- Test `tests/e2e/nachttemperatur.spec.js`: Ursache des Wackelns gefunden. Heute fragt die Nachtwerte auch ab und behält die Antwort 3 Stunden auf dem Gerät. Der Test stellte seine eigene Antwort erst NACH dem Laden von Heute ein; war Heute schneller, blieb die allgemeine Testantwort im Speicher und die Karte zeigte nicht «Heute früh». Jetzt wird die Test-Antwort vor dem Laden von Heute gesetzt (`weather`-Option von `openHome`).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine Prüfung gelockert: dieselben Erwartungen, nur die Reihenfolge der Test-Antworten ist fest. Die App selbst ändert sich nicht (kein Fehler im Verhalten, nur im Test).
- Keine Daten, kein Schema, kein Backup, kein Sync, kein `api/`.

## Prüfschritte (nach dem Merge)
1. Ich › Neuigkeiten, die Zeile zum Regen der nächsten 3 Stunden antippen: Wetter öffnet sich, die Stelle leuchtet oder der Hinweis sagt, wo sie erscheint.
2. Die Zeile zu «Wetter heute» antippen: Heute öffnet sich, die Zeile leuchtet oder der Hinweis nennt den Tag.

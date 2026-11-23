# Dein Gesicht ist eine Stimmungs-Antwort

Auftrag: Noah «a» (22.11.2026, Thread «Alle Sportarten und Erholung», Schritt C/F2: Gruss-Gesichter als Skalenfrage `spass.stimmung`)

## Was ist neu
- Ein Gesicht im Gruss («Wi gaht's?») wird als Antwort der Skalenfrage `spass.stimmung` (1–10) gespeichert, nicht mehr als `hallo.gaht`: Müed 1, Gaht so 3, Okay 6, Guet 8, Super 10. Wochenrückblick, Verlauf und Auswertungen lesen so EINE Stimmung.
- Ältere Antworten (`hallo.gaht`, Text-Schlüssel) bleiben unverändert gespeichert und werden gelesen: die «Letzte 7 Tage»-Punkte und «Gestern» im Gruss zeigen beide Arten (eine Zahl wird als das nächste Gesicht gezeigt).
- Wie jede Antwort dieser Frage schreibt es auch die Stimmung des Tageschecks (`flowChecks.mood`, `abdb.js` MIRROR). Nimmt man das Gesicht mit einem zweiten Tipp zurück, geht die Zeile und ihre Spiegelung im Tagescheck mit.

## Was fällt weg oder rutscht tiefer
- Neue Gesichter heissen im Verlauf nicht mehr «Wi gaht's?» (Text-Wert wie «Guet»), sondern «Wie ist die Stimmung?» mit der Zahl (8). Alte Einträge bleiben so, wie sie waren.

## Selbst entschieden
- Die Stelle auf der Skala ergibt sich aus dem Wert des Gesichts (`v` 0 → 1, 0.25 → 3, 0.5 → 6, 0.75 → 8, 1 → 10); beim Zurücklesen gewinnt das nächste Gesicht (bei Gleichstand das erste).
- Keine Umschreibung alter Daten, kein Schema, kein Backup-Format geändert; die Datenänderung ist nur, was neue Taps schreiben. Backup-Kopie-Test: ein altes Backup mit `hallo.gaht`-Zeilen öffnet mit der neuen App und zeigt die Punkte wie vorher (Test `tests/hallo-week.test.js`).
- Eigene Gesichter ohne Eintrag in der Liste der fünf Standard-Gesichter wurden schon vorher nicht gespeichert; das bleibt so.

## Entscheide (eigene Datei `docs/decisions/gruss-skala.md`)
- 22.11.2026: Gruss-Gesichter als Skalenfrage `spass.stimmung`, alte `hallo.gaht` bleiben lesbar.

## Stand im Plan (roadmap.md / vorhaben.md)
- Alle Sportarten und Erholung: Gruss-Skala erledigt; wartet auf Noahs Einzelfreigabe.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: Gruss antippen, ein Gesicht wählen. Ich › Daten › Verlauf: «Wie ist die Stimmung?» mit der Zahl.
2. Gesicht noch einmal antippen: Zeile weg.
3. Die Punkte «Letzte 7 Tage» zeigen auch ältere Tage.

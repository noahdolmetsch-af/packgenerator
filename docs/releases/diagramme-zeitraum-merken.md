# Jede Seite merkt sich ihren Zeitraum

22.11.2026 · Auftrag: Noah «4b» (Diagramme besser), Punkt 7 von 7 · `src/lib/flow/zeitraum.svelte.js`, Sportjahr, Rückblick pro Sportart, Start von Auswerten

## Was ist neu
- Sportjahr, Rückblick pro Sportart und der Start von Auswerten merken sich je ihren Zeitraum (Woche, Monat, Jahr, Alles, eigener Bereich). Eine Seite ändert die anderen nicht mehr.
- Eine Seite ohne eigene Wahl startet mit der bisherigen gemeinsamen Wahl, sonst mit der Woche.

## Was fällt weg oder rutscht tiefer
- Der eine gemeinsame Zeitraum für alle Seiten von Auswerten. Wer ihn gewohnt war, stellt ihn jetzt pro Seite ein.

## Selbst entschieden
- Gespeichert wird im Browser dieses Geräts (localStorage `pg.period.<seite>`), wie bisher. Kein Dexie, kein Backup-Format, keine Datenänderung der App-Daten. Der Zeitraum steht weiterhin nicht im Backup.
- Zurückblättern (‹) beginnt wie bisher bei jedem Besuch in der Gegenwart.

## Entscheide (für decisions/)
- Noah «4b»: Zeitraum je Seite merken (Diagramme besser machen).

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme besser machen: Punkt 7 von 7, damit alle sieben gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Sportjahr: «Jahr» wählen.
2. Auswerten öffnen: es springt nicht auf «Jahr».
3. Zurück ins Sportjahr: «Jahr» ist noch gewählt.

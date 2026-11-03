# Sportarten direkt in der Liste ändern

PR (Nummer folgt) · 02.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Meine Sportarten voll editierbar machen»), Teil 2 von 5

## Was ist neu
- Menü ⋯ bei jeder Sportart (links): Umbenennen, Pausieren/Fortsetzen, Nach oben/unten, Ganz nach oben/unten, Löschen (Verlauf behalten oder mit Verlauf, danach Rückgängig).
- Rechts «Sportarten deiner Touren»: Menü ⋯ mit Umbenennen, Ausblenden, Verschieben, Löschen; Knopf «Sportart der Touren» fügt eine eigene hinzu (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- nichts. Der Weg über die Seite der Sportart («Bearbeiten») und Ich › Listen bleibt.

## Selbst entschieden
- Eine eigene Sportart der Touren löschen: ihre Touren und ihr Material wandern zu Bikepacking (wie unter Ich › Listen), mit Rückgängig.
- Neue Menü-Komponente `RowMenu.svelte` für weitere Listen.

## Stand im Plan
- Konzept «Meine Sportarten»: Teil 2 von 5.

## Prüfschritte (nach dem Merge)
1. Aktiv › Meine Sportarten: ⋯ bei einer Sportart öffnen, umbenennen.
2. Pausieren, danach «Rückgängig».
3. Rechts «Sportart der Touren» tippen, einen Namen eingeben.

# Warteliste mit Daten: Tippfehler, Nebelmeer-Tage, Wertliste

PR #<Nummer> · 27.11.2026 · Auftrag: Noah «1-5 a» (Warteliste 6, 7 und 8), ein Paket als Einzel-PR, Freigabe am 27.11.2026

Dieser PR bringt die drei Teile der Warteliste, die Zahlen und Eingaben anfassen, in einem Zug. Die Einzelheiten stehen in den drei Dateien dazu: [tippfehler-gewicht.md](tippfehler-gewicht.md), [tippfehler-mehr.md](tippfehler-mehr.md), [nebelmeer-tage.md](nebelmeer-tage.md) und [wertliste.md](wertliste.md).

## Was ist neu
- **Tippfehler-Frage:** eine leise Zeile unter dem Feld («Meintest du 70?», «Ja, 70 kg», «Stimmt so») beim Gewicht, beim Material-Gewicht, bei den km am Zähler und bei einer eigenen Länge in Minuten. Sie blockiert nie.
- **Nebelmeer-Tage:** Heute merkt einen Tag über dem Nebel; die Sammel-Wand hat ein Regal dafür (ändern, löschen, Rückgängig); Heute zeigt leise die Winterzahl.
- **Wertliste:** neue Seite unter Material mit Summe für die Versicherung, Nachtragen von Preis und Kaufdatum, PDF auf dem Gerät und Kopie in Ich › Dokumente.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ein News-Eintrag für den ganzen PR (`src/lib/news/warteliste-mit-daten.js`) statt vier, weil er als ein Merge zählt.
- Die Prüfschritte stehen in den vier Einzeldateien; die Zahlen zu den Daten unten.

## Daten
- Kein Eingriff in Dexie-Schema, Backup-Format, Sync oder `api/`.
- Test mit einer Kopie von Noahs neuestem Backup (nur auf dem Test-Rechner, nicht im Repo): alle 39 Tabellen und 24'076 Zeilen unverändert nach dem Durchspielen der neuen Seiten, nur die App-eigene Tabelle `meta` bekam 2 Zeilen wie bei jedem Öffnen; keine Fehler in der Konsole.

## Stand im Plan
- Warteliste 6, 7 und 8 gebaut. Offen bleiben die Rückblick-Frage zum Nebelmeer, das Logbuch und Tippfehler bei Beträgen und Daten (tiefe Priorität).

# Eine Woche als Pause markieren

Auftrag: Noah «ok» zu Schritt I «Pausenwochen» (22.11.2026, Thread «Alle Sportarten und Erholung»; «alles freigegeben» 23.11.2026)

## Was ist neu
- Im Wochenrückblick (Karte «Rhythmus und Vergleich») hat jede Woche den Knopf «Als Pause markieren» (Ferien, Krankheit, ruhige Woche). Eine markierte Woche zählt nicht in «Deine übliche Woche» (Rückblick und Karte auf Heute). «Pausen-Markierung wegnehmen» und «Rückgängig» in der Meldung machen es rückgängig.
- Neue Einstellung `week.pauses` (Liste von Montagen, im Backup, nicht nur im Gerät).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Markierung steht im Rückblick der Woche selbst (kein eigener Ort in den Einstellungen). Die Woche selbst, ihre Zahlen und ihr Vergleich mit der Vorwoche bleiben sichtbar; nur die übliche Woche lässt sie aus.
- Eine Woche ohne irgendetwas bleibt weiterhin automatisch aus der üblichen Woche draussen, auch ohne Markierung.
- Datenänderung: eine neue Einstellung (Liste von Montagen), kein Schema, kein Backup-Format; ein altes Backup ohne diese Einstellung liest sich als «keine Pausenwochen».

## Entscheide (eigene Datei `docs/decisions/wochenpause.md`)
- 22.11.2026: Pausenwochen als Markierung pro Woche, die aus der üblichen Woche herausgenommen wird.

## Stand im Plan (roadmap.md / vorhaben.md)
- Alle Sportarten und Erholung: I erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wochenrückblick: «Als Pause markieren» in der Karte «Rhythmus und Vergleich»; die Zeile sagt, dass die Woche nicht in die übliche Woche zählt.
2. Rückgängig in der Meldung nimmt es zurück.

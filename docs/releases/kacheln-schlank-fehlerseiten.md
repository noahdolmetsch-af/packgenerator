# Kacheln schlank: gemerkte Fehlerantworten blockieren das Aufräumen nicht mehr

PR · 24.11.2026 · Auftrag: Noahs Bild von «Speicher auf diesem Gerät» am Mac (754 MB, davon 78 «nicht lesbare» Kartenbilder mit je ~8 MB) · Gruppe: Klarheit

**Nichts Sichtbares geändert, nur das Aufräumen im Hintergrund** (kein Bildschirm, keine Zeile, kein Text ändert sich; die Zahl in der Karte «Speicher auf diesem Gerät» wird kleiner).

## Was ist neu
- Das Neuladen alter Kartenkacheln (`src/lib/tilediet.js`) blieb bei Noah am Mac an 78 Kacheln hängen. Ursache, mit echten swisstopo-Kacheln nachgebaut: Workbox hat früher jede «opaque» Antwort gemerkt, auch Fehlerseiten. swisstopo antwortet für Stellen ausserhalb seiner Karte mit **400** (JSON, 78 Bytes). Solche Einträge liessen sich nie neu laden, und fünf Fehler hintereinander stoppten den ganzen Lauf bei jedem Start vorn in der Liste, sodass die Kacheln danach nie klein wurden.
- Neu: eine gemerkte Fehlerantwort (400, 404, 410) wird weggeräumt und der Lauf geht weiter. Bei 403, 429 und 5xx bleibt die Kachel erhalten, nach fünf solchen Antworten hintereinander hält der Lauf höflich an (wie bisher).
- Test mit 8 gemerkten Fehlerseiten und 10 echten Kacheln: alt blieben alle 18 «opaque» hängen, neu sind es 0 (10 Kacheln erneuert, 8 Fehlerseiten weg). Unit-Test deckt es ab (`tests/tilediet.test.js`).

## Was fällt weg oder rutscht tiefer
- nichts Brauchbares: weg gehen nur gemerkte Fehlerseiten (JSON-Text, der als Bild gespeichert war und nie angezeigt werden konnte). Keine echte Kachel, keine Offline-Karte (`pg-offline-map`), keine Daten, kein Backup.

## Selbst entschieden
- 400 zählt als «keine Kachel hier» (swisstopo sagt so für Orte ausserhalb der Karte). 403 und 429 nicht: dort kann ein gültiges Bild nur gerade gesperrt sein, darum bleibt es.
- Kein Backup nötig und keine Datenänderung: nur die zwei Kachel-Zwischenspeicher, die jederzeit neu laden.
- Keine News-Zeile: für Noah ändert sich nichts am Bildschirm.

## Stand im Plan
- Speicher senken: Handy ist bei 177 MB (vorher 8 GB). Am Mac blieben 78 Fehlerkacheln hängen; mit dieser Änderung räumt sich das beim nächsten Start auf.

## Prüfschritte (nach dem Merge auf der echten Seite, am Mac)
1. App öffnen und etwa 1 Minute warten.
2. Ich › Daten › «Speicher messen»: bei den Kartenkacheln steht «nicht lesbar» nicht mehr (oder nur noch wenige), die Zahl «Browser zählt» ist deutlich kleiner als 754 MB.

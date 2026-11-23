# Mein Tag: «nächste Blöcke» für Heute laut Plan (Schritt 4a)

PR # · 23.11.2026 · Auftrag: Noah 15:17 (Karte B «Heute laut Plan» statt «Dein Tag mit Wetter»); Plan `/mnt/project-files/notes/mein-tag-bauplan-2026-11-23/bauplan.md`

## Was ist neu
- Nichts Sichtbares. Neue Rechenfunktion `nextBlocks(entries, now, max)` in `src/lib/tag/timeline.js`: gibt die nächsten Blöcke des Tages zurück (was jetzt läuft, was noch kommt, dann Einträge ohne Zeit, dazu `more`). Sie nutzt dieselben Einträge wie die Zeitleiste (`buildWeek`), es gibt keine zweite Rechnung.
- Die Karte «Heute laut Plan» auf Heute baut der Design-Thread darauf auf.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Vorbei ist ein Block, wenn sein Ende vor «jetzt» liegt; die Zeitleiste auf «Mein Tag» zeigt ihn weiter, nichts geht verloren. Ein abgehakter Block, der noch läuft, bleibt mit Haken in der Liste.
- Ferien und Reisen (`away`) sind keine Blöcke.
- Kein neues Schema, kein Backup-Format, kein `api/`. Keine News-Datei, weil nichts sichtbar ist.

## Beitrag zu den Zielen (Noah 18:09)
- Klarheit und Auffindbarkeit: die Funktion liefert die Daten, damit Heute zeigt, was als Nächstes dran ist, und «Abhaken» vorne steht.

## Stand im Plan
- «Mein Tag»: Daten für Heute laut Plan fertig; als Nächstes «Plan mir den Tag» (Schritt 4).

## Prüfschritte
- Nichts zu prüfen (keine sichtbare Änderung); `npm test` deckt die Funktion ab.

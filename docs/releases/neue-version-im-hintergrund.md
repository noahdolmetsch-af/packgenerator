# Die App lädt sich nicht mehr von selbst neu

PR (Nummer folgt) · 27.11.2026 · Auftrag: Noah (Thread «Server-Klicks/Setup / Wächter»)

## Was ist neu
- Eine neue Version wartet im Hintergrund und schaltet sich erst ein, wenn die App aus dem Blick geht. Die sichtbare Seite, die Scrollposition und alles, was gerade getippt wird, bleiben.
- Nach einem Neuladen, auch wenn das Handy die App aus dem Speicher geworfen hat, geht die Seite wieder an ihre Stelle.
- Neue Tests: `tests/e2e/live/update.spec.js` (alte App offen, neue Version kommt, die Seite bleibt, dann Hintergrund: neue Version), zwei in `tests/e2e/zurueck-position.spec.js`, Einheitstests für `swupdate.js`, `autofresh.js`, `scrollmem.js`. Der Live-Check (`live.yml`) läuft nach jedem Deploy und jede Nacht.

## Was fällt weg oder rutscht tiefer
- Das automatische Neuladen der sichtbaren Seite nach einem Update (auch das einmalige «Frisch laden» 30 Sekunden nach dem Start) fällt weg; der Balken «Jetzt laden» zeigt sich nur noch, wenn eine neue Version sich nicht speichern lässt.

## Selbst entschieden
- Keine «Was ist neu»-Datei und keine Bilder: nichts Sichtbares geändert, nur das Verhalten beim Update.
- Ein sichtbares Neuladen gibt es nicht mehr, auch nicht ein sanftes «Neue Version, tippen zum Laden»: Noah will davon nichts mitbekommen.

## Entscheide (eigene Datei `docs/decisions/neue-version-im-hintergrund.md`)
- 27.11.2026: Neue Version nur im Hintergrund einschalten.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Die App am Handy öffnen, etwas weit nach unten scrollen, in ein anderes App wechseln und zurückkommen: die Seite ist an derselben Stelle.
2. Zwei, drei Stunden normal arbeiten, während neue Versionen online gehen: die Seite lädt sich nicht von selbst neu. Nach dem ersten Hintergrund-Wechsel zeigt Ich › Was ist neu die neueste Version.

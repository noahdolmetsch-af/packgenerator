# Nebelmeer: «Warst du über dem Nebel?» im Rückblick

PR #<Nummer> · 27.11.2026 · Auftrag: Noah «wieder aufnehmen» (die 4b-Frage aus «Nebelmeer-Tage», 22.11.2026)

## Was ist neu
- Der gespeicherte Rückblick einer Tour von Oktober bis März fragt unter dem Stempel leise: «Warst du über dem Nebel?» (`src/lib/sammlung/NebelOffer.svelte`, Regeln `askDays` in `src/lib/sammlung/nebelmeer.js`).
- «Ja, Tag merken» legt den Tag ins Regal «Nebelmeer» der Sammel-Wand (mit dem Namen der Tour; die Nebelhöhe ist freiwillig), mit Rückgängig. Danach steht auf der Karte «Als Nebelmeer-Tag gemerkt» mit dem Weg zur Sammel-Wand.
- «Nein danke» wird für die Tour gemerkt (Einstellung `fogSeaAsk`, in jedem Backup, keine Schemaänderung), mit Rückgängig.
- Bei einer Tour über mehrere Tage wählst du den Tag.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Gefragt wird nur bei Touren mit einem Tag zwischen Oktober und März (der Winter des Regals) und nicht, wenn der Tag schon gemerkt ist; ohne Ziel, ohne Serie, nichts wird ohne Tippen gemerkt (Noahs 4a).
- Kein neues Feld an der Tour: die abgelehnten Touren stehen in der eigenen Einstellung `fogSeaAsk` (wie `declined` beim Tourenpass), damit weder das Tour-Format noch das Backup-Format sich ändert.
- Die Frage steht nach dem Stempel, nicht davor: der Stempel ist die ältere Frage und die Nebelfrage nur im Winter.
- Die Fertig-Regel: Seite und Absprung sind der Rückblick selbst (kein neuer Eintrag in `features.js`, das Regal «Nebelmeer» bleibt die Funktion `f.collectwall`); «Gut zu wissen» und leerer Zustand ändern sich nicht (die Frage fehlt einfach, wenn nichts zu fragen ist).

## Entscheide (eigene Datei `docs/decisions/nebelmeer-rueckblick.md`)
- 27.11.2026: Noah «wieder aufnehmen».

## Stand im Plan
- Die Frage «Warst du über dem Nebel?» aus Warteliste 8 ist gebaut. Offen bleiben das Logbuch (L5) und Tippfehler bei Beträgen und Daten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › eine Tour von Oktober bis März öffnen › Rückblick: unter dem Stempel steht «Warst du über dem Nebel?».
2. «Ja, Tag merken»: die Karte sagt «Als Nebelmeer-Tag gemerkt»; «Sammel-Wand öffnen» zeigt das Regal mit dem Tag.
3. Bei einer anderen Wintertour «Nein danke»: die Frage geht weg, «Rückgängig» bringt sie zurück.

**Daten:** neue Einstellung `fogSeaAsk` (nur die Ids abgelehnter Touren) und Einträge in `fogSeaDays` wie bisher. Kein Eingriff in Dexie-Schema, Backup-Format, Sync oder `api/`; Test mit einer Backup-Kopie vor dem Merge.

# Gold schliesst am richtigen Tag

PR folgt · 23.11.2026 · Auftrag: Noah «du hast freie hand und darfst aufkommende fehler selbständig beheben» (Thread «Mockup für Kurse von Gold, SMI und Aktien»)

## Was ist neu
- Fund nach dem Merge von Kursblick: der Abruf bei den echten Quellen läuft (Stooq gab für Gold nichts, Yahoo sprang ein; SMI und Dollarkurs kamen von Yahoo). Aber Yahoo beschriftet die Tagesbalken von Gold (Futures) und vom Dollarkurs mit dem Abend davor: ein Balken, der am Sonntagabend beginnt, hiess «Sonntag», und der Letzte («22.11.») war schon der Beginn des Montags, kein Schlusskurs.
- Der Server ordnet diese Balken jetzt dem Tag zu, an dem sie enden (12 Stunden nach dem Start). Der Montag, der noch nicht gehandelt ist, ist «heute» und fällt weg; der letzte Schlusskurs ist der Freitag.
- Der SMI (Börse mit festen Zeiten) bleibt, wie er war.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur Gold und Dollarkurs bekommen die Regel («session» in `KURS_ASSETS`); Aktien in Welle K-B bekommen sie nicht, ihre Balken beginnen am Tag selbst.
- Stooq liefert für Gold nichts mehr (vermutlich ein Schlüssel nötig); Yahoo bleibt die Quelle. Ein Ersatz für die Gold-Reihe wird nicht gesucht, solange Yahoo antwortet.
- Keine Daten-, Backup- oder Schemaänderung; der Cache von Vercel (6 Stunden) und der Browser-Cache füllen sich von selbst neu.

## Prüfschritte (nach dem Merge)
1. Kursblick öffnen: der Tag unter dem Goldpreis ist ein Werktag (Freitag bis der Montag zu Ende ist).
2. Quellen: «Tag des Schlusskurses» für Gold und Dollarkurs ist derselbe Werktag.

# Spruch auf Heute: eigene Sprüche (PR 4)

PR folgt · 07.11.2026 · Auftrag: Noah «bau spruch pr3 und 4» (Thread «Entwerfen: täglicher Einstiegs-Spruch»)

## Was ist neu
- Im Fenster **«Alle Sprüche»** gibt es den Abschnitt **«Eigene Sprüche»**: einen Spruch schreiben (bis 140 Zeichen, eine Zeile), einen Ton wählen (Motivierend, Ruhig, Lustig, Vision, Herausforderung) und **Hinzufügen**.
- Jeder eigene Spruch hat einen **Schalter** (ein/aus), **Bearbeiten** (Text und Ton) und **Löschen** (die App fragt, danach **Rückgängig**). Ein Schalter für alle eigenen Sprüche steht über der Liste.
- Die eigenen Sprüche kommen **mit den anderen** auf der Kachel, mit dem Etikett «Eigene». Sie erscheinen **so, wie du sie schreibst** (keine Übersetzung, keine Mundart-Umwandlung). «Warum?» sagt: «Ein Spruch, den du selbst geschrieben hast.»
- Es gelten dieselben Regeln wie für alle Sätze: Ton-Wahl, Schalter, Verlauf der letzten 30 (nie derselbe), nie dieselbe Quelle zweimal hintereinander. Ein eigener Spruch im Ton «Herausforderung» kommt nur an einem Tag, an dem Schlaf und Ruhepuls im Normal sind.
- Auch ohne Zahlen und ohne Zitate ist die Kachel nicht mehr leer, sobald du einen eigenen Spruch hast.

## Was fällt weg oder rutscht tiefer
- nichts. Das Fenster «Alle Sprüche» hat oben einen neuen Abschnitt.

## Selbst entschieden
- **Speicherung (Daten, deshalb Einzelfreigabe):** eigene Einstellungszeile `home.spruch.own` = `{ items: [{ id, text, ton }] }`. Keine neue Tabelle, kein neues Schema, kein `api/`. Die Zeile steht im Backup und im Abgleich zwischen Geräten (nicht in `DEVICE_SETTINGS`), wie `home.spruch`. Ein Test baut ein Backup, stellt es in einer leeren Datenbank wieder her und prüft die Sprüche, den Ton und die Schalter.
- Höchstens **40** eigene Sprüche und **140** Zeichen, damit die Kachel ruhig bleibt; ein Zeilenumbruch wird zu einem Leerzeichen.
- Eigene Sprüche kommen gleich oft wie jeder andere Satz (kein Vorrang). Wer sie öfter sehen will, schaltet im Fenster eine Quelle aus oder wählt den Ton.
- Platzhalter wie «{km}» gibt es nicht: Ein eigener Spruch ist fester Text. Das ist einfach und bleibt privat; Zahlen können später kommen, wenn du sie willst.
- Der Text eines eigenen Spruchs geht nie durch `t()` (Texte, die du getippt hast). Die Beschriftungen drumherum gehen durch `t()` mit Deutsch in `i18n/de/spruch.js`.
- Die Sprüche sind privat: sie liegen nur auf dem Gerät und im Backup, nie im Repo. Tests und Bilder nutzen erfundene Sprüche.
- Fertig-Regel: kein Katalog-Eintrag (siehe PR 1), leere Ansicht: «Noch keine eigenen Sprüche. Schreib unten einen.»; nach dem Hinzufügen bestätigt die Meldung «Spruch hinzugefügt.» mit Rückgängig; Zeile in `docs/app-stand.md` aktualisiert.

## Entscheide (für decisions.md)
- 07.11.2026: Eigene Sprüche als feste Texte (Ton wählbar, bis 40 Stück), in der Einstellung `home.spruch.own`.

## Stand im Plan
- Spruch zum Einstieg: PR 4 von 4 (eigene Sprüche). Plan: `design/tagesspruch/konzept.md` im Projektordner. Damit ist der Plan vollständig gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute bei der Kachel «Spruch» «Alle Sprüche» tippen, unter «Eigene Sprüche» einen Spruch schreiben, einen Ton wählen und «Hinzufügen» tippen.
2. Fenster schliessen und «Neuer Spruch» tippen, bis dein Spruch kommt: er steht so da, wie du ihn geschrieben hast, mit dem Etikett «Eigene».
3. Im Fenster den Spruch bearbeiten und dann löschen: nach dem Löschen in der Meldung «Rückgängig» tippen, er ist wieder da.

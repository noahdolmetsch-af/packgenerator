# Heute sagt, wenn etwas nicht stimmt

PR folgt · 03.11.2026 · Auftrag: Noah «1a danach 3 und 4» (Thread «Finden: Was wir übersehen haben»)

## Was ist neu
- Auf Heute, in der Liste «Wichtig heute», erscheint eine ruhige Zeile mit einem Knopf, wenn etwas nicht stimmt: Platz im Browser über 80 % («Öffnen» führt zu Daten und Backup), der Browser behält die Daten noch nicht («Daten behalten»), der automatische Abgleich hat nicht geklappt («Jetzt versuchen»). Ist alles gut, steht nichts da (`src/lib/home/zustand.js`).
- Die letzte Sicherung und der Backup-Ordner hatten ihre Zeile schon und bleiben.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine eigene Kachel, sondern Zeilen in «Wichtig heute»: dort stehen schon Sicherung und Backup-Ordner, so gibt es einen Ort statt zwei. Die volle Übersicht mit allen Lichtern bleibt unter Ich › Daten und Backup › «Alles in Ordnung?».
- Strava, Offline-Karten und App-Version nicht aufgenommen: sie sind keine Gefahr für die Daten und haben ihre eigenen Hinweise. Auf Zuruf nachziehbar.
- Keine neue Funktion im Katalog (`features.js`): es sind Zeilen einer bestehenden Liste, ohne eigene Seite.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Lücken-Vorschläge 02.11.: Schritt 3 (Zustand) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: ist alles gut, ist keine zusätzliche Zeile da.
2. Ich › Daten und Backup › «Alles in Ordnung?»: alle Lichter stehen weiter da.

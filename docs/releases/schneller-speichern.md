# Schneller starten, schneller speichern

Auftrag: Noah «ja» (Thread «Messen: warum die App langsam ist»), Bericht `notes/messen-2026-11-10/README.md` im Projektordner.

## Was ist neu
- Die Datenbank (`src/lib/db.js`) öffnet mit `cache: 'disabled'`. Dexie 4 kopierte bisher jedes Ergebnis jeder Live-Abfrage tief. Mit Noahs echten Daten (1'440 Fahrten, 27 MB) lasen und kopierten beim Speichern 6 bis 17 Stellen alle Fahrten neu.
- Gemessen mit dem Backup vom 08.11., Handy-Ansicht, 4× gebremster Prozessor (1× in Klammern):
  - Start bis die App ruhig ist: 108 s → 38 s (30 s → 12 s).
  - Eine Tour speichern: 14 s → 1.5 s. Eine Einstellung speichern: 3.7 s → 0.02 s. Eine Fahrt speichern: 35 s → 4.5 s.
  - Analyse öffnen: 3.8 s → 0.05 s (1×). Touren 4.6 s → 1.3 s (1×).
  - Speicher im Browser beim Start: 2.5 GB → 0.8 GB (kein Tab-Absturz mehr).
- Neuer Test `tests/dbcache.test.js`: die Einstellung bleibt, und Live-Abfragen melden weiter jede Änderung.

## Was fällt weg oder rutscht tiefer
- nichts. Keine Daten, kein Schema, kein Backup-Format geändert.

## Selbst entschieden
- Nur diese eine Einstellung (Punkt 1 der Messung). Die weiteren Punkte (Fahrten schlank halten, `ensureTrips` schreibt bei jedem Start 10 Touren, Abgleich-Runden) sind eigene kleine PRs.
- Keine Bilder: nichts Sichtbares ändert sich, nur die Geschwindigkeit.
- `cache: 'disabled'` ist das Verhalten von Dexie 3: Ergebnisse sind frische Kopien aus der Datenbank, eine Seite, die ein Ergebnis ändert, verändert nichts anderes.

## Stand im Plan
- Tempo: Messung vom 10.11. Punkt 1 erledigt, Punkte 2 bis 4 offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App neu laden und Heute öffnen: nach wenigen Sekunden sollte nichts mehr ruckeln (vorher bis zu 30 s).
2. Auswerten › Analyse öffnen, dann Touren: kein langes Warten.
3. Eine Tour ändern und speichern: die Seite bleibt bedienbar.

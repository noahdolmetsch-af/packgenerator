# Kosten-Schätzung im Begleiter

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Velopflege zum Inspektions-Begleiter machen»), Schritt E von A–E

## Was ist neu
- Im Begleiter (`src/lib/inspect/InspectRun.svelte`) steht bei einem Punkt «Ein neues kostet etwa CHF … (letzter Preis am …)», sobald das Teil abgenutzt ist oder du «Selbst richten» oder «Werkstatt» wählst und für das Teil ein Preis bekannt ist.
- In der Zusammenfassung am Ende steht bei jedem Punkt «etwa CHF …, letzter Preis» und darunter «Geschätzte Kosten: CHF …» (Summe der Punkte «Selbst richten» und «Werkstatt»; «Beobachten» zählt nicht). Fehlt bei einem Punkt der Preis, sagt es «N Punkte ohne bekannten Preis».
- Der Preis ist der letzte bezahlte Preis dieses Teils an diesem Velo: ein Ersatz mit Preis, selbst eingetragen oder aus einem Werkstatt-Besuch. Rechnung `src/lib/care/estimate.js` (reine Funktionen, `tests/estimate.test.js`). Nichts wird gespeichert.
- «Letztes Mal» (wie der Punkt beim letzten Check stand) gibt es seit Schritt C im Begleiter.

## Was fällt weg oder rutscht tiefer
- Nichts. Es kommen nur Zeilen dazu; ohne bekannten Preis erscheint nichts.

## Selbst entschieden
- Keine Preisliste und keine Schätzung ohne Preis: nur was du selbst bezahlt oder eingetragen hast. Falsche Zahlen wären schlimmer als keine.
- «Beobachten» zählt nicht in die Kosten, weil noch nichts ersetzt wird.
- Die Schätzung steht nur im Begleiter (Punkt und Zusammenfassung). Bei «Auf einen Blick» steht der Preis der Kette schon (seit Schritt A).
- Keine neue Datenhaltung, kein Backup-Format, kein `api/`. Fertig-Regel: keine neue Seite, deshalb kein neuer Eintrag in `features.js`; Ordnung und Zeilen der bestehenden Begleiter-Seite.

## Entscheide
- Siehe `docs/decisions/velopflege-kosten.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Velopflege-Begleiter: Schritte A bis E gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege › Monatlichen Check starten, bis zur Kette: 0,55 eintragen. Unter dem Wert steht «Ein neues kostet etwa CHF …», wenn du einen Preis erfasst hast.
2. Den Check bis zum Ende durchgehen: unter «Was zu tun ist» steht «Geschätzte Kosten».

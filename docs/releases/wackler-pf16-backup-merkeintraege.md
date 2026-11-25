# Wackel-Test PF16 (Backup-Rundlauf): Merk-Einträge von Heute zählen nicht als Zugang

PR #PRNR · 25.11.2026 · Auftrag: Wackel-Wächter (Bündler, Vorrang: `pf.spec.js:940` war auch auf unverändertem main rot und hielt PR 1760 auf)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `pf.spec.js` PF16 («Backup-Rundlauf»).
- **Ursache** (nachgestellt, 2 von 12 Läufen rot auf dem Computer, keine Wartezeit-Frage, kein Fehler der App): der Test macht einen Snapshot aller Tabellen, speichert ein Backup, importiert es und prüft, dass alles gleich zurückkommt. Heute legt aber zwei Merk-Einträge in den Einstellungen erst an, wenn die Kachel gezeigt wird: `home.spruch` (der gezeigte Spruch, `src/lib/home/spruch.js`) und `flow.medSeed` (die drei Meditations-Vorlagen, einmal, `src/lib/flowdb.js`). Je nach Zeit fiel das Anlegen vor oder nach den Snapshot; kam es danach, hatten die Einstellungen nach dem Import einen Eintrag mehr (`home.spruch` mit dem Spruch «t.far», oder `flow.medSeed = true`). Im Backup-Test steht schon dasselbe Muster für `tips` und `quickLinks.used.*`.
- **Fix im Test:** die beiden Einträge zählen wie `tips` nicht als Zugang und nicht als Änderung. Ausserdem prüft der Test jetzt: war einer davon schon im Snapshot, muss er nach dem Import zurück sein (das Backup darf ihn nicht verlieren). Nichts gelockert, keine feste Wartezeit.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test wartet nicht auf die beiden Einträge, weil Heute sie nicht immer anlegt (nur beim Zeigen der Kachel); das Warten auf einen nicht sicheren Zustand wäre selbst ein Wackler. Darum die Ausnahme mit der Rückkehr-Prüfung.
- Keine App-Änderung: das späte Anlegen ist gewollt (wie bei den Tipps), kein Datenverlust.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün, PF16 auf Handy und Computer. In der App nichts zu prüfen.

# Dazu nötig: das kleine Teil wird nicht vergessen

PR (G1) · 23.11.2026 · Auftrag: Noah «G1 G2 G3» (Thread «Packen leichter und besser machen»)

## Was ist neu
- Im Fenster eines Teils (Material, auch aus Packen) gibt es die Zeile «Dazu nötig»: du wählst die Teile, die zu diesem gehören (zum Beispiel Ladekabel und Ersatzakku zur Helmlampe). Jedes lässt sich mit dem × wieder herausnehmen.
- Bei einer geplanten Tour zeigt die Karte «Bereit zur Abfahrt?» eine neue Zeile «Dazu nötig: Ladekabel fehlt» (oder «3 Teile fehlen»), wenn ein Teil auf der Liste ein Begleitteil hat, das nicht darauf steht. Ein Tipp öffnet ein Fenster: «Hinzufügen» legt das Teil in seine übliche Tasche (mit «Rückgängig» wie jede Änderung der Liste), «Diesmal nicht» lässt es nur für diese Tour weg.
- Die App schlägt auch Teile vor, die auf deinen letzten Touren immer mit einem anderen Teil dabei waren (mindestens 3 abgeschlossene Touren), mit dem Vermerk «Auf deinen letzten 3 Touren immer mit … dabei». Höchstens 3 solche Vorschläge; Teile, die auf mehr als der Hälfte aller Touren mitgehen (Jacke, Velocomputer), und Paare, die nur in der kalten Jahreszeit zusammenfallen, werden nicht vorgeschlagen.
- Regeln und Tests: `src/lib/pack/dazu.js`, `src/lib/pack/dazufeld.js`, `tests/dazu.test.js`; Fenster `src/lib/pack/DazuSheet.svelte`; Zeile in `src/lib/trip/ampel.js`.

## Was fällt weg oder rutscht tiefer
- Nichts. Die Zeile steht nur in der bestehenden Karte «Bereit zur Abfahrt?» und nur, wenn etwas fehlt; über der Packliste kommt nichts Neues dazu (Content first).

## Selbst entschieden
- Der Name ist «Dazu nötig», nicht «Gehört dazu»: «Gehört dazu» heisst in der App schon die Zeile mit Links oben auf einer Seite (Heute als Begleiter). Neues Wort, eigene Zeile in `docs/namen.md`.
- Die Zeile steht in der Karte «Bereit zur Abfahrt?» statt als neue Karte, damit die Packliste nicht länger wird. Mit einem fehlenden Begleitteil heisst die Karte «Fast bereit».
- Das Feld heisst `withIds` und liegt am Teil; es gibt keine Änderung am Datenbank-Schema. Ein Teil, das du nie öffnest, bekommt das Feld nicht. Löschst du ein Begleitteil, wird die Verknüpfung still übergangen.
- Gelernte Paare sind streng (3 Touren, 90 % mit, 80 % nie ohne das andere, beide Teile auf höchstens der Hälfte der Touren, höchstens 3 Vorschläge), lieber zu wenig als zu viel. Der erste Entwurf war lockerer und gab auf Noahs Sicherungskopie auf 26 von 30 Touren Vorschläge, meist Kältesachen (Velocomputer zu Beinlingen); daraus kam die Strenge. Auf Wunsch kann die Schwelle später gesenkt werden.
- Gelernte Paare lassen sich noch nicht mit einem Tipp «Immer zusammen» fest verknüpfen; das geht über das Fenster des Teils. Ein Tipp dafür folgt, wenn es gebraucht wird.
- Keine eigene Funktionsseite und kein neuer Eintrag in `features.js`: die Zeile gehört zur Packliste und zum Fenster eines Teils (wie bei der Tour-Ampel); die Zeile «Packliste» in `docs/app-stand.md` ist ergänzt.
- Wer die Zeile nicht will: «Diesmal nicht» pro Teil; ein Schalter für alles folgt nur auf Wunsch.

## Test mit einer Kopie von Noahs Sicherung (vor jeder Datenänderung)
- Mit der Sicherung vom 23.11.2026 04:47 (nur lokal gelesen, nichts davon im Repo): 412 Teile, 58 Touren, 30 Rückblicke. Öffnen und Speichern jedes Teils lässt `withIds` weg (0 von 412 bekamen das Feld), alle anderen Felder bleiben, wie sie waren. Die Vorschläge für die letzten 30 Touren rechnen zusammen in 65 ms und ändern nichts an den Daten.
- Neues Feld = keine Änderung am Schema, am Backup-Format und am Abgleich: ein Teil wird als Ganzes gespeichert und abgeglichen, das Feld reist mit.

## Entscheide (eigene Datei `docs/decisions/gehoert-dazu.md`)
- 23.11.2026: Begleitteile nur als Vorschlag, gelernte Paare nur streng (Verweis auf die Datei).

## Stand im Plan (roadmap.md / vorhaben.md)
- Packen leichter und besser: G1 gebaut. G2 «Abendblick unterwegs» und G3 «Griffbereit» folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material öffnen, ein Teil antippen, in der Zeile «Dazu nötig» ein zweites Teil wählen, speichern.
2. In Packen eine geplante Tour öffnen, die nur das erste Teil hat; die Karte «Bereit zur Abfahrt?» aufklappen: die Zeile «Dazu nötig» steht da.
3. Zeile antippen, «Hinzufügen»: das Teil steht auf der Liste, «Rückgängig» nimmt es wieder weg.

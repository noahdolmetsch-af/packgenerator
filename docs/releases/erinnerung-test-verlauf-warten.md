# Test «Erinnerung»: Neuladen und Seitenwechsel erst, wenn das geschlossene Fenster seinen Verlaufsschritt abgegeben hat

PR #<Nummer> · 25.11.2026 · Auftrag: Regel 3 / Wackel-Wächter (Thread «Wackel-Tests zuverlässig machen»; `erinnerung.spec.js:29`, Handy, `net::ERR_ABORTED` bei `page.goto('./buchen/#…')`, gemeldet auf PR 1738)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für die Erinnerung an die Kunden. Ein geschlossenes Fenster nimmt seinen Verlaufsschritt eine Aufgabe später zurück (`backclose.js`). Ging der Test genau dazwischen neu laden oder auf `/buchen/` wechseln, brach dieser Rückschritt die Navigation ab (`ERR_ABORTED`). Ein Mensch ist dafür zu langsam.
- Der Test wartet jetzt (auf den Zustand, nicht auf Zeit), bis der Verlaufseintrag des Fensters weg ist: nach «Eigener Text» speichern vor dem Neuladen und nach «Zeit öffnen» vor dem Wechsel auf `/buchen/`. Dieselben Prüfungen wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert, keine feste Wartezeit. Auf main liess sich der Fehler in 12 Läufen mit 4 Arbeitern nicht nachstellen; die Ursache folgt aus dem Code und ist dieselbe wie bei `bedienung.spec.js:31` und `haustuer:150`. Mit dem Fix 3 frische Läufe grün (Handy und Computer).

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.

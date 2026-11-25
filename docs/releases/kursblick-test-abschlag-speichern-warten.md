# Test «Kursblick»: Neuladen erst, wenn der Händlerabschlag wirklich gespeichert ist

25.11.2026 · Auftrag: Wackel-Wächter (Thread «Wackel-Tests zuverlässig machen»; `kursblick.spec.js:50`, gemeldet vom Bündler auf PR 1752: «Händlerabschlag nach Reload 5 statt 4»)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für den Kursblick. Die Seite Gold speichert den Händlerabschlag im Hintergrund (erst 5, dann 4 über «Münzen»). Lud der Test genau dazwischen neu, war die 4 noch nicht gespeichert und es kam die 5 zurück. Ein Mensch ist dafür zu langsam.
- Der Test wartet jetzt auf den Zustand (der gespeicherte Wert ist 4), nicht auf Zeit, und lädt erst dann neu. Dieselben Prüfungen wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert, keine feste Wartezeit. Der Fehler liess sich lokal nicht nachstellen; die Ursache folgt aus dem Code (`setAbschlag` speichert asynchron). Mit dem Fix 3 frische Läufe grün (Handy und Computer). Eintrag in `docs/wackelliste.md`.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.

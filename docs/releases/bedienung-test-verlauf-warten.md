# Test «Tastenkürzel»: «n» wartet, bis das geschlossene Fenster seinen Verlaufsschritt abgegeben hat

PR #1783 · 24.11.2026 · Auftrag: Regel 3 (Thread «Wackel-Tests zuverlässig machen»; `bedienung.spec.js:31`, am Computer 1 von 3 rot: «n» öffnet «Neu» nicht)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für die Tastenkürzel. Nach «Esc» im Fenster «Tastenkürzel» nimmt das Fenster seinen Verlaufsschritt eine Aufgabe später zurück (`backclose.js`). Drückte der Test «n» genau dazwischen, öffnete sich «Neu» und wurde vom Zurück-Schritt gleich wieder geschlossen. Ein Mensch ist dafür zu langsam.
- Der Test wartet jetzt (auf den Zustand, nicht auf Zeit), bis der Verlaufseintrag des geschlossenen Fensters weg ist, und drückt dann «n». Dieselben Prüfungen wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert, keine feste Wartezeit. Lokal 4 frische Läufe grün (Computer).

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.

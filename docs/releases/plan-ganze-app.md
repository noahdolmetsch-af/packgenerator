# Plan-Wächter: der Plan «ganze App» wird geprüft

PR #? · 07.11.2026 · Auftrag: Noah «a» (Thread «Skizzieren: Tour von A bis Z und Datencenter», Frage «Wie stellen wir sicher, dass das umgesetzt wird?»)

## Was ist neu
- `docs/plan-ganze-app.md`: alle Schritte 0 bis 8 des Entwurfs «Die ganze App aus einem Guss» in einer Tabelle (Schritt, Titel, PR, Stand `offen`/`gebaut`/`online`, Weg).
- `tests/plan.test.js` (Plan-Wächter): prüft, dass die Tabelle vollständig ist (P1), dass ein Schritt «online» seinen Weg in der App noch hat (P2) und dass ein erreichter Schritt nicht still zurückgesetzt wird (P3, Liste in `tests/fixtures/plan-online.json`). Offene Schritte machen ihn nie rot.
- `node scripts/plan-stand.mjs` meldet «Plan: X von Y online» für die Zeile nach jedem Merge.
- Nichts davon ist in der App sichtbar.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Schritte sind feiner geschnitten als im Entwurf (0a/0b, 2a/2b, 3a/3b, 4a/4b, 5a/5b, 7a/7b), weil jeder PR einzeln freigegeben wird.
- Der Weg wird als Datei, Text in einer Datei oder Funktion aus `features.js` geprüft, weil es nur so ohne Browser im Test geht.
- Alle 15 Zeilen stehen auf `offen`. Der Bau-Thread von Schritt 0 setzt seine Zeilen mit seinem PR auf `gebaut` und nach dem Merge auf `online`.

## Entscheide (für decisions.md)
- 07.11.2026: Der Plan «ganze App» wird mit einem Wächter-Test geprüft, ein erreichter Schritt geht nicht still verloren (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Prüfung steht, kein Schritt online.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App zu sehen. Auf GitHub unter `docs/plan-ganze-app.md` steht die Tabelle mit 15 Schritten, alle «offen».
2. Unter Actions ist der Lauf «build» grün.

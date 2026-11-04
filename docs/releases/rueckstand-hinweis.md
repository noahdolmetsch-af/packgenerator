# Hinweis, wenn ein PR hinter main liegt

PR (diese Änderung) · 04.11.2026 · Auftrag: Noah «Test-Plan 4 1 2», Punkt 2 (Thread «Prüfen: Warum die Tests langsam sind»)

## Was ist neu
- Liegt ein PR mehr als einen Tag hinter `main` (sein Ast ist vor mehr als 24 Stunden von `main` abgezweigt), zeigt die Prüfung «build» eine gelbe Notiz: «Dieser PR liegt N Tage und M Merges hinter main. Main hineinmergen …». Die Notiz steht auch in der Zusammenfassung des Laufs.
- Die Prüfung wird davon nie rot. Nichts wird ins Repo geschrieben: `main` in den PR mergt Claude nur mit Noahs ok.
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «Hinter main» heisst: `main` hat einen neuern Stand als die Abzweigung des PRs, gemessen am Zeitunterschied zwischen dem letzten `main`-Commit und dem Punkt, wo der PR abzweigte, und mindestens ein Merge ist dazugekommen.
- Das Skript `scripts/behind-main.mjs` fängt jeden Fehler ab und lässt die Prüfung weiterlaufen.
- `docs/app-stand.md` bleibt unverändert: keine App-Funktion.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan
- Verschlanken (Tests und Tempo): Test-Plan Punkt 2. Punkt 4 liegt als eigener PR vor, Punkt 1 folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Bei einem PR, der älter als ein Tag ist, zeigt «build» unter Annotations eine gelbe Notiz «PR liegt hinter main».
2. Bei einem frischen PR steht dort nichts, und «build» bleibt grün.

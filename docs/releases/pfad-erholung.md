# Pfad nennt auch die Seite unter dem Reiter

PR #1783 · 23.11.2026 · Auftrag: Fix nach «Pfad aus einer Quelle» (Thread «Navigation ohne Sackgassen»); main war rot (`tests/e2e/routinen-erholung.spec.js`)

## Was ist neu
- Der Pfad beginnt mit dem Ort und dem Reiter der Seitenleiste. Liegt die Seite unter einem Reiter mit mehreren Seiten (Training: Plan, Sport, Erholung …), nennt er jetzt auch diese Seite: «Woche › Training › Erholung». Vorher fiel dieser Schritt weg, weil er als «Reiter» galt (`trailOf` in `src/lib/nav/wege.js`, mit `subOf` aus der Karte der App).
- «Was mir gut tut» (`#/routine`) zeigt wieder «Woche › Training › Erholung › Was mir gut tut».

## Was fällt weg oder rutscht tiefer
- nichts. Der Schritt «Erholung», den «Pfad aus einer Quelle» versehentlich entfernt hatte, ist wieder da.

## Selbst entschieden
- Die erste Seite eines Reiters (zum Beispiel «Training» selbst) bekommt keinen zweiten Schritt mit demselben Namen.
- Der Test `tests/e2e/routinen-erholung.spec.js` bleibt wie er ist (die Absicht war richtig: der Pfad nennt «Erholung»); der Unit-Test `tests/wege.test.js` erwartet jetzt die drei Schritte.

## Entscheide
- Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche › Training › Erholung öffnen: der Pfad lautet «Woche › Training › Erholung».
2. Dort auf «Was mir gut tut» tippen: der Pfad beginnt mit denselben drei Namen.

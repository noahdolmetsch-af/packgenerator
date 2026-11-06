# Wächter «Seitengrösse»

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «Idee A: Tempo-Runde für Seiten» (Thread «Umsetzen Tempo-Runde für Seiten»)

## Was ist neu
- Nichts in der App. Ein neuer Test (`tests/e2e/seitengroesse.spec.js`, Fenster 390 px breit) zählt auf den 14 langsamsten Seiten, wie viele Elemente sie aufbauen (Touren, Material, Wunschliste, Vorrat, Velos, Pflege, Bausteine, Aktiv, Meine Sportarten, Meilensteine, Träume, Neuland, Deine Abfragen, Wohlbefinden). Baut eine Seite mehr als ihr Budget, wird der Test rot: «Seite wird träger, baue zugeklappte Teile erst beim Öffnen».
- Das Budget (`tests/seitengroesse-budget.json`) ist der Stand vom 05.11.2026 (erfundene Daten) plus 12 %. Neu schreiben: `SEITE_UPDATE=1 npx playwright test tests/e2e/seitengroesse.spec.js --project=desktop`, mit einem Grund im PR.
- Gezählt werden Elemente, nicht Millisekunden: die Zahl ist auf jedem Rechner gleich, der Test wackelt nicht.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Fenster 390 px breit, aber im Computer-Projekt: so läuft der Test schon im ersten Lauf (Wächter) und wartet nicht auf die Handy-Freigabe.
- 12 % Luft, damit ein neuer kleiner Knopf nicht gleich rot macht. Wird eine Seite leichter, bleibt das alte Budget, bis jemand es senkt.
- Der Test sitzt im normalen Browserlauf, nicht im Nachtlauf.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo-Runde für Seiten (Idee A, «Neuer Schwung»): Schritt «Messwert in den Wächter». Bericht: notes/tempo-runde-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub: der Lauf «e2e (desktop)» ist grün , der Test «Seitengroesse» steht in der Liste und ist grün.

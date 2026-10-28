# Eintrag «Online» auf GitHub

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «5a» (Thread «Verbessern Weg von gebaut zu online»); gewünscht schon am 26.10.2026 «1a»

## Was ist neu
- Nach jedem Online-Gehen schreibt GitHub selbst einen Eintrag unter github.com/noahdolmetsch-af/packgenerator/releases: «Online: v0.244.0», mit allen PRs, die seit dem letzten Eintrag dazugekommen sind, und ihrem «Was ist neu»-Titel auf Deutsch.
- Neu `scripts/release-notes.mjs` (schreibt den Text) und der Schritt «release» in `.github/workflows/deploy.yml` (läuft nach «deploy», nur auf main).

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile «Online: …» von Claude im Thread bleibt.

## Selbst entschieden
- Der Eintrag entsteht erst nach dem Online-Gehen; schlägt er fehl, ist die App trotzdem online.
- Merges ohne «Was ist neu» (Tests, Regeln) stehen auch drin, ohne Titel.
- Der erste Eintrag zeigt nur den letzten Merge, weil es davor noch keinen Eintrag gibt.

## Entscheide (für decisions.md)
- (steht schon unter «27.10.2026 Weg von gebaut zu online»)

## Stand im Plan
- Weg zu online: Schnellspur (#320) und Eintrag «Online» erledigt.

## Prüfschritte (nach dem Merge)
1. github.com/noahdolmetsch-af/packgenerator/releases öffnen.
2. Oben steht «Online: v…» mit diesem PR und der Version, die in der App unter Ich › Was ist neu steht.

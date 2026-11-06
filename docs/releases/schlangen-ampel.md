# Schlangen-Ampel für das Label «ok»

PR # · 05.11.2026 · Auftrag: Noah «2a» (Thread «Verbessern: GitHub-Warteschlange und Tests»)

Nichts in der App ändert sich: ein Hilfsskript für Claude und den Bündler (`scripts/schlange.mjs`).

## Was ist neu
- `node scripts/schlange.mjs` zählt, wie viele Test-Jobs auf GitHub gerade warten oder laufen, und sagt Grün, Gelb oder Rot. Grün (unter 30 Jobs) sagt auch, wie viele PRs jetzt «ok» bekommen dürfen (ein PR mit «ok» bringt etwa 6 Jobs). Gelb (30–59) und Rot (ab 60): noch kein «ok» setzen.
- Grund: GitHub gibt 20 Rechner gleichzeitig und kennt keine Vorfahrt. Am 05.11.2026 standen 131 Handy-Test-Teile in der Schlange, und das Online-Stellen von main wartete über eine Stunde dahinter.
- Das Skript liest nur und ändert nichts. Es braucht `gh` mit Lesezugriff. Kann es die Schlange nicht lesen, sagt es «kein ok setzen».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Schwellen 30 und 60 Jobs, 6 Jobs pro PR (Build, Wächter, 5 Handy-Teile, Prüfung): einfach anpassbar oben im Skript.
- Kein Workflow und keine Automatik: das Label «ok» setzt weiter Claude, nachdem Noah freigegeben hat, und der Bündler schaut vorher auf die Ampel. So entsteht kein zusätzlicher Lauf in der Schlange.
- Keine News-Datei, weil nichts sichtbar ist.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge)
1. `node scripts/schlange.mjs` im Repo ausführen: eine Zeile mit Farbe und Zahlen.
2. Bei Rot: «ok» erst setzen, wenn die Ampel wieder Grün zeigt.

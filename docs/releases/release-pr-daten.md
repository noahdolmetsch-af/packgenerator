# Alle Releases, Teil 1: jede Neuigkeit kennt ihre PR-Nummer

PR (offen) · 27.11.2026 · Auftrag: Noah «alles freigegeben» (Thread «Alle Releases mit Testanleitung auflisten»)

Nichts Sichtbares geändert, nur Daten im Bau der App: Die Liste aller Releases kann ab jetzt für jedes Release sagen, zu welchem PR (Änderungs-Paket bei GitHub) es gehört, und kennt auch die Releases, die man nicht sieht. Die Ansicht dafür folgt im nächsten PR (Teil 2).

## Was ist neu
- `scripts/news.mjs` liest die PR-Nummer aus dem Merge von `main` und gibt sie jeder Neuigkeit mit (`pr` am Eintrag).
- Die **249 Releases ohne sichtbare Änderung** (Tests, Regeln, Reparaturen: «Nichts zu testen») stehen jetzt in einer eigenen Liste `RELEASES_OHNE` (`src/lib/news/ohne.gen.js`, wird beim Bauen geschrieben wie die anderen `.gen.js`, nicht in Git). Sie gehören nicht zu `WHATS_NEW`: jede Zahl in «Was ist neu» (zum Beispiel «1317 Updates») bleibt, wie sie war.
- Die 241 von Hand nummerierten Versionen (0.1.0 bis 0.234.0) haben ihre PR-Nummer in einer festen Liste (`src/lib/whatsnew-alt-pr.js`, `prOf()` in `whatsnew-full.js`). Sie ist aus der Git-Geschichte gewonnen; für die ersten Tage (4. bis 9.10.2026) aus der Version in `package.json` je Merge, weil dort ein Commit viele Einträge brachte.
- Test `tests/release-pr.test.js`: PR-Nummer lesen, Titel aus dem Merge, Releases ohne News-Datei, jede alte Version hat eine Nummer, nichts doppelt.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Die unsichtbaren Releases sind **keine** Einträge von `WHATS_NEW`, damit «Ausprobieren», die Kachel «Neu» und alle Zähler gleich bleiben.
- Ein Merge ohne Titel (Dependabot, eine von Hand gemergte Branch) bekommt «Bibliotheken aktualisiert (automatisch)» oder die Überschrift seiner Release-Datei; einer (PR 377) bleibt ohne Titel, die Ansicht sagt dann «ohne Titel».
- Ohne volle Git-Geschichte (ein Vorschau-Build) fehlen die PR-Nummern der neuen Einträge; die Ansicht blendet sie dann aus (der Test dazu läuft nur mit voller Geschichte, `EXACT`).
- Die Datei `ohne.gen.js` lädt nur mit der Liste «Was ist neu» (`whatsnew-full.js`), nie mit dem Start. Die Grösse der Liste wächst um rund 8 KB auf etwa 2,65 MB (Grenze 3 MB).
- Kein Eintrag in `docs/app-stand.md`: die App kann dadurch nichts Neues.

## Entscheide (eigene Datei `docs/decisions/release-liste-in-app.md`)
- Der Plan «Release-Liste, Testrunde, Logbuch-Link, Kommentar» mit Noahs Antworten.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Alle Releases» in der App: Teil 1 (Daten) gebaut. Teil 2 (Ansicht), 3 (Testschritte zum Abhaken), 4 (Link-Wächter), 5 (Testrunde, Logbuch-Link, Kommentar) folgen, je ein eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › «Was ist neu» öffnen: alles sieht aus wie vorher, die Zahl der Updates ist dieselbe.
2. Die Seite lädt ohne Fehler in der Konsole.

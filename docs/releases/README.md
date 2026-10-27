# Releases: eine Datei pro PR

Seit 27.10.2026 (Noah «1a», Versionsnummer beim Merge) legt jeder PR hier **eine eigene Datei** an, mit dem
gleichen Namen wie seine «Was ist neu»-Datei in `src/lib/news/` (z. B. `kleider-sets.md` und
`kleider-sets.js`). Zwei offene PRs ändern so nie dieselbe Zeile, auch nicht in der Doku.

Die Versionsnummer steht **nicht** in der Datei: sie entsteht beim Merge aus der Reihenfolge auf `main`
(`scripts/news.mjs`). Wer sie sucht: in der App unter Ich › Was ist neu, oder `node scripts/news.mjs`.

## Vorlage

```markdown
# <Titel wie in «Was ist neu»>

PR #<Nummer> · <Datum> · Auftrag: Noah «<Antwort>» (Thread «<Name>»)

## Was ist neu
- …

## Was fällt weg oder rutscht tiefer
- nichts / … (alter Weg → neuer Weg)

## Selbst entschieden
- …

## Entscheide (für decisions.md)
- <Datum>: <Entscheid> (Grund)

## Stand im Plan (roadmap.md / vorhaben.md)
- <Vorhaben>: <neuer Stand>

## Prüfschritte (nach dem Merge auf der echten Seite)
1. …
```

Ältere Releases (bis 0.232.0) stehen in `projektstand.md`, `status.md` und `decisions.md`.

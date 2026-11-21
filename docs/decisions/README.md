# Entscheide: eine Datei pro PR

Seit 21.11.2026 (Noah «2a») schreibt ein PR seine Entscheide **nicht mehr ans Ende von `docs/decisions.md`**, sondern
in **eine eigene Datei** `docs/decisions/<name>.md`, mit dem gleichen Namen wie seine Datei in `docs/releases/`
(und, wenn er eine hat, in `src/lib/news/`). Der Grund: Alle PRs hängten ihre Zeilen an dieselbe Stelle am Dateiende,
und jeder zweite PR bekam deshalb einen Konflikt und musste neu geprüft werden. Zwei offene PRs ändern so nie dieselbe
Zeile, wie bei `docs/releases/`.

## Wann

Nur wenn der PR etwas **entscheidet**, das später noch gilt: ein Entscheid von Noah (mit Antwort, z. B. «1a»), eine
Regel, eine Absage mit Grund. Kein Entscheid, keine Datei. Was im PR nur beschrieben wird, gehört in
`docs/releases/<name>.md` unter «Selbst entschieden».

## Vorlage

```markdown
# <Titel>

<Datum> · Auftrag: Noah «<Antwort>» (Thread «<Name>»)

- <Entscheid> (Grund; verworfen: …)
```

Datum und Quelle stehen in der Datei, die Versionsnummer nicht (wie bei den Releases). Ein Entscheid, der einen
früheren ersetzt, nennt ihn mit Datum.

## `docs/decisions.md`

Bleibt als **Verlauf bis 21.11.2026** erhalten und wird nicht mehr ergänzt. Wer einen Entscheid sucht, schaut in beiden:
zuerst hier (neuere), dann dort (ältere).
